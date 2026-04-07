/**
 * Hook: useAffiliateShortLinksAnalytics
 * Description: Analytics avancés pour les liens courts d'affiliation
 * Date: Janvier 2026
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { handleSupabaseError } from '@/lib/affiliate-errors';

export interface ShortLinksAnalytics {
  summary: {
    total_links: number;
    active_links: number;
    inactive_links: number;
    total_clicks: number;
    avg_clicks_per_link: number;
    conversion_rate: number;
  };
  top_performing_links: Array<{
    short_code: string;
    custom_alias: string | null;
    clicks: number;
    is_active: boolean;
    created_at: string;
    last_used_at: string | null;
  }>;
  clicks_by_day: Array<{
    date: string;
    clicks: number;
  }>;
  geographic_distribution: Array<{
    country: string;
    clicks: number;
  }>;
  period_days: number;
  generated_at: string;
}

export interface OptimizationSuggestions {
  affiliate_id: string;
  suggestions: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    affected_links?: { short_code: string; clicks: number }[];
    action_suggestion: string;
  }>;
  total_suggestions: number;
  generated_at: string;
}

/**
 * Hook pour récupérer les analytics avancés des liens courts
 */
export const useAffiliateShortLinksAnalytics = (
  affiliateId?: string,
  days: number = 30
) => {
  return useQuery({
    queryKey: ['affiliate-short-links-analytics', affiliateId, days],
    queryFn: async (): Promise<ShortLinksAnalytics> => {
      try {
        const { data, error } = await supabase.rpc('get_affiliate_short_links_analytics', {
          p_affiliate_id: affiliateId || null,
          p_days: days,
        });

        if (error) {
          throw handleSupabaseError(error);
        }

        return data as ShortLinksAnalytics;
      } catch (error) {
        logger.error('Error fetching short links analytics:', error);
        throw error;
      }
    },
    enabled: !!affiliateId,
    staleTime: 5 * 60 * 1000, // 5 minutes (analytics moins critiques)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook pour récupérer les suggestions d'optimisation
 */
export const useShortLinkOptimizationSuggestions = (affiliateId?: string) => {
  return useQuery({
    queryKey: ['short-link-optimization-suggestions', affiliateId],
    queryFn: async (): Promise<OptimizationSuggestions> => {
      try {
        const { data, error } = await supabase.rpc('get_short_link_optimization_suggestions', {
          p_affiliate_id: affiliateId,
        });

        if (error) {
          throw handleSupabaseError(error);
        }

        return data as OptimizationSuggestions;
      } catch (error) {
        logger.error('Error fetching optimization suggestions:', error);
        throw error;
      }
    },
    enabled: !!affiliateId,
    staleTime: 15 * 60 * 1000, // 15 minutes (suggestions moins urgentes)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook helper pour combiner analytics et suggestions
 */
export const useAffiliateShortLinksInsights = (
  affiliateId?: string,
  days: number = 30
) => {
  const analytics = useAffiliateShortLinksAnalytics(affiliateId, days);
  const suggestions = useShortLinkOptimizationSuggestions(affiliateId);

  return {
    analytics,
    suggestions,
    isLoading: analytics.isLoading || suggestions.isLoading,
    error: analytics.error || suggestions.error,
    // Données combinées pour faciliter l'utilisation
    insights: {
      analytics: analytics.data,
      suggestions: suggestions.data,
      hasInsights: !!(analytics.data && suggestions.data),
    },
  };
};