/**
 * Lazy load des pages de route avec retry + fallback (évite l'écran d'erreur global au 1er clic).
 */
import type { ComponentType, LazyExoticComponent } from 'react';
import { lazyWithRetry } from '@/utils/lazyLoad';
import { PageLoadError } from '@/components/errors/PageLoadError';
import { logger } from '@/lib/logger';

type ErrorLike = {
  name?: unknown;
  stack?: unknown;
};

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === 'object' && value !== null;
}

function inferPageName(importFn: () => Promise<{ default: unknown }>): string | undefined {
  try {
    const src = Function.prototype.toString.call(importFn);
    const match = src.match(/import\((['"`])([^'"`]+)\1\)/);
    return match?.[2];
  } catch {
    return undefined;
  }
}

export function lazyPage<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  pageName?: string
): LazyExoticComponent<T> {
  return lazyWithRetry(() =>
    importFn().catch(error => {
      const inferred = pageName ?? inferPageName(importFn);
      const errName = isErrorLike(error) && 'name' in error ? String(error.name) : undefined;
      const errStack = isErrorLike(error) && 'stack' in error ? String(error.stack) : undefined;
      logger.error('Page chunk load failed', {
        pageName: inferred,
        error,
        errorName: errName,
        errorStack: errStack,
      });
      const Fallback = () => <PageLoadError pageName={inferred} />;
      return { default: Fallback as T };
    })
  );
}
