/**
 * Critère unique de revenu plateforme (aligné SQL `is_order_eligible_for_revenue`).
 * status IN (completed, confirmed) AND payment_status IN (paid, partially_refunded)
 */
export function isOrderEligibleForRevenue(
  status: string | null | undefined,
  paymentStatus: string | null | undefined
): boolean {
  const s = (status || '').toLowerCase();
  const p = (paymentStatus || '').toLowerCase();
  return (s === 'completed' || s === 'confirmed') && (p === 'paid' || p === 'partially_refunded');
}

/** Revenu net commande (total − remboursé), plancher 0. */
export function orderNetRevenueAmount(
  totalAmount: number | null | undefined,
  refundedAmount?: number | null
): number {
  const total = Number(totalAmount) || 0;
  const refunded = Number(refundedAmount) || 0;
  return Math.max(0, total - refunded);
}

type OrderRevenueMeta = {
  subtotal?: unknown;
  platform_fee?: unknown;
  platform_fee_rule?: unknown;
};

/**
 * Revenu vendeur / produit (hors frais checkout acheteur 2%+100 et hors TTC).
 * Aligné SQL `order_checkout_buyer_fee_amount` + crédit wallet marchand.
 */
export function orderSellerProductRevenueAmount(input: {
  total_amount?: number | null;
  refunded_amount?: number | null;
  metadata?: unknown;
  /** Somme order_items.total_price si déjà chargée */
  itemsTotal?: number | null;
}): number {
  const total = Number(input.total_amount) || 0;
  const refunded = Number(input.refunded_amount) || 0;
  const meta =
    input.metadata && typeof input.metadata === 'object'
      ? (input.metadata as OrderRevenueMeta)
      : {};

  const platformFee = Number(meta.platform_fee);
  if (Number.isFinite(platformFee) && platformFee > 0) {
    return Math.max(0, total - platformFee - refunded);
  }

  const subtotal = Number(meta.subtotal);
  if (Number.isFinite(subtotal) && subtotal >= 0) {
    return Math.max(0, subtotal - refunded);
  }

  const itemsTotal = Number(input.itemsTotal);
  if (Number.isFinite(itemsTotal) && itemsTotal > 0) {
    return Math.max(0, itemsTotal - refunded);
  }

  // Inférence règle 2%+100 XOF quand seule platform_fee_rule est présente
  if (meta.platform_fee_rule && total > 100) {
    const inferred = Math.round((total - 100) / 1.02);
    if (inferred > 0 && inferred < total) {
      return Math.max(0, inferred - refunded);
    }
  }

  return Math.max(0, total - refunded);
}
