import type { PaymentProviderCode } from '@/types/store-payment-connection';

/** Devises courantes supportées par Stripe Connect checkout */
export const STRIPE_CONNECT_CURRENCIES = new Set([
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'CHF',
  'JPY',
  'XOF',
  'XAF',
  'MAD',
  'NGN',
]);

export const PAYPAL_COMMERCE_CURRENCIES = new Set([
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'CHF',
  'JPY',
]);

export const FLUTTERWAVE_CONNECT_CURRENCIES = new Set([
  'NGN',
  'GHS',
  'KES',
  'ZAR',
  'USD',
  'EUR',
  'GBP',
  'XOF',
  'XAF',
]);

export const MONEROO_PLATFORM_CURRENCIES = new Set(['XOF', 'XAF', 'EUR', 'USD']);

export const PROVIDER_PRIORITY: PaymentProviderCode[] = [
  'stripe_connect',
  'paypal_commerce',
  'flutterwave_connect',
  'moneroo_platform',
];

export function normalizeCurrency(currency?: string | null): string {
  return (currency ?? 'XOF').trim().toUpperCase();
}

export function isConnectionActive(connection: { external_account_status: string }): boolean {
  return connection.external_account_status === 'active';
}

export function hasCapability(
  capabilities: Record<string, unknown> | undefined,
  key: string
): boolean {
  if (!capabilities) return false;
  const value = capabilities[key];
  return value === true || value === 'active';
}
