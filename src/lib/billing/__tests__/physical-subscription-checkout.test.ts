import { describe, expect, it } from 'vitest';
import {
  convertUsdPlanPrice,
  resolvePhysicalPlanCheckout,
  roundAmountForCurrency,
} from '@/lib/billing/physical-subscription-checkout';

describe('physical-subscription-checkout', () => {
  it('returns USD amount unchanged for USD checkout', () => {
    const checkout = resolvePhysicalPlanCheckout('physical_basic', 'USD');
    expect(checkout.amount).toBe(25);
    expect(checkout.currency).toBe('USD');
    expect(checkout.usdAmount).toBe(25);
  });

  it('converts Starter plan to XOF for local checkout', () => {
    const amount = convertUsdPlanPrice(25, 'XOF');
    expect(amount).toBeGreaterThan(10000);
    expect(roundAmountForCurrency(amount, 'XOF')).toBe(Math.round(amount));
  });

  it('resolves Professional plan at $49', () => {
    const checkout = resolvePhysicalPlanCheckout('physical_standard', 'USD');
    expect(checkout.amount).toBe(49);
  });

  it('resolves Business plan at $79', () => {
    const checkout = resolvePhysicalPlanCheckout('physical_premium', 'USD');
    expect(checkout.amount).toBe(79);
  });
});
