/**
 * Notification Logger
 * Date: 2 Février 2025
 *
 * Système de logging structuré pour les notifications
 * pour analytics et debugging
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { NotificationType } from './unified-notifications';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationStatus = 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';

export interface NotificationLog {
  userId: string;
  notificationId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  error?: string;
  processingTimeMs?: number;
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Logger une notification
 */
export async function logNotification(log: NotificationLog): Promise<void> {
  try {
    const  logData: Record<string, unknown> = {
      user_id: log.userId,
      notification_id: log.notificationId || null,
      notification_type: log.type,
      channel: log.channel,
      status: log.status,
      processing_time_ms: log.processingTimeMs || null,
      retry_count: log.retryCount || 0,
      metadata: log.metadata || {},
    };

    // Ajouter les timestamps selon le statut
    const now = new Date().toISOString();
    switch (log.status) {
      case 'sent':
        logData.sent_at = now;
        break;
      case 'delivered':
        logData.sent_at = now;
        logData.delivered_at = now;
        break;
      case 'opened':
        logData.sent_at = now;
        logData.delivered_at = now;
        logData.opened_at = now;
        break;
      case 'clicked':
        logData.sent_at = now;
        logData.delivered_at = now;
        logData.opened_at = now;
        logData.clicked_at = now;
        break;
      case 'failed':
      case 'bounced':
        logData.sent_at = now;
        logData.failed_at = now;
        logData.error_message = log.error || null;
        break;
    }

    const { error } = await supabase.from('notification_logs').insert(logData);

    if (error) {
      logger.error('Error logging notification', { error, log });
    } else {
      logger.debug('Notification logged', {
        userId: log.userId,
        type: log.type,
        channel: log.channel,
        status: log.status,
      });
    }
  } catch (error) {
    logger.error('Error in logNotification', { error, log });
  }
}

/**
 * Mettre à jour le statut d'une notification loggée
 */
export async function updateNotificationLogStatus(
  userId: string,
  notificationId: string,
  status: NotificationStatus,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const  updateData: Record<string, unknown> = {
      status,
      metadata: metadata || {},
    };

    const now = new Date().toISOString();
    switch (status) {
      case 'delivered':
        updateData.delivered_at = now;
        break;
      case 'opened':
        updateData.opened_at = now;
        break;
      case 'clicked':
        updateData.clicked_at = now;
        break;
      case 'failed':
      case 'bounced':
        updateData.failed_at = now;
        break;
    }

    const { error } = await supabase
      .from('notification_logs')
      .update(updateData)
      .eq('user_id', userId)
      .eq('notification_id', notificationId)
      .order('sent_at', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('Error updating notification log status', {
        error,
        userId,
        notificationId,
        status,
      });
    }
  } catch (error) {
    logger.error('Error in updateNotificationLogStatus', {
      error,
      userId,
      notificationId,
      status,
    });
  }
}

/**
 * Obtenir les statistiques de notifications
 */
export async function getNotificationStats(options?: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  failureRate: number;
}> {
  try {
    const { data, error } = await supabase.rpc('get_notification_stats', {
      p_user_id: options?.userId || null,
      p_start_date: options?.startDate?.toISOString() || null,
      p_end_date: options?.endDate?.toISOString() || null,
    });

    if (error) {
      logger.error('Error getting notification stats', { error, options });
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalFailed: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        failureRate: 0,
      };
    }

    const stats = data[0];
    return {
      totalSent: Number(stats.total_sent) || 0,
      totalDelivered: Number(stats.total_delivered) || 0,
      totalOpened: Number(stats.total_opened) || 0,
      totalClicked: Number(stats.total_clicked) || 0,
      totalFailed: Number(stats.total_failed) || 0,
      deliveryRate: Number(stats.delivery_rate) || 0,
      openRate: Number(stats.open_rate) || 0,
      clickRate: Number(stats.click_rate) || 0,
      failureRate: Number(stats.failure_rate) || 0,
    };
  } catch (error) {
    logger.error('Error in getNotificationStats', { error, options });
    throw error;
  }
}






