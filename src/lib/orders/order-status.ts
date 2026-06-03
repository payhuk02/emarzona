/**
 * Statuts commande après paiement — source de vérité partagée (client + tests).
 *
 * - Physique : `confirmed` démarre le pipeline logistique (→ processing → shipped → delivered).
 * - Digital / service / cours / artiste : `completed` = payé et droits acheteur actifs.
 * - Revenus vendeur : toute commande `paid` avec statut dans PAID_REVENUE_ELIGIBLE_STATUSES.
 */

export const PAID_REVENUE_ELIGIBLE_STATUSES = ['completed', 'confirmed'] as const;

export type PaidRevenueEligibleStatus = (typeof PAID_REVENUE_ELIGIBLE_STATUSES)[number];

export const ORDER_STATUS_ON_PAYMENT = {
  /** Commandes contenant au moins un article physique */
  physical: 'confirmed',
  /** Digital, service, cours, artiste (sans physique) */
  fulfilled: 'completed',
} as const;

export type OrderPaymentStatus = string;
export type OrderLifecycleStatus = string;

export function isPaidRevenueEligibleOrder(
  status: OrderLifecycleStatus,
  paymentStatus: OrderPaymentStatus
): boolean {
  return (
    paymentStatus === 'paid' &&
    (PAID_REVENUE_ELIGIBLE_STATUSES as readonly string[]).includes(status)
  );
}

/** Accès acheteur (téléchargements, droits digitaux) : payé et statut éligible. */
export function isPaidBuyerAccessEligibleOrder(
  status: OrderLifecycleStatus,
  paymentStatus: OrderPaymentStatus
): boolean {
  return isPaidRevenueEligibleOrder(status, paymentStatus);
}

/** Statut à appliquer au webhook selon les types de lignes commande. */
export function resolveOrderStatusAfterPayment(
  productTypes: Array<string | null | undefined>
): 'completed' | 'confirmed' {
  const types = productTypes.filter((t): t is string => Boolean(t));
  if (types.some(t => t === 'physical')) {
    return ORDER_STATUS_ON_PAYMENT.physical;
  }
  return ORDER_STATUS_ON_PAYMENT.fulfilled;
}
