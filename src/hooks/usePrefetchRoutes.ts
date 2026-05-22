/**
 * Prefetch document des routes critiques (idle), selon profil auth/vendeur.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';

export interface PrefetchRoutesOptions {
  enabled?: boolean;
  idleRoutes?: readonly string[];
  hoverRoutes?: readonly string[];
  idleDelayMs?: number;
}

function prefetchDocumentRoute(route: string) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  link.as = 'document';
  document.head.appendChild(link);
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
          prefetchDocumentRoute(route);
          logger.debug(`Prefetched route (idle): ${route}`);
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
        prefetchDocumentRoute(pathname);
        logger.debug(`Prefetched route (hover): ${pathname}`);
      } catch {
        // Liens externes ou href invalides
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    return () => document.removeEventListener('mouseenter', handleMouseEnter, true);
  }, [enabled, hoverRoutes]);
}
