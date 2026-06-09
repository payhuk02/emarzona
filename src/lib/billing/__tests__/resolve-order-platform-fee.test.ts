import { describe, expect, it } from 'vitest';
import {
  computeAffiliateCommissionBase,
  computeOrderPlatformFeeAmount,
  isCommissionableProductType,
  isPhysicalProductType,
  resolveLineTotal,
} from '@/lib/billing/resolve-order-platform-fee';

describe('resolve-order-platform-fee (C1)', () => {
  it('identifies commissionable vs physical product types', () => {
    expect(isCommissionableProductType('digital')).toBe(true);
    expect(isCommissionableProductType('service')).toBe(true);
    expect(isCommissionableProductType('course')).toBe(true);
    expect(isCommissionableProductType('artist')).toBe(true);
    expect(isPhysicalProductType('physical')).toBe(true);
    expect(isCommissionableProductType('physical')).toBe(false);
    expect(isCommissionableProductType(null)).toBe(false);
  });

  it('charges 0 % commission on physical-only orders', () => {
    const result = computeOrderPlatformFeeAmount(
      [{ product_type: 'physical', total_price: 10000 }],
      10
    );
    expect(result.commissionableTotal).toBe(0);
    expect(result.physicalTotal).toBe(10000);
    expect(result.feeAmount).toBe(0);
  });

  it('charges 10 % commission on digital-only orders', () => {
    const result = computeOrderPlatformFeeAmount(
      [{ product_type: 'digital', total_price: 10000 }],
      10
    );
    expect(result.commissionableTotal).toBe(10000);
    expect(result.feeAmount).toBe(1000);
  });

  it('charges commission only on non-physical lines in mixed carts', () => {
    const result = computeOrderPlatformFeeAmount(
      [
        { product_type: 'physical', total_price: 10000 },
        { product_type: 'digital', total_price: 5000 },
        { product_type: 'course', quantity: 1, unit_price: 2000 },
      ],
      10
    );
    expect(result.commissionableTotal).toBe(7000);
    expect(result.physicalTotal).toBe(10000);
    expect(result.feeAmount).toBe(700);
  });

  it('derives line total from quantity × unit_price when total_price is zero', () => {
    expect(resolveLineTotal({ quantity: 3, unit_price: 2500 })).toBe(7500);
  });

  it('computes affiliate base after platform fee', () => {
    expect(computeAffiliateCommissionBase(15000, 500)).toBe(14500);
    expect(computeAffiliateCommissionBase(10000, 0)).toBe(10000);
  });

  it('respects custom store fee percent on commissionable portion only', () => {
    const result = computeOrderPlatformFeeAmount(
      [
        { product_type: 'physical', total_price: 8000 },
        { product_type: 'artist', total_price: 2000 },
      ],
      15
    );
    expect(result.feeAmount).toBe(300);
  });
});
