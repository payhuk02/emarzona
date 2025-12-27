/**
 * Intelligent Notifications Service
 * Date: 2 Février 2025
 *
 * Système intelligent pour optimiser l'envoi de notifications
 * - Meilleur moment pour envoyer
 * - Éviter le spam
 * - Priorité adaptative
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { UnifiedNotification } from './unified-notifications';

export interface UserNotificationContext {
  userId: string;
  timezone?: string;
  preferredHours?: { start: number; end: number }; // 0-23
  preferredDays?: number[]; // 0-6 (dimanche = 0)
  lastNotificationAt?: Date;
  notificationFrequency?: number; // notifications par heure
  engagementScore?: number; // 0-1
}

export interface IntelligentNotificationResult {
  shouldSend: boolean;
  bestTime?: Date;
  reason?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Service de notifications intelligentes
 */
export class IntelligentNotificationService {
  /**
   * Déterminer si une notification doit être envoyée
   */
  async shouldSendNotification(
    notification: UnifiedNotification,
    context?: UserNotificationContext
  ): Promise<IntelligentNotificationResult> {
    // Si pas de contexte, envoyer immédiatement
    if (!context) {
      return { shouldSend: true };
    }

    // Vérifier les heures préférées
    const now = new Date();
    const userTime = this.getUserTime(now, context.timezone);
    const hour = userTime.getHours();
    const day = userTime.getDay();

    // Vérifier les heures préférées
    if (context.preferredHours) {
      const { start, end } = context.preferredHours;
      if (hour < start || hour >= end) {
        return {
          shouldSend: false,
          bestTime: this.calculateBestTime(context),
          reason: `En dehors des heures préférées (${start}h-${end}h)`,
        };
      }
    }

    // Vérifier les jours préférés
    if (context.preferredDays && !context.preferredDays.includes(day)) {
      return {
        shouldSend: false,
        bestTime: this.calculateBestTime(context),
        reason: `Jour non préféré`,
      };
    }

    // Vérifier la fréquence (éviter le spam)
    if (context.lastNotificationAt) {
      const timeSinceLastNotification = now.getTime() - context.lastNotificationAt.getTime();
      const minInterval = this.getMinInterval(notification.priority || 'medium');

      if (timeSinceLastNotification < minInterval) {
        return {
          shouldSend: false,
          bestTime: new Date(now.getTime() + (minInterval - timeSinceLastNotification)),
          reason: `Trop tôt après la dernière notification (min: ${minInterval}ms)`,
        };
      }
    }

    // Vérifier la fréquence horaire
    if (context.notificationFrequency) {
      const recentCount = await this.getRecentNotificationCount(
        context.userId,
        new Date(now.getTime() - 60 * 60 * 1000)
      );

      if (recentCount >= context.notificationFrequency) {
        return {
          shouldSend: false,
          bestTime: this.calculateBestTime(context),
          reason: `Limite de fréquence atteinte (${context.notificationFrequency}/h)`,
        };
      }
    }

    // Calculer la priorité adaptative
    const adaptivePriority = await this.calculateAdaptivePriority(notification, context);

    return {
      shouldSend: true,
      priority: adaptivePriority,
    };
  }

  /**
   * Trouver le meilleur moment pour envoyer
   */
  async findBestTime(
    notification: UnifiedNotification,
    context: UserNotificationContext
  ): Promise<Date> {
    const now = new Date();
    const userTime = this.getUserTime(now, context.timezone);
    const hour = userTime.getHours();

    // Si dans les heures préférées, envoyer maintenant
    if (context.preferredHours) {
      const { start, end } = context.preferredHours;
      if (hour >= start && hour < end) {
        return now;
      }

      // Sinon, programmer pour le début des heures préférées
      const nextPreferredTime = new Date(userTime);
      if (hour < start) {
        nextPreferredTime.setHours(start, 0, 0, 0);
      } else {
        nextPreferredTime.setDate(nextPreferredTime.getDate() + 1);
        nextPreferredTime.setHours(start, 0, 0, 0);
      }

      return this.getUTCTime(nextPreferredTime, context.timezone);
    }

    // Par défaut, éviter les heures de sommeil (22h-8h)
    if (hour >= 22 || hour < 8) {
      const nextGoodTime = new Date(userTime);
      if (hour >= 22) {
        nextGoodTime.setDate(nextGoodTime.getDate() + 1);
      }
      nextGoodTime.setHours(8, 0, 0, 0);
      return this.getUTCTime(nextGoodTime, context.timezone);
    }

    return now;
  }

  /**
   * Calculer la priorité adaptative
   */
  private async calculateAdaptivePriority(
    notification: UnifiedNotification,
    context: UserNotificationContext
  ): Promise<'low' | 'medium' | 'high' | 'urgent'> {
    const priority = notification.priority || 'medium';

    // Ajuster selon le score d'engagement
    if (context.engagementScore !== undefined) {
      if (context.engagementScore < 0.3 && priority === 'low') {
        // Utilisateur peu engagé, ne pas envoyer de notifications low
        return 'medium';
      }
      if (context.engagementScore > 0.7 && priority === 'medium') {
        // Utilisateur très engagé, augmenter la priorité
        return 'high';
      }
    }

    // Ajuster selon le type de notification
    const urgentTypes = [
      'order_payment_failed',
      'order_payment_received',
      'service_booking_reminder',
    ];

    if (urgentTypes.includes(notification.type)) {
      return 'high';
    }

    return priority;
  }

  /**
   * Obtenir le contexte utilisateur
   */
  async getUserContext(userId: string): Promise<UserNotificationContext | null> {
    try {
      // Récupérer les préférences
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Récupérer le profil pour timezone
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone, preferred_notification_hours, preferred_notification_days')
        .eq('id', userId)
        .single();

      // Récupérer la dernière notification
      const { data: lastNotification } = await supabase
        .from('notification_logs')
        .select('sent_at')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      // Calculer le score d'engagement (simplifié)
      const engagementScore = await this.calculateEngagementScore(userId);

      return {
        userId,
        timezone: profile?.timezone || 'UTC',
        preferredHours: profile?.preferred_notification_hours || { start: 8, end: 22 },
        preferredDays: profile?.preferred_notification_days || [0, 1, 2, 3, 4, 5, 6],
        lastNotificationAt: lastNotification?.sent_at
          ? new Date(lastNotification.sent_at)
          : undefined,
        notificationFrequency: preferences?.notification_frequency || 10,
        engagementScore,
      };
    } catch (error) {
      logger.error('Error getting user context', { error, userId });
      return null;
    }
  }

  /**
   * Calculer le score d'engagement
   */
  private async calculateEngagementScore(userId: string): Promise<number> {
    try {
      // Récupérer les statistiques des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: stats } = await supabase.rpc('get_notification_stats', {
        p_user_id: userId,
        p_start_date: thirtyDaysAgo.toISOString(),
        p_end_date: new Date().toISOString(),
      });

      if (!stats || stats.length === 0) {
        return 0.5; // Score par défaut
      }

      const stat = stats[0];
      const totalSent = Number(stat.total_sent) || 0;
      const openRate = Number(stat.open_rate) || 0;
      const clickRate = Number(stat.click_rate) || 0;

      // Score basé sur l'ouverture et les clics
      const score = (openRate * 0.6 + clickRate * 0.4) / 100;

      return Math.min(1, Math.max(0, score));
    } catch (error) {
      logger.error('Error calculating engagement score', { error, userId });
      return 0.5;
    }
  }

  /**
   * Obtenir le nombre de notifications récentes
   */
  private async getRecentNotificationCount(userId: string, since: Date): Promise<number> {
    try {
      const { count } = await supabase
        .from('notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('sent_at', since.toISOString());

      return count || 0;
    } catch (error) {
      logger.error('Error getting recent notification count', { error, userId });
      return 0;
    }
  }

  /**
   * Obtenir l'intervalle minimum selon la priorité
   */
  private getMinInterval(priority: string): number {
    const  intervals: Record<string, number> = {
      low: 60 * 60 * 1000, // 1 heure
      medium: 30 * 60 * 1000, // 30 minutes
      high: 5 * 60 * 1000, // 5 minutes
      urgent: 0, // Immédiat
    };

    return intervals[priority] || intervals.medium;
  }

  /**
   * Calculer le meilleur moment
   */
  private calculateBestTime(context: UserNotificationContext): Date {
    const now = new Date();
    const userTime = this.getUserTime(now, context.timezone);

    if (context.preferredHours) {
      const { start } = context.preferredHours;
      const nextTime = new Date(userTime);
      if (userTime.getHours() < start) {
        nextTime.setHours(start, 0, 0, 0);
      } else {
        nextTime.setDate(nextTime.getDate() + 1);
        nextTime.setHours(start, 0, 0, 0);
      }
      return this.getUTCTime(nextTime, context.timezone);
    }

    return now;
  }

  /**
   * Obtenir l'heure utilisateur
   */
  private getUserTime(date: Date, timezone?: string): Date {
    if (!timezone || timezone === 'UTC') {
      return date;
    }

    // Conversion simplifiée (pour production, utiliser une lib comme date-fns-tz)
    return date;
  }

  /**
   * Obtenir l'heure UTC depuis l'heure utilisateur
   */
  private getUTCTime(userTime: Date, timezone?: string): Date {
    if (!timezone || timezone === 'UTC') {
      return userTime;
    }

    // Conversion simplifiée
    return userTime;
  }
}

// Instance singleton
export const intelligentNotificationService = new IntelligentNotificationService();






