/**
 * Règles tarifaires plateforme Emarzona (5 systèmes e-commerce).
 *
 * - Produits physiques : abonnement requis (essai 30 jours + 3 paliers)
 * - Digital / services / cours / œuvres : commission 10% par vente réussie
 */

export const COMMISSION_ONLY_PRODUCT_TYPES = ['digital', 'service', 'course', 'artist'] as const;

export const SUBSCRIPTION_PRODUCT_TYPE = 'physical' as const;

export const PHYSICAL_TRIAL_DAYS = 30;

export const PHYSICAL_PLAN_PRICES_XOF = {
  basic: 7500,
  standard: 12500,
  premium: 15000,
} as const;

export const PHYSICAL_SUBSCRIPTION_ERROR_CODE = 'PHYSICAL_SUBSCRIPTION_REQUIRED';

export function isPhysicalSubscriptionError(message?: string | null): boolean {
  if (!message) return false;
  return message.includes(PHYSICAL_SUBSCRIPTION_ERROR_CODE);
}

export function formatPhysicalSubscriptionError(): string {
  return 'Un abonnement produits physiques actif (ou essai en cours) est requis pour créer ce type de produit.';
}
