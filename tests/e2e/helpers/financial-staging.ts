/**
 * Helpers staging pour tests financiers E2E (remboursements partiels).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const TEST_MARKER = 'e2e_partial_refund_test';

export type PartialRefundFixture = {
  orderId: string;
  transactionId: string;
  storeId: string;
  amount: number;
};

export async function seedPartialRefundFixture(
  supabase: SupabaseClient
): Promise<PartialRefundFixture | null> {
  const { data: store } = await supabase.from('stores').select('id').limit(1).maybeSingle();
  if (!store?.id) return null;

  const amount = 10_000;
  const orderNumber = `E2E-PR-${Date.now()}`;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: store.id,
      order_number: orderNumber,
      total_amount: amount,
      currency: 'XOF',
      payment_status: 'paid',
      status: 'completed',
      payment_type: 'full',
      metadata: { [TEST_MARKER]: true, run_at: new Date().toISOString() },
    })
    .select('id, store_id')
    .single();

  if (orderError || !order) return null;

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      store_id: store.id,
      order_id: order.id,
      amount,
      currency: 'XOF',
      status: 'completed',
      payment_provider: 'moneroo',
      moneroo_transaction_id: `e2e-test-${order.id}`,
      metadata: { [TEST_MARKER]: true },
    })
    .select('id')
    .single();

  if (txError || !tx) {
    await supabase.from('orders').delete().eq('id', order.id);
    return null;
  }

  return {
    orderId: order.id,
    transactionId: tx.id,
    storeId: store.id,
    amount,
  };
}

export async function cleanupPartialRefundFixture(
  supabase: SupabaseClient,
  fixture: PartialRefundFixture
): Promise<void> {
  await supabase.from('transactions').delete().eq('id', fixture.transactionId);
  await supabase.from('orders').delete().eq('id', fixture.orderId);
}

export async function applyPartialRefundRpc(
  supabase: SupabaseClient,
  transactionId: string,
  amount: number
): Promise<{ status?: string; refunded_amount?: number; error?: string }> {
  const { data, error } = await supabase.rpc('apply_transaction_refund', {
    p_transaction_id: transactionId,
    p_refund_amount: amount,
    p_refund_id: `e2e-refund-${Date.now()}`,
    p_provider: 'e2e_test',
    p_reason: 'E2E partial refund test',
  });

  if (error) {
    return { error: error.message };
  }

  const payload = data as { status?: string; refunded_amount?: number } | null;
  return {
    status: payload?.status,
    refunded_amount: payload?.refunded_amount,
  };
}
