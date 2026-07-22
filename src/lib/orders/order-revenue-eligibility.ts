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
