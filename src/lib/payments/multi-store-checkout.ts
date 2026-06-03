/**
 * Règles checkout panier multi-boutiques × orchestration multi-PSP.
 */

import type { CheckoutPaymentProvider } from '@/hooks/payments/useStorePaymentOptions';

const CONNECT_PROVIDERS = new Set<CheckoutPaymentProvider>(['stripe_connect', 'paypal_commerce']);

export function isConnectCheckoutProvider(provider: CheckoutPaymentProvider): boolean {
  return CONNECT_PROVIDERS.has(provider);
}

/**
 * Stripe/PayPal Connect ne supportent pas encore un seul checkout multi-boutiques.
 */
export function validateMultiStorePaymentProvider(params: {
  storeCount: number;
  provider: CheckoutPaymentProvider;
  orchestrationEnabled: boolean;
}): { allowed: true } | { allowed: false; message: string } {
  const { storeCount, provider, orchestrationEnabled } = params;

  if (storeCount <= 1 || !orchestrationEnabled) {
    return { allowed: true };
  }

  if (isConnectCheckoutProvider(provider)) {
    return {
      allowed: false,
      message:
        'Le panier contient plusieurs boutiques : seul Moneroo est disponible pour payer en une fois. Choisissez Moneroo ou retirez des articles pour payer par carte/PayPal boutique par boutique.',
    };
  }

  return { allowed: true };
}
