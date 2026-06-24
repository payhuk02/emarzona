import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { resolvePaidOrderStatusForOrder } from './order-status.ts';
import { sanitizePaymentWebhookPayload } from './payment-log-sanitize.ts';

export async function recordWebhookEvent(
  supabase: SupabaseClient,
  provider: string,
  externalEventId: string,
  eventType: string,
  payload: Record<string, unknown>,
  orderId?: string | null,
  transactionId?: string | null
): Promise<boolean> {
  // ATOMIC FIX: If we only record here, there is a race condition.
  // We keep this function for backward compatibility with non-payment events,
  // but true idempotency is now handled in the atomic RPC inside completeTransactionAndOrder.
  const safePayload = sanitizePaymentWebhookPayload(provider, payload);
  const { error } = await supabase.from('payment_webhook_events').insert({
    provider,
    external_event_id: externalEventId,
    event_type: eventType,
    order_id: orderId ?? null,
    transaction_id: transactionId ?? null,
    payload: safePayload,
  });
  if (error?.code === '23505') {
    return false;
  }
  if (error) {
    throw error;
  }
  return true;
}

export async function markWebhookProcessed(
  supabase: SupabaseClient,
  provider: string,
  externalEventId: string
): Promise<void> {
  await supabase
    .from('payment_webhook_events')
    .update({ processed_at: new Date().toISOString(), processing_error: null })
    .eq('provider', provider)
    .eq('external_event_id', externalEventId);
}

export async function completeTransactionAndOrder(
  supabase: SupabaseClient,
  transactionId: string,
  extras?: {
    provider_session_id?: string;
    provider_payment_intent_id?: string;
    connected_account_id?: string;
    application_fee_amount?: number;
    webhookPayload?: Record<string, unknown>;
    paymentProviderUsed?: string;
    externalEventId?: string; // Ajout pour l'idempotence stricte
    eventType?: string; // Ajout pour l'idempotence stricte
  }
): Promise<{ orderId: string | null; alreadyCompleted: boolean }> {
  const paymentProviderUsed = extras?.paymentProviderUsed ?? 'unknown';

  const safePayload = extras?.webhookPayload
    ? sanitizePaymentWebhookPayload(paymentProviderUsed, extras.webhookPayload)
    : {};

  // ATOMIC IDEMPOTENCY: Use the RPC to lock the transaction, insert the webhook event,
  // and update the order/transaction all in one PostgreSQL transaction.
  if (extras?.externalEventId && extras?.eventType) {
    const rpcArgs = {
      p_provider: paymentProviderUsed,
      p_external_event_id: extras.externalEventId,
      p_event_type: extras.eventType,
      p_transaction_id: transactionId,
      p_payload: safePayload,
      p_mapped_status: 'completed',
      p_provider_session_id: extras?.provider_session_id ?? null,
      p_provider_payment_intent_id: extras?.provider_payment_intent_id ?? null,
      p_connected_account_id: extras?.connected_account_id ?? null,
      p_application_fee_amount: extras?.application_fee_amount ?? null,
    };

    let result: {
      success?: boolean;
      reason?: string;
      order_id?: string | null;
      already_completed?: boolean;
    } | null = null;
    let rpcError: { message?: string } | null = null;

    const primary = await supabase.rpc('process_payment_webhook_atomic', rpcArgs);
    result = primary.data as typeof result;
    rpcError = primary.error;

    if (rpcError?.message?.includes('process_payment_webhook_atomic')) {
      const fallback = await supabase.rpc('process_moneroo_webhook_atomic', rpcArgs);
      result = fallback.data as typeof result;
      rpcError = fallback.error;
    }

    if (rpcError) {
      console.error('RPC process_payment_webhook_atomic error:', rpcError);
      throw rpcError;
    }

    if (!result?.success && result?.reason === 'duplicate_webhook') {
      console.warn('Duplicate webhook prevented by atomic RPC lock.');
      return { orderId: null, alreadyCompleted: true };
    }

    return {
      orderId: result?.order_id ?? null,
      alreadyCompleted: Boolean(result?.already_completed),
    };
  }

  // FALLBACK for legacy callers that don't pass externalEventId
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('id, order_id, status, payment_provider')
    .eq('id', transactionId)
    .single();

  if (txError || !transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'completed') {
    return { orderId: transaction.order_id, alreadyCompleted: true };
  }

  const now = new Date().toISOString();
  await supabase
    .from('transactions')
    .update({
      status: 'completed',
      completed_at: now,
      updated_at: now,
      webhook_processed_at: now,
      provider_session_id: extras?.provider_session_id ?? null,
      provider_payment_intent_id: extras?.provider_payment_intent_id ?? null,
      connected_account_id: extras?.connected_account_id ?? null,
      application_fee_amount: extras?.application_fee_amount ?? null,
      last_webhook_payload: safePayload,
    })
    .eq('id', transactionId);

  let orderId: string | null = transaction.order_id;
  if (orderId) {
    const paidOrderStatus = await resolvePaidOrderStatusForOrder(supabase, orderId);
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: paidOrderStatus,
        payment_provider_used:
          paymentProviderUsed !== 'unknown' ? paymentProviderUsed : transaction.payment_provider,
        updated_at: now,
      })
      .eq('id', orderId);
  }

  return { orderId, alreadyCompleted: false };
}

export async function getMaxAmountTolerance(supabase: SupabaseClient): Promise<number> {
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('settings')
      .eq('key', 'admin')
      .single();

    if (settings?.settings?.max_amount_tolerance != null) {
      return parseFloat(String(settings.settings.max_amount_tolerance)) || 1.0;
    }
  } catch {
    // default below
  }
  return 1.0;
}

export async function validateOrderPaymentAmount(
  supabase: SupabaseClient,
  orderId: string,
  paidAmount: number,
  paidCurrency?: string | null
): Promise<{ valid: boolean; orderAmount?: number; difference?: number; reason?: string }> {
  const { data: orderData } = await supabase
    .from('orders')
    .select('total_amount, currency')
    .eq('id', orderId)
    .single();

  if (!orderData) {
    return { valid: false, reason: 'order_not_found' };
  }

  const orderCurrency = String(orderData.currency ?? '').toUpperCase();
  const webhookCurrency = paidCurrency ? String(paidCurrency).toUpperCase() : orderCurrency;

  if (orderCurrency && webhookCurrency && orderCurrency !== webhookCurrency) {
    return { valid: false, reason: 'currency_mismatch' };
  }

  const orderAmount =
    typeof orderData.total_amount === 'string'
      ? parseFloat(orderData.total_amount)
      : Number(orderData.total_amount);

  const tolerance = await getMaxAmountTolerance(supabase);
  const difference = Math.abs(paidAmount - orderAmount);

  if (difference > tolerance) {
    return { valid: false, orderAmount, difference, reason: 'amount_mismatch' };
  }

  return { valid: true, orderAmount, difference };
}

/** Validates order amount before marking paid; throws on mismatch. */
export async function assertOrderPaymentBeforeComplete(
  supabase: SupabaseClient,
  transactionId: string,
  paidAmount: number,
  paidCurrency?: string | null
): Promise<string | null> {
  const { data: tx } = await supabase
    .from('transactions')
    .select('order_id')
    .eq('id', transactionId)
    .maybeSingle();

  if (!tx?.order_id) {
    return null;
  }

  const check = await validateOrderPaymentAmount(supabase, tx.order_id, paidAmount, paidCurrency);

  if (!check.valid) {
    throw new Error(check.reason ?? 'payment_validation_failed');
  }

  return tx.order_id;
}

import { resolveStoreDefaultFeePercent } from './order-platform-fee.ts';

export { resolveOrderPlatformFee, resolveStoreDefaultFeePercent } from './order-platform-fee.ts';

/** @deprecated Préférer resolveOrderPlatformFee(storeId, orderId) pour respecter le modèle C1. */
export async function resolvePlatformFeePercent(
  supabase: SupabaseClient,
  storeId: string
): Promise<number> {
  return resolveStoreDefaultFeePercent(supabase, storeId);
}
