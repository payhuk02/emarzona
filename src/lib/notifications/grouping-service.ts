/**
 * Notification Grouping Service
 * Date: 2 Février 2025
 *
 * Système pour grouper les notifications similaires
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { NotificationType } from './unified-notifications';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: Date;
  is_read: boolean;
  metadata?: Record<string, unknown>;
}

export interface GroupedNotification {
  groupKey: string;
  type: NotificationType;
  title: string;
  count: number;
  latest: Notification;
  items: Notification[];
  createdAt: Date;
}

/**
 * Service de groupement de notifications
 */
export class NotificationGroupingService {
  /**
   * Grouper les notifications similaires
   */
  async groupNotifications(
    notifications: Notification[],
    options?: {
      groupByType?: boolean;
      groupByTimeWindow?: number; // minutes
      maxGroupSize?: number;
    }
  ): Promise<GroupedNotification[]> {
    const {
      groupByType = true,
      groupByTimeWindow = 60, // 1 heure par défaut
      maxGroupSize = 10,
    } = options || {};

    if (!groupByType) {
      // Pas de groupement, retourner individuellement
      return notifications.map(notif => ({
        groupKey: notif.id,
        type: notif.type,
        title: notif.title,
        count: 1,
        latest: notif,
        items: [notif],
        createdAt: notif.created_at,
      }));
    }

    // Grouper par type et fenêtre temporelle
    const groups = new Map<string, Notification[]>();

    for (const notif of notifications) {
      const groupKey = this.getGroupKey(notif, groupByTimeWindow);
      const existing = groups.get(groupKey) || [];
      existing.push(notif);
      groups.set(groupKey, existing);
    }

    // Créer les groupes
    const  grouped: GroupedNotification[] = [];

    for (const [groupKey, items] of groups.entries()) {
      // Limiter la taille du groupe
      const limitedItems = items.slice(0, maxGroupSize);
      const latest = this.getLatestNotification(limitedItems);

      grouped.push({
        groupKey,
        type: latest.type,
        title: this.getGroupTitle(latest.type, limitedItems.length),
        count: limitedItems.length,
        latest,
        items: limitedItems,
        createdAt: latest.created_at,
      });
    }

    // Trier par date (plus récent en premier)
    return grouped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Obtenir la clé de groupe
   */
  private getGroupKey(notification: Notification, timeWindow: number): string {
    const windowStart = new Date(notification.created_at.getTime() - timeWindow * 60 * 1000);

    // Grouper par type et fenêtre temporelle
    return `${notification.type}:${Math.floor(windowStart.getTime() / (timeWindow * 60 * 1000))}`;
  }

  /**
   * Obtenir le titre du groupe
   */
  private getGroupTitle(type: NotificationType, count: number): string {
    const  typeLabels: Record<string, string> = {
      order_payment_received: 'Paiements reçus',
      order_payment_failed: 'Paiements échoués',
      product_review_received: 'Avis produits',
      course_new_content: 'Nouveau contenu',
      affiliate_commission_earned: 'Commissions',
      // Ajouter plus de labels
    };

    const label = typeLabels[type] || type;
    return count > 1 ? `${count} ${label}` : label;
  }

  /**
   * Obtenir la notification la plus récente
   */
  private getLatestNotification(notifications: Notification[]): Notification {
    return notifications.reduce((latest, current) => {
      return current.created_at > latest.created_at ? current : latest;
    });
  }

  /**
   * Grouper les notifications d'un utilisateur
   */
  async groupUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      groupByType?: boolean;
      groupByTimeWindow?: number;
    }
  ): Promise<GroupedNotification[]> {
    try {
      let  query= supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (options?.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching user notifications for grouping', { error, userId });
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      const  notifications: Notification[] = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        type: item.type,
        title: item.title,
        message: item.message,
        created_at: new Date(item.created_at),
        is_read: item.is_read,
        metadata: item.metadata,
      }));

      return await this.groupNotifications(notifications, {
        groupByType: options?.groupByType,
        groupByTimeWindow: options?.groupByTimeWindow,
      });
    } catch (error) {
      logger.error('Error in groupUserNotifications', { error, userId });
      return [];
    }
  }
}

// Instance singleton
export const notificationGroupingService = new NotificationGroupingService();






