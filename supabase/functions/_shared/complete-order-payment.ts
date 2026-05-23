import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

export async function recordWebhookEvent(
  supabase: SupabaseClient,
  provider: string,
  externalEventId: string,
  eventType: string,
  payload: Record<string, unknown>,
  orderId?: string | null,
  transactionId?: string | null
): Promise<boolean> {
  const { error } = await supabase.from('payment_webhook_events').insert({
    provider,
    external_event_id: externalEventId,
    event_type: eventType,
    order_id: orderId ?? null,
    transaction_id: transactionId ?? null,
    payload,
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
  }
): Promise<{ orderId: string | null; alreadyCompleted: boolean }> {
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
      last_webhook_payload: extras?.webhookPayload ?? null,
    })
    .eq('id', transactionId);

  const paymentProviderUsed =
    extras?.paymentProviderUsed ?? transaction.payment_provider ?? 'stripe_connect';

  let orderId: string | null = transaction.order_id;
  if (orderId) {
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        payment_provider_used: paymentProviderUsed,
        updated_at: now,
      })
      .eq('id', orderId);
  }

  return { orderId, alreadyCompleted: false };
}

export async function resolvePlatformFeePercent(
  supabase: SupabaseClient,
  storeId: string
): Promise<number> {
  const { data: store } = await supabase
    .from('stores')
    .select('platform_fee_percent')
    .eq('id', storeId)
    .maybeSingle();

  if (store?.platform_fee_percent != null) {
    return Number(store.platform_fee_percent);
  }

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('platform_commission_rate')
    .not('platform_commission_rate', 'is', null)
    .limit(1)
    .maybeSingle();

  if (settings?.platform_commission_rate != null) {
    return Number(settings.platform_commission_rate);
  }

  return 10;
}
