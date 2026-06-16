import { describe, it, expect, beforeEach } from 'vitest';
import { RedisService } from '@/lib/redis/service';
import { getCacheMetricsSummary, recordCacheMetric, resetCacheMetrics } from '@/lib/redis/metrics';
import * as local from '@/lib/redis/local-fallback';

describe('redis local fallback', () => {
  beforeEach(() => {
    local.localClear();
    resetCacheMetrics();
  });

  it('stores and retrieves values', () => {
    local.localSetEx('test-key', 'hello', 60);
    expect(local.localGet('test-key')).toBe('hello');
  });

  it('expires entries', () => {
    local.localSetEx('exp-key', 'val', 0);
    expect(local.localGet('exp-key')).toBeNull();
  });
});

describe('RedisService with local fallback', () => {
  beforeEach(() => {
    local.localClear();
    resetCacheMetrics();
  });

  it('set and get roundtrip via fallback', async () => {
    const service = new RedisService('test');
    await service.set('popular-products', { ids: ['a', 'b'] }, 300);
    const result = await service.get<{ ids: string[] }>('popular-products');
    expect(result?.ids).toEqual(['a', 'b']);
  });

  it('getOrSet fetches on miss', async () => {
    const service = new RedisService('test');
    let calls = 0;
    const data = await service.getOrSet(
      'search:shoes',
      async () => {
        calls++;
        return { results: [1, 2] };
      },
      60
    );
    expect(data.results).toEqual([1, 2]);
    expect(calls).toBe(1);

    const cached = await service.getOrSet(
      'search:shoes',
      async () => {
        calls++;
        return { results: [3] };
      },
      60
    );
    expect(cached.results).toEqual([1, 2]);
    expect(calls).toBe(1);
  });
});

describe('cache metrics', () => {
  beforeEach(() => resetCacheMetrics());

  it('tracks hit rate', () => {
    recordCacheMetric({ operation: 'hit', layer: 'redis' });
    recordCacheMetric({ operation: 'hit', layer: 'redis' });
    recordCacheMetric({ operation: 'miss', layer: 'redis' });
    const summary = getCacheMetricsSummary();
    expect(summary.hits).toBe(2);
    expect(summary.misses).toBe(1);
    expect(summary.hitRate).toBeCloseTo(2 / 3);
  });
});
