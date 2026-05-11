/**
 * Email Rate Limiter
 * Gère le rate limiting pour l'envoi d'emails via SendGrid
 * Date: 2 Février 2025
 */

import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

interface QueuedEmail {
  payload: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retryCount: number;
  maxRetries: number;
}

// ============================================================
// CONFIGURATION
// ============================================================

// Limites SendGrid (par défaut)
// Free: 100 emails/jour, 14 emails/seconde
// Essentials: 40,000 emails/jour, 14 emails/seconde
// Pro: 100,000 emails/jour, 14 emails/seconde
// Advanced: 100,000+ emails/jour, 14 emails/seconde

const RATE_LIMITS = {
  MAX_PER_SECOND: 10, // Limite conservatrice (en dessous de 14/sec)
  MAX_PER_MINUTE: 600, // 10/sec * 60
  MAX_PER_HOUR: 36000, // 10/sec * 3600
  MAX_PER_DAY: 100000, // Limite pour plan Advanced
};

// ============================================================
// CLASSE RATE LIMITER
// ============================================================

export class EmailRateLimiter {
  private static queue: QueuedEmail[] = [];
  private static processing = false;
  private static currentSecondCount = 0;
  private static currentMinuteCount = 0;
  private static currentHourCount = 0;
  private static currentDayCount = 0;
  private static lastSecondReset = Date.now();
  private static lastMinuteReset = Date.now();
  private static lastHourReset = Date.now();
  private static lastDayReset = Date.now();

  /**
   * Ajouter un email à la queue
   */
  static async enqueue(
    sendEmailFn: () => Promise<any>,
    maxRetries: number = 3
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        payload: sendEmailFn,
        resolve,
        reject,
        retryCount: 0,
        maxRetries,
      });

      // Démarrer le traitement si pas déjà en cours
      this.processQueue();
    });
  }

  /**
   * Traiter la queue
   */
  private static async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        // Réinitialiser les compteurs si nécessaire
        this.resetCountersIfNeeded();

        // Vérifier les limites
        if (this.isRateLimited()) {
          // Attendre avant de continuer
          const waitTime = this.calculateWaitTime();
          logger.info('Rate limit reached, waiting', { waitTime });
          await this.sleep(waitTime);
          continue;
        }

        // Traiter un batch d'emails (jusqu'à MAX_PER_SECOND)
        const batchSize = Math.min(
          RATE_LIMITS.MAX_PER_SECOND - this.currentSecondCount,
          this.queue.length
        );

        if (batchSize > 0) {
          const batch = this.queue.splice(0, batchSize);

          // Traiter le batch en parallèle
          await Promise.allSettled(
            batch.map((item) => this.processEmail(item))
          );
        }

        // Attendre 1 seconde avant le prochain batch
        if (this.queue.length > 0) {
          await this.sleep(1000);
        }
      }
    } catch (error) {
      logger.error('Error processing email queue', { error });
    } finally {
      this.processing = false;
    }
  }

  /**
   * Traiter un email individuel
   */
  private static async processEmail(item: QueuedEmail): Promise<void> {
    try {
      // Incrémenter les compteurs
      this.incrementCounters();

      // Exécuter la fonction d'envoi
      const result = await item.payload();

      // Résoudre la promesse
      item.resolve(result);
    } catch ( _error: any) {
      // Si erreur récupérable et retries disponibles, réessayer
      if (this.isRecoverableError(error) && item.retryCount < item.maxRetries) {
        item.retryCount++;
        const backoffDelay = Math.pow(2, item.retryCount) * 1000; // Backoff exponentiel

        logger.warn('Email failed, retrying', {
          retryCount: item.retryCount,
          maxRetries: item.maxRetries,
          backoffDelay,
          error: error.message,
        });

        // Réinsérer dans la queue après le délai
        setTimeout(() => {
          this.queue.push(item);
          this.processQueue();
        }, backoffDelay);
      } else {
        // Erreur non récupérable ou max retries atteint
        logger.error('Email failed permanently', {
          retryCount: item.retryCount,
          maxRetries: item.maxRetries,
          error: error.message,
        });
        item.reject(error);
      }
    }
  }

  /**
   * Vérifier si on est rate limited
   */
  private static isRateLimited(): boolean {
    return (
      this.currentSecondCount >= RATE_LIMITS.MAX_PER_SECOND ||
      this.currentMinuteCount >= RATE_LIMITS.MAX_PER_MINUTE ||
      this.currentHourCount >= RATE_LIMITS.MAX_PER_HOUR ||
      this.currentDayCount >= RATE_LIMITS.MAX_PER_DAY
    );
  }

  /**
   * Calculer le temps d'attente nécessaire
   */
  private static calculateWaitTime(): number {
    const now = Date.now();

    // Attendre jusqu'à la prochaine seconde si limite seconde atteinte
    if (this.currentSecondCount >= RATE_LIMITS.MAX_PER_SECOND) {
      const nextSecond = this.lastSecondReset + 1000;
      return Math.max(0, nextSecond - now);
    }

    // Attendre jusqu'à la prochaine minute si limite minute atteinte
    if (this.currentMinuteCount >= RATE_LIMITS.MAX_PER_MINUTE) {
      const nextMinute = this.lastMinuteReset + 60000;
      return Math.max(0, nextMinute - now);
    }

    // Attendre jusqu'à la prochaine heure si limite heure atteinte
    if (this.currentHourCount >= RATE_LIMITS.MAX_PER_HOUR) {
      const nextHour = this.lastHourReset + 3600000;
      return Math.max(0, nextHour - now);
    }

    // Attendre jusqu'au prochain jour si limite jour atteinte
    if (this.currentDayCount >= RATE_LIMITS.MAX_PER_DAY) {
      const nextDay = this.lastDayReset + 86400000;
      return Math.max(0, nextDay - now);
    }

    return 0;
  }

  /**
   * Réinitialiser les compteurs si nécessaire
   */
  private static resetCountersIfNeeded(): void {
    const now = Date.now();

    // Réinitialiser compteur seconde
    if (now - this.lastSecondReset >= 1000) {
      this.currentSecondCount = 0;
      this.lastSecondReset = now;
    }

    // Réinitialiser compteur minute
    if (now - this.lastMinuteReset >= 60000) {
      this.currentMinuteCount = 0;
      this.lastMinuteReset = now;
    }

    // Réinitialiser compteur heure
    if (now - this.lastHourReset >= 3600000) {
      this.currentHourCount = 0;
      this.lastHourReset = now;
    }

    // Réinitialiser compteur jour
    if (now - this.lastDayReset >= 86400000) {
      this.currentDayCount = 0;
      this.lastDayReset = now;
    }
  }

  /**
   * Incrémenter les compteurs
   */
  private static incrementCounters(): void {
    this.currentSecondCount++;
    this.currentMinuteCount++;
    this.currentHourCount++;
    this.currentDayCount++;
  }

  /**
   * Vérifier si une erreur est récupérable
   */
  private static isRecoverableError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message || String(error);
    const errorCode = error.code || error.status || error.statusCode;

    // Erreurs récupérables
    const recoverableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504, // Gateway Timeout
    ];

    // Vérifier par code
    if (errorCode && recoverableErrors.includes(errorCode)) {
      return true;
    }

    // Vérifier par message
    const recoverableMessages = [
      'timeout',
      'network',
      'connection',
      'rate limit',
      'too many requests',
      'server error',
      'service unavailable',
    ];

    return recoverableMessages.some((msg) =>
      errorMessage.toLowerCase().includes(msg)
    );
  }

  /**
   * Sleep helper
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtenir les statistiques actuelles
   */
  static getStats(): {
    queueLength: number;
    currentSecondCount: number;
    currentMinuteCount: number;
    currentHourCount: number;
    currentDayCount: number;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.queue.length,
      currentSecondCount: this.currentSecondCount,
      currentMinuteCount: this.currentMinuteCount,
      currentHourCount: this.currentHourCount,
      currentDayCount: this.currentDayCount,
      isProcessing: this.processing,
    };
  }

  /**
   * Réinitialiser les compteurs (pour tests)
   */
  static resetCounters(): void {
    this.currentSecondCount = 0;
    this.currentMinuteCount = 0;
    this.currentHourCount = 0;
    this.currentDayCount = 0;
    this.lastSecondReset = Date.now();
    this.lastMinuteReset = Date.now();
    this.lastHourReset = Date.now();
    this.lastDayReset = Date.now();
  }
}

// Export instance singleton
export const emailRateLimiter = EmailRateLimiter;







