import { describe, it, expect } from 'vitest';
import { normalizePrefetchPath } from '@/lib/normalize-prefetch-path';

describe('normalizePrefetchPath', () => {
  it('normalise pathname et trailing slash', () => {
    expect(normalizePrefetchPath('/marketplace/')).toBe('/marketplace');
    expect(normalizePrefetchPath('/cart?x=1')).toBe('/cart');
    expect(normalizePrefetchPath('/account#top')).toBe('/account');
  });
});
