import { describe, it, expect } from 'vitest';
import { buildWwwProductPublicPath, buildWwwProductPublicUrl } from '../product-public-url';

describe('product-public-url', () => {
  it('maps product types to correct www paths', () => {
    expect(buildWwwProductPublicPath({ id: 'd1', product_type: 'digital' })).toBe('/digital/d1');
    expect(buildWwwProductPublicPath({ id: 'p1', product_type: 'physical' })).toBe('/physical/p1');
    expect(buildWwwProductPublicPath({ id: 's1', product_type: 'service' })).toBe('/service/s1');
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
  });
});
