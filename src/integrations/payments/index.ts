/**
 * Payment Integrations Export
 * Point d'entrée pour tous les providers de paiement
 */

export { BasePaymentProvider } from './base';
export * from './types';

// Providers
export { StripeProvider } from './stripe';
export { PayPalProvider } from './paypal';
export { FlutterwaveProvider } from './flutterwave';

// Factory pour créer des instances de providers
import { StripeProvider } from './stripe';
import { PayPalProvider } from './paypal';
import { FlutterwaveProvider } from './flutterwave';
import { BasePaymentProvider } from './base';
import type { PaymentProvider } from './types';

export type PaymentProviderCode = 'stripe' | 'paypal' | 'flutterwave' | 'moneroo';

export function createPaymentProvider(
  code: PaymentProviderCode,
  config: {
    apiKey: string;
    apiSecret?: string;
    testMode?: boolean;
    [key: string]: unknown;
  }
): BasePaymentProvider {
  switch (code) {
    case 'stripe':
      return new StripeProvider(config);
    case 'paypal':
      return new PayPalProvider(config);
    case 'flutterwave':
      return new FlutterwaveProvider(config);
    default:
      throw new Error(`Payment provider "${code}" not implemented`);
  }
}

export function getAvailableProviders(): PaymentProvider[] {
  return [
    new StripeProvider({ apiKey: '', testMode: true }).getProviderInfo(),
    new PayPalProvider({ apiKey: '', testMode: true }).getProviderInfo(),
    new FlutterwaveProvider({ apiKey: '', testMode: true }).getProviderInfo(),
  ];
}






