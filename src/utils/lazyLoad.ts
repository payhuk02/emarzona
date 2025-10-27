/**
 * Utilitaires pour lazy loading optimisé
 * Date : 27 octobre 2025
 */

import { lazy, ComponentType } from 'react';

/**
 * Lazy load avec retry automatique en cas d'échec
 * Utile pour les erreurs de chunk loading
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (attemptNumber: number) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (attemptNumber >= retries) {
              reject(error);
            } else {
              setTimeout(() => {
                console.log(`Retry loading component (attempt ${attemptNumber + 1}/${retries})`);
                attemptLoad(attemptNumber + 1);
              }, interval);
            }
          });
      };

      attemptLoad(1);
    });
  });
}

/**
 * Précharger un module pour améliorer la navigation
 */
export function prefetchComponent(importFunc: () => Promise<any>) {
  if (typeof window !== 'undefined') {
    // Précharger après un délai pour ne pas bloquer l'interaction
    const timeoutId = setTimeout(() => {
      importFunc().catch(() => {
        // Silently fail - prefetch is a nice-to-have
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }
  return () => {};
}

/**
 * Lazy load conditionnel basé sur les conditions
 */
export function conditionalLazyLoad<T extends ComponentType<any>>(
  condition: () => boolean,
  importFunc: () => Promise<{ default: T }>,
  fallback?: T
): React.LazyExoticComponent<T> | T {
  if (condition() && fallback) {
    return fallback;
  }
  return lazyWithRetry(importFunc);
}

