export {
  getRedisConfig,
  redisGet,
  redisSetEx,
  redisDel,
  redisKeys,
  redisPing,
  redisPipeline,
} from './client';
export {
  RedisService,
  redisService,
  registerKeyUnderTag,
  invalidateRedisByTag,
  invalidateRedisByTags,
} from './service';
export { purgeTags, purgeByEvent, purgeSeoMetaCache } from './tags';
export {
  recordCacheMetric,
  getCacheMetricsSummary,
  getRecentCacheMetrics,
  resetCacheMetrics,
  serializeMetricsSnapshot,
  type CacheMetricPoint,
  type CacheMetricsSummary,
} from './metrics';
export * as localFallback from './local-fallback';
