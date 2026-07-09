/**
 * Lazy load des pages de route avec retry + fallback (évite l'écran d'erreur global au 1er clic).
 */
import React, { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
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
  return lazy(() => {
    return new Promise<{ default: T }>((resolve) => {
      let attempts = 0;
      const maxRetries = 3;
      const interval = 1000;

      const attemptLoad = () => {
        attempts++;
        importFn()
          .then(resolve)
          .catch((error) => {
            if (attempts >= maxRetries) {
              const inferred = pageName ?? inferPageName(importFn);
              const errName = isErrorLike(error) && 'name' in error ? String(error.name) : undefined;
              const errStack = isErrorLike(error) && 'stack' in error ? String(error.stack) : undefined;
              logger.error('Page chunk load failed after retries', {
                pageName: inferred,
                error,
                errorName: errName,
                errorStack: errStack,
                attempts
              });
              
              // Affichage du composant de fallback au lieu de jeter l'erreur 
              // pour éviter de déclencher le ErrorBoundary global.
              const Fallback = () => <PageLoadError pageName={inferred} />;
              resolve({ default: Fallback as unknown as T });
            } else {
              logger.debug(`Retry loading component (attempt ${attempts + 1}/${maxRetries})`);
              setTimeout(attemptLoad, interval);
            }
          });
      };

      attemptLoad();
    });
  });
}
