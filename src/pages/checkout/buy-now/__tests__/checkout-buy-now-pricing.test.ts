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
});
