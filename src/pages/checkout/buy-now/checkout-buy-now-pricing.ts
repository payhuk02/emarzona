import type {
  AppliedBuyNowCoupon,
  CheckoutProduct,
  CheckoutVariant,
} from '@/pages/checkout/buy-now/checkout-buy-now-types';

export function getBuyNowBasePrice(
  product: CheckoutProduct,
  selectedVariant: CheckoutVariant
): number {
  if (!product) return 0;
  if (selectedVariant?.price) return Number(selectedVariant.price);

  const promoPrice = product.promotional_price;
  const normalPrice = Number(product.price) || 0;
  if (promoPrice && Number(promoPrice) < normalPrice && Number(promoPrice) > 0) {
    return Number(promoPrice);
  }
  return normalPrice;
}

export function calculateBuyNowPrice(
  product: CheckoutProduct,
  selectedVariant: CheckoutVariant,
  appliedCoupon: AppliedBuyNowCoupon | null
): number {
  const base = getBuyNowBasePrice(product, selectedVariant);
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  return Math.max(0, base - couponDiscount);
}
