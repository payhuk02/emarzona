/**
 * Mise à jour DB après remboursement (tous PSP) — délègue à apply_transaction_refund (SQL)
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';

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
): Promise<{ orderId: string | null; status: string; refundedAmount: number }> {
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('id, order_id, store_id, status, amount, refunded_amount, metadata')
    .eq('id', transactionId)
    .single();

  if (fetchError || !transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'refunded') {
    return {
      orderId: transaction.order_id,
      status: 'refunded',
      refundedAmount: Number(transaction.refunded_amount ?? transaction.amount ?? 0),
    };
  }

  if (!['completed', 'partially_refunded'].includes(transaction.status ?? '')) {
    throw new Error(`Cannot refund transaction with status: ${transaction.status}`);
  }

  const txAmount = Number(transaction.amount ?? 0);
  const alreadyRefunded = Number(transaction.refunded_amount ?? 0);
  if (alreadyRefunded + refund.amount > txAmount + 0.01) {
    throw new Error('Refund amount exceeds remaining transaction amount');
  }

  const { data: result, error: rpcError } = await supabase.rpc('apply_transaction_refund', {
    p_transaction_id: transactionId,
    p_refund_amount: refund.amount,
    p_refund_id: refund.refundId,
    p_provider: refund.provider,
    p_reason: refund.reason ?? 'Customer request',
    p_metadata: {
      refund_currency: refund.currency,
    },
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  const payload = result as {
    order_id?: string | null;
    status?: string;
    refunded_amount?: number;
  } | null;

  if (transaction.store_id) {
    await supabase
      .rpc('trigger_webhook', {
        p_store_id: transaction.store_id,
        p_event_type: 'payment.refunded',
        p_payload: {
          transaction_id: transactionId,
          order_id: payload?.order_id ?? transaction.order_id,
          refund_id: refund.refundId,
          amount: refund.amount,
          cumulative_refunded: payload?.refunded_amount,
          currency: refund.currency,
          provider: refund.provider,
          status: payload?.status,
        },
      })
      .then(null, (err: unknown) => console.error('payment.refunded webhook:', err));
  }

  return {
    orderId: payload?.order_id ?? transaction.order_id,
    status: payload?.status ?? 'refunded',
    refundedAmount: Number(payload?.refunded_amount ?? refund.amount),
  };
}
