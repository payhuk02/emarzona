/**
 * Métriques cache Redis — hit rate, miss rate, latence.
 */

export interface CacheMetricPoint {
  timestamp: number;
  operation: 'get' | 'set' | 'del' | 'hit' | 'miss' | 'fallback';
  key?: string;
  durationMs?: number;
  layer: 'redis' | 'local' | 'network';
}

export interface CacheMetricsSummary {
  hits: number;
  misses: number;
  hitRate: number;
  fallbackCount: number;
  avgLatencyMs: number;
  operations: number;
  lastUpdated: number;
}

const MAX_POINTS = 500;
const points: CacheMetricPoint[] = [];
let hits = 0;
let misses = 0;
let fallbackCount = 0;
let totalLatencyMs = 0;
let latencyCount = 0;

export function recordCacheMetric(point: Omit<CacheMetricPoint, 'timestamp'>): void {
  points.push({ ...point, timestamp: Date.now() });
  if (points.length > MAX_POINTS) points.shift();

  if (point.operation === 'hit') hits++;
  if (point.operation === 'miss') misses++;
  if (point.layer === 'local' && point.operation === 'get') fallbackCount++;
  if (point.durationMs != null) {
    totalLatencyMs += point.durationMs;
    latencyCount++;
  }
}

export function getCacheMetricsSummary(): CacheMetricsSummary {
  const total = hits + misses;
  return {
    hits,
    misses,
    hitRate: total > 0 ? hits / total : 0,
    fallbackCount,
    avgLatencyMs: latencyCount > 0 ? totalLatencyMs / latencyCount : 0,
    operations: points.length,
    lastUpdated: Date.now(),
  };
}

export function getRecentCacheMetrics(limit = 50): CacheMetricPoint[] {
  return points.slice(-limit);
}

export function resetCacheMetrics(): void {
  points.length = 0;
  hits = 0;
  misses = 0;
  fallbackCount = 0;
  totalLatencyMs = 0;
  latencyCount = 0;
}

/** Persist metrics snapshot to Redis for dashboard */
export function serializeMetricsSnapshot(): string {
  return JSON.stringify({
    summary: getCacheMetricsSummary(),
    recent: getRecentCacheMetrics(20),
  });
}
