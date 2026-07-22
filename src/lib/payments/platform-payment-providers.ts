/**
 * Providers de checkout plateforme (rail live + historique).
 * MoneyFusion = live ; GeniusPay = legacy (stats/recon historiques).
 */
export const PLATFORM_CHECKOUT_PROVIDERS = ['moneyfusion', 'geniuspay'] as const;

export type PlatformCheckoutProvider = (typeof PLATFORM_CHECKOUT_PROVIDERS)[number];

export function isPlatformCheckoutProvider(
  provider: string | null | undefined
): provider is PlatformCheckoutProvider {
  const p = (provider || '').toLowerCase();
  return (PLATFORM_CHECKOUT_PROVIDERS as readonly string[]).includes(p);
}

export function isMoneyFusionProvider(provider: string | null | undefined): boolean {
  return (provider || '').toLowerCase() === 'moneyfusion';
}

/** Identifiant PSP utilisable pour verify/reconcile (token MF ou id GeniusPay). */
export function resolveExternalPaymentId(tx: {
  payment_provider?: string | null;
  payment_id?: string | null;
  geniuspay_transaction_id?: string | null;
}): string | null {
  const provider = (tx.payment_provider || '').toLowerCase();
  if (provider === 'moneyfusion') {
    return (tx.payment_id || tx.geniuspay_transaction_id || '').trim() || null;
  }
  if (provider === 'geniuspay') {
    return (tx.geniuspay_transaction_id || tx.payment_id || '').trim() || null;
  }
  return (tx.payment_id || tx.geniuspay_transaction_id || '').trim() || null;
}
