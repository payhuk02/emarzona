import { describe, expect, it } from 'vitest';
import {
  convertUsdPlanPrice,
  resolvePhysicalPlanCheckout,
  roundAmountForCurrency,
  withPhysicalBillingCheckoutFee,
} from '@/lib/billing/physical-subscription-checkout';
import { applyCheckoutPlatformFee, getCheckoutPlatformFee } from '@/lib/checkout/platform-fee';

describe('physical-subscription-checkout', () => {
  it('returns USD TTC (plan + 2%+100) for USD checkout', () => {
    const checkout = resolvePhysicalPlanCheckout('physical_basic', 'USD');
    expect(checkout.planAmount).toBe(25);
    expect(checkout.platformFee).toBe(getCheckoutPlatformFee(25, 'USD'));
    expect(checkout.amount).toBe(applyCheckoutPlatformFee(25, 'USD'));
    expect(checkout.currency).toBe('USD');
    expect(checkout.usdAmount).toBe(25);
  });

  it('converts Starter plan to XOF for local checkout', () => {
    const amount = convertUsdPlanPrice(25, 'XOF');
    expect(amount).toBeGreaterThan(10000);
    expect(roundAmountForCurrency(amount, 'XOF')).toBe(Math.round(amount));
  });

  it('resolves Professional plan TTC at $49 + fee', () => {
    const checkout = resolvePhysicalPlanCheckout('physical_standard', 'USD');
    expect(checkout.planAmount).toBe(49);
    expect(checkout.amount).toBe(applyCheckoutPlatformFee(49, 'USD'));
  });

  it('resolves Business plan TTC at $79 + fee', () => {
    const checkout = resolvePhysicalPlanCheckout('physical_premium', 'USD');
    expect(checkout.planAmount).toBe(79);
    expect(checkout.amount).toBe(applyCheckoutPlatformFee(79, 'USD'));
  });

  it('adds 2%+100 on XOF plan amounts for physical billing', () => {
    const withFee = withPhysicalBillingCheckoutFee(14976, 'XOF');
    expect(withFee.planAmount).toBe(14976);
    expect(withFee.platformFee).toBe(Math.round(14976 * 0.02 + 100));
    expect(withFee.amount).toBe(14976 + withFee.platformFee);
  });
});
