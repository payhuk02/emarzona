/**
 * Redis Service — get/set avec fallback local et métriques.
 */

import { redisKey, CACHE_TAG_VERSION } from '@/lib/cache/tags';
import type { CacheTagValue } from '@/lib/cache/tags';
import { getStrategyForTag } from '@/lib/cache/config';
import { redisGet, redisSetEx, redisDel, redisKeys, getRedisConfig } from './client';
import * as local from './local-fallback';
import { recordCacheMetric } from './metrics';

export interface RedisGetOptions {
  ttlSeconds?: number;
  allowFallback?: boolean;
}

export class RedisService {
  private namespace: string;

  constructor(namespace = 'app') {
    this.namespace = namespace;
  }

  private fullKey(key: string): string {
    return redisKey(this.namespace, key);
  }

  async get<T>(key: string, options: RedisGetOptions = {}): Promise<T | null> {
    const t0 = Date.now();
    const fullKey = this.fullKey(key);
    const allowFallback = options.allowFallback !== false;

    const config = getRedisConfig();
    if (config) {
      const raw = await redisGet(fullKey, config);
      const durationMs = Date.now() - t0;
      if (raw) {
        recordCacheMetric({ operation: 'hit', key: fullKey, durationMs, layer: 'redis' });
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      }
      recordCacheMetric({ operation: 'miss', key: fullKey, durationMs, layer: 'redis' });
    }

    if (allowFallback) {
      const localRaw = local.localGet(fullKey);
      if (localRaw) {
        recordCacheMetric({
          operation: 'hit',
          key: fullKey,
          durationMs: Date.now() - t0,
          layer: 'local',
        });
        try {
          return JSON.parse(localRaw) as T;
        } catch {
          return localRaw as unknown as T;
        }
      }
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const fullKey = this.fullKey(key);
    const ttl = ttlSeconds ?? 300;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const t0 = Date.now();

    const config = getRedisConfig();
    if (config) {
      const ok = await redisSetEx(fullKey, serialized, ttl, config);
      recordCacheMetric({
        operation: 'set',
        key: fullKey,
        durationMs: Date.now() - t0,
        layer: 'redis',
      });
      if (ok) return true;
    }

    local.localSetEx(fullKey, serialized, ttl);
    recordCacheMetric({
      operation: 'set',
      key: fullKey,
      durationMs: Date.now() - t0,
      layer: 'local',
    });
    return true;
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.fullKey(key);
    const config = getRedisConfig();
    let deleted = false;
    if (config) deleted = await redisDel(fullKey, config);
    deleted = local.localDel(fullKey) || deleted;
    recordCacheMetric({ operation: 'del', key: fullKey, layer: config ? 'redis' : 'local' });
    return deleted;
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

/** Tag index key for invalidation */
function tagIndexKey(tag: string): string {
  return `tag-index:${CACHE_TAG_VERSION}:${tag}`;
}

export async function registerKeyUnderTag(
  tag: CacheTagValue,
  cacheKey: string,
  service = new RedisService()
): Promise<void> {
  const indexKey = tagIndexKey(tag);
  const existing = (await service.get<string[]>(indexKey)) ?? [];
  if (!existing.includes(cacheKey)) {
    existing.push(cacheKey);
    const strategy = getStrategyForTag(tag);
    await service.set(indexKey, existing, strategy?.ttlSeconds ?? 3600);
  }
}

export async function invalidateRedisByTag(tag: CacheTagValue): Promise<number> {
  const service = new RedisService();
  const indexKey = tagIndexKey(tag);
  const keys = (await service.get<string[]>(indexKey)) ?? [];

  let deleted = 0;
  for (const key of keys) {
    if (await service.delete(key)) deleted++;
  }
  await service.delete(indexKey);

  const config = getRedisConfig();
  if (config) {
    const patternKeys = await redisKeys(`emz:${CACHE_TAG_VERSION}:*${tag}*`, config);
    for (const key of patternKeys) {
      if (await redisDel(key, config)) deleted++;
    }
  } else {
    for (const key of local.localKeysMatching(`emz:${CACHE_TAG_VERSION}:`)) {
      if (key.includes(tag)) {
        local.localDel(key);
        deleted++;
      }
    }
  }

  return deleted;
}

export async function invalidateRedisByTags(tags: CacheTagValue[]): Promise<number> {
  let total = 0;
  for (const tag of tags) {
    total += await invalidateRedisByTag(tag);
  }
  return total;
}

export const redisService = new RedisService();
