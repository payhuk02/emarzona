/**
 * Hook useErrorBoundary - Gestion simplifiée des erreurs dans les composants
 * Fournit une API simple pour gérer les erreurs avec Error Boundary
 *
 * @example
 * ```tsx
 * const { error, resetError, ErrorFallback } = useErrorBoundary();
 *
 * if (error) {
 *   return <ErrorFallback />;
 * }
 * ```
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ErrorFallback } from '@/components/error/ErrorFallback';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

export interface UseErrorBoundaryReturn {
  /**
   * Erreur actuelle
   */
  error: Error | null;
  /**
   * Réinitialiser l'erreur
   */
  resetError: () => void;
  /**
   * Capturer une erreur
   */
  captureError: (error: Error) => void;
  /**
   * Composant ErrorFallback prêt à l'emploi
   */
  ErrorFallback: React.ComponentType<{ level?: 'component' | 'section' | 'page' | 'app' }>;
}

/**
 * Hook pour gérer les erreurs dans un composant
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((err: Error) => {
    setError(err);
  }, []);

  const ErrorFallbackComponent = useMemo(() => {
    const Component = (props: { level?: 'component' | 'section' | 'page' | 'app' }) => {
      if (!error) return null;
      return React.createElement(ErrorFallback, {
        error,
        resetError,
        level: props.level || 'component',
      });
    };
    return Component;
  }, [error, resetError]);

  return {
    error,
    resetError,
    captureError,
    ErrorFallback: ErrorFallbackComponent,
  };
}

/**
 * Hook pour wrapper une fonction avec gestion d'erreur
 */
export function useErrorHandler<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: {
    onError?: (error: Error) => void;
    showToast?: boolean;
  }
): T {
  const { onError, showToast = true } = options || {};

  return useCallback(
    ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        // Si c'est une promesse, gérer les erreurs
        if (result instanceof Promise) {
          return result.catch((error: Error) => {
            onError?.(error);
            if (showToast) {
              // ✅ PHASE 2: Remplacer console.error par logger
              logger.error('Error in async function', { error });
            }
            throw error;
          });
        }
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        if (showToast) {
          // ✅ PHASE 2: Remplacer console.error par logger
          logger.error('Error in function', { error: err });
        }
        throw err;
      }
    }) as T,
    [fn, onError, showToast]
  );
}






