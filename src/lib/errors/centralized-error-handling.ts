/**
 * Système Centralisé de Gestion d'Erreurs
 * Date: 3 Février 2025
 *
 * Unifie tous les systèmes de gestion d'erreurs et retry
 */

import { logger } from '@/lib/logger';
import {
  normalizeError,
  shouldRetryError,
  getRetryDelay,
  ErrorSeverity,
} from '@/lib/error-handling';
import { retryWithBackoff, RetryConfig } from '@/lib/retry-logic-enhanced';

// =====================================================
// TYPES
// =====================================================

export interface CentralizedErrorResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
  retryable?: boolean;
  severity?: ErrorSeverity;
}

export interface ErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  showToast?: boolean;
  logError?: boolean;
  onError?: (error: unknown) => void;
}

// =====================================================
// FONCTION CENTRALISÉE DE GESTION D'ERREURS
// =====================================================

/**
 * Gère une erreur de manière centralisée
 */
export function handleError<T = unknown>(
  error: unknown,
  options: ErrorHandlingOptions = {}
): CentralizedErrorResult<T> {
  const { logError: shouldLog = true, onError } = options;

  // Normaliser l'erreur
  const normalized = normalizeError(error);

  // Logger si nécessaire
  if (shouldLog) {
    logger.error('Error handled by centralized error handler', {
      error: normalized,
      severity: normalized.severity,
    });
  }

  // Appeler le callback personnalisé
  onError?.(error);

  // Déterminer si l'erreur est retryable
  const retryable = shouldRetryError(error, 0);

  return {
    success: false,
    error: normalized.message,
    retryable,
    severity: normalized.severity,
  };
}

// =====================================================
// FONCTION AVEC RETRY AUTOMATIQUE
// =====================================================

/**
 * Exécute une fonction avec retry automatique et gestion d'erreurs centralisée
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions & RetryConfig = {}
): Promise<CentralizedErrorResult<T>> {
  const { maxRetries = 3, retryDelay = 1000, onError, logError = true, ...retryConfig } = options;

  try {
    const result = await retryWithBackoff(fn, {
      maxRetries,
      initialDelay: retryDelay,
      ...retryConfig,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleError<T>(error, {
      maxRetries,
      retryDelay,
      onError,
      logError,
    });
  }
}

// =====================================================
// WRAPPER POUR REACT QUERY
// =====================================================

/**
 * Configuration centralisée pour React Query avec retry automatique
 */
export const centralizedQueryConfig = {
  retry: (failureCount: number, error: unknown) => {
    return shouldRetryError(error, failureCount) && failureCount < 3;
  },
  retryDelay: (attemptIndex: number, error: unknown) => {
    return getRetryDelay(attemptIndex);
  },
  onError: (error: unknown) => {
    const normalized = normalizeError(error);
    if (normalized.severity >= ErrorSeverity.HIGH) {
      logger.error('React Query error', { error: normalized });
    }
  },
};

/**
 * Configuration centralisée pour React Query Mutations avec retry automatique
 */
export const centralizedMutationConfig = {
  retry: (failureCount: number, error: unknown) => {
    // Pour les mutations, on retry seulement les erreurs réseau
    const normalized = normalizeError(error);
    return (
      normalized.type === 'NETWORK_ERROR' &&
      shouldRetryError(error, failureCount) &&
      failureCount < 2
    );
  },
  retryDelay: (attemptIndex: number) => {
    return getRetryDelay(attemptIndex);
  },
  onError: (error: unknown) => {
    const normalized = normalizeError(error);
    logger.error('React Query mutation error', { error: normalized });
  },
};

// =====================================================
// EXPORT UNIFIÉ
// =====================================================

export const centralizedErrorHandling = {
  handleError,
  executeWithRetry,
  queryConfig: centralizedQueryConfig,
  mutationConfig: centralizedMutationConfig,
};

