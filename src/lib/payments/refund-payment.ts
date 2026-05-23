/**
 * Remboursement unifié multi-PSP (Moneroo, Stripe Connect, PayPal Commerce)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { refundMonerooPayment, type RefundOptions, type RefundResult } from '@/lib/moneroo-payment';

async function refundPayPalCommerce(options: RefundOptions): Promise<RefundResult> {
  const { data, error } = await supabase.functions.invoke<RefundResult>('paypal-refund', {
    body: options,
  });

  if (error) {
    logger.error('paypal-refund invoke failed', { error });
    return { success: false, error: error.message };
  }

  if (!data?.success) {
    return { success: false, error: data?.error ?? 'PayPal refund failed' };
  }

  return data;
}

async function refundStripeConnect(options: RefundOptions): Promise<RefundResult> {
  const { data, error } = await supabase.functions.invoke<RefundResult>('stripe-refund', {
    body: options,
  });

  if (error) {
    logger.error('stripe-refund invoke failed', { error });
    return { success: false, error: error.message };
  }

  if (!data?.success) {
    return { success: false, error: data?.error ?? 'Stripe refund failed' };
  }

  return data;
}

async function notifyRefund(result: RefundResult, transactionId: string): Promise<void> {
  if (!result.success) return;

  try {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('store_id, customer_id, customer_email, customer_name, order_id, amount, currency')
      .eq('id', transactionId)
      .single();

    if (!transaction) return;

    const { notifyPaymentRefunded } = await import('@/lib/moneroo-notifications');
    await notifyPaymentRefunded({
      transactionId,
      storeId: transaction.store_id ?? undefined,
      userId: transaction.customer_id ?? undefined,
      customerEmail: transaction.customer_email ?? undefined,
      customerName: transaction.customer_name ?? undefined,
      amount: result.amount ?? transaction.amount ?? 0,
      currency: result.currency ?? transaction.currency ?? 'XOF',
      status: 'refunded',
      orderId: transaction.order_id ?? undefined,
    });
  } catch (err) {
    logger.warn('Refund notification failed', { err, transactionId });
  }
}

/**
 * Rembourse une transaction selon son payment_provider.
 */
export async function refundPayment(options: RefundOptions): Promise<RefundResult> {
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('id, payment_provider')
    .eq('id', options.transactionId)
    .single();

  if (error || !transaction) {
    return { success: false, error: 'Transaction not found' };
  }

  const provider = transaction.payment_provider ?? 'moneroo';

  let result: RefundResult;

  switch (provider) {
    case 'paypal_commerce':
      result = await refundPayPalCommerce(options);
      break;
    case 'stripe_connect':
      result = await refundStripeConnect(options);
      break;
    case 'moneroo':
    case 'moneroo_platform':
      result = await refundMonerooPayment(options);
      break;
    default:
      return { success: false, error: `Refunds not supported for provider: ${provider}` };
  }

  if (result.success) {
    await notifyRefund(result, options.transactionId);
  }

  return result;
}

export type { RefundOptions, RefundResult };
