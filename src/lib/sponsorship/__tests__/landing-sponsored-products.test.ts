import { describe, expect, it } from 'vitest';
import {
  LANDING_SPONSORED_SLOT_COUNT,
  pickSponsoredWindow,
} from '@/lib/sponsorship/landing-sponsored-products';

describe('pickSponsoredWindow', () => {
  it('returns empty for empty pool', () => {
    expect(pickSponsoredWindow([], 0)).toEqual([]);
  });

  it('returns full pool when fewer than slot count', () => {
    const pool = ['a', 'b', 'c'];
    expect(pickSponsoredWindow(pool, 5)).toEqual(['a', 'b', 'c']);
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
    expect(pickSponsoredWindow(pool, 11).map(x => x)).toHaveLength(LANDING_SPONSORED_SLOT_COUNT);
    expect(pickSponsoredWindow(pool, 11)[0]).toBe('p11');
    expect(pickSponsoredWindow(pool, 11)[1]).toBe('p0');
  });
});
