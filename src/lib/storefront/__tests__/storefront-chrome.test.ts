import { describe, expect, it } from 'vitest';
import { shouldShowStoreChrome, shouldShowStoreHeader } from '@/lib/storefront/storefront-chrome';

describe('storefront-chrome', () => {
  it('hides full chrome on checkout and auth', () => {
    expect(shouldShowStoreChrome('/checkout')).toBe(false);
    expect(shouldShowStoreChrome('/pay/slug')).toBe(false);
    expect(shouldShowStoreChrome('/payment/success')).toBe(false);
    expect(shouldShowStoreChrome('/login')).toBe(false);
    expect(shouldShowStoreChrome('/')).toBe(true);
    expect(shouldShowStoreChrome('/cart')).toBe(true);
  });

  it('hides hero header on product detail routes but keeps chrome elsewhere', () => {
    expect(shouldShowStoreHeader('/products/facebook-rocket')).toBe(false);
    expect(shouldShowStoreHeader('/service/abc')).toBe(false);
    expect(shouldShowStoreHeader('/artist/xyz')).toBe(false);
    expect(shouldShowStoreHeader('/auctions/lot-1')).toBe(false);
    expect(shouldShowStoreHeader('/collections/summer')).toBe(false);

    expect(shouldShowStoreHeader('/')).toBe(true);
    expect(shouldShowStoreHeader('/cart')).toBe(true);
    expect(shouldShowStoreHeader('/legal/terms')).toBe(true);
    expect(shouldShowStoreHeader('/collections')).toBe(true);
    expect(shouldShowStoreHeader('/auctions')).toBe(true);
    expect(shouldShowStoreHeader('/portfolio')).toBe(true);
  });

  it('does not show header when chrome is already off', () => {
    expect(shouldShowStoreHeader('/checkout')).toBe(false);
  });
});
