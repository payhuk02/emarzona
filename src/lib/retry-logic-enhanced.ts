/**
 * Système de retry amélioré avec stratégies avancées
 * Date: 1 Février 2025
 * 
 * Améliore la gestion des erreurs avec :
 * - Retry avec backoff exponentiel
 * - Retry conditionnel selon le type d'erreur
 * - Circuit breaker pattern
 * - Rate limiting
 * - Logging détaillé
 */

import { logger } from './logger';

/**
 * Types d'erreurs pour déterminer la stratégie de retry
 */
export enum ErrorType {
  NETWORK = 'network', // Erreur réseau (timeout, connexion)
  SERVER = 'server', // Erreur serveur (500, 503)
  CLIENT = 'client', // Erreur client (400, 401, 403)
  RATE_LIMIT = 'rate_limit', // Rate limiting (429)
  UNKNOWN = 'unknown', // Erreur inconnue
}

/**
 * Configuration de retry
 */
export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: ErrorType[];
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Détecte le type d'erreur
 */
export function detectErrorType(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN;

  // Erreur réseau
  if (
    error.message?.includes('network') ||
    error.message?.includes('timeout') ||
    error.message?.includes('fetch failed') ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT'
  ) {
    return ErrorType.NETWORK;
  }

  // Rate limiting
  if (error.status === 429 || error.statusCode === 429) {
    return ErrorType.RATE_LIMIT;
  }

  // Erreur serveur
  if (
    error.status >= 500 ||
    error.statusCode >= 500 ||
    (error.response && error.response.status >= 500)
  ) {
    return ErrorType.SERVER;
  }

  // Erreur client
  if (
    error.status >= 400 ||
    error.statusCode >= 400 ||
    (error.response && error.response.status >= 400)
  ) {
    return ErrorType.CLIENT;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Détermine si une erreur est retryable
 */
export function isRetryableError(error: any, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;

  const errorType = detectErrorType(error);

  // Les erreurs réseau sont toujours retryables
  if (errorType === ErrorType.NETWORK) return true;

  // Les erreurs serveur sont retryables
  if (errorType === ErrorType.SERVER) return true;

  // Rate limiting est retryable (avec délai plus long)
  if (errorType === ErrorType.RATE_LIMIT) return true;

  // Les erreurs client ne sont généralement pas retryables
  if (errorType === ErrorType.CLIENT) {
    // Sauf pour certaines erreurs spécifiques
    const status = error.status || error.statusCode || error.response?.status;
    if (status === 408 || status === 409) return true; // Timeout ou conflit
    return false;
  }

  return false;
}

/**
 * Calcule le délai avant le prochain retry avec backoff exponentiel
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig
): number {
  const {
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
  } = config;

  // Pour rate limiting, utiliser un délai plus long
  const errorType = detectErrorType({});
  if (errorType === ErrorType.RATE_LIMIT) {
    return Math.min(initialDelay * 10 * (attempt + 1), maxDelay * 2);
  }

  // Backoff exponentiel avec jitter
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Jitter de 30%
  const delay = Math.min(exponentialDelay + jitter, maxDelay);

  return Math.round(delay);
}

/**
 * Retry avec stratégie améliorée
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    onRetry,
    shouldRetry,
  } = config;

  let  lastError: Error | null = null;

  for (let  attempt= 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Si succès après retry, logger
      if (attempt > 0) {
        logger.info('Retry successful', {
          attempt,
          maxRetries,
          errorType: lastError ? detectErrorType(lastError) : 'unknown',
        });
      }

      return result;
    } catch ( _error: any) {
      lastError = error;

      // Vérifier si on doit retry
      const shouldRetryThis = shouldRetry
        ? shouldRetry(error, attempt)
        : isRetryableError(error, attempt, maxRetries);

      if (!shouldRetryThis || attempt >= maxRetries) {
        // Ne plus retry, lancer l'erreur
        logger.error('Retry exhausted', {
          attempt,
          maxRetries,
          errorType: detectErrorType(error),
          error: error.message,
        });
        throw error;
      }

      // Calculer le délai
      const delay = calculateRetryDelay(attempt, config);

      // Logger le retry
      logger.warn('Retrying operation', {
        attempt: attempt + 1,
        maxRetries,
        delay,
        errorType: detectErrorType(error),
        error: error.message,
      });

      // Callback onRetry
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Attendre avant de retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Ne devrait jamais arriver ici, mais TypeScript le demande
  throw lastError || new Error('Retry failed');
}

/**
 * Circuit Breaker Pattern
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 secondes
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Si le circuit est ouvert, vérifier si on peut passer en half-open
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.timeout) {
        this.state = 'half-open';
        logger.info('Circuit breaker: transitioning to half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      
      // Succès : réinitialiser le circuit
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        logger.info('Circuit breaker: closed after successful half-open');
      } else {
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      // Si on dépasse le seuil, ouvrir le circuit
      if (this.failures >= this.threshold) {
        this.state = 'open';
        logger.error('Circuit breaker: opened', {
          failures: this.failures,
          threshold: this.threshold,
        });
      }

      throw error;
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Rate Limiter pour éviter trop de requêtes
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Nettoyer les requêtes anciennes
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Si on a atteint la limite, attendre
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        logger.info('Rate limiter: waiting', { waitTime });
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Nettoyer à nouveau après l'attente
        this.requests = this.requests.filter(
          timestamp => Date.now() - timestamp < this.windowMs
        );
      }
    }

    // Enregistrer cette requête
    this.requests.push(Date.now());
  }
}

/**
 * Wrapper pour fonction avec retry, circuit breaker et rate limiting
 */
export async function executeWithResilience<T>(
  fn: () => Promise<T>,
  options: {
    retryConfig?: RetryConfig;
    circuitBreaker?: CircuitBreaker;
    rateLimiter?: RateLimiter;
  } = {}
): Promise<T> {
  const { retryConfig, circuitBreaker, rateLimiter } = options;

  // Rate limiting d'abord
  if (rateLimiter) {
    await rateLimiter.waitIfNeeded();
  }

  // Circuit breaker
  if (circuitBreaker) {
    return circuitBreaker.execute(() => retryWithBackoff(fn, retryConfig));
  }

  // Sinon, juste retry
  return retryWithBackoff(fn, retryConfig);
}







