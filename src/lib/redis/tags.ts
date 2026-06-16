/**
 * Redis Tags — invalidation par tag (équivalent Next.js revalidateTag côté serveur).
 */

import {
  CacheTag,
  type CacheTagValue,
  PRODUCT_MUTATION_CASCADE,
  STORE_MUTATION_CASCADE,
  SERVICE_MUTATION_CASCADE,
  COURSE_MUTATION_CASCADE,
  ARTIST_MUTATION_CASCADE,
} from '@/lib/cache/tags';
import { invalidateRedisByTags } from './service';
import { recordCacheMetric } from './metrics';

export type RedisInvalidationEvent =
  | 'product:mutation'
  | 'store:mutation'
  | 'service:mutation'
  | 'course:mutation'
  | 'artist:mutation'
  | 'import:catalog'
  | 'deploy';

const EVENT_TAGS: Record<RedisInvalidationEvent, CacheTagValue[]> = {
  'product:mutation': PRODUCT_MUTATION_CASCADE,
  'store:mutation': STORE_MUTATION_CASCADE,
  'service:mutation': SERVICE_MUTATION_CASCADE,
  'course:mutation': COURSE_MUTATION_CASCADE,
  'artist:mutation': ARTIST_MUTATION_CASCADE,
  'import:catalog': PRODUCT_MUTATION_CASCADE,
  deploy: [CacheTag.HOMEPAGE, CacheTag.MARKETPLACE, CacheTag.RECOMMENDATIONS, CacheTag.SEO_META],
};

export async function purgeTags(
  tags: CacheTagValue[]
): Promise<{ deleted: number; tags: CacheTagValue[] }> {
  const t0 = Date.now();
  const deleted = await invalidateRedisByTags(tags);
  recordCacheMetric({
    operation: 'del',
    durationMs: Date.now() - t0,
    layer: 'redis',
  });
  return { deleted, tags };
}

export async function purgeByEvent(
  event: RedisInvalidationEvent
): Promise<{ deleted: number; tags: CacheTagValue[] }> {
  const tags = EVENT_TAGS[event] ?? [];
  return purgeTags(tags);
}

/** Purge SEO meta keys (middleware edge cache) */
export async function purgeSeoMetaCache(): Promise<number> {
  const { redisKeys, redisDel, getRedisConfig } = await import('./client');
  const config = getRedisConfig();
  if (!config) return 0;

  const keys = await redisKeys('seo:meta:v1:*', config);
  let deleted = 0;
  for (const key of keys) {
    if (await redisDel(key, config)) deleted++;
  }
  return deleted;
}
