import { describe, it, expect } from 'vitest';
import {
  buildWwwProductPublicPath,
  buildWwwProductPublicUrl,
  resolveMarketplaceProductCardUrl,
  resolveStoreProductCardUrl,
} from '../product-public-url';

describe('product-public-url', () => {
  it('maps product types to correct www paths', () => {
    expect(buildWwwProductPublicPath({ id: 'd1', product_type: 'digital' })).toBe('/digital/d1');
    expect(buildWwwProductPublicPath({ id: 'p1', product_type: 'physical' })).toBe('/physical/p1');
    expect(buildWwwProductPublicPath({ id: 's1', product_type: 'service' })).toBe('/service/s1');
    expect(
      buildWwwProductPublicPath({
        id: 's1',
        slug: 'creation-page-facebook',
        product_type: 'service',
      })
    ).toBe('/service/creation-page-facebook');
    expect(buildWwwProductPublicPath({ id: 'a1', product_type: 'artist' })).toBe('/artist/a1');
    expect(buildWwwProductPublicPath({ id: 'c1', product_type: 'course', slug: 'mon-cours' })).toBe(
      '/courses/mon-cours'
    );
  });

  it('returns null for course without slug or unknown type', () => {
    expect(buildWwwProductPublicPath({ id: 'c1', product_type: 'course' })).toBeNull();
    expect(buildWwwProductPublicPath({ id: 'g1', product_type: 'generic' })).toBeNull();
  });

  it('builds absolute URLs', () => {
    expect(buildWwwProductPublicUrl({ id: 'd1', product_type: 'digital' })).toBe(
      'https://www.emarzona.com/digital/d1'
    );
    expect(buildWwwProductPublicUrl({ id: 's1', product_type: 'service' })).toBe(
      'https://www.emarzona.com/service/s1'
    );
  });

  it('resolveMarketplaceProductCardUrl prefers www paths for typed products', () => {
    expect(
      resolveMarketplaceProductCardUrl(
        { id: 's1', slug: 'identite-visuelle', product_type: 'service' },
        { slug: 'ecom-web' }
      )
    ).toBe('/service/identite-visuelle');
  });

  it('resolveMarketplaceProductCardUrl falls back to storefront URL', () => {
    expect(
      resolveMarketplaceProductCardUrl(
        { id: 'g1', slug: 'misc', product_type: 'generic' },
        { slug: 'ecom-web' }
      )
    ).toBe('https://ecom-web.myemarzona.shop/products/misc');
  });

  it('resolveStoreProductCardUrl routes services and courses correctly', () => {
    expect(
      resolveStoreProductCardUrl({ id: 's1', slug: 'identite-visuelle', product_type: 'service' })
    ).toBe('/service/identite-visuelle');
    expect(
      resolveStoreProductCardUrl({ id: 'c1', slug: 'mon-cours', product_type: 'course' })
    ).toBe('/courses/mon-cours');
    expect(resolveStoreProductCardUrl({ id: 'd1', slug: 'ebook', product_type: 'digital' })).toBe(
      '/products/ebook'
    );
  });
});
