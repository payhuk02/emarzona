/**
 * Adapter GeniusPay (rail plateforme) — implémentation actuelle de production
 */

import { initiateGeniusPayPayment } from '@/lib/geniuspay-payment';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';
import type { OrchestratedPaymentRequest, OrchestratedPaymentResult } from '../types';

export async function createGeniusPayPlatformPayment(
  request: OrchestratedPaymentRequest
): Promise<OrchestratedPaymentResult> {
  const currency: Currency =
    request.currency && isSupportedCurrency(request.currency) ? request.currency : 'XOF';

  const result = await initiateGeniusPayPayment({
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
      payment_orchestration_provider: 'geniuspay_platform',
    },
  });

  return {
    success: result.success,
    transaction_id: result.transaction_id,
    checkout_url: result.checkout_url,
    provider: 'geniuspay_platform',
    provider_transaction_id: result.geniuspay_id,
    connection_id: request.connections?.find(c => c.provider === 'geniuspay_platform')?.id ?? null,
  };
}
