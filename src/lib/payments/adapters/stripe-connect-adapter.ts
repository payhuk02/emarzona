/**
 * Adapter Stripe Connect — checkout via Edge Function
 */

import { createStripeConnectCheckout } from '../stripe-connect-client';
import type { OrchestratedPaymentRequest, OrchestratedPaymentResult } from '../types';

function buildUrls() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com';
  return {
    successUrl: `${origin}/payment/success`,
    cancelUrl: `${origin}/payment/cancel`,
  };
}

export async function createStripeConnectPayment(
  request: OrchestratedPaymentRequest
): Promise<OrchestratedPaymentResult> {
  if (!request.orderId) {
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'stripe_connect',
      error: 'orderId is required for Stripe Connect checkout',
    };
  }

  if (!request.customerEmail) {
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'stripe_connect',
      error: 'customerEmail is required',
    };
  }

  const { successUrl, cancelUrl } = buildUrls();

  const result = await createStripeConnectCheckout({
    storeId: request.storeId,
    orderId: request.orderId,
    amount: request.amount,
    currency: request.currency ?? 'EUR',
    description: request.description,
    customerEmail: request.customerEmail,
    customerName: request.customerName,
    productId: request.productId,
    successUrl,
    cancelUrl,
    metadata: request.metadata,
  });

  const connectionId = request.connections?.find(c => c.provider === 'stripe_connect')?.id ?? null;

  return {
    success: result.success,
    transaction_id: result.transaction_id,
    checkout_url: result.checkout_url,
    provider: 'stripe_connect',
    provider_transaction_id: result.provider_session_id,
    connection_id: connectionId,
    error: result.error,
  };
}
