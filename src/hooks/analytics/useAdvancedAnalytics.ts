/**
 * Advanced Analytics Hook
 * Date: 30 Janvier 2025
 *
 * Hook pour gérer les analytics avancés (dashboards, métriques, monitoring, alertes, goals)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const ADVANCED_ANALYTICS_DASHBOARD_FIELDS =
  'id, store_id, user_id, name, description, layout, is_default, is_shared, shared_with_users, widgets, refresh_interval, auto_refresh, date_range_type, date_range_start, date_range_end, is_active, created_at, updated_at';
const ANALYTICS_METRIC_FIELDS =
  'id, store_id, product_id, period_start, period_end, period_type, total_views, unique_views, total_clicks, unique_clicks, total_conversions, unique_conversions, total_revenue, average_order_value, bounce_rate, avg_session_duration, pages_per_session, returning_visitors, new_visitors, conversion_rate, click_through_rate, cart_abandonment_rate, avg_page_load_time, avg_time_to_first_byte, error_rate, desktop_views, mobile_views, tablet_views, organic_search, direct_traffic, referral_traffic, social_traffic, paid_search, email_traffic, country_breakdown, city_breakdown, calculated_at';
const PERFORMANCE_METRIC_FIELDS =
  'id, store_id, product_id, metric_name, metric_value, metric_unit, metric_type, page_url, api_endpoint, user_agent, device_type, browser, os, threshold_warning, threshold_critical, is_above_threshold, recorded_at, metadata';
const ANALYTICS_ALERT_FIELDS =
  'id, store_id, user_id, name, description, alert_type, metric_name, condition_type, threshold_value, comparison_period, email_enabled, push_enabled, webhook_url, is_active, last_triggered_at, trigger_count, created_at, updated_at';
const ANALYTICS_GOAL_FIELDS =
  'id, store_id, user_id, name, description, goal_type, target_value, current_value, progress_percentage, period_type, period_start, period_end, status, achieved_at, notify_on_achievement, notify_on_missed, created_at, updated_at';

// =====================================================
// TYPES
// =====================================================

export interface AdvancedAnalyticsDashboard {
  id: string;
  store_id: string;
  user_id: string;
  name: string;
  description?: string;
  layout: Record<string, unknown>;
  is_default: boolean;
  is_shared: boolean;
  shared_with_users?: string[];
  widgets: Array<Record<string, unknown>>;
  refresh_interval: number;
  auto_refresh: boolean;
  date_range_type:
    | 'today'
    | 'yesterday'
    | 'last_7_days'
    | 'last_30_days'
    | 'last_90_days'
    | 'this_month'
    | 'last_month'
    | 'this_year'
    | 'custom';
  date_range_start?: string;
  date_range_end?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetric {
  id: string;
  store_id: string;
  product_id?: string;
  period_start: string;
  period_end: string;
  period_type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  total_views: number;
  unique_views: number;
  total_clicks: number;
  unique_clicks: number;
  total_conversions: number;
  unique_conversions: number;
  total_revenue: number;
  average_order_value: number;
  bounce_rate: number;
  avg_session_duration: number;
  pages_per_session: number;
  returning_visitors: number;
  new_visitors: number;
  conversion_rate: number;
  click_through_rate: number;
  cart_abandonment_rate: number;
  avg_page_load_time: number;
  avg_time_to_first_byte: number;
  error_rate: number;
  desktop_views: number;
  mobile_views: number;
  tablet_views: number;
  organic_search: number;
  direct_traffic: number;
  referral_traffic: number;
  social_traffic: number;
  paid_search: number;
  email_traffic: number;
  country_breakdown: Record<string, number>;
  city_breakdown: Record<string, number>;
  calculated_at: string;
}

export interface PerformanceMetric {
  id: string;
  store_id?: string;
  product_id?: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  metric_type:
    | 'page_load'
    | 'api_response'
    | 'database_query'
    | 'image_load'
    | 'script_execution'
    | 'network_request'
    | 'custom';
  page_url?: string;
  api_endpoint?: string;
  user_agent?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
  threshold_warning?: number;
  threshold_critical?: number;
  is_above_threshold: boolean;
  recorded_at: string;
  metadata: Record<string, unknown>;
}

export interface AnalyticsAlert {
  id: string;
  store_id: string;
  user_id: string;
  name: string;
  description?: string;
  alert_type:
    | 'metric_threshold'
    | 'anomaly_detection'
    | 'goal_achievement'
    | 'goal_missed'
    | 'performance_issue'
    | 'custom';
  metric_name: string;
  condition_type: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';
  threshold_value: number;
  comparison_period?: 'previous_period' | 'same_period_last_year' | 'custom';
  email_enabled: boolean;
  push_enabled: boolean;
  webhook_url?: string;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsGoal {
  id: string;
  store_id: string;
  user_id: string;
  name: string;
  description?: string;
  goal_type: 'revenue' | 'conversions' | 'views' | 'clicks' | 'conversion_rate' | 'custom';
  target_value: number;
  current_value: number;
  progress_percentage: number;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start: string;
  period_end: string;
  status: 'active' | 'achieved' | 'missed' | 'cancelled';
  achieved_at?: string;
  notify_on_achievement: boolean;
  notify_on_missed: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useAdvancedDashboards - Liste les dashboards d'analytics
 */
export const useAdvancedDashboards = (storeId?: string) => {
  return useQuery({
    queryKey: ['advanced-dashboards', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('advanced_analytics_dashboards')
        .select(ADVANCED_ANALYTICS_DASHBOARD_FIELDS)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching advanced dashboards', { error, storeId });
        throw error;
      }

      return (data || []) as AdvancedAnalyticsDashboard[];
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useAnalyticsMetrics - Récupère les métriques d'analytics
 */
export const useAnalyticsMetrics = (
  storeId?: string,
  productId?: string,
  periodStart?: string,
  periodEnd?: string,
  periodType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
) => {
  return useQuery({
    queryKey: ['analytics-metrics', storeId, productId, periodStart, periodEnd, periodType],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('analytics_metrics')
        .select(ANALYTICS_METRIC_FIELDS)
        .eq('store_id', storeId)
        .eq('period_type', periodType)
        .order('period_start', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (periodStart) {
        query = query.gte('period_start', periodStart);
      }

      if (periodEnd) {
        query = query.lte('period_end', periodEnd);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        logger.error('Error fetching analytics metrics', { error, storeId, productId });
        throw error;
      }

      return (data || []) as AnalyticsMetric[];
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * usePerformanceMonitoring - Récupère les métriques de performance
 */
export const usePerformanceMonitoring = (
  storeId?: string,
  productId?: string,
  metricName?: string,
  limit: number = 100
) => {
  return useQuery({
    queryKey: ['performance-monitoring', storeId, productId, metricName, limit],
    queryFn: async () => {
      let query = supabase
        .from('performance_monitoring')
        .select(PERFORMANCE_METRIC_FIELDS)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (metricName) {
        query = query.eq('metric_name', metricName);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching performance monitoring', { error, storeId, productId });
        throw error;
      }

      return (data || []) as PerformanceMetric[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useAnalyticsAlerts - Liste les alertes d'analytics
 */
export const useAnalyticsAlerts = (storeId?: string) => {
  return useQuery({
    queryKey: ['analytics-alerts', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('analytics_alerts')
        .select(ANALYTICS_ALERT_FIELDS)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching analytics alerts', { error, storeId });
        throw error;
      }

      return (data || []) as AnalyticsAlert[];
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useAnalyticsGoals - Liste les objectifs d'analytics
 */
export const useAnalyticsGoals = (storeId?: string) => {
  return useQuery({
    queryKey: ['analytics-goals', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('analytics_goals')
        .select(ANALYTICS_GOAL_FIELDS)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching analytics goals', { error, storeId });
        throw error;
      }

      return (data || []) as AnalyticsGoal[];
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateAdvancedDashboard - Créer un dashboard d'analytics
 */
export const useCreateAdvancedDashboard = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dashboard: Partial<AdvancedAnalyticsDashboard>) => {
      const { data, error } = await supabase
        .from('advanced_analytics_dashboards')
        .insert([dashboard])
        .select()
        .single();

      if (error) {
        logger.error('Error creating advanced dashboard', { error, dashboard });
        throw error;
      }

      return data as AdvancedAnalyticsDashboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-dashboards'] });
      toast({
        title: '✅ Dashboard créé',
        description: 'Le dashboard a été créé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateAdvancedDashboard', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le dashboard',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateAdvancedDashboard - Mettre à jour un dashboard d'analytics
 */
export const useUpdateAdvancedDashboard = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...dashboard
    }: Partial<AdvancedAnalyticsDashboard> & { id: string }) => {
      const { data, error } = await supabase
        .from('advanced_analytics_dashboards')
        .update(dashboard)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating advanced dashboard', { error, dashboard });
        throw error;
      }

      return data as AdvancedAnalyticsDashboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-dashboards'] });
      toast({
        title: '✅ Dashboard mis à jour',
        description: 'Le dashboard a été mis à jour avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useUpdateAdvancedDashboard', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le dashboard',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreateAnalyticsAlert - Créer une alerte d'analytics
 */
export const useCreateAnalyticsAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (alert: Partial<AnalyticsAlert>) => {
      const { data, error } = await supabase
        .from('analytics_alerts')
        .insert([alert])
        .select()
        .single();

      if (error) {
        logger.error('Error creating analytics alert', { error, alert });
        throw error;
      }

      return data as AnalyticsAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-alerts'] });
      toast({
        title: '✅ Alerte créée',
        description: "L'alerte a été créée avec succès",
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateAnalyticsAlert', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || "Impossible de créer l'alerte",
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreateAnalyticsGoal - Créer un objectif d'analytics
 */
export const useCreateAnalyticsGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (goal: Partial<AnalyticsGoal>) => {
      const { data, error } = await supabase
        .from('analytics_goals')
        .insert([goal])
        .select()
        .single();

      if (error) {
        logger.error('Error creating analytics goal', { error, goal });
        throw error;
      }

      return data as AnalyticsGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-goals'] });
      toast({
        title: '✅ Objectif créé',
        description: "L'objectif a été créé avec succès",
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateAnalyticsGoal', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || "Impossible de créer l'objectif",
        variant: 'destructive',
      });
    },
  });
};
