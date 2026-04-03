/**
 * Scheduled Notifications Service
 * Date: 2 Février 2025
 *
 * Système pour programmer des notifications à envoyer plus tard
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { sendUnifiedNotification } from './unified-notifications';
import type { UnifiedNotification } from './unified-notifications';

export interface ScheduledNotification {
  id?: string;
  user_id: string;
  notification: UnifiedNotification;
  scheduled_at: Date;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  created_at?: Date;
  sent_at?: Date;
  cancelled_at?: Date;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service de notifications schedulées
 */
export class ScheduledNotificationService {
  /**
   * Programmer une notification
   */
  async schedule(notification: ScheduledNotification): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .insert({
          user_id: notification.user_id,
          notification_data: notification.notification,
          scheduled_at: notification.scheduled_at.toISOString(),
          status: 'pending',
          metadata: notification.metadata || {},
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Error scheduling notification', { error, notification });
        throw error;
      }

      logger.info('Notification scheduled', {
        id: data.id,
        userId: notification.user_id,
        scheduledAt: notification.scheduled_at,
      });

      return data.id;
    } catch (error) {
      logger.error('Error in schedule', { error, notification });
      throw error;
    }
  }

  /**
   * Annuler une notification schedulée
   */
  async cancel(scheduledId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', scheduledId)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) {
        logger.error('Error cancelling scheduled notification', { error, scheduledId });
        throw error;
      }

      logger.info('Scheduled notification cancelled', { scheduledId, userId });
    } catch (error) {
      logger.error('Error in cancel', { error, scheduledId, userId });
      throw error;
    }
  }

  /**
   * Traiter les notifications schedulées en attente
   */
  async processPendingNotifications(): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    let  processed= 0;
    let  sent= 0;
    let  failed= 0;

    try {
      // Récupérer les notifications à envoyer
      const { data: scheduled, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(100);

      if (error) {
        logger.error('Error fetching pending scheduled notifications', { error });
        return { processed, sent, failed };
      }

      if (!scheduled || scheduled.length === 0) {
        return { processed, sent, failed };
      }

      // Traiter chaque notification
      for (const item of scheduled) {
        processed++;

        try {
          // Envoyer la notification
          const result = await sendUnifiedNotification(
            item.notification_data as UnifiedNotification
          );

          if (result.success) {
            // Marquer comme envoyée
            await supabase
              .from('scheduled_notifications')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
              .eq('id', item.id);

            sent++;
          } else {
            // Marquer comme échouée
            await supabase
              .from('scheduled_notifications')
              .update({
                status: 'failed',
                error_message: result.error || 'Unknown error',
              })
              .eq('id', item.id);

            failed++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // Marquer comme échouée
          await supabase
            .from('scheduled_notifications')
            .update({
              status: 'failed',
              error_message: errorMessage,
            })
            .eq('id', item.id);

          failed++;
        }
      }
    } catch (error) {
      logger.error('Error processing pending scheduled notifications', { error });
    }

    return { processed, sent, failed };
  }

  /**
   * Récupérer les notifications schedulées d'un utilisateur
   */
  async getUserScheduledNotifications(
    userId: string,
    options?: {
      status?: 'pending' | 'sent' | 'cancelled' | 'failed';
      limit?: number;
    }
  ): Promise<ScheduledNotification[]> {
    try {
      let  query= supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: true });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching user scheduled notifications', { error, userId });
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        notification: item.notification_data as UnifiedNotification,
        scheduled_at: new Date(item.scheduled_at),
        status: item.status,
        created_at: item.created_at ? new Date(item.created_at) : undefined,
        sent_at: item.sent_at ? new Date(item.sent_at) : undefined,
        cancelled_at: item.cancelled_at ? new Date(item.cancelled_at) : undefined,
        error_message: item.error_message,
        metadata: item.metadata,
      }));
    } catch (error) {
      logger.error('Error in getUserScheduledNotifications', { error, userId });
      return [];
    }
  }
}

// Instance singleton
export const scheduledNotificationService = new ScheduledNotificationService();






