import { describe, expect, it } from 'vitest';
import {
  buildStorefrontItemPath,
  generateProductUrl,
  generateStorefrontItemUrl,
  PLATFORM_WWW_ORIGIN,
} from '@/lib/store-utils';

describe('store-utils storefront URLs', () => {
  it('generateProductUrl uses myemarzona.shop subdomain', () => {
    expect(generateProductUrl('ecom-nadege', 'mon-ebook', 'ecom-nadege')).toBe(
      'https://ecom-nadege.myemarzona.shop/products/mon-ebook'
    );
  });

  it('buildStorefrontItemPath routes by vertical', () => {
    expect(buildStorefrontItemPath({ id: 's1', slug: 'coaching', product_type: 'service' })).toBe(
      '/service/coaching'
    );
    expect(buildStorefrontItemPath({ id: 'a1', product_type: 'artist' })).toBe('/artist/a1');
    expect(buildStorefrontItemPath({ id: 'd1', slug: 'ebook', product_type: 'digital' })).toBe(
      '/products/ebook'
    );
    expect(
      buildStorefrontItemPath({ id: 'c1', slug: 'mon-cours', product_type: 'course' })
    ).toBeNull();
  });

  it('generateStorefrontItemUrl builds absolute service URLs on store host', () => {
    expect(
      generateStorefrontItemUrl(
        'ecom-web',
        { id: 's1', slug: 'identite-visuelle', product_type: 'service' },
        'ecom-web'
      )
    ).toBe('https://ecom-web.myemarzona.shop/service/identite-visuelle');
  });

  it('generateStorefrontItemUrl sends courses to www LMS', () => {
    expect(
      generateStorefrontItemUrl(
        'learn-shop',
        { id: 'c1', slug: 'mon-cours', product_type: 'course' },
        'learn-shop'
      )
    ).toBe(`${PLATFORM_WWW_ORIGIN}/courses/mon-cours`);
  });
});
