import { describe, it, expect } from 'vitest';
import {
  buildCheckoutUrl,
  resolveCheckoutMode,
  CHECKOUT_LEGACY_REDIRECTS,
} from '../checkout-route';

describe('checkout-route', () => {
  it('invalid mode when no product params', () => {
    expect(resolveCheckoutMode(new URLSearchParams())).toBe('invalid');
    expect(buildCheckoutUrl()).toBe('/marketplace');
  });

  it('buy_now mode with productId', () => {
    const sp = new URLSearchParams({ productId: 'p1', storeId: 's1' });
    expect(resolveCheckoutMode(sp)).toBe('buy_now');
    expect(buildCheckoutUrl({ productId: 'p1', storeId: 's1' })).toBe(
      '/checkout?productId=p1&storeId=s1'
    );
  });

  it('supports service scheduling params', () => {
    expect(
      buildCheckoutUrl({
        productId: 'p1',
        storeId: 's1',
        scheduledAt: '2026-07-21T10:00:00.000Z',
        participants: 2,
      })
    ).toBe(
      '/checkout?productId=p1&storeId=s1&scheduledAt=2026-07-21T10%3A00%3A00.000Z&participants=2'
    );
  });

  it('auction mode', () => {
    const sp = new URLSearchParams({ auction: 'a1', buy_now: 'true' });
    expect(resolveCheckoutMode(sp)).toBe('auction');
    expect(buildCheckoutUrl({ auctionId: 'a1', buyNow: true })).toBe(
      '/checkout?auction=a1&buy_now=true'
    );
  });

  it('legacy paths map to marketplace', () => {
    expect(CHECKOUT_LEGACY_REDIRECTS['/checkout/cart']).toBe('/marketplace');
    expect(CHECKOUT_LEGACY_REDIRECTS['/cart']).toBe('/marketplace');
  });
});
