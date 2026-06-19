import { describe, expect, it } from 'vitest';
import {
  VENDOR_PRODUCTS_HUB_PATH,
  resolveSellerNavPath,
  resolveSellerNavUrl,
  isSellerNavItemActive,
  isVendorProductsHubPath,
} from '@/lib/navigation/vendor-products-nav';

describe('vendor-products-nav', () => {
  it('résout le hub produits vers la liste verticale', () => {
    expect(resolveSellerNavPath(VENDOR_PRODUCTS_HUB_PATH, 'digital')).toBe(
      '/dashboard/digital-products'
    );
    expect(resolveSellerNavPath(VENDOR_PRODUCTS_HUB_PATH, 'course')).toBe('/dashboard/courses');
    expect(resolveSellerNavPath(VENDOR_PRODUCTS_HUB_PATH, 'artist')).toBe(
      '/dashboard/artist-products'
    );
    expect(resolveSellerNavUrl('/dashboard/products?foo=1', 'service')).toBe(
      '/dashboard/services?foo=1'
    );
  });

  it('ne modifie pas les autres chemins', () => {
    expect(resolveSellerNavPath('/dashboard/orders', 'digital')).toBe('/dashboard/orders');
  });

  it('active le hub menu sur la liste verticale', () => {
    expect(
      isSellerNavItemActive(
        VENDOR_PRODUCTS_HUB_PATH,
        '/dashboard/digital-products',
        '',
        'prefix',
        'digital'
      )
    ).toBe(true);
    expect(isVendorProductsHubPath('/dashboard/products')).toBe(true);
    expect(isVendorProductsHubPath('/dashboard/digital-products')).toBe(false);
  });
});
