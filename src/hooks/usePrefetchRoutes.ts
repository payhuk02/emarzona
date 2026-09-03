/**
 * usePrefetchRoutes — précharge les chunks JS des pages (import dynamique).
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { prefetchRouteChunk } from '@/lib/route-chunk-prefetch';

export interface PrefetchRoutesOptions {
  enabled?: boolean;
  idleRoutes?: readonly string[];
  hoverRoutes?: readonly string[];
  idleDelayMs?: number;
}

export function usePrefetchRoutes(options: PrefetchRoutesOptions = {}) {
  const { enabled = true, idleRoutes = [], hoverRoutes = [], idleDelayMs = 2500 } = options;
  const location = useLocation();
  const prefetchedIdle = useRef(new Set<string>());

  useEffect(() => {
    prefetchedIdle.current.clear();
  }, [enabled, idleRoutes.join('|')]);

  useEffect(() => {
    if (!enabled || idleRoutes.length === 0) return;

    const run = () => {
      idleRoutes.forEach((route, index) => {
        if (route === location.pathname || prefetchedIdle.current.has(route)) return;
        setTimeout(() => {
          if (prefetchedIdle.current.has(route)) return;
          prefetchedIdle.current.add(route);
          const started = prefetchRouteChunk(route);
          if (started) {
            logger.debug(`Prefetched route chunk (idle): ${route}`);
          }
        }, index * 200);
      });
    };

    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(run, { timeout: idleDelayMs + 1000 });
      return () => cancelIdleCallback(id);
    }

    const timeoutId = setTimeout(run, idleDelayMs);
    return () => clearTimeout(timeoutId);
  }, [enabled, idleRoutes, idleDelayMs, location.pathname]);

  useEffect(() => {
    if (!enabled || hoverRoutes.length === 0) return;

    const prefetchedHover = new Set<string>();

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target;
      if (!target || !(target instanceof Element)) return;

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor?.href) return;

      try {
        const pathname = new URL(anchor.href).pathname;
        if (!hoverRoutes.includes(pathname) || prefetchedHover.has(pathname)) return;
        prefetchedHover.add(pathname);
        const started = prefetchRouteChunk(pathname);
        if (started) {
          logger.debug(`Prefetched route chunk (hover): ${pathname}`);
        }
      } catch {
        // Liens externes ou href invalides
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    return () => document.removeEventListener('mouseenter', handleMouseEnter, true);
  }, [enabled, hoverRoutes]);
}
