/**
 * API publique du système de cache enterprise Emarzona.
 */

export {
  CacheTag,
  CACHE_TAG_VERSION,
  entityTag,
  storeScopedTag,
  redisKey,
  PRODUCT_MUTATION_CASCADE,
  STORE_MUTATION_CASCADE,
  SERVICE_MUTATION_CASCADE,
  COURSE_MUTATION_CASCADE,
  ARTIST_MUTATION_CASCADE,
  type CacheTagValue,
} from './tags';

export {
  CACHE_STRATEGIES,
  buildCacheControlHeader,
  getStrategyForTag,
  type CacheLayer,
  type CacheMethod,
  type CacheStrategyEntry,
} from './config';

export { TAG_TO_QUERY_PREFIXES, queryKeysForEntity, collectQueryKeysForTags } from './query-tags';

export {
  getSwrState,
  createSwrEntry,
  fetchWithSwr,
  DEFAULT_SWR_OPTIONS,
  type SwrEntry,
  type SwrOptions,
  type SwrState,
} from './swr';

export {
  invalidateTags,
  invalidateByEvent,
  invalidateFull,
  purgeRedisTags,
  revalidateTag,
  updateTag,
  type InvalidationEvent,
  type InvalidationContext,
  type InvalidationResult,
} from './invalidation-engine';

export {
  CACHE_WARMER,
  warmCache,
  scheduleClientWarmOnDeploy,
  WARM_TARGETS_DEPLOY,
} from './CACHE_WARMER';

// Ré-exports compatibilité
export {
  createOptimizedQueryClient,
  cacheStrategies,
  invalidateCache,
  setupCacheCleanup,
  optimizeLocalStorageCache,
} from '@/lib/cache-optimization';

export {
  invalidateCatalogCaches,
  invalidateRelatedCache,
  invalidateProductCache,
  EntityType,
  EntityAction,
} from '@/lib/cache-invalidation';
