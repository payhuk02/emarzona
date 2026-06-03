/**
 * Mise à jour DB après remboursement (tous PSP)
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

export interface ApplyRefundInput {
  refundId: string;
  amount: number;
  currency: string;
  reason?: string;
  provider: string;
}

export async function applyPaymentRefund(
  supabase: SupabaseClient,
  transactionId: string,
  refund: ApplyRefundInput
): Promise<{ orderId: string | null }> {
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('id, order_id, store_id, status, amount, metadata, customer_id')
    .eq('id', transactionId)
    .single();

  if (fetchError || !transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'refunded') {
    return { orderId: transaction.order_id };
  }

  if (transaction.status !== 'completed') {
    throw new Error(`Cannot refund transaction with status: ${transaction.status}`);
  }

  const txAmount = Number(transaction.amount ?? 0);
  if (refund.amount > txAmount) {
    throw new Error('Refund amount exceeds transaction amount');
  }

  const now = new Date().toISOString();
  const existingMeta =
    transaction.metadata && typeof transaction.metadata === 'object'
      ? (transaction.metadata as Record<string, unknown>)
      : {};

  await supabase
    .from('transactions')
    .update({
      status: 'refunded',
      refunded_at: now,
      updated_at: now,
      metadata: {
        ...existingMeta,
        refund: {
          refund_id: refund.refundId,
          amount: refund.amount,
          currency: refund.currency,
          provider: refund.provider,
          reason: refund.reason ?? 'Customer request',
          created_at: now,
        },
      },
    })
    .eq('id', transactionId);

  if (transaction.order_id) {
    await supabase
      .from('orders')
      .update({ payment_status: 'refunded', updated_at: now })
      .eq('id', transaction.order_id);

    const { error: revokeError } = await supabase.rpc('revoke_digital_access_for_order', {
      p_order_id: transaction.order_id,
    });
    if (revokeError) {
      console.error('revoke_digital_access_for_order failed:', revokeError);
    }
  }

  await supabase.from('transaction_logs').insert({
    transaction_id: transactionId,
    event_type: 'refund_completed',
    status: 'completed',
    response_data: refund,
  });

  if (transaction.store_id) {
    await supabase
      .rpc('trigger_webhook', {
        p_store_id: transaction.store_id,
        p_event_type: 'payment.refunded',
        p_payload: {
          transaction_id: transactionId,
          order_id: transaction.order_id,
          refund_id: refund.refundId,
          amount: refund.amount,
          currency: refund.currency,
          provider: refund.provider,
        },
      })
      .then(null, (err: unknown) => console.error('payment.refunded webhook:', err));
  }

  return { orderId: transaction.order_id };
}
