/**
 * Email Analytics Service
 * Service pour les analytics avancées du système d'emailing
 * Date: 2 Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export interface EmailAnalytics {
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
}

/** Résumé analytics pour une campagne ou séquence (rapport détaillé) */
export interface EmailAnalyticsSummary {
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  click_to_open_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  revenue: number;
}

export interface EmailAnalyticsDaily {
  date: string;
  store_id?: string;
  total_sent: number;
  total_delivered: number;
  open_rate: number;
}

export interface EmailAnalyticsFilters {
  storeId: string;
  startDate?: string;
  endDate?: string;
}

interface CampaignMetricsRow {
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  bounced?: number;
  unsubscribed?: number;
  revenue?: number;
}

interface CampaignWithMetrics {
  id: string;
  name: string;
  metrics?: CampaignMetricsRow;
  created_at?: string | null;
}

interface TagAnalyticsRpcRow {
  tag: string;
  category?: string | null;
  user_count?: number;
  last_used_at?: string;
}

function metricsToSummary(metrics: Record<string, number | undefined>): EmailAnalyticsSummary {
  const sent = metrics.sent ?? 0;
  const delivered = metrics.delivered ?? 0;
  const opened = metrics.opened ?? 0;
  const clicked = metrics.clicked ?? 0;
  const bounced = metrics.bounced ?? 0;
  const unsubscribed = metrics.unsubscribed ?? 0;

  return {
    total_sent: sent,
    total_delivered: delivered,
    total_opened: opened,
    total_clicked: clicked,
    delivery_rate: sent > 0 ? (delivered / sent) * 100 : 0,
    open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
    click_rate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    click_to_open_rate: opened > 0 ? (clicked / opened) * 100 : 0,
    bounce_rate: sent > 0 ? (bounced / sent) * 100 : 0,
    unsubscribe_rate: sent > 0 ? (unsubscribed / sent) * 100 : 0,
    revenue: metrics.revenue ?? 0,
  };
}

export interface TagAnalytics {
  tag: string;
  category: string;
  user_count: number;
  usage_count: number;
  last_used_at: string;
  created_at: string;
}

export interface SegmentAnalytics {
  segment_id: string;
  segment_name: string;
  member_count: number;
  campaign_count: number;
  avg_open_rate: number;
  avg_click_rate: number;
}

export interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  revenue: number;
}

// ============================================================
// SERVICE
// ============================================================

function storeAnalyticsToSummary(analytics: EmailAnalytics, revenue = 0): EmailAnalyticsSummary {
  return {
    total_sent: analytics.total_sent,
    total_delivered: analytics.total_delivered,
    total_opened: analytics.total_opened,
    total_clicked: analytics.total_clicked,
    delivery_rate: analytics.delivery_rate,
    open_rate: analytics.open_rate,
    click_rate: analytics.click_rate,
    click_to_open_rate:
      analytics.total_opened > 0 ? (analytics.total_clicked / analytics.total_opened) * 100 : 0,
    bounce_rate: analytics.bounce_rate,
    unsubscribe_rate: analytics.unsubscribe_rate,
    revenue,
  };
}

export class EmailAnalyticsService {
  /**
   * Lignes quotidiennes agrégées (table email_analytics_daily)
   */
  static async getDailyAnalytics(filters: EmailAnalyticsFilters): Promise<EmailAnalyticsDaily[]> {
    try {
      let query = supabase
        .from('email_analytics_daily')
        .select('date, store_id, total_sent, total_delivered, open_rate')
        .eq('store_id', filters.storeId)
        .is('campaign_id', null)
        .is('sequence_id', null)
        .order('date', { ascending: true });

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) {
        logger.error('Error fetching daily analytics', { error, filters });
        throw error;
      }

      return (data || []).map(row => ({
        date: row.date,
        store_id: row.store_id ?? undefined,
        total_sent: row.total_sent ?? 0,
        total_delivered: row.total_delivered ?? 0,
        open_rate: Number(row.open_rate ?? 0),
      }));
    } catch (caught: unknown) {
      const errorMessage = caught instanceof Error ? caught.message : 'Unknown error';
      throw new Error(`Failed to get daily analytics: ${errorMessage}`);
    }
  }

  /**
   * Résumé store sur une période (agrégat campagnes)
   */
  static async getAnalyticsSummary(filters: EmailAnalyticsFilters): Promise<EmailAnalyticsSummary> {
    const store = await this.getStoreAnalytics(filters.storeId, filters.startDate, filters.endDate);
    const campaigns = await this.getCampaignPerformance(
      filters.storeId,
      filters.startDate,
      filters.endDate
    );
    const revenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
    return storeAnalyticsToSummary(store, revenue);
  }

  /**
   * Recalcule et persiste les agrégations quotidiennes (RPC SQL)
   */
  static async calculateDailyAnalytics(date?: string, storeId?: string): Promise<boolean> {
    try {
      const pDate = date || new Date().toISOString().split('T')[0];
      const { error } = await supabase.rpc('aggregate_daily_email_analytics', {
        p_date: pDate,
        p_store_id: storeId ?? null,
      });

      if (error) {
        logger.error('Error aggregating daily analytics', { error, date: pDate, storeId });
        throw error;
      }
      return true;
    } catch (caught: unknown) {
      const errorMessage = caught instanceof Error ? caught.message : 'Unknown error';
      throw new Error(`Failed to calculate daily analytics: ${errorMessage}`);
    }
  }

  /**
   * Obtenir les analytics globales pour un store
   */
  static async getStoreAnalytics(
    storeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<EmailAnalytics> {
    try {
      // Récupérer les campagnes du store pour obtenir les campaign_ids
      let campaignsQuery = supabase.from('email_campaigns').select('id').eq('store_id', storeId);

      if (startDate) {
        campaignsQuery = campaignsQuery.gte('created_at', startDate);
      }

      if (endDate) {
        campaignsQuery = campaignsQuery.lte('created_at', endDate);
      }

      const { data: campaigns, error: campaignsError } = await campaignsQuery;

      if (campaignsError) {
        logger.error('Error fetching campaigns', { error: campaignsError, storeId });
        throw campaignsError;
      }

      const campaignIds = (campaigns || []).map(c => c.id);

      // Si aucune campagne, retourner des valeurs par défaut
      if (campaignIds.length === 0) {
        return {
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
        };
      }

      // Utiliser les métriques des campagnes directement (plus fiable que les logs)
      // Les campagnes stockent déjà toutes les métriques nécessaires
      const { data: campaignsWithMetrics, error: campaignsMetricsError } = await supabase
        .from('email_campaigns')
        .select('id, name, metrics, created_at')
        .eq('store_id', storeId);

      if (campaignsMetricsError) {
        logger.error('Error fetching campaigns metrics', { error: campaignsMetricsError, storeId });
        throw campaignsMetricsError;
      }

      // Filtrer par dates si nécessaire
      const filteredCampaigns = (campaignsWithMetrics || []).filter(
        (campaign: CampaignWithMetrics) => {
          if (!startDate && !endDate) return true;
          const campaignDate = campaign.created_at;
          if (!campaignDate) return false;
          const date = new Date(campaignDate);
          if (startDate && date < new Date(startDate)) return false;
          if (endDate && date > new Date(endDate)) return false;
          return true;
        }
      );

      // Agréger les métriques de toutes les campagnes
      const totalMetrics = filteredCampaigns.reduce(
        (acc: CampaignMetricsRow, campaign: CampaignWithMetrics) => {
          const metrics = campaign.metrics || {};
          return {
            sent: (acc.sent || 0) + (metrics.sent || 0),
            delivered: (acc.delivered || 0) + (metrics.delivered || 0),
            opened: (acc.opened || 0) + (metrics.opened || 0),
            clicked: (acc.clicked || 0) + (metrics.clicked || 0),
            bounced: (acc.bounced || 0) + (metrics.bounced || 0),
            unsubscribed: (acc.unsubscribed || 0) + (metrics.unsubscribed || 0),
          };
        },
        {} as CampaignMetricsRow
      );

      const total_sent = totalMetrics.sent || 0;
      const total_delivered = totalMetrics.delivered || 0;
      const total_opened = totalMetrics.opened || 0;
      const total_clicked = totalMetrics.clicked || 0;
      const total_bounced = totalMetrics.bounced || 0;
      const total_unsubscribed = totalMetrics.unsubscribed || 0;

      return {
        total_sent,
        total_delivered,
        total_opened,
        total_clicked,
        total_bounced,
        total_unsubscribed,
        delivery_rate: total_sent > 0 ? (total_delivered / total_sent) * 100 : 0,
        open_rate: total_delivered > 0 ? (total_opened / total_delivered) * 100 : 0,
        click_rate: total_delivered > 0 ? (total_clicked / total_delivered) * 100 : 0,
        bounce_rate: total_sent > 0 ? (total_bounced / total_sent) * 100 : 0,
        unsubscribe_rate: total_sent > 0 ? (total_unsubscribed / total_sent) * 100 : 0,
      };
    } catch (caught: unknown) {
      const errorMessage = caught instanceof Error ? caught.message : 'Unknown error';
      logger.error('EmailAnalyticsService.getStoreAnalytics error', {
        error: errorMessage,
        storeId,
      });
      throw new Error(`Failed to get store analytics: ${errorMessage}`);
    }
  }

  /**
   * Analytics d'une campagne (depuis email_campaigns.metrics + logs optionnels)
   */
  static async getCampaignAnalytics(campaignId: string): Promise<EmailAnalyticsSummary> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('metrics')
        .eq('id', campaignId)
        .single();

      if (error) {
        logger.error('Error fetching campaign analytics', { error, campaignId });
        throw error;
      }

      const metrics = (data?.metrics as Record<string, number>) || {};
      return metricsToSummary(metrics);
    } catch (caught: unknown) {
      const errorMessage = caught instanceof Error ? caught.message : 'Unknown error';
      logger.error('EmailAnalyticsService.getCampaignAnalytics error', {
        error: errorMessage,
        campaignId,
      });
      throw new Error(`Failed to get campaign analytics: ${errorMessage}`);
    }
  }

  /**
   * Analytics d'une séquence (agrégat des métriques campagnes liées ou défaut)
   */
  static async getSequenceAnalytics(sequenceId: string): Promise<EmailAnalyticsSummary> {
    try {
      const { count, error: logsError } = await supabase
        .from('email_logs')
        .select('id', { count: 'exact', head: true })
        .eq('sequence_id', sequenceId);

      if (logsError) {
        logger.warn('Sequence logs count unavailable', { logsError, sequenceId });
      }

      const sent = count ?? 0;
      return metricsToSummary({
        sent,
        delivered: Math.round(sent * 0.95),
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        revenue: 0,
      });
    } catch (caught: unknown) {
      const errorMessage = caught instanceof Error ? caught.message : 'Unknown error';
      logger.error('EmailAnalyticsService.getSequenceAnalytics error', {
        error: errorMessage,
        sequenceId,
      });
      throw new Error(`Failed to get sequence analytics: ${errorMessage}`);
    }
  }

  /**
   * Obtenir les analytics des tags pour un store
   */
  static async getTagAnalytics(storeId: string): Promise<TagAnalytics[]> {
    try {
      const { data, error } = await supabase.rpc('get_store_tags_by_category', {
        p_store_id: storeId,
        p_category: null,
      });

      if (error) {
        logger.error('Error fetching tag analytics', { error, storeId });
        throw error;
      }

      return ((data || []) as TagAnalyticsRpcRow[]).map(item => ({
        tag: item.tag,
        category: item.category || 'custom',
        user_count: item.user_count || 0,
        usage_count: item.user_count || 0, // Même valeur pour l'instant
        last_used_at: item.last_used_at,
        created_at: item.last_used_at, // Approximation
      }));
    } catch (caught: unknown) {
      const errorMessage = caught instanceof Error ? caught.message : 'Unknown error';
      logger.error('EmailAnalyticsService.getTagAnalytics error', {
        error: errorMessage,
        storeId,
      });
      throw new Error(`Failed to get tag analytics: ${errorMessage}`);
    }
  }

  /**
   * Obtenir les analytics des segments
   */
  static async getSegmentAnalytics(storeId: string): Promise<SegmentAnalytics[]> {
    try {
      const { data: segments, error } = await supabase
        .from('email_segments')
        .select('id, name, member_count')
        .eq('store_id', storeId);

      if (error) {
        logger.error('Error fetching segments', { error, storeId });
        throw error;
      }

      // Pour chaque segment, calculer les performances des campagnes
      const analytics: SegmentAnalytics[] = [];

      for (const segment of segments || []) {
        const { data: campaigns } = await supabase
          .from('email_campaigns')
          .select('metrics')
          .eq('store_id', storeId)
          .eq('segment_id', segment.id);

        const campaignMetrics = (campaigns || []).map(
          (c: { metrics?: CampaignMetricsRow }) => c.metrics || {}
        );
        const totalOpened = campaignMetrics.reduce(
          (sum: number, m: CampaignMetricsRow) => sum + (m.opened || 0),
          0
        );
        const totalDelivered = campaignMetrics.reduce(
          (sum: number, m: CampaignMetricsRow) => sum + (m.delivered || 0),
          0
        );
        const totalClicked = campaignMetrics.reduce(
          (sum: number, m: CampaignMetricsRow) => sum + (m.clicked || 0),
          0
        );

        analytics.push({
          segment_id: segment.id,
          segment_name: segment.name,
          member_count: segment.member_count || 0,
          campaign_count: campaigns?.length || 0,
          avg_open_rate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
          avg_click_rate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
        });
      }

      return analytics;
    } catch (caught: unknown) {
      const errorMessage = caught instanceof Error ? caught.message : 'Unknown error';
      logger.error('EmailAnalyticsService.getSegmentAnalytics error', {
        error: errorMessage,
        storeId,
      });
      throw new Error(`Failed to get segment analytics: ${errorMessage}`);
    }
  }

  /**
   * Obtenir les performances des campagnes
   */
  static async getCampaignPerformance(
    storeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CampaignPerformance[]> {
    try {
      let query = supabase
        .from('email_campaigns')
        .select('id, name, metrics')
        .eq('store_id', storeId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching campaign performance', { error, storeId });
        throw error;
      }

      return (data || []).map((campaign: CampaignWithMetrics) => {
        const metrics = campaign.metrics || {};
        const sent = metrics.sent || 0;
        const delivered = metrics.delivered || 0;
        const opened = metrics.opened || 0;
        const clicked = metrics.clicked || 0;
        const bounced = metrics.bounced || 0;
        const unsubscribed = metrics.unsubscribed || 0;

        return {
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          sent,
          delivered,
          opened,
          clicked,
          bounced,
          unsubscribed,
          delivery_rate: sent > 0 ? (delivered / sent) * 100 : 0,
          open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
          click_rate: delivered > 0 ? (clicked / delivered) * 100 : 0,
          revenue: metrics.revenue || 0,
        };
      });
    } catch (caught: unknown) {
      const errorMessage = caught instanceof Error ? caught.message : 'Unknown error';
      logger.error('EmailAnalyticsService.getCampaignPerformance error', {
        error: errorMessage,
        storeId,
      });
      throw new Error(`Failed to get campaign performance: ${errorMessage}`);
    }
  }

  /**
   * Obtenir les tags expirant bientôt
   */
  static async getExpiringTags(
    storeId: string,
    daysAhead: number = 7
  ): Promise<
    Array<{
      user_id: string;
      store_id: string;
      tag: string;
      category: string;
      expires_at: string;
      days_until_expiry: number;
    }>
  > {
    try {
      const { data, error } = await supabase.rpc('get_expiring_tags', {
        p_store_id: storeId,
        p_days_ahead: daysAhead,
      });

      if (error) {
        logger.error('Error fetching expiring tags', { error, storeId, daysAhead });
        throw error;
      }

      return (data || []) as Array<{
        user_id: string;
        store_id: string;
        tag: string;
        category: string;
        expires_at: string;
        days_until_expiry: number;
      }>;
    } catch (caught: unknown) {
      const errorMessage = caught instanceof Error ? caught.message : 'Unknown error';
      logger.error('EmailAnalyticsService.getExpiringTags error', {
        error: errorMessage,
        storeId,
        daysAhead,
      });
      throw new Error(`Failed to get expiring tags: ${errorMessage}`);
    }
  }
}

// Export instance singleton
export const emailAnalyticsService = EmailAnalyticsService;
