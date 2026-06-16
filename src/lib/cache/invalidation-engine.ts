/**
 * Moteur d'invalidation intelligent — purge en cascade multi-couches.
 * Produit modifié → purge produit, boutique, catégorie, recherche, homepage.
 */

import type { QueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { clearAllMarketplaceCache } from '@/lib/marketplace-cache';
import {
  CacheTag,
  type CacheTagValue,
  PRODUCT_MUTATION_CASCADE,
  STORE_MUTATION_CASCADE,
  SERVICE_MUTATION_CASCADE,
  COURSE_MUTATION_CASCADE,
  ARTIST_MUTATION_CASCADE,
  entityTag,
} from './tags';
import { collectQueryKeysForTags } from './query-tags';

export type InvalidationEvent =
  | 'product:create'
  | 'product:update'
  | 'product:delete'
  | 'product:publish'
  | 'product:mutation'
  | 'store:update'
  | 'store:mutation'
  | 'service:mutation'
  | 'course:mutation'
  | 'artist:mutation'
  | 'import:catalog'
  | 'deploy'
  | 'admin:homepage-update';

export interface InvalidationContext {
  entityId?: string;
  storeId?: string;
  /** Invalider aussi le cache Redis edge (nécessite appel API) */
  purgeRedis?: boolean;
  /** Invalider le cache navigateur marketplace */
  purgeBrowserCache?: boolean;
}

export interface InvalidationResult {
  tags: CacheTagValue[];
  queryKeysInvalidated: number;
  browserCacheCleared: boolean;
  redisPurged: boolean;
  timestamp: number;
}

const EVENT_CASCADE_MAP: Record<InvalidationEvent, CacheTagValue[]> = {
  'product:create': PRODUCT_MUTATION_CASCADE,
  'product:update': PRODUCT_MUTATION_CASCADE,
  'product:delete': PRODUCT_MUTATION_CASCADE,
  'product:publish': PRODUCT_MUTATION_CASCADE,
  'product:mutation': PRODUCT_MUTATION_CASCADE,
  'store:update': STORE_MUTATION_CASCADE,
  'store:mutation': STORE_MUTATION_CASCADE,
  'service:mutation': SERVICE_MUTATION_CASCADE,
  'course:mutation': COURSE_MUTATION_CASCADE,
  'artist:mutation': ARTIST_MUTATION_CASCADE,
  'import:catalog': [
    ...PRODUCT_MUTATION_CASCADE,
    CacheTag.CATEGORY,
    CacheTag.FACETS,
    CacheTag.RECOMMENDATIONS,
  ],
  deploy: [CacheTag.HOMEPAGE, CacheTag.MARKETPLACE, CacheTag.RECOMMENDATIONS, CacheTag.SEO_META],
  'admin:homepage-update': [CacheTag.HOMEPAGE, CacheTag.MARKETPLACE],
};

/** Invalide les tags React Query côté client */
export function invalidateTags(
  queryClient: QueryClient,
  tags: CacheTagValue[],
  context: InvalidationContext = {}
): InvalidationResult {
  const { entityId, storeId, purgeBrowserCache = true } = context;
  const queryKeys = collectQueryKeysForTags(tags, entityId, { storeId });

  for (const key of queryKeys) {
    queryClient.invalidateQueries({ queryKey: key });
  }

  if (entityId) {
    for (const tag of tags) {
      queryClient.invalidateQueries({ queryKey: [entityTag(tag, entityId)] });
    }
  }

  let browserCacheCleared = false;
  if (purgeBrowserCache) {
    void clearAllMarketplaceCache().then(() => {
      browserCacheCleared = true;
    });
  }

  const result: InvalidationResult = {
    tags,
    queryKeysInvalidated: queryKeys.length,
    browserCacheCleared,
    redisPurged: false,
    timestamp: Date.now(),
  };

  logger.info('Cache tags invalidated', {
    tags,
    queryKeys: queryKeys.length,
    entityId,
    storeId,
  });

  return result;
}

/** Invalide par événement métier avec cascade automatique */
export function invalidateByEvent(
  queryClient: QueryClient,
  event: InvalidationEvent,
  context: InvalidationContext = {}
): InvalidationResult {
  const tags = EVENT_CASCADE_MAP[event] ?? [];
  return invalidateTags(queryClient, tags, context);
}

/** Purge Redis edge — serveur uniquement (API Vercel / scripts). Le client utilise les triggers DB. */
export async function purgeRedisTags(tags: CacheTagValue[], secret?: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    logger.debug('Redis purge skipped on client — handled by DB webhook → cache-invalidate');
    return false;
  }

  const apiSecret = secret ?? process.env.CACHE_INVALIDATION_SECRET;
  if (!apiSecret) {
    logger.debug('Redis purge skipped: CACHE_INVALIDATION_SECRET not set');
    return false;
  }

  try {
    const site = process.env.SITE_URL || process.env.VERCEL_URL || 'https://www.emarzona.com';
    const base = site.startsWith('http') ? site : `https://${site}`;
    const res = await fetch(`${base}/api/cache/invalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiSecret}`,
      },
      body: JSON.stringify({ tags }),
    });
    return res.ok;
  } catch (error) {
    logger.warn('Redis tag purge failed', { error, tags });
    return false;
  }
}

/** Invalidation complète multi-couches */
export async function invalidateFull(
  queryClient: QueryClient,
  event: InvalidationEvent,
  context: InvalidationContext = {}
): Promise<InvalidationResult> {
  const result = invalidateByEvent(queryClient, event, context);

  if (context.purgeRedis !== false) {
    result.redisPurged = await purgeRedisTags(result.tags);
  }

  return result;
}

/** Équivalent revalidateTag() — invalide un tag unique */
export function revalidateTag(
  queryClient: QueryClient,
  tag: CacheTagValue,
  context?: InvalidationContext
): InvalidationResult {
  return invalidateTags(queryClient, [tag], context);
}

/** Équivalent updateTag() — force refresh immédiat */
export function updateTag(
  queryClient: QueryClient,
  tag: CacheTagValue,
  context?: InvalidationContext
): void {
  const keys = collectQueryKeysForTags([tag], context?.entityId, {
    storeId: context?.storeId,
  });
  for (const key of keys) {
    queryClient.refetchQueries({ queryKey: key });
  }
}
