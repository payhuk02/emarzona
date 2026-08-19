/**
 * Paiements MoneyFusion orphelins (webhook sans transaction locale).
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import {
  mapMoneyFusionStatus,
  syncMoneyFusionTransactionFromToken,
  type MoneyFusionMappedStatus,
} from './moneyfusion-sync-from-status.ts';

const TX_SELECT =
  'id,status,order_id,store_id,payment_id,amount,currency,customer_id,payment_provider,customer_email,customer_name,metadata,webhook_attempts';

export type MoneyFusionOrphanRecord = {
  id: string;
  mf_token: string;
  mapped_status: string;
  resolution_status: string;
};

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
}

async function findTransactionForOrphan(
  supabase: SupabaseClient,
  token: string,
  personalInfo?: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const byPaymentId = await supabase
    .from('transactions')
    .select(TX_SELECT)
    .eq('payment_id', token)
    .eq('payment_provider', 'moneyfusion')
    .maybeSingle();
  if (byPaymentId.data) return byPaymentId.data as Record<string, unknown>;

  const txHint = personalInfo?.transaction_id;
  if (isUuid(txHint)) {
    const byId = await supabase
      .from('transactions')
      .select(TX_SELECT)
      .eq('id', txHint)
      .maybeSingle();
    if (byId.data) return byId.data as Record<string, unknown>;
  }

  const orderHint = personalInfo?.orderId ?? personalInfo?.order_id;
  if (isUuid(orderHint)) {
    const byOrder = await supabase
      .from('transactions')
      .select(TX_SELECT)
      .eq('order_id', orderHint)
      .eq('payment_provider', 'moneyfusion')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byOrder.data) return byOrder.data as Record<string, unknown>;

    const byOrderPending = await supabase
      .from('transactions')
      .select(TX_SELECT)
      .eq('order_id', orderHint)
      .eq('payment_provider', 'moneyfusion')
      .in('status', ['pending', 'processing'])
      .is('payment_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byOrderPending.data) return byOrderPending.data as Record<string, unknown>;
  }

  return null;
}

async function attachTokenToTransaction(
  supabase: SupabaseClient,
  transaction: Record<string, unknown>,
  token: string
): Promise<void> {
  if (String(transaction.payment_id || '') === token) return;

  await supabase
    .from('transactions')
    .update({
      payment_id: token,
      provider_payment_intent_id: token,
      reference: token,
      status:
        String(transaction.status || '') === 'pending' ? 'processing' : transaction.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', String(transaction.id));
}

export async function recordMoneyFusionOrphanPayment(
  supabase: SupabaseClient,
  input: {
    token: string;
    mappedStatus: MoneyFusionMappedStatus;
    verifiedStatut?: string;
    verifiedAmount?: number | null;
    currency?: string | null;
    eventType: string;
    payload: Record<string, unknown>;
    personalInfo?: Record<string, unknown>;
  }
): Promise<MoneyFusionOrphanRecord> {
  const txHint = input.personalInfo?.transaction_id;
  const orderHint = input.personalInfo?.orderId ?? input.personalInfo?.order_id;
  const storeHint = input.personalInfo?.store_id;
  const userHint = input.personalInfo?.userId;

  const row = {
    mf_token: input.token,
    mapped_status: input.mappedStatus,
    verified_statut: input.verifiedStatut ?? null,
    verified_amount: input.verifiedAmount ?? null,
    currency: String(input.currency || 'XOF').toUpperCase(),
    event_type: input.eventType,
    transaction_id_hint: isUuid(txHint) ? txHint : null,
    order_id_hint: isUuid(orderHint) ? orderHint : null,
    store_id_hint: isUuid(storeHint) ? storeHint : null,
    customer_email_hint:
      typeof userHint === 'string' && userHint.includes('@') ? userHint : null,
    payload: input.payload,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('moneyfusion_orphan_payments')
    .select('id, mf_token, mapped_status, resolution_status, webhook_attempts')
    .eq('mf_token', input.token)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('moneyfusion_orphan_payments')
      .update({
        ...row,
        webhook_attempts: Number(existing.webhook_attempts || 0) + 1,
      })
      .eq('id', existing.id)
      .select('id, mf_token, mapped_status, resolution_status')
      .single();
    if (error) throw error;
    return updated as MoneyFusionOrphanRecord;
  }

  const { data: inserted, error } = await supabase
    .from('moneyfusion_orphan_payments')
    .insert(row)
    .select('id, mf_token, mapped_status, resolution_status')
    .single();
  if (error) throw error;
  return inserted as MoneyFusionOrphanRecord;
}

async function markOrphanLinked(
  supabase: SupabaseClient,
  orphanId: string,
  resolution: 'auto_linked' | 'manual_linked',
  linked: { transactionId: string; orderId?: string | null },
  note?: string,
  resolvedBy?: string | null
): Promise<void> {
  await supabase
    .from('moneyfusion_orphan_payments')
    .update({
      resolution_status: resolution,
      linked_transaction_id: linked.transactionId,
      linked_order_id: linked.orderId ?? null,
      resolution_note: note ?? null,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orphanId);
}

export async function tryAutoResolveMoneyFusionOrphan(
  supabase: SupabaseClient,
  input: {
    orphanId: string;
    token: string;
    mappedStatus: MoneyFusionMappedStatus;
    personalInfo?: Record<string, unknown>;
  }
): Promise<{
  resolved: boolean;
  transactionId?: string;
  orderId?: string | null;
  reason?: string;
}> {
  const transaction = await findTransactionForOrphan(
    supabase,
    input.token,
    input.personalInfo
  );
  if (!transaction) {
    return { resolved: false, reason: 'no_matching_transaction' };
  }

  const transactionId = String(transaction.id);
  const orderId = (transaction.order_id as string | null) ?? null;

  await attachTokenToTransaction(supabase, transaction, input.token);

  if (input.mappedStatus === 'completed') {
    const sync = await syncMoneyFusionTransactionFromToken(supabase, input.token, {
      source: 'orphan_auto_resolve',
      transactionIdHint: transactionId,
    });
    if (!sync.success) {
      return {
        resolved: false,
        transactionId,
        orderId: sync.orderId ?? orderId,
        reason: sync.error || sync.reason || 'sync_failed',
      };
    }

    await markOrphanLinked(supabase, input.orphanId, 'auto_linked', {
      transactionId,
      orderId: sync.orderId ?? orderId,
    });

    await supabase.from('transaction_logs').insert({
      transaction_id: transactionId,
      event_type: 'orphan_auto_linked',
      status: 'completed',
      response_data: {
        orphan_id: input.orphanId,
        mf_token: input.token,
        order_id: sync.orderId ?? orderId,
      },
    });

    return { resolved: true, transactionId, orderId: sync.orderId ?? orderId };
  }

  await markOrphanLinked(supabase, input.orphanId, 'auto_linked', {
    transactionId,
    orderId,
  }, `Linked on ${input.mappedStatus} webhook`);

  return { resolved: true, transactionId, orderId };
}

export async function resolveMoneyFusionOrphanPayment(
  supabase: SupabaseClient,
  input: {
    orphanId?: string;
    token?: string;
    resolvedBy?: string | null;
    force?: boolean;
  }
): Promise<{
  success: boolean;
  orphanId?: string;
  transactionId?: string;
  orderId?: string | null;
  error?: string;
}> {
  let orphan: Record<string, unknown> | null = null;

  if (input.orphanId) {
    const { data } = await supabase
      .from('moneyfusion_orphan_payments')
      .select('*')
      .eq('id', input.orphanId)
      .maybeSingle();
    orphan = data as Record<string, unknown> | null;
  } else if (input.token) {
    const { data } = await supabase
      .from('moneyfusion_orphan_payments')
      .select('*')
      .eq('mf_token', input.token)
      .maybeSingle();
    orphan = data as Record<string, unknown> | null;
  }

  if (!orphan) {
    return { success: false, error: 'orphan_not_found' };
  }

  if (
    !input.force &&
    orphan.resolution_status !== 'open' &&
    orphan.linked_transaction_id
  ) {
    return {
      success: true,
      orphanId: String(orphan.id),
      transactionId: String(orphan.linked_transaction_id),
      orderId: orphan.linked_order_id ? String(orphan.linked_order_id) : null,
    };
  }

  const token = String(orphan.mf_token);
  const mappedStatus = mapMoneyFusionStatus(String(orphan.mapped_status || ''));
  const personalInfo = {
    transaction_id: orphan.transaction_id_hint,
    orderId: orphan.order_id_hint,
    store_id: orphan.store_id_hint,
  };

  const auto = await tryAutoResolveMoneyFusionOrphan(supabase, {
    orphanId: String(orphan.id),
    token,
    mappedStatus,
    personalInfo,
  });

  if (auto.resolved) {
    if (auto.transactionId) {
      await supabase.from('transaction_logs').insert({
        transaction_id: auto.transactionId,
        event_type: 'orphan_manual_linked',
        status: 'completed',
        response_data: {
          orphan_id: orphan.id,
          mf_token: token,
          resolved_by: input.resolvedBy ?? null,
        },
      });
    }
    return {
      success: true,
      orphanId: String(orphan.id),
      transactionId: auto.transactionId,
      orderId: auto.orderId ?? null,
    };
  }

  return {
    success: false,
    orphanId: String(orphan.id),
    error: auto.reason || 'resolve_failed',
  };
}

export async function handleMoneyFusionOrphanWebhook(
  supabase: SupabaseClient,
  input: {
    token: string;
    mappedStatus: MoneyFusionMappedStatus;
    verifiedStatut?: string;
    verifiedAmount?: number | null;
    currency?: string | null;
    eventType: string;
    safePayload: Record<string, unknown>;
    personalInfo?: Record<string, unknown>;
  }
): Promise<{
  recorded: boolean;
  autoResolved: boolean;
  orphanId?: string;
  transactionId?: string;
  orderId?: string | null;
}> {
  const orphan = await recordMoneyFusionOrphanPayment(supabase, {
    token: input.token,
    mappedStatus: input.mappedStatus,
    verifiedStatut: input.verifiedStatut,
    verifiedAmount: input.verifiedAmount,
    currency: input.currency,
    eventType: input.eventType,
    payload: input.safePayload,
    personalInfo: input.personalInfo,
  });

  const auto = await tryAutoResolveMoneyFusionOrphan(supabase, {
    orphanId: orphan.id,
    token: input.token,
    mappedStatus: input.mappedStatus,
    personalInfo: input.personalInfo,
  });

  return {
    recorded: true,
    autoResolved: auto.resolved,
    orphanId: orphan.id,
    transactionId: auto.transactionId,
    orderId: auto.orderId ?? null,
  };
}

export async function ignoreMoneyFusionOrphanPayment(
  supabase: SupabaseClient,
  input: { orphanId: string; note?: string; resolvedBy?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('moneyfusion_orphan_payments')
    .update({
      resolution_status: 'ignored',
      resolution_note: input.note ?? 'ignored_by_admin',
      resolved_at: new Date().toISOString(),
      resolved_by: input.resolvedBy ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.orphanId)
    .eq('resolution_status', 'open')
    .select('id')
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: 'orphan_not_open' };
  return { success: true };
}

export async function autoResolveOpenMoneyFusionOrphans(
  supabase: SupabaseClient,
  limit = 20
): Promise<{ scanned: number; resolved: number }> {
  const { data: rows } = await supabase
    .from('moneyfusion_orphan_payments')
    .select('id, mf_token, mapped_status, transaction_id_hint, order_id_hint, store_id_hint')
    .eq('resolution_status', 'open')
    .order('last_seen_at', { ascending: true })
    .limit(limit);

  let resolved = 0;
  for (const row of rows || []) {
    const result = await tryAutoResolveMoneyFusionOrphan(supabase, {
      orphanId: String(row.id),
      token: String(row.mf_token),
      mappedStatus: mapMoneyFusionStatus(String(row.mapped_status || '')),
      personalInfo: {
        transaction_id: row.transaction_id_hint,
        orderId: row.order_id_hint,
        store_id: row.store_id_hint,
      },
    });
    if (result.resolved) resolved++;
  }

  return { scanned: (rows || []).length, resolved };
}
