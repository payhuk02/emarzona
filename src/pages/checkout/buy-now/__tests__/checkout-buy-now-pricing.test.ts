import { describe, expect, it } from 'vitest';
import {
  buildServiceBuyNowBreakdown,
  calculateBuyNowPrice,
  calculateServiceBuyNowPrice,
  readServiceProjectQuotedTotal,
} from '../checkout-buy-now-pricing';
import { applyCheckoutPlatformFee } from '@/lib/checkout/platform-fee';

const serviceProduct = {
  id: 'svc-1',
  price: 20000,
  promotional_price: 15000,
  currency: 'XOF',
  product_type: 'service',
};

describe('readServiceProjectQuotedTotal', () => {
  it('reads a positive package quote', () => {
    expect(readServiceProjectQuotedTotal({ totalPrice: 80000 })).toBe(80000);
  });

  it('ignores empty or invalid quotes', () => {
    expect(readServiceProjectQuotedTotal(null)).toBeNull();
    expect(readServiceProjectQuotedTotal({ totalPrice: 0 })).toBeNull();
  });
});

describe('calculateServiceBuyNowPrice', () => {
  it('uses the project quote instead of the entry price', () => {
    expect(
      calculateServiceBuyNowPrice({
        product: serviceProduct,
        selectedVariant: null,
        appliedCoupon: null,
        projectQuotedTotal: 80000,
      })
    ).toBe(applyCheckoutPlatformFee(80000, 'XOF'));
  });

  it('applies hourly duration like the order RPC', () => {
    expect(
      calculateServiceBuyNowPrice({
        product: serviceProduct,
        selectedVariant: null,
        appliedCoupon: null,
        pricingType: 'per_hour',
        durationMinutes: 90,
        participants: 1,
      })
    ).toBe(applyCheckoutPlatformFee(22500, 'XOF'));
  });

  it('includes complementary products in the displayed total', () => {
    const withoutAddons = calculateServiceBuyNowPrice({
      product: serviceProduct,
      selectedVariant: null,
      appliedCoupon: null,
    });
    const withAddons = calculateServiceBuyNowPrice({
      product: serviceProduct,
      selectedVariant: null,
      appliedCoupon: null,
      addonTotal: 5000,
    });
    expect(withAddons).toBeGreaterThan(withoutAddons);
  });

  it('does not use the catalog entry price for a 90 min hourly session', () => {
    const entry = calculateBuyNowPrice(serviceProduct, null, null);
    const session = calculateServiceBuyNowPrice({
      product: serviceProduct,
      selectedVariant: null,
      appliedCoupon: null,
      pricingType: 'hourly',
      durationMinutes: 90,
    });
    expect(session).toBeGreaterThan(entry);
  });

  it('charges a deposit after addons and platform fee', () => {
    const breakdown = buildServiceBuyNowBreakdown({
      product: serviceProduct,
      selectedVariant: null,
      appliedCoupon: null,
      addonTotal: 5000,
      deposit: { deposit_required: true, deposit_type: 'percentage', deposit_amount: 30 },
    });
    const full = applyCheckoutPlatformFee(20000, 'XOF');
    expect(breakdown.amountDueNow).toBe(Math.max(1, Math.round((full * 30) / 100)));
    expect(breakdown.remainingAmount).toBe(full - breakdown.amountDueNow);
    expect(breakdown.isDeposit).toBe(true);
    expect(
      calculateServiceBuyNowPrice({
        product: serviceProduct,
        selectedVariant: null,
        appliedCoupon: null,
        addonTotal: 5000,
        deposit: { deposit_required: true, deposit_type: 'percentage', deposit_amount: 30 },
      })
    ).toBe(breakdown.amountDueNow);
  });

  it('keeps the service deposit when the product also has a percentage payment option', () => {
    const breakdown = buildServiceBuyNowBreakdown({
      product: {
        ...serviceProduct,
        payment_options: { payment_type: 'percentage', percentage_rate: 10 },
      },
      selectedVariant: null,
      appliedCoupon: null,
      deposit: { deposit_required: true, deposit_type: 'percentage', deposit_amount: 40 },
    });
    const full = applyCheckoutPlatformFee(15000, 'XOF');
    expect(breakdown.amountDueNow).toBe(Math.max(1, Math.round((full * 40) / 100)));
    expect(breakdown.isDeposit).toBe(true);
  });

  it('charges only the first milestone for project delivery_secured checkout', () => {
    const breakdown = buildServiceBuyNowBreakdown({
      product: {
        ...serviceProduct,
        payment_options: {
          payment_type: 'delivery_secured',
          use_project_milestones: true,
          project_milestones: [
            { label: 'Démarrage', percentage: 50, trigger: 'order_placed' },
            { label: 'Livraison', percentage: 50, trigger: 'delivery_approved' },
          ],
        },
      },
      selectedVariant: null,
      appliedCoupon: null,
      projectQuotedTotal: 100_000,
    });
    const full = applyCheckoutPlatformFee(100_000, 'XOF');
    expect(breakdown.isProjectMilestones).toBe(true);
    expect(breakdown.amountDueNow).toBe(Math.round(full / 2));
    expect(breakdown.milestoneRemaining).toBe(full - breakdown.amountDueNow);
    expect(breakdown.remainingAmount).toBe(breakdown.milestoneRemaining);
  });

  it('applies coupon before computing milestone due at checkout', () => {
    const breakdown = buildServiceBuyNowBreakdown({
      product: {
        ...serviceProduct,
        payment_options: {
          payment_type: 'delivery_secured',
          use_project_milestones: true,
          project_milestones: [
            { label: 'Démarrage', percentage: 50, trigger: 'order_placed' },
            { label: 'Livraison', percentage: 50, trigger: 'delivery_approved' },
          ],
        },
      },
      selectedVariant: null,
      appliedCoupon: { id: 'coupon-1', code: 'SAVE10K', discountAmount: 10_000 },
      projectQuotedTotal: 100_000,
    });

    const discountedFull = applyCheckoutPlatformFee(90_000, 'XOF');
    expect(breakdown.couponDiscount).toBe(10_000);
    expect(breakdown.totalWithFee).toBe(discountedFull);
    expect(breakdown.amountDueNow).toBe(Math.round(discountedFull / 2));
    expect(breakdown.milestoneRemaining).toBe(discountedFull - breakdown.amountDueNow);
  });

  it('charges first milestone for fixed-price delivery_secured without project quote', () => {
    const breakdown = buildServiceBuyNowBreakdown({
      product: {
        ...serviceProduct,
        price: 5_200,
        payment_options: {
          payment_type: 'delivery_secured',
          use_project_milestones: true,
          project_milestones: [
            { label: 'Démarrage', percentage: 50, trigger: 'order_placed' },
            { label: 'Livraison', percentage: 50, trigger: 'delivery_approved' },
          ],
        },
      },
      selectedVariant: null,
      appliedCoupon: null,
    });
    const full = applyCheckoutPlatformFee(5_200, 'XOF');
    expect(breakdown.isProjectMilestones).toBe(true);
    expect(breakdown.amountDueNow).toBe(Math.round(full / 2));
    expect(breakdown.milestoneRemaining).toBe(full - breakdown.amountDueNow);
  });
});
