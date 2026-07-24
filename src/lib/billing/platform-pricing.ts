/**
 * Règles tarifaires plateforme Emarzona (5 systèmes e-commerce).
 *
 * - Produits physiques : abonnement vendeur requis (essai 30 jours + 3 paliers en USD) ;
 *   pas de commission 10% ni de frais acheteur 2%+100 sur les ventes physiques
 * - Abonnements vendeur physiques : frais checkout 2% + 100 FCFA sur le paiement du plan
 * - Digital / services / cours / œuvres : commission vendeur 10% + frais acheteur 2%+100
 */

export const COMMISSION_ONLY_PRODUCT_TYPES = ['digital', 'service', 'course', 'artist'] as const;

/** Commission plateforme sur le revenu vendeur (ventes réussies commissionnables). */
export const PLATFORM_SELLER_COMMISSION_PERCENT = 10;

export const SUBSCRIPTION_PRODUCT_TYPE = 'physical' as const;

export const PHYSICAL_TRIAL_DAYS = 30;

/** Devise de référence des plans abonnement produits physiques */
export const PHYSICAL_PLAN_BASE_CURRENCY = 'USD' as const;

export const PHYSICAL_PLAN_PRICES_USD = {
  basic: 25,
  standard: 49,
  premium: 79,
} as const;

export type PhysicalPlanPriceKey = keyof typeof PHYSICAL_PLAN_PRICES_USD;

export const PHYSICAL_SUBSCRIPTION_ERROR_CODE = 'PHYSICAL_SUBSCRIPTION_REQUIRED';

export function isPhysicalSubscriptionError(message?: string | null): boolean {
  if (!message) return false;
  return message.includes(PHYSICAL_SUBSCRIPTION_ERROR_CODE);
}

export function formatPhysicalSubscriptionError(): string {
  return 'Un abonnement produits physiques actif (ou essai en cours) est requis pour créer ce type de produit.';
}
