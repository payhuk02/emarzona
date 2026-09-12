import { describe, expect, it } from 'vitest';
import {
  LANDING_SPONSORED_ROTATE_MS,
  LANDING_SPONSORED_SLOT_COUNT,
  landingSponsoredProductHref,
  pickSponsoredWindow,
} from '@/lib/sponsorship/landing-sponsored-products';

describe('pickSponsoredWindow', () => {
  it('returns empty for empty pool', () => {
    expect(pickSponsoredWindow([], 0)).toEqual([]);
  });

  it('returns the pool as-is without duplicates when ≤ 9', () => {
    const pool = ['a', 'b', 'c'];
    expect(pickSponsoredWindow(pool, 0)).toEqual(['a', 'b', 'c']);
    expect(pickSponsoredWindow(pool, 99)).toEqual(['a', 'b', 'c']);
  });

  it('returns all nine without cycling when pool has exactly 9', () => {
    const pool = Array.from({ length: 9 }, (_, i) => `p${i}`);
    expect(pickSponsoredWindow(pool, 3)).toEqual(pool);
  });

  it('returns a sliding window of 9 when pool is larger', () => {
    const pool = Array.from({ length: 12 }, (_, i) => `p${i}`);
    expect(pickSponsoredWindow(pool, 0)).toEqual(pool.slice(0, 9));
    expect(pickSponsoredWindow(pool, 1)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
      'p6',
      'p7',
      'p8',
      'p9',
    ]);
    expect(pickSponsoredWindow(pool, 11)).toHaveLength(LANDING_SPONSORED_SLOT_COUNT);
    expect(pickSponsoredWindow(pool, 11)[0]).toBe('p11');
    expect(pickSponsoredWindow(pool, 11)[1]).toBe('p0');
  });
});

describe('LANDING_SPONSORED_ROTATE_MS', () => {
  it('is 30 minutes', () => {
    expect(LANDING_SPONSORED_ROTATE_MS).toBe(30 * 60 * 1000);
  });
});

describe('landingSponsoredProductHref', () => {
  it('builds an in-app store product path', () => {
    expect(
      landingSponsoredProductHref({
        id: '1',
        name: 'Identité visuelle',
        slug: 'identit-visuelle',
        image_url: null,
        price: 1,
        promotional_price: null,
        currency: 'XOF',
        is_featured: true,
        is_sponsored: true,
        active_sponsorship_id: null,
        store: { id: 's', name: 'Ecom Web', slug: 'ecom-web', logo_url: null },
      })
    ).toBe('/stores/ecom-web/products/identit-visuelle');
  });
});
