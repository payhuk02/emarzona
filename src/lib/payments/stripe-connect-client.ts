/**
 * Client Stripe Connect — appels Edge Functions (secrets côté serveur uniquement)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface StripeOnboardParams {
  storeId: string;
  returnUrl: string;
  refreshUrl: string;
  syncOnly?: boolean;
}

export interface StripeOnboardResult {
  url?: string;
  accountId?: string;
  status?: string;
  charges_enabled?: boolean;
  details_submitted?: boolean;
  error?: string;
}

export interface StripeCheckoutParams {
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
  checkoutToken?: string;
  metadata?: Record<string, unknown>;
}

export interface StripeCheckoutResult {
  success: boolean;
  transaction_id: string;
  checkout_url: string;
  provider_session_id?: string;
  error?: string;
}

export async function startStripeConnectOnboarding(
  params: StripeOnboardParams
): Promise<StripeOnboardResult> {
  const { data, error } = await supabase.functions.invoke<StripeOnboardResult>(
    'stripe-connect-onboard',
    { body: params }
  );

  if (error) {
    logger.error('stripe-connect-onboard invoke failed', { error });
    return { error: error.message };
  }

  if (data?.error) {
    return { error: data.error };
  }

  return data ?? { error: 'Empty response' };
}

export async function createStripeConnectCheckout(
  params: StripeCheckoutParams
): Promise<StripeCheckoutResult> {
  const checkoutToken =
    params.checkoutToken ||
    (typeof params.metadata?.checkout_token === 'string'
      ? params.metadata.checkout_token
      : undefined);

  const { data, error } = await supabase.functions.invoke<StripeCheckoutResult>(
    'stripe-create-checkout',
    { body: { ...params, checkoutToken } }
  );

  if (error) {
    logger.error('stripe-create-checkout invoke failed', { error });
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
      error: data?.error ?? 'Stripe checkout failed',
    };
  }

  return data;
}
