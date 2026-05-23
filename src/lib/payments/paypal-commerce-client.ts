/**
 * Client PayPal Commerce — Edge Functions (secrets côté serveur)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface PayPalOnboardParams {
  storeId: string;
  returnUrl: string;
  syncOnly?: boolean;
}

export interface PayPalOnboardResult {
  url?: string;
  merchantId?: string | null;
  status?: string;
  payments_receivable?: boolean;
  error?: string;
}

export interface PayPalCheckoutParams {
  storeId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName?: string;
  productId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PayPalCheckoutResult {
  success: boolean;
  transaction_id: string;
  checkout_url: string;
  provider_session_id?: string;
  error?: string;
}

export async function startPayPalPartnerOnboarding(
  params: PayPalOnboardParams
): Promise<PayPalOnboardResult> {
  const { data, error } = await supabase.functions.invoke<PayPalOnboardResult>(
    'paypal-partner-onboard',
    { body: params }
  );

  if (error) {
    logger.error('paypal-partner-onboard invoke failed', { error });
    return { error: error.message };
  }
  if (data?.error) return { error: data.error };
  return data ?? { error: 'Empty response' };
}

export async function createPayPalCommerceCheckout(
  params: PayPalCheckoutParams
): Promise<PayPalCheckoutResult> {
  const { data, error } = await supabase.functions.invoke<PayPalCheckoutResult>(
    'paypal-create-order',
    { body: params }
  );

  if (error) {
    logger.error('paypal-create-order invoke failed', { error });
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      error: error.message,
    };
  }

  if (!data?.success || !data.checkout_url) {
    return {
      success: false,
      transaction_id: data?.transaction_id ?? '',
      checkout_url: '',
      error: data?.error ?? 'PayPal checkout failed',
    };
  }

  return data;
}
