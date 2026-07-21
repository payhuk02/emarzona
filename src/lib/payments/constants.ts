import type { PaymentProviderCode } from '@/types/store-payment-connection';

/** Devises courantes supportées par Stripe Connect checkout */
/** Stripe Connect — cartes internationales (hors XOF/XAF → GeniusPay) */
export const STRIPE_CONNECT_CURRENCIES = new Set([
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'CHF',
  'JPY',
  'MAD',
  'NGN',
]);

export const GENIUSPAY_PRIMARY_CURRENCIES = new Set(['XOF', 'XAF']);

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

export const GENIUSPAY_PLATFORM_CURRENCIES = new Set(['XOF', 'XAF', 'EUR', 'USD']);

/** MoneyFusion (FusionPay) — Mobile Money Afrique de l'Ouest (XOF) */
export const MONEYFUSION_CURRENCIES = new Set(['XOF']);

/** Flutterwave retiré du routage actif (Epic 2.2.6 Option B) — phase 4+ si réactivation */
export const PROVIDER_PRIORITY: PaymentProviderCode[] = [
  'stripe_connect',
  'paypal_commerce',
  'moneyfusion',
  'geniuspay_platform',
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
