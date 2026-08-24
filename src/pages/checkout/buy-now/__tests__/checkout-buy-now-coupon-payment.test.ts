import { describe, expect, it } from 'vitest';
import { calculateBuyNowPrice } from '../checkout-buy-now-pricing';
import { applyCheckoutPlatformFee } from '@/lib/checkout/platform-fee';
import type { CheckoutProduct } from '../checkout-buy-now-types';

const digitalProduct: CheckoutProduct = {
  id: 'formation-publicite-facebook',
  price: 4500,
  promotional_price: null,
  currency: 'XOF',
  product_type: 'digital',
};

describe('buy-now coupon vs payment amount', () => {
  it('matches the GF100 screenshots: 2395 after promo, not 4690 without it', () => {
    expect(applyCheckoutPlatformFee(4500, 'XOF')).toBe(4690);
    expect(calculateBuyNowPrice(digitalProduct, null, null)).toBe(4690);

    expect(applyCheckoutPlatformFee(2250, 'XOF')).toBe(2395);
    expect(
      calculateBuyNowPrice(digitalProduct, null, {
        id: 'gf100',
        code: 'GF100',
        discountAmount: 2250,
      })
    ).toBe(2395);
  });
});
