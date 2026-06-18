/**
 * Détermine si un cours est gratuit (inscription sans paiement).
 */

export interface CoursePricingLike {
  pricing_model?: string | null;
  price?: number | null;
  promotional_price?: number | null;
}

export function isFreeCourse(product: CoursePricingLike): boolean {
  if (product.pricing_model === 'free') return true;
  const effective = product.promotional_price ?? product.price ?? 0;
  return Number(effective) <= 0;
}
