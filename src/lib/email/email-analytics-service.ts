/**
 * Email Analytics Service
 * Service pour la gestion des analytics email
 * Date: 1er Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export interface EmailAnalyticsDaily {
  id: string;
  date: string;
  store_id?: string;
  campaign_id?: string;
  sequence_id?: string;
  template_id?: string;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  total_failed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  click_to_open_rate: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

export interface EmailAnalyticsSummary {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  click_to_open_rate: number;
  revenue: number;
}

export interface EmailAnalyticsFilters {
  storeId?: string;
  campaignId?: string;
  sequenceId?: string;
  templateId?: string;
  dateFrom?: string;
  dateTo?: string;
  groupBy?: 'day' | 'week' | 'month';
}

// ============================================================
// SERVICE
// ============================================================

export class EmailAnalyticsService {
  /**
   * Récupérer les analytics quotidiennes
   */
  static async getDailyAnalytics(filters: EmailAnalyticsFilters): Promise<EmailAnalyticsDaily[]> {
    try {
      let query = supabase
        .from('email_analytics_daily')
        .select('*')
        .order('date', { ascending: false });

      if (filters.storeId) {
        query = query.eq('store_id', filters.storeId);
      }

      if (filters.campaignId) {
        query = query.eq('campaign_id', filters.campaignId);
      }

      if (filters.sequenceId) {
        query = query.eq('sequence_id', filters.sequenceId);
      }

      if (filters.templateId) {
        query = query.eq('template_id', filters.templateId);
      }

      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching daily analytics', { error, filters });
        throw error;
      }

      return (data || []) as EmailAnalyticsDaily[];
    } catch (error: any) {
      logger.error('EmailAnalyticsService.getDailyAnalytics error', { error, filters });
      throw error;
    }
  }

  /**
   * Récupérer un résumé des analytics
   */
  static async getAnalyticsSummary(filters: EmailAnalyticsFilters): Promise<EmailAnalyticsSummary> {
    try {
      const dailyAnalytics = await this.getDailyAnalytics(filters);

      const summary: EmailAnalyticsSummary = {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_bounced: 0,
        total_unsubscribed: 0,
        delivery_rate: 0,
        open_rate: 0,
        click_rate: 0,
        bounce_rate: 0,
        unsubscribe_rate: 0,
        click_to_open_rate: 0,
        revenue: 0,
      };

      dailyAnalytics.forEach((analytics) => {
        summary.total_sent += analytics.total_sent;
        summary.total_delivered += analytics.total_delivered;
        summary.total_opened += analytics.total_opened;
        summary.total_clicked += analytics.total_clicked;
        summary.total_bounced += analytics.total_bounced;
        summary.total_unsubscribed += analytics.total_unsubscribed;
        summary.revenue += Number(analytics.revenue || 0);
      });

      // Calculer les taux
      if (summary.total_sent > 0) {
        summary.delivery_rate = (summary.total_delivered / summary.total_sent) * 100;
        summary.bounce_rate = (summary.total_bounced / summary.total_sent) * 100;
      }

      if (summary.total_delivered > 0) {
        summary.open_rate = (summary.total_opened / summary.total_delivered) * 100;
        summary.click_rate = (summary.total_clicked / summary.total_delivered) * 100;
        summary.unsubscribe_rate = (summary.total_unsubscribed / summary.total_delivered) * 100;
      }

      if (summary.total_opened > 0) {
        summary.click_to_open_rate = (summary.total_clicked / summary.total_opened) * 100;
      }

      return summary;
    } catch (error: any) {
      logger.error('EmailAnalyticsService.getAnalyticsSummary error', { error, filters });
      throw error;
    }
  }

  /**
   * Calculer les analytics pour une date donnée
   */
  static async calculateDailyAnalytics(
    date: string = new Date().toISOString().split('T')[0],
    storeId?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('aggregate_daily_email_analytics', {
        p_date: date,
        p_store_id: storeId || null,
      });

      if (error) {
        logger.error('Error calculating daily analytics', { error, date, storeId });
        throw error;
      }

      return true;
    } catch (error: any) {
      logger.error('EmailAnalyticsService.calculateDailyAnalytics error', { error, date, storeId });
      throw error;
    }
  }

  /**
   * Récupérer les analytics d'une campagne
   */
  static async getCampaignAnalytics(campaignId: string): Promise<EmailAnalyticsSummary> {
    return this.getAnalyticsSummary({ campaignId });
  }

  /**
   * Récupérer les analytics d'une séquence
   */
  static async getSequenceAnalytics(sequenceId: string): Promise<EmailAnalyticsSummary> {
    return this.getAnalyticsSummary({ sequenceId });
  }
}

// Export instance singleton
export const emailAnalyticsService = EmailAnalyticsService;

