import { describe, it, expect } from 'vitest';
import {
  buildCheckoutUrl,
  resolveCheckoutMode,
  CHECKOUT_LEGACY_REDIRECTS,
} from '../checkout-route';

describe('checkout-route (Epic 3.6)', () => {
  it('cart mode when no product params', () => {
    expect(resolveCheckoutMode(new URLSearchParams())).toBe('cart');
    expect(buildCheckoutUrl()).toBe('/checkout');
  });

  it('buy_now mode with productId', () => {
    const sp = new URLSearchParams({ productId: 'p1', storeId: 's1' });
    expect(resolveCheckoutMode(sp)).toBe('buy_now');
    expect(buildCheckoutUrl({ productId: 'p1', storeId: 's1' })).toBe(
      '/checkout?productId=p1&storeId=s1'
    );
  });

  it('auction mode', () => {
    const sp = new URLSearchParams({ auction: 'a1', buy_now: 'true' });
    expect(resolveCheckoutMode(sp)).toBe('auction');
    expect(buildCheckoutUrl({ auctionId: 'a1', buyNow: true })).toBe(
      '/checkout?auction=a1&buy_now=true'
    );
  });

  it('legacy paths map to canonical checkout', () => {
    expect(CHECKOUT_LEGACY_REDIRECTS['/checkout/cart']).toBe('/checkout');
  });
});
