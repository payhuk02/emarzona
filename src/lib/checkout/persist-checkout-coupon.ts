/** Transfère un coupon appliqué sur la fiche produit vers le checkout canonique. */
export function persistCheckoutCoupon(
  coupon: {
    id: string;
    code: string;
    discountAmount: number;
  } | null
): void {
  try {
    if (!coupon?.id || !coupon.code) {
      localStorage.removeItem('applied_coupon');
      return;
    }
    localStorage.setItem(
      'applied_coupon',
      JSON.stringify({
        id: coupon.id,
        discountAmount: coupon.discountAmount,
        code: coupon.code,
      })
    );
  } catch {
    // localStorage indisponible (navigation privée, quota)
  }
}
