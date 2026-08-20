/**
 * Sync MoneyFusion légère (sans fulfillment emails) pour garder le boot Edge petit.
 * Les licences digitales restent gérées par le trigger SQL on paid.
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import {
  completeTransactionAndOrder,
  validateOrderPaymentAmount,
} from './complete-order-payment.ts';
import { moneyFusionFetch, moneyFusionPaidAmount, moneyFusionAmountCandidates } from './moneyfusion-http.ts';

const MONEYFUSION_STATUS_URL = 'https://pay.moneyfusion.net/paiementNotif';

export type MoneyFusionMappedStatus = 'completed' | 'failed' | 'cancelled' | 'processing';

export function mapMoneyFusionStatus(statut?: string): MoneyFusionMappedStatus {
  const s = (statut || '').toLowerCase().trim();
  if (s === 'paid' || s === 'completed' || s === 'success') return 'completed';
  if (s === 'failure' || s === 'failed') return 'failed';
  if (s === 'no paid' || s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'processing';
}

export async function fetchMoneyFusionVerifiedStatus(token: string): Promise<{
  ok: boolean;
  statut?: string;
  amount?: number;
  raw?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const res = await moneyFusionFetch(`${MONEYFUSION_STATUS_URL}/${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      return { ok: false, error: 'Réponse statut non-JSON' };
    }
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, raw: data };
    }
    const inner =
      data.data && typeof data.data === 'object'
        ? (data.data as Record<string, unknown>)
        : data;
    const statut = String(inner.statut ?? inner.status ?? '')
      .toLowerCase()
      .trim();
    const amount = moneyFusionPaidAmount(inner);
    return { ok: true, statut, amount, raw: data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export type SyncMoneyFusionLiteResult = {
  success: boolean;
  status: MoneyFusionMappedStatus | 'unknown';
  transactionId?: string;
  orderId?: string | null;
  alreadyCompleted?: boolean;
  completed?: boolean;
  error?: string;
  reason?: string;
};

export async function syncMoneyFusionLite(
  supabase: SupabaseClient,
  token: string,
  options?: { source?: string; transactionIdHint?: string }
): Promise<SyncMoneyFusionLiteResult> {
  const source = options?.source || 'sync_lite';
  const verified = await fetchMoneyFusionVerifiedStatus(token);
  if (!verified.ok) {
    return { success: false, status: 'unknown', error: verified.error || 'verify_failed' };
  }

  const mappedStatus = mapMoneyFusionStatus(verified.statut);
  let transaction: Record<string, unknown> | null = null;

  if (options?.transactionIdHint) {
    const byHint = await supabase
      .from('transactions')
      .select(
        'id,status,order_id,store_id,payment_id,amount,currency,customer_id,payment_provider,metadata,webhook_attempts'
      )
      .eq('id', options.transactionIdHint)
      .eq('payment_provider', 'moneyfusion')
      .maybeSingle();
    if (byHint.data) transaction = byHint.data as Record<string, unknown>;
  }

  if (!transaction) {
    const byPaymentId = await supabase
      .from('transactions')
      .select(
        'id,status,order_id,store_id,payment_id,amount,currency,customer_id,payment_provider,metadata,webhook_attempts'
      )
      .eq('payment_id', token)
      .eq('payment_provider', 'moneyfusion')
      .maybeSingle();
    if (byPaymentId.data) transaction = byPaymentId.data as Record<string, unknown>;
  }

  if (!transaction) {
    return { success: false, status: mappedStatus, error: 'transaction_not_found' };
  }

  const transactionId = String(transaction.id);
  const orderId = (transaction.order_id as string | null) ?? null;
  const currentStatus = String(transaction.status || '');

  if (currentStatus === 'completed' && mappedStatus === 'completed') {
    return {
      success: true,
      status: 'completed',
      transactionId,
      orderId,
      alreadyCompleted: true,
      completed: false,
    };
  }

  if (mappedStatus !== 'completed') {
    if (['completed', 'failed', 'cancelled'].includes(currentStatus)) {
      return {
        success: true,
        status: currentStatus as MoneyFusionMappedStatus,
        transactionId,
        orderId,
        alreadyCompleted: currentStatus === 'completed',
      };
    }

    await supabase
      .from('transactions')
      .update({
        status: mappedStatus === 'processing' ? 'processing' : mappedStatus,
        webhook_processed_at: new Date().toISOString(),
        webhook_attempts: Number(transaction.webhook_attempts || 0) + 1,
        updated_at: new Date().toISOString(),
        metadata: {
          ...((transaction.metadata as Record<string, unknown>) || {}),
          [`${source}_at`]: new Date().toISOString(),
          [`${source}_statut`]: verified.statut,
        },
      })
      .eq('id', transactionId);

    return {
      success: true,
      status: mappedStatus,
      transactionId,
      orderId,
      completed: false,
    };
  }

  const localAmount = Number(transaction.amount);
  const txCurrency = typeof transaction.currency === 'string' ? transaction.currency : null;
  const amountCandidates =
    verified.raw && typeof verified.raw === 'object'
      ? (() => {
          const root = verified.raw as Record<string, unknown>;
          const inner =
            root.data && typeof root.data === 'object'
              ? (root.data as Record<string, unknown>)
              : root;
          return moneyFusionAmountCandidates(inner);
        })()
      : [];
  if (verified.amount != null && Number.isFinite(verified.amount)) {
    amountCandidates.push(Number(verified.amount));
  }
  const uniqueAmounts = [...new Set(amountCandidates.filter(n => Number.isFinite(n)))];

  if (orderId) {
    let paymentCheck: { valid: boolean; orderAmount?: number; reason?: string } = {
      valid: false,
      reason: 'amount_mismatch',
    };
    for (const candidate of uniqueAmounts.length ? uniqueAmounts : [localAmount]) {
      paymentCheck = await validateOrderPaymentAmount(supabase, orderId, candidate, txCurrency);
      if (paymentCheck.valid) break;
    }
    if (!paymentCheck.valid) {
      return {
        success: false,
        status: mappedStatus,
        transactionId,
        orderId,
        error: 'payment_validation_failed',
        reason: paymentCheck.reason,
      };
    }
  }

  const externalEventId = `moneyfusion:${token}:${mappedStatus}`;
  const { orderId: completedOrderId, alreadyCompleted } = await completeTransactionAndOrder(
    supabase,
    transactionId,
    {
      webhookPayload: {
        source,
        token,
        statut: verified.statut,
        raw: verified.raw ?? null,
      },
      paymentProviderUsed: 'moneyfusion',
      externalEventId,
      eventType: 'payin.session.completed',
    }
  );

  return {
    success: true,
    status: 'completed',
    transactionId,
    orderId: completedOrderId ?? orderId,
    alreadyCompleted,
    completed: !alreadyCompleted,
  };
}
