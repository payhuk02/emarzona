import { describe, expect, it } from 'vitest';

/** Miroir logique affiliation-tracking / SQL : base = orderTotal * (1 - platformFeeRate) */
function affiliateCommissionBase(orderTotal: number, platformFeePercent: number): number {
  return orderTotal * (1 - platformFeePercent / 100);
}

describe('affiliate commission base', () => {
  it('uses 90% of order when platform fee is 10%', () => {
    expect(affiliateCommissionBase(100_000, 10)).toBe(90_000);
  });

  it('uses custom store platform fee', () => {
    expect(affiliateCommissionBase(10_000, 15)).toBe(8_500);
  });
});
