/**
 * Email Retry Service
 * Gère les retries automatiques avec backoff exponentiel
 * Date: 2 Février 2025
 */

import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number; // en millisecondes
  maxDelay?: number; // en millisecondes
  multiplier?: number; // multiplicateur pour backoff exponentiel
  jitter?: boolean; // ajouter du jitter pour éviter les thundering herds
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

// ============================================================
// CONFIGURATION PAR DÉFAUT
// ============================================================

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 seconde
  maxDelay: 30000, // 30 secondes
  multiplier: 2, // double à chaque retry
  jitter: true,
};

// ============================================================
// SERVICE
// ============================================================

export class EmailRetryService {
  /**
   * Exécuter une fonction avec retry automatique
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      attempts = attempt + 1;

      try {
        const result = await fn();
        const totalTime = Date.now() - startTime;

        if (attempt > 0) {
          logger.info('Email sent successfully after retry', {
            attempts,
            totalTime,
            attempt,
          });
        }

        return {
          success: true,
          result,
          attempts,
          totalTime,
        };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Vérifier si l'erreur est récupérable
        if (!this.isRecoverableError(lastError)) {
          logger.error('Non-recoverable error, stopping retries', {
            error: lastError.message,
            attempts,
          });
          break;
        }

        // Si c'est le dernier essai, arrêter
        if (attempt >= finalConfig.maxRetries) {
          logger.error('Max retries reached', {
            error: lastError.message,
            attempts: finalConfig.maxRetries + 1,
          });
          break;
        }

        // Calculer le délai avant le prochain essai
        const delay = this.calculateDelay(attempt, finalConfig);

        logger.warn('Email failed, retrying', {
          attempt: attempt + 1,
          maxRetries: finalConfig.maxRetries,
          delay,
          error: lastError.message,
        });

        // Attendre avant le prochain essai
        await this.sleep(delay);
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      success: false,
      error: lastError,
      attempts,
      totalTime,
    };
  }

  /**
   * Calculer le délai avec backoff exponentiel
   */
  private static calculateDelay(
    attempt: number,
    config: Required<RetryConfig>
  ): number {
    // Calculer le délai de base (backoff exponentiel)
    let delay =
      config.initialDelay * Math.pow(config.multiplier, attempt);

    // Appliquer le délai maximum
    delay = Math.min(delay, config.maxDelay);

    // Ajouter du jitter si activé (évite les thundering herds)
    if (config.jitter) {
      // Jitter aléatoire entre 0 et 20% du délai
      const jitterAmount = delay * 0.2 * Math.random();
      delay = delay + jitterAmount;
    }

    return Math.floor(delay);
  }

  /**
   * Vérifier si une erreur est récupérable
   */
  private static isRecoverableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Erreurs non récupérables
    const nonRecoverableErrors = [
      'authentication',
      'authorization',
      'invalid',
      'not found',
      'bad request',
      'forbidden',
      'unauthorized',
    ];

    if (
      nonRecoverableErrors.some(
        (msg) => errorMessage.includes(msg) || errorName.includes(msg)
      )
    ) {
      return false;
    }

    // Erreurs récupérables
    const recoverableErrors = [
      'timeout',
      'network',
      'connection',
      'rate limit',
      'too many requests',
      'server error',
      'service unavailable',
      'gateway',
      'econnreset',
      'etimedout',
      'enotfound',
      'econnrefused',
    ];

    return recoverableErrors.some(
      (msg) => errorMessage.includes(msg) || errorName.includes(msg)
    );
  }

  /**
   * Sleep helper
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Vérifier si une erreur HTTP est récupérable
   */
  static isRecoverableHttpError(statusCode: number): boolean {
    // 4xx (sauf 429) = erreurs client, non récupérables
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      return false;
    }

    // 429 (Too Many Requests) = récupérable
    if (statusCode === 429) {
      return true;
    }

    // 5xx = erreurs serveur, récupérables
    if (statusCode >= 500) {
      return true;
    }

    return false;
  }
}

// Export instance singleton
export const emailRetryService = EmailRetryService;

