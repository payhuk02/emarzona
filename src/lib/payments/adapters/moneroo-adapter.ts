/**
 * Adapter Moneroo (rail plateforme) — implémentation actuelle de production
 */

import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';
import type { OrchestratedPaymentRequest, OrchestratedPaymentResult } from '../types';

export async function createMonerooPlatformPayment(
  request: OrchestratedPaymentRequest
): Promise<OrchestratedPaymentResult> {
  const currency: Currency =
    request.currency && isSupportedCurrency(request.currency) ? request.currency : 'XOF';

  const result = await initiateMonerooPayment({
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
      payment_orchestration_provider: 'moneroo_platform',
    },
  });

  return {
    success: result.success,
    transaction_id: result.transaction_id,
    checkout_url: result.checkout_url,
    provider: 'moneroo_platform',
    provider_transaction_id: result.moneroo_transaction_id,
    connection_id: request.connections?.find(c => c.provider === 'moneroo_platform')?.id ?? null,
  };
}
