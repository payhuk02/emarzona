/**
 * Digest Notifications Service
 * Date: 2 Février 2025
 *
 * Système pour regrouper les notifications non urgentes en digest
 * (quotidien, hebdomadaire)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { sendUnifiedNotification } from './unified-notifications';
import type { UnifiedNotification, NotificationType } from './unified-notifications';

export type DigestPeriod = 'daily' | 'weekly';
export type DigestPreference = 'never' | 'daily' | 'weekly';

export interface DigestNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: Date;
  metadata?: Record<string, unknown>;
}

export interface DigestContent {
  userId: string;
  period: DigestPeriod;
  notifications: DigestNotification[];
  summary: {
    total: number;
    byType: Record<string, number>;
  };
}

/**
 * Service de digest de notifications
 */
export class DigestNotificationService {
  /**
   * Créer un digest pour un utilisateur
   */
  async createDigest(userId: string, period: DigestPeriod): Promise<DigestContent | null> {
    try {
      // Récupérer les notifications non urgentes non lues
      const startDate = this.getStartDate(period);
      const endDate = new Date();

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .in('priority', ['low', 'normal']) // Exclure high et urgent
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50); // Limiter à 50 notifications max

      if (error) {
        logger.error('Error fetching notifications for digest', { error, userId, period });
        return null;
      }

      if (!notifications || notifications.length === 0) {
        return null;
      }

      // Grouper par type
      const byType: Record<string, number> = {};
      for (const notif of notifications) {
        byType[notif.type] = (byType[notif.type] || 0) + 1;
      }

      return {
        userId,
        period,
        notifications: notifications.map(n => ({
          id: n.id,
          user_id: n.user_id,
          type: n.type,
          title: n.title,
          message: n.message,
          created_at: new Date(n.created_at),
          metadata: n.metadata,
        })),
        summary: {
          total: notifications.length,
          byType,
        },
      };
    } catch (error) {
      logger.error('Error in createDigest', { error, userId, period });
      return null;
    }
  }

  /**
   * Envoyer un digest
   */
  async sendDigest(digest: DigestContent): Promise<boolean> {
    try {
      // Construire le contenu du digest
      const title = this.getDigestTitle(digest.period, digest.summary.total);
      const message = this.buildDigestMessage(digest);

      // Envoyer la notification
      const result = await sendUnifiedNotification({
        user_id: digest.userId,
        type: 'system_announcement',
        title,
        message,
        priority: 'low',
        channels: ['email', 'in_app'],
        metadata: {
          digest_period: digest.period,
          digest_summary: digest.summary,
          notification_count: digest.notifications.length,
        },
      });

      if (result.success) {
        // Marquer les notifications comme lues
        const notificationIds = digest.notifications.map(n => n.id);
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', notificationIds);

        logger.info('Digest sent', {
          userId: digest.userId,
          period: digest.period,
          count: digest.notifications.length,
        });
      }

      return result.success;
    } catch (error) {
      logger.error('Error sending digest', { error, digest });
      return false;
    }
  }

  /**
   * Traiter tous les digests en attente
   */
  async processDigests(period: DigestPeriod): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    let processed = 0;
    let sent = 0;
    let failed = 0;

    try {
      // Récupérer les utilisateurs avec préférences de digest
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('user_id, email_digest_frequency')
        .eq('email_digest_frequency', period);

      if (error) {
        logger.error('Error fetching digest preferences', { error, period });
        return { processed, sent, failed };
      }

      if (!preferences || preferences.length === 0) {
        return { processed, sent, failed };
      }

      // Traiter chaque utilisateur
      for (const pref of preferences) {
        processed++;

        try {
          const digest = await this.createDigest(pref.user_id, period);

          if (digest && digest.notifications.length > 0) {
            const success = await this.sendDigest(digest);
            if (success) {
              sent++;
            } else {
              failed++;
            }
          }
        } catch (error) {
          logger.error('Error processing digest for user', {
            error,
            userId: pref.user_id,
            period,
          });
          failed++;
        }
      }
    } catch (error) {
      logger.error('Error processing digests', { error, period });
    }

    return { processed, sent, failed };
  }

  /**
   * Obtenir la date de début selon la période
   */
  private getStartDate(period: DigestPeriod): Date {
    const now = new Date();
    if (period === 'daily') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      // Weekly: lundi de cette semaine
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi
      return new Date(now.setDate(diff));
    }
  }

  /**
   * Obtenir le titre du digest
   */
  private getDigestTitle(period: DigestPeriod, count: number): string {
    const periodText = period === 'daily' ? 'quotidien' : 'hebdomadaire';
    return `📬 Résumé ${periodText} - ${count} notification${count > 1 ? 's' : ''}`;
  }

  /**
   * Construire le message du digest
   */
  private buildDigestMessage(digest: DigestContent): string {
    const periodText = digest.period === 'daily' ? "aujourd'hui" : 'cette semaine';
    let message = `Vous avez ${digest.summary.total} notification${digest.summary.total > 1 ? 's' : ''} ${periodText}.\n\n`;

    // Lister par type
    for (const [type, count] of Object.entries(digest.summary.byType)) {
      const typeLabel = this.getTypeLabel(type);
      message += `• ${typeLabel}: ${count}\n`;
    }

    message += '\nConsultez vos notifications pour plus de détails.';

    return message;
  }

  /**
   * Obtenir le label d'un type de notification
   */
  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      order_payment_received: 'Paiements reçus',
      order_payment_failed: 'Paiements échoués',
      product_review_received: 'Avis produits',
      course_new_content: 'Nouveau contenu',
      affiliate_commission_earned: 'Commissions',
      // Ajouter plus de labels selon les besoins
    };

    return labels[type] || type;
  }
}

// Instance singleton
export const digestNotificationService = new DigestNotificationService();
