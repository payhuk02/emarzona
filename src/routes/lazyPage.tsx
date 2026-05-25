/**
 * Lazy load des pages de route avec retry + fallback (évite l'écran d'erreur global au 1er clic).
 */
import type { ComponentType, LazyExoticComponent } from 'react';
import { lazyWithRetry } from '@/utils/lazyLoad';
import { PageLoadError } from '@/components/errors/PageLoadError';
import { logger } from '@/lib/logger';

export function lazyPage<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  pageName?: string
): LazyExoticComponent<T> {
  return lazyWithRetry(() =>
    importFn().catch(error => {
      logger.error('Page chunk load failed', { error, pageName });
      const Fallback = () => <PageLoadError pageName={pageName} />;
      return { default: Fallback as T };
    })
  );
}
