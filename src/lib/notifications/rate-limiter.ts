/**
 * Rate Limiter pour Notifications
 * Date: 2 Février 2025
 *
 * Système de rate limiting spécifique pour les notifications
 * pour éviter le spam et contrôler les coûts
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { NotificationType } from './unified-notifications';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export interface RateLimitConfig {
  // Limites par canal
  in_app: { maxPerHour: number; maxPerDay: number };
  email: { maxPerHour: number; maxPerDay: number };
  sms: { maxPerHour: number; maxPerDay: number };
  push: { maxPerHour: number; maxPerDay: number };

  // Limites globales
  global: { maxPerHour: number; maxPerDay: number };

  // Limites par type de notification
  typeLimits?: Record<NotificationType, { maxPerHour: number; maxPerDay: number }>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: {
    hourly: number;
    daily: number;
  };
  resetAt: {
    hourly: Date;
    daily: Date;
  };
  reason?: string;
}

// Configuration par défaut
const  DEFAULT_CONFIG: RateLimitConfig = {
  in_app: { maxPerHour: 100, maxPerDay: 500 },
  email: { maxPerHour: 20, maxPerDay: 100 },
  sms: { maxPerHour: 10, maxPerDay: 50 },
  push: { maxPerHour: 50, maxPerDay: 200 },
  global: { maxPerHour: 200, maxPerDay: 1000 },
};

/**
 * Rate Limiter pour notifications
 */
export class NotificationRateLimiter {
  private config: RateLimitConfig;
  private cache: Map<string, { hourly: number[]; daily: number[] }> = new Map();

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Vérifier si une notification peut être envoyée
   */
  async checkRateLimit(
    userId: string,
    channel: NotificationChannel,
    type?: NotificationType
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    // Récupérer les limites
    const channelLimits = this.config[channel];
    const typeLimits = type && this.config.typeLimits?.[type];
    const limits = typeLimits || channelLimits;

    // Clé de cache
    const cacheKey = `${userId}:${channel}${type ? `:${type}` : ''}`;

    // Récupérer ou créer les enregistrements
    let  records= this.cache.get(cacheKey);
    if (!records) {
      records = { hourly: [], daily: [] };
      this.cache.set(cacheKey, records);
    }

    // Nettoyer les anciens enregistrements
    records.hourly = records.hourly.filter(timestamp => timestamp > hourAgo);
    records.daily = records.daily.filter(timestamp => timestamp > dayAgo);

    // Vérifier les limites horaires
    const hourlyCount = records.hourly.length;
    const hourlyAllowed = hourlyCount < limits.maxPerHour;

    // Vérifier les limites quotidiennes
    const dailyCount = records.daily.length;
    const dailyAllowed = dailyCount < limits.maxPerDay;

    // Vérifier les limites globales
    const globalHourlyCount = await this.getGlobalCount(userId, 'hourly');
    const globalDailyCount = await this.getGlobalCount(userId, 'daily');
    const globalHourlyAllowed = globalHourlyCount < this.config.global.maxPerHour;
    const globalDailyAllowed = globalDailyCount < this.config.global.maxPerDay;

    // Déterminer si autorisé
    const allowed = hourlyAllowed && dailyAllowed && globalHourlyAllowed && globalDailyAllowed;

    // Calculer les dates de reset
    const resetHourly = new Date(now + (60 * 60 * 1000 - (now % (60 * 60 * 1000))));
    const resetDaily = new Date(now + (24 * 60 * 60 * 1000 - (now % (24 * 60 * 60 * 1000))));

    // Raison si refusé
    let  reason: string | undefined;
    if (!allowed) {
      if (!hourlyAllowed) {
        reason = `Limite horaire atteinte pour ${channel} (${hourlyCount}/${limits.maxPerHour})`;
      } else if (!dailyAllowed) {
        reason = `Limite quotidienne atteinte pour ${channel} (${dailyCount}/${limits.maxPerDay})`;
      } else if (!globalHourlyAllowed) {
        reason = `Limite globale horaire atteinte (${globalHourlyCount}/${this.config.global.maxPerHour})`;
      } else if (!globalDailyAllowed) {
        reason = `Limite globale quotidienne atteinte (${globalDailyCount}/${this.config.global.maxPerDay})`;
      }
    }

    return {
      allowed,
      remaining: {
        hourly: Math.max(0, limits.maxPerHour - hourlyCount),
        daily: Math.max(0, limits.maxPerDay - dailyCount),
      },
      resetAt: {
        hourly: resetHourly,
        daily: resetDaily,
      },
      reason,
    };
  }

  /**
   * Enregistrer une notification envoyée
   */
  async recordNotification(
    userId: string,
    channel: NotificationChannel,
    type?: NotificationType
  ): Promise<void> {
    const now = Date.now();
    const cacheKey = `${userId}:${channel}${type ? `:${type}` : ''}`;

    // Ajouter aux enregistrements
    let  records= this.cache.get(cacheKey);
    if (!records) {
      records = { hourly: [], daily: [] };
      this.cache.set(cacheKey, records);
    }

    records.hourly.push(now);
    records.daily.push(now);

    // Enregistrer dans la base de données pour persistance
    try {
      await supabase.from('notification_rate_limits').insert({
        user_id: userId,
        channel,
        notification_type: type || null,
        sent_at: new Date(now).toISOString(),
      });
    } catch (error) {
      logger.warn('Error recording notification rate limit', { error, userId, channel });
    }
  }

  /**
   * Obtenir le compte global d'un utilisateur
   */
  private async getGlobalCount(userId: string, period: 'hourly' | 'daily'): Promise<number> {
    try {
      const since =
        period === 'hourly'
          ? new Date(Date.now() - 60 * 60 * 1000).toISOString()
          : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('notification_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('sent_at', since);

      if (error) {
        logger.warn('Error getting global count', { error, userId, period });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.warn('Error getting global count', { error, userId, period });
      return 0;
    }
  }

  /**
   * Nettoyer le cache (appelé périodiquement)
   */
  cleanupCache(): void {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    for (const [key, records] of this.cache.entries()) {
      records.hourly = records.hourly.filter(timestamp => timestamp > now - 60 * 60 * 1000);
      records.daily = records.daily.filter(timestamp => timestamp > dayAgo);

      // Supprimer si vide
      if (records.hourly.length === 0 && records.daily.length === 0) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Réinitialiser les limites pour un utilisateur (admin)
   */
  async resetLimits(userId: string, channel?: NotificationChannel): Promise<void> {
    if (channel) {
      const cacheKey = `${userId}:${channel}`;
      this.cache.delete(cacheKey);
    } else {
      // Supprimer toutes les clés pour cet utilisateur
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${userId}:`)) {
          this.cache.delete(key);
        }
      }
    }

    // Supprimer de la base de données
    try {
      let  query= supabase.from('notification_rate_limits').delete().eq('user_id', userId);
      if (channel) {
        query = query.eq('channel', channel);
      }
      await query;
    } catch (error) {
      logger.error('Error resetting rate limits', { error, userId, channel });
    }
  }
}

// Instance singleton
export const notificationRateLimiter = new NotificationRateLimiter();

// Nettoyer le cache toutes les heures
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      notificationRateLimiter.cleanupCache();
    },
    60 * 60 * 1000
  );
}






