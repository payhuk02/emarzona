import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateCacheKey,
  getCachedMarketplaceProductsSync,
  setCache,
  MARKETPLACE_CACHE_SOFT_STALE_MS,
} from '@/lib/marketplace-cache';

describe('marketplace-cache SWR', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generateCacheKey est stable pour les mêmes filtres', () => {
    const a = generateCacheKey('products', { page: 1, category: 'all' });
    const b = generateCacheKey('products', { category: 'all', page: 1 });
    expect(a).toBe(b);
  });

  it('getCachedMarketplaceProductsSync retourne les données et isSoftStale', async () => {
    const filters = { page: 1, itemsPerPage: 12, category: 'all' };
    await setCache(
      generateCacheKey('products', filters),
      { products: [{ id: 'p1' } as never], totalCount: 1 },
      10 * 60 * 1000
    );

    const fresh = getCachedMarketplaceProductsSync(filters);
    expect(fresh?.data.products).toHaveLength(1);
    expect(fresh?.isSoftStale).toBe(false);

    vi.advanceTimersByTime(MARKETPLACE_CACHE_SOFT_STALE_MS + 1);
    const stale = getCachedMarketplaceProductsSync(filters);
    expect(stale?.isSoftStale).toBe(true);
    expect(stale?.data.products).toHaveLength(1);
  });
});
