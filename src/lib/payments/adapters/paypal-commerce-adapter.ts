/**
 * Adapter PayPal Commerce — checkout via Edge Function
 */

import { createPayPalCommerceCheckout } from '../paypal-commerce-client';
import type { OrchestratedPaymentRequest, OrchestratedPaymentResult } from '../types';

function buildUrls(returnUrl?: string, cancelUrl?: string) {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com';
  return {
    successUrl: returnUrl || `${origin}/payment/success`,
    cancelUrl: cancelUrl || `${origin}/payment/cancel`,
  };
}

export async function createPayPalCommercePayment(
  request: OrchestratedPaymentRequest
): Promise<OrchestratedPaymentResult> {
  if (!request.orderId) {
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'paypal_commerce',
      error: 'orderId is required for PayPal checkout',
    };
  }

  if (!request.customerEmail) {
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'paypal_commerce',
      error: 'customerEmail is required',
    };
  }

  const { successUrl, cancelUrl } = buildUrls(request.returnUrl, request.cancelUrl);

  const checkoutToken =
    typeof request.metadata?.checkout_token === 'string'
      ? request.metadata.checkout_token
      : undefined;

  const result = await createPayPalCommerceCheckout({
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
    checkoutToken,
    metadata: request.metadata,
  });

  const connectionId = request.connections?.find(c => c.provider === 'paypal_commerce')?.id ?? null;

  return {
    success: result.success,
    transaction_id: result.transaction_id,
    checkout_url: result.checkout_url,
    provider: 'paypal_commerce',
    provider_transaction_id: result.provider_session_id,
    connection_id: connectionId,
    error: result.error,
  };
}
