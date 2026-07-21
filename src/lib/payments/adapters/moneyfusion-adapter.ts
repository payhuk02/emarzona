/**
 * Adapter MoneyFusion (rail plateforme)
 */
import { initiateMoneyFusionPayment } from '@/lib/moneyfusion-payment';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';
import type { OrchestratedPaymentRequest, OrchestratedPaymentResult } from '../types';

export async function createMoneyFusionPayment(
  request: OrchestratedPaymentRequest
): Promise<OrchestratedPaymentResult> {
  const currency: Currency =
    request.currency && isSupportedCurrency(request.currency) ? request.currency : 'XOF';

  const result = await initiateMoneyFusionPayment({
    storeId: request.storeId,
    productId: request.productId,
    orderId: request.orderId,
    customerId: request.customerId,
    amount: request.amount,
    currency,
    description: request.description,
    customerEmail: request.customerEmail,
    customerName: request.customerName,
    customerPhone: request.customerPhone,
    returnUrl: request.returnUrl,
    cancelUrl: request.cancelUrl,
    metadata: {
      ...request.metadata,
      payment_orchestration_provider: 'moneyfusion',
    },
  });

  return {
    success: result.success,
    transaction_id: result.transaction_id || '',
    checkout_url: result.checkout_url,
    provider: 'moneyfusion',
    provider_transaction_id: result.moneyfusion_token || undefined,
    connection_id: request.connections?.find(c => c.provider === 'moneyfusion')?.id ?? null,
  };
}
