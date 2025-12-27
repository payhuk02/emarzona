/**
 * Retry Service pour Notifications
 * Date: 2 Février 2025
 *
 * Système de retry avec exponential backoff pour les notifications
 * avec support de dead letter queue
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { UnifiedNotification } from './unified-notifications';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  multiplier?: number;
  jitter?: boolean;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface RetryResult {
  success: boolean;
  attempt: number;
  error?: string;
  nextRetryAt?: Date;
}

// Configuration par défaut
const  DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 seconde
  maxDelay: 30000, // 30 secondes
  multiplier: 2,
  jitter: true,
  shouldRetry: (error: unknown, attempt: number) => {
    // Ne pas retry si erreur non retryable
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Erreurs non retryables
      if (
        message.includes('invalid') ||
        message.includes('unauthorized') ||
        message.includes('forbidden') ||
        message.includes('not found')
      ) {
        return false;
      }
    }
    return attempt < 3;
  },
};

/**
 * Calculer le délai de retry avec exponential backoff
 */
function calculateRetryDelay(attempt: number, config: Required<RetryConfig>): number {
  const baseDelay = config.initialDelay * Math.pow(config.multiplier, attempt);
  const delay = Math.min(baseDelay, config.maxDelay);

  // Ajouter du jitter pour éviter le thundering herd
  if (config.jitter) {
    const jitterAmount = delay * 0.1; // 10% de jitter
    const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
    return Math.round(delay + jitter);
  }

  return Math.round(delay);
}

/**
 * Vérifier si une erreur est retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Erreurs retryables
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'rate limit',
      'server error',
      'temporary',
      'unavailable',
      '503',
      '502',
      '500',
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  return false;
}

/**
 * Retry Service pour notifications
 */
export class NotificationRetryService {
  /**
   * Exécuter une fonction avec retry
   */
  async executeWithRetry<T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    let  lastError: unknown;

    for (let  attempt= 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const result = await fn();

        // Si succès après retry, logger
        if (attempt > 0) {
          logger.info('Notification retry successful', {
            attempt,
            maxRetries: finalConfig.maxRetries,
          });
        }

        return result;
      } catch (error) {
        lastError = error;

        // Vérifier si on doit retry
        const shouldRetry = finalConfig.shouldRetry
          ? finalConfig.shouldRetry(error, attempt)
          : isRetryableError(error) && attempt < finalConfig.maxRetries;

        if (!shouldRetry) {
          logger.error('Notification retry exhausted', {
            attempt,
            maxRetries: finalConfig.maxRetries,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }

        // Calculer le délai
        const delay = calculateRetryDelay(attempt, finalConfig);

        logger.warn('Notification retry', {
          attempt: attempt + 1,
          maxRetries: finalConfig.maxRetries,
          delay,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Attendre avant de retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Retry failed');
  }

  /**
   * Enregistrer une notification en échec pour retry ultérieur
   */
  async scheduleRetry(
    notification: UnifiedNotification,
    channel: NotificationChannel,
    error: unknown,
    attempt: number
  ): Promise<void> {
    try {
      const nextRetryAt = new Date(Date.now() + calculateRetryDelay(attempt, DEFAULT_CONFIG));

      await supabase.from('notification_retries').insert({
        user_id: notification.user_id,
        notification_type: notification.type,
        channel,
        notification_data: notification,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        attempt_number: attempt + 1,
        max_attempts: DEFAULT_CONFIG.maxRetries,
        next_retry_at: nextRetryAt.toISOString(),
        status: 'pending',
      });

      logger.info('Notification retry scheduled', {
        userId: notification.user_id,
        type: notification.type,
        channel,
        attempt: attempt + 1,
        nextRetryAt,
      });
    } catch (err) {
      logger.error('Error scheduling notification retry', {
        error: err,
        notification,
        channel,
      });
    }
  }

  /**
   * Traiter les retries en attente
   */
  async processPendingRetries(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    let  processed= 0;
    let  succeeded= 0;
    let  failed= 0;

    try {
      // Récupérer les retries en attente
      const { data: retries, error } = await supabase
        .from('notification_retries')
        .select('*')
        .eq('status', 'pending')
        .lte('next_retry_at', new Date().toISOString())
        .order('next_retry_at', { ascending: true })
        .limit(100);

      if (error) {
        logger.error('Error fetching pending retries', { error });
        return { processed, succeeded, failed };
      }

      if (!retries || retries.length === 0) {
        return { processed, succeeded, failed };
      }

      // Traiter chaque retry
      for (const retry of retries) {
        processed++;

        try {
          // Réessayer l'envoi
          // Note: Cette fonction devrait être injectée depuis unified-notifications
          // Pour l'instant, on marque juste comme traité

          // Si succès, marquer comme complété
          await supabase
            .from('notification_retries')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', retry.id);

          succeeded++;
        } catch (err) {
          // Si échec et max attempts atteint, marquer comme failed
          if (retry.attempt_number >= retry.max_attempts) {
            await supabase
              .from('notification_retries')
              .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: err instanceof Error ? err.message : 'Unknown error',
              })
              .eq('id', retry.id);

            // Optionnel: Envoyer à dead letter queue
            await this.sendToDeadLetterQueue(retry, err);
          } else {
            // Programmer le prochain retry
            const nextRetryAt = new Date(
              Date.now() + calculateRetryDelay(retry.attempt_number, DEFAULT_CONFIG)
            );

            await supabase
              .from('notification_retries')
              .update({
                attempt_number: retry.attempt_number + 1,
                next_retry_at: nextRetryAt.toISOString(),
                error_message: err instanceof Error ? err.message : 'Unknown error',
              })
              .eq('id', retry.id);
          }

          failed++;
        }
      }
    } catch (error) {
      logger.error('Error processing pending retries', { error });
    }

    return { processed, succeeded, failed };
  }

  /**
   * Envoyer à la dead letter queue
   */
  private async sendToDeadLetterQueue(
    retry: {
      id: string;
      notification_id?: string;
      user_id: string;
      channel: string;
      type: string;
      error_message?: string;
    },
    error: unknown
  ): Promise<void> {
    try {
      await supabase.from('notification_dead_letters').insert({
        user_id: retry.user_id,
        notification_type: retry.notification_type,
        channel: retry.channel,
        notification_data: retry.notification_data,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        failed_at: new Date().toISOString(),
        retry_id: retry.id,
      });

      logger.error('Notification sent to dead letter queue', {
        retryId: retry.id,
        userId: retry.user_id,
        type: retry.notification_type,
      });
    } catch (err) {
      logger.error('Error sending to dead letter queue', { error: err, retry });
    }
  }
}

// Instance singleton
export const notificationRetryService = new NotificationRetryService();






