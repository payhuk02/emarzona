/**
 * Batch Notifications Service
 * Date: 2 Février 2025
 *
 * Système pour envoyer des notifications en batch efficacement
 */

import { logger } from '@/lib/logger';
import { sendUnifiedNotification } from './unified-notifications';
import type { UnifiedNotification } from './unified-notifications';

export interface BatchNotificationOptions {
  batchSize?: number;
  delay?: number;
  priority?: 'low' | 'normal' | 'high';
  continueOnError?: boolean;
  onProgress?: (processed: number, total: number, succeeded: number, failed: number) => void;
}

export interface BatchResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ notification: UnifiedNotification; error: string }>;
}

/**
 * Service de notifications batch
 */
export class BatchNotificationService {
  /**
   * Envoyer des notifications en batch
   */
  async sendBatch(
    notifications: UnifiedNotification[],
    options: BatchNotificationOptions = {}
  ): Promise<BatchResult> {
    const {
      batchSize = 10,
      delay = 100, // ms entre les batches
      priority = 'normal',
      continueOnError = true,
      onProgress,
    } = options;

    const  result: BatchResult = {
      total: notifications.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    // Traiter par batches
    for (let  i= 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);

      // Traiter le batch en parallèle
      const batchResults = await Promise.allSettled(
        batch.map(notification => this.sendWithPriority(notification, priority))
      );

      // Analyser les résultats
      for (let  j= 0; j < batchResults.length; j++) {
        const batchResult = batchResults[j];
        const notification = batch[j];

        if (batchResult.status === 'fulfilled' && batchResult.value.success) {
          result.succeeded++;
        } else {
          result.failed++;
          const error =
            batchResult.status === 'rejected'
              ? batchResult.reason?.message || 'Unknown error'
              : batchResult.value.error || 'Unknown error';

          result.errors.push({ notification, error });

          if (!continueOnError) {
            logger.error('Batch notification failed, stopping', {
              error,
              notification,
              processed: i + j + 1,
              total: notifications.length,
            });
            return result;
          }
        }
      }

      // Callback de progression
      if (onProgress) {
        onProgress(i + batch.length, notifications.length, result.succeeded, result.failed);
      }

      // Délai entre les batches (sauf pour le dernier)
      if (i + batchSize < notifications.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    logger.info('Batch notifications completed', {
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed,
    });

    return result;
  }

  /**
   * Envoyer avec priorité (simulation pour l'instant)
   */
  private async sendWithPriority(
    notification: UnifiedNotification,
    priority: 'low' | 'normal' | 'high'
  ): Promise<{ success: boolean; error?: string }> {
    // Pour les priorités hautes, envoyer immédiatement
    if (priority === 'high') {
      return await sendUnifiedNotification(notification);
    }

    // Pour les priorités normales et basses, utiliser un délai
    if (priority === 'normal') {
      // Petit délai pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 50));
    } else {
      // Délai plus long pour les priorités basses
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return await sendUnifiedNotification(notification);
  }

  /**
   * Envoyer des notifications à plusieurs utilisateurs avec le même contenu
   */
  async sendToMultipleUsers(
    userIds: string[],
    notificationTemplate: Omit<UnifiedNotification, 'user_id'>,
    options: BatchNotificationOptions = {}
  ): Promise<BatchResult> {
    const  notifications: UnifiedNotification[] = userIds.map(userId => ({
      ...notificationTemplate,
      user_id: userId,
    }));

    return await this.sendBatch(notifications, options);
  }
}

// Instance singleton
export const batchNotificationService = new BatchNotificationService();






