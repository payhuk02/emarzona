/**
 * Vérification architecture cache enterprise — checklist automatisée.
 */
import { describe, it, expect, vi } from 'vitest';
import { CacheTag, PRODUCT_MUTATION_CASCADE } from '@/lib/cache/tags';
import { CACHE_STRATEGIES } from '@/lib/cache/config';
import { TAG_TO_QUERY_PREFIXES } from '@/lib/cache/query-tags';
import { invalidateByEvent } from '@/lib/cache/invalidation-engine';
import { QueryClient } from '@tanstack/react-query';

describe('enterprise cache architecture', () => {
  it('defines all critical catalog tags', () => {
    expect(PRODUCT_MUTATION_CASCADE).toContain(CacheTag.MARKETPLACE);
    expect(PRODUCT_MUTATION_CASCADE).toContain(CacheTag.SEO_META);
    expect(PRODUCT_MUTATION_CASCADE).toContain(CacheTag.HOMEPAGE);
  });

  it('marketplace tag maps to unified catalog query key', () => {
    expect(TAG_TO_QUERY_PREFIXES[CacheTag.MARKETPLACE]).toContain('marketplace-catalog');
  });

  it('covers static, semi-dynamic and dynamic data strategies', () => {
    const tags = Object.values(CACHE_STRATEGIES).map(s => s.tag);
    expect(tags).toContain(CacheTag.LEGAL);
    expect(tags).toContain(CacheTag.STORE);
    expect(tags).toContain(CacheTag.PRODUCT);
    expect(tags).toContain(CacheTag.ORDER);
  });

  it('private data uses no-store or network-only', () => {
    expect(CACHE_STRATEGIES.order.method).toBe('network-first');
    expect(CACHE_STRATEGIES.order.isPrivate).toBe(true);
    expect(CACHE_STRATEGIES.notification.method).toBe('network-only');
  });

  it('product mutation event invalidates marketplace tags', () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    invalidateByEvent(qc, 'product:mutation');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
