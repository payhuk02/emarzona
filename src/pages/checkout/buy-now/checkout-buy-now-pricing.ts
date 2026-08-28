import type {
  AppliedBuyNowCoupon,
  CheckoutProduct,
  CheckoutVariant,
} from '@/pages/checkout/buy-now/checkout-buy-now-types';
import { applyCheckoutPlatformFee, getCheckoutPlatformFee } from '@/lib/checkout/platform-fee';
import { resolveServiceAppointmentCharge } from '@/lib/service/service-pricing';
import { resolveServicePayableAmount } from '@/lib/service/service-payable-amount';
import {
  amountDueAtProjectCheckout,
  computeServiceProjectMilestoneAmounts,
  projectMilestonesEnabled,
  type ServicePaymentOptionsWithMilestones,
} from '@/lib/service/service-project-milestones';

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

export function readServiceProjectQuotedTotal(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null;
  const total = Number((raw as { totalPrice?: unknown }).totalPrice);
  return Number.isFinite(total) && total > 0 ? total : null;
}

export type ServiceBuyNowInput = {
  product: CheckoutProduct;
  selectedVariant: CheckoutVariant;
  appliedCoupon: AppliedBuyNowCoupon | null;
  pricingType?: string | null;
  durationMinutes?: number | null;
  participants?: number | null;
  projectQuotedTotal?: number | null;
  addonTotal?: number | null;
  deposit?: {
    deposit_required?: boolean | null;
    deposit_type?: string | null;
    deposit_amount?: number | null;
  } | null;
};

export type ServiceBuyNowBreakdown = {
  serviceAmount: number;
  addonTotal: number;
  couponDiscount: number;
  subtotal: number;
  platformFee: number;
  totalWithFee: number;
  amountDueNow: number;
  remainingAmount: number;
  isDeposit: boolean;
  isProject: boolean;
  isProjectMilestones: boolean;
  milestoneDueNow: number;
  milestoneRemaining: number;
};

export function buildServiceBuyNowBreakdown(input: ServiceBuyNowInput): ServiceBuyNowBreakdown {
  const couponDiscount = input.appliedCoupon?.discountAmount || 0;
  const quoted = Number(input.projectQuotedTotal);
  const isProject = Number.isFinite(quoted) && quoted > 0;
  const addons = Math.max(0, Number(input.addonTotal) || 0);
  const serviceAmount = isProject
    ? quoted
    : resolveServiceAppointmentCharge({
        price: input.product?.price,
        promotionalPrice: input.product?.promotional_price,
        pricingType: input.pricingType,
        durationMinutes: input.durationMinutes,
        participants: input.participants,
      });
  const subtotal = Math.max(0, serviceAmount + addons - couponDiscount);
  const currency = input.product?.currency || 'XOF';
  const platformFee = getCheckoutPlatformFee(subtotal, currency);
  const totalWithFee = applyCheckoutPlatformFee(subtotal, currency);
  const paymentOptions =
    input.product?.payment_options && typeof input.product.payment_options === 'object'
      ? (input.product.payment_options as ServicePaymentOptionsWithMilestones)
      : null;
  const payable = resolveServicePayableAmount(totalWithFee, paymentOptions, input.deposit);

  let amountDueNow = payable.amountToPay;
  let remainingAmount = payable.remainingAmount;
  let isProjectMilestones = false;
  let milestoneDueNow = 0;
  let milestoneRemaining = 0;

  if (isProject && projectMilestonesEnabled(paymentOptions, true)) {
    const milestones = computeServiceProjectMilestoneAmounts(
      totalWithFee,
      paymentOptions?.project_milestones
    );
    milestoneDueNow = amountDueAtProjectCheckout(milestones);
    milestoneRemaining = Math.max(0, totalWithFee - milestoneDueNow);
    if (milestoneDueNow > 0) {
      isProjectMilestones = true;
      amountDueNow = milestoneDueNow;
      remainingAmount = milestoneRemaining;
    }
  }

  return {
    serviceAmount,
    addonTotal: addons,
    couponDiscount,
    subtotal,
    platformFee,
    totalWithFee,
    amountDueNow,
    remainingAmount,
    isDeposit: payable.remainingAmount > 0 || isProjectMilestones,
    isProject,
    isProjectMilestones,
    milestoneDueNow,
    milestoneRemaining,
  };
}

export function calculateServiceBuyNowPrice(input: ServiceBuyNowInput): number {
  return buildServiceBuyNowBreakdown(input).amountDueNow;
}
