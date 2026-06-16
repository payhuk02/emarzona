/**
 * CACHE_WARMER — Précharge les pages et données critiques après déploiement ou import catalogue.
 */

import { logger } from '@/lib/logger';
import { CacheTag } from './tags';
import type { CacheTagValue } from './tags';

export interface WarmTarget {
  path: string;
  tags: CacheTagValue[];
  priority: 'critical' | 'high' | 'normal';
}

/** Routes à précharger après déploiement */
export const WARM_TARGETS_DEPLOY: WarmTarget[] = [
  { path: '/', tags: [CacheTag.HOMEPAGE], priority: 'critical' },
  { path: '/marketplace', tags: [CacheTag.MARKETPLACE, CacheTag.FACETS], priority: 'critical' },
  {
    path: '/marketplace?type=digital',
    tags: [CacheTag.MARKETPLACE, CacheTag.DIGITAL_PRODUCT],
    priority: 'high',
  },
  {
    path: '/marketplace?type=physical',
    tags: [CacheTag.MARKETPLACE, CacheTag.PHYSICAL_PRODUCT],
    priority: 'high',
  },
  {
    path: '/marketplace?type=service',
    tags: [CacheTag.MARKETPLACE, CacheTag.SERVICE],
    priority: 'high',
  },
  {
    path: '/marketplace?type=course',
    tags: [CacheTag.MARKETPLACE, CacheTag.COURSE],
    priority: 'high',
  },
  {
    path: '/marketplace?type=artist',
    tags: [CacheTag.MARKETPLACE, CacheTag.ARTIST],
    priority: 'high',
  },
];

export interface WarmResult {
  path: string;
  success: boolean;
  durationMs: number;
  status?: number;
  error?: string;
}

export interface WarmSummary {
  total: number;
  succeeded: number;
  failed: number;
  durationMs: number;
  results: WarmResult[];
}

export interface WarmOptions {
  baseUrl?: string;
  targets?: WarmTarget[];
  concurrency?: number;
  secret?: string;
  onProgress?: (result: WarmResult) => void;
}

/**
 * Précharge les URLs via fetch (edge + CDN + Redis SEO).
 * Appelé côté serveur (Vercel cron / post-deploy hook) ou via /api/cache/warm.
 */
export async function warmCache(options: WarmOptions = {}): Promise<WarmSummary> {
  const start = Date.now();
  const baseUrl =
    options.baseUrl ??
    (typeof process !== 'undefined' ? process.env.VERCEL_URL : undefined) ??
    'https://www.emarzona.com';
  const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  const targets = options.targets ?? WARM_TARGETS_DEPLOY;
  const concurrency = options.concurrency ?? 3;
  const results: WarmResult[] = [];

  const queue = [...targets];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const target = queue.shift();
      if (!target) break;

      const url = `${origin}${target.path}`;
      const t0 = Date.now();
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'EmarzonaCacheWarmer/1.0',
        };
        if (options.secret) {
          headers['Authorization'] = `Bearer ${options.secret}`;
        }

        const res = await fetch(url, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(15000),
        });

        const result: WarmResult = {
          path: target.path,
          success: res.ok,
          durationMs: Date.now() - t0,
          status: res.status,
        };
        results.push(result);
        options.onProgress?.(result);
      } catch (error) {
        const result: WarmResult = {
          path: target.path,
          success: false,
          durationMs: Date.now() - t0,
          error: error instanceof Error ? error.message : String(error),
        };
        results.push(result);
        options.onProgress?.(result);
      }
    }
  });

  await Promise.all(workers);

  const summary: WarmSummary = {
    total: results.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    durationMs: Date.now() - start,
    results,
  };

  logger.info('Cache warm completed', {
    succeeded: summary.succeeded,
    failed: summary.failed,
    durationMs: summary.durationMs,
  });

  return summary;
}

/** Déclenche le warm cache côté client après déploiement (détecté via build ID) */
export function scheduleClientWarmOnDeploy(): void {
  if (typeof window === 'undefined') return;

  const buildId = import.meta.env.VITE_BUILD_ID ?? 'dev';
  const storageKey = 'emarzona_cache_warm_build';

  try {
    const lastWarmed = localStorage.getItem(storageKey);
    if (lastWarmed === buildId) return;

    const criticalPaths = WARM_TARGETS_DEPLOY.filter(t => t.priority === 'critical').map(
      t => t.path
    );

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        criticalPaths.forEach(path => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = path;
          document.head.appendChild(link);
        });
        localStorage.setItem(storageKey, buildId);
      });
    }
  } catch {
    /* ignore storage errors */
  }
}

export const CACHE_WARMER = { warmCache, scheduleClientWarmOnDeploy, WARM_TARGETS_DEPLOY };
