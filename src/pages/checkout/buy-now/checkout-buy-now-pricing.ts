import type {
  AppliedBuyNowCoupon,
  CheckoutProduct,
  CheckoutVariant,
} from '@/pages/checkout/buy-now/checkout-buy-now-types';
import { applyCheckoutPlatformFee, getCheckoutPlatformFee } from '@/lib/checkout/platform-fee';

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

/** Sous-total après coupon, avant frais plateforme. */
export function calculateBuyNowSubtotal(
  product: CheckoutProduct,
  selectedVariant: CheckoutVariant,
  appliedCoupon: AppliedBuyNowCoupon | null
): number {
  const base = getBuyNowBasePrice(product, selectedVariant);
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  return Math.max(0, base - couponDiscount);
}

/** Produits physiques : pas de frais acheteur 2%+100 (monétisation = abonnement vendeur). */
function shouldApplyBuyNowPlatformFee(product: CheckoutProduct): boolean {
  return product?.product_type !== 'physical';
}

export function calculateBuyNowPlatformFee(
  product: CheckoutProduct,
  selectedVariant: CheckoutVariant,
  appliedCoupon: AppliedBuyNowCoupon | null
): number {
  if (!shouldApplyBuyNowPlatformFee(product)) return 0;
  const currency = product?.currency || 'XOF';
  return getCheckoutPlatformFee(
    calculateBuyNowSubtotal(product, selectedVariant, appliedCoupon),
    currency
  );
}

/**
 * Prix final checkout.
 * Digital / service / course / artist : sous-total + 2 % + 100 FCFA.
 * Physique : sous-total seul (pas de frais acheteur).
 */
export function calculateBuyNowPrice(
  product: CheckoutProduct,
  selectedVariant: CheckoutVariant,
  appliedCoupon: AppliedBuyNowCoupon | null
): number {
  const subtotal = calculateBuyNowSubtotal(product, selectedVariant, appliedCoupon);
  if (!shouldApplyBuyNowPlatformFee(product)) return subtotal;
  const currency = product?.currency || 'XOF';
  return applyCheckoutPlatformFee(subtotal, currency);
}
