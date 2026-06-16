import { describe, it, expect, beforeEach } from 'vitest';
import {
  CacheTag,
  entityTag,
  storeScopedTag,
  redisKey,
  PRODUCT_MUTATION_CASCADE,
} from '@/lib/cache/tags';
import { collectQueryKeysForTags } from '@/lib/cache/query-tags';
import { getSwrState, createSwrEntry, DEFAULT_SWR_OPTIONS } from '@/lib/cache/swr';
import { CACHE_STRATEGIES, buildCacheControlHeader } from '@/lib/cache/config';

describe('cache tags', () => {
  it('entityTag formats correctly', () => {
    expect(entityTag(CacheTag.PRODUCT, 'abc-123')).toBe('product:abc-123');
  });

  it('storeScopedTag isolates tenant', () => {
    expect(storeScopedTag(CacheTag.PRODUCT, 'store-1')).toBe('store:store-1:product');
  });

  it('redisKey uses versioned prefix', () => {
    expect(redisKey('search', 'q=shoes')).toContain('emz:v1:search:');
  });

  it('product mutation cascades include marketplace and search', () => {
    expect(PRODUCT_MUTATION_CASCADE).toContain(CacheTag.MARKETPLACE);
    expect(PRODUCT_MUTATION_CASCADE).toContain(CacheTag.SEARCH);
    expect(PRODUCT_MUTATION_CASCADE).toContain(CacheTag.HOMEPAGE);
  });
});

describe('query-tags', () => {
  it('collects unique query keys for tags', () => {
    const keys = collectQueryKeysForTags([CacheTag.PRODUCT, CacheTag.MARKETPLACE]);
    expect(keys.some(k => JSON.stringify(k) === '["marketplace-products"]')).toBe(true);
    expect(keys.some(k => JSON.stringify(k) === '["products"]')).toBe(true);
  });

  it('includes entity-specific keys', () => {
    const keys = collectQueryKeysForTags([CacheTag.PRODUCT], 'prod-1');
    expect(keys.some(k => JSON.stringify(k) === '["product","prod-1"]')).toBe(true);
  });
});

describe('swr', () => {
  it('returns fresh for recent entries', () => {
    const entry = createSwrEntry({ items: [] }, 'memory');
    const state = getSwrState(entry, DEFAULT_SWR_OPTIONS);
    expect(state.state).toBe('fresh');
    expect(state.canServe).toBe(true);
    expect(state.shouldRevalidate).toBe(false);
  });

  it('serves stale with background revalidate', () => {
    const entry = {
      data: { items: [] },
      fetchedAt: Date.now() - 5000,
      expiresAt: Date.now() + 60000,
      source: 'localStorage' as const,
    };
    const state = getSwrState(entry, {
      freshMs: 1000,
      maxStaleMs: 60000,
      staleIfErrorMs: 60000,
    });
    expect(state.state).toBe('stale');
    expect(state.shouldRevalidate).toBe(true);
    expect(state.canServe).toBe(true);
  });

  it('error-fallback serves stale data', () => {
    const entry = createSwrEntry({ items: [1] }, 'network');
    const state = getSwrState(entry, DEFAULT_SWR_OPTIONS, true);
    expect(state.state).toBe('error-fallback');
    expect(state.canServe).toBe(true);
  });
});

describe('cache config', () => {
  it('builds Cache-Control with SWR headers', () => {
    const strategy = CACHE_STRATEGIES.product;
    const header = buildCacheControlHeader(strategy);
    expect(header).toContain('stale-while-revalidate');
    expect(header).toContain('stale-if-error');
  });

  it('private strategies use no-store', () => {
    const header = buildCacheControlHeader(CACHE_STRATEGIES.order);
    expect(header).toContain('no-store');
  });
});
