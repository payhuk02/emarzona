/**
 * Système de retry avec backoff exponentiel pour Moneroo
 */

import { logger } from './logger';
import {
  MonerooError,
  MonerooNetworkError,
  MonerooTimeoutError,
  MonerooValidationError,
  MonerooAuthenticationError,
} from './moneroo-errors';
import { RetryOptions } from './moneroo-types';

/**
 * Erreurs qui peuvent être retentées
 */
const RETRYABLE_ERRORS = [
  'Failed to fetch',
  'NetworkError',
  'network request failed',
  'timeout',
  'TIMEOUT',
  'AbortError',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
];

/**
 * Erreurs qui ne doivent PAS être retentées
 */
const NON_RETRYABLE_ERRORS = [
  'ValidationError',
  'AuthenticationError',
  '401',
  '403',
  '400',
  '422',
];

/**
 * Vérifie si une erreur peut être retentée
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof MonerooValidationError || 
      error instanceof MonerooAuthenticationError) {
    return false;
  }

  if (error instanceof MonerooNetworkError || 
      error instanceof MonerooTimeoutError) {
    return true;
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Vérifier les erreurs non retentables
    for (const nonRetryable of NON_RETRYABLE_ERRORS) {
      if (errorMessage.includes(nonRetryable.toLowerCase())) {
        return false;
      }
    }

    // Vérifier les erreurs retentables
    for (const retryable of RETRYABLE_ERRORS) {
      if (errorMessage.includes(retryable.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calcule le délai de backoff exponentiel
 */
function calculateBackoff(attempt: number, baseBackoffMs: number): number {
  // Backoff exponentiel: baseBackoffMs * 2^attempt
  // Avec un maximum de 30 secondes
  const backoff = baseBackoffMs * Math.pow(2, attempt);
  return Math.min(backoff, 30000);
}

/**
 * Attend un délai avec un peu de jitter pour éviter le thundering herd
 */
function sleep(ms: number): Promise<void> {
  // Ajouter un jitter aléatoire de ±20%
  const jitter = ms * 0.2 * (Math.random() * 2 - 1);
  const delay = Math.max(0, ms + jitter);
  
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Exécute une fonction avec retry automatique et backoff exponentiel
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    backoffMs = 1000,
    retryableErrors = RETRYABLE_ERRORS,
  } = options;

  let lastError: unknown;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await fn();
      
      // Si c'est le premier essai, pas de log
      if (attempt > 0) {
        logger.info(`[MonerooRetry] Success after ${attempt} retry(ies)`);
      }
      
      return result;
    } catch (error) {
      lastError = error;

      // Vérifier si l'erreur peut être retentée
      if (!isRetryableError(error)) {
        logger.warn(`[MonerooRetry] Non-retryable error, stopping retries:`, {
          error: error instanceof Error ? error.message : String(error),
          attempt,
        });
        throw error;
      }

      // Si on a atteint le maximum de tentatives, lancer l'erreur
      if (attempt >= maxRetries) {
        logger.error(`[MonerooRetry] Max retries (${maxRetries}) reached, giving up:`, {
          error: error instanceof Error ? error.message : String(error),
          attempts: attempt + 1,
        });
        throw error;
      }

      // Calculer le délai de backoff
      const backoff = calculateBackoff(attempt, backoffMs);
      
      logger.warn(`[MonerooRetry] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${backoff}ms:`, {
        error: error instanceof Error ? error.message : String(error),
        backoff,
      });

      // Attendre avant de réessayer
      await sleep(backoff);
      attempt++;
    }
  }

  // Ne devrait jamais arriver, mais TypeScript l'exige
  throw lastError;
}


