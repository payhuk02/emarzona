/**
 * Paiement du solde restant d'une commande (acompte / paiement partiel).
 */
import { initiatePayment } from '@/lib/payment-service';
import { logger } from '@/lib/logger';

export interface OrderBalancePaymentOptions {
  storeId: string;
  orderId: string;
  customerId?: string | null;
  amount: number;
  currency?: string | null;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  totalAmount: number;
  percentagePaid: number;
  remainingAmount: number;
}

export interface OrderBalancePaymentResult {
  checkoutUrl: string;
  transactionId: string;
}

/**
 * Initie le checkout pour payer le solde d'une commande existante.
 */
export async function initiateOrderBalancePayment(
  options: OrderBalancePaymentOptions
): Promise<OrderBalancePaymentResult> {
  const result = await initiatePayment({
    storeId: options.storeId,
    orderId: options.orderId,
    customerId: options.customerId ?? undefined,
    amount: options.amount,
    currency: options.currency ?? 'XOF',
    description: `Solde commande #${options.orderNumber}`,
    customerEmail: options.customerEmail,
    customerName: options.customerName,
    metadata: {
      order_id: options.orderId,
      payment_type: 'balance',
      initial_amount: options.totalAmount,
      percentage_paid: options.percentagePaid,
      remaining_amount: options.remainingAmount,
    },
  });

  if (!result.success || !result.checkout_url) {
    const message = result.error ?? "Erreur lors de l'initialisation du paiement";
    logger.error('initiateOrderBalancePayment failed', {
      orderId: options.orderId,
      storeId: options.storeId,
      error: message,
    });
    throw new Error(message);
  }

  return {
    checkoutUrl: result.checkout_url,
    transactionId: result.transaction_id,
  };
}
