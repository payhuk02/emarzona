/**
 * Réconciliation MoneyFusion : lit paiementNotif et finalise la transaction locale
 * (webhook miss / retour success / cron).
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import {
  completeTransactionAndOrder,
  validateOrderPaymentAmount,
} from './complete-order-payment.ts';
import { moneyFusionFetch, moneyFusionPaidAmount } from './moneyfusion-http.ts';
import { runPostOrderPaymentFulfillment } from './post-order-payment-fulfillment.ts';

const MONEYFUSION_STATUS_URL = 'https://www.pay.moneyfusion.net/paiementNotif';

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

export type SyncMoneyFusionResult = {
  success: boolean;
  status: MoneyFusionMappedStatus | 'unknown';
  transactionId?: string;
  orderId?: string | null;
  alreadyCompleted?: boolean;
  completed?: boolean;
  error?: string;
  reason?: string;
};

/**
 * Synchronise une transaction locale à partir du token MoneyFusion.
 * Idempotent si déjà completed.
 */
export async function syncMoneyFusionTransactionFromToken(
  supabase: SupabaseClient,
  token: string,
  options?: { source?: string; transactionIdHint?: string }
): Promise<SyncMoneyFusionResult> {
  const source = options?.source || 'sync';
  const verified = await fetchMoneyFusionVerifiedStatus(token);
  if (!verified.ok) {
    return {
      success: false,
      status: 'unknown',
      error: verified.error || 'verify_failed',
    };
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
    return {
      success: false,
      status: mappedStatus,
      error: 'transaction_not_found',
    };
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

  const pspAmount =
    verified.amount != null && !Number.isNaN(verified.amount) ? Number(verified.amount) : null;
  const localAmount = Number(transaction.amount);
  const txCurrency = typeof transaction.currency === 'string' ? transaction.currency : null;

  if (orderId) {
    const amountToValidate = pspAmount != null ? pspAmount : localAmount;
    const paymentCheck = await validateOrderPaymentAmount(
      supabase,
      orderId,
      amountToValidate,
      txCurrency
    );
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

    if (pspAmount != null && Math.abs(pspAmount - localAmount) > 1) {
      return {
        success: false,
        status: mappedStatus,
        transactionId,
        orderId,
        error: 'psp_local_amount_mismatch',
        reason: `psp=${pspAmount} local=${localAmount}`,
      };
    }
  }

  const externalEventId = `moneyfusion:sync:${source}:${token}:${mappedStatus}`;
  const { orderId: completedOrderId, alreadyCompleted } = await completeTransactionAndOrder(
    supabase,
    transactionId,
    {
      provider_payment_intent_id: token,
      webhookPayload: {
        source,
        tokenPay: token,
        verified_statut: verified.statut,
        verified_amount: verified.amount ?? null,
        raw: verified.raw ?? null,
      },
      paymentProviderUsed: 'moneyfusion',
      externalEventId,
      eventType: 'payin.session.completed',
    }
  );

  const fulfillmentOrderId = completedOrderId || orderId;
  if (fulfillmentOrderId) {
    await runPostOrderPaymentFulfillment(supabase, fulfillmentOrderId, transactionId).catch(err =>
      console.error(`[MoneyFusion ${source}] post-order fulfillment failed`, err)
    );
  }

  return {
    success: true,
    status: 'completed',
    transactionId,
    orderId: fulfillmentOrderId,
    alreadyCompleted,
    completed: !alreadyCompleted,
  };
}
