import { describe, expect, it } from 'vitest';
import {
  computeOrderPlatformFeeAmount,
  isCommissionableProductType,
} from '../platform-pricing.ts';

describe('edge platform-pricing (C1)', () => {
  it('matches frontend rules for physical zero commission', () => {
    expect(isCommissionableProductType('physical')).toBe(false);
    const result = computeOrderPlatformFeeAmount(
      [{ product_type: 'physical', total_price: 12500 }],
      10
    );
    expect(result.feeAmount).toBe(0);
  });

  it('applies fee on digital lines only in mixed cart', () => {
    const result = computeOrderPlatformFeeAmount(
      [
        { product_type: 'physical', total_price: 10000 },
        { product_type: 'digital', total_price: 3000 },
      ],
      10
    );
    expect(result.feeAmount).toBe(300);
  });
});
