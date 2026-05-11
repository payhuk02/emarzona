/**
 * Hook: useAffiliateDailyStats
 * Description: Utilise la vue SQL optimisée pour récupérer les statistiques journalières pour les graphiques
 * Date: 28/01/2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { handleSupabaseError } from '@/lib/affiliate-errors';
import { format } from 'date-fns';
import type { AffiliateChartDataPoint } from '@/components/affiliate/AffiliatePerformanceCharts';

export interface DailyStatsRow {
  date: string; // Format: YYYY-MM-DD
  clicks_count: number;
  sales_count: number;
  revenue: number;
  commission_earned: number;
  conversion_rate: number;
}

/**
 * Hook pour récupérer les statistiques journalières d'un affilié pour les graphiques
 */
export const useAffiliateDailyStats = (
  affiliateId: string | undefined,
  days: number = 30
) => {
  return useQuery({
    queryKey: ['affiliate-daily-stats', affiliateId, days],
    queryFn: async (): Promise<AffiliateChartDataPoint[]> => {
      if (!affiliateId) {
        return [];
      }

      try {
        // Utiliser la fonction RPC optimisée
        const { data, error } = await supabase.rpc('get_affiliate_daily_stats', {
          p_affiliate_id: affiliateId,
          p_days: days,
        });

        if (error) {
          throw handleSupabaseError(error);
        }

        if (!data || data.length === 0) {
          return [];
        }

        // Transformer les données pour le format attendu par les graphiques
        const stats = data as DailyStatsRow[];

        // Créer des tableaux séparés pour chaque type de données
        const  clicksData: AffiliateChartDataPoint[] = stats.map((stat) => ({
          date: format(new Date(stat.date), 'yyyy-MM-dd'),
          clicks: Number(stat.clicks_count),
        }));

        const  salesData: AffiliateChartDataPoint[] = stats.map((stat) => ({
          date: format(new Date(stat.date), 'yyyy-MM-dd'),
          sales: Number(stat.sales_count),
          revenue: Number(stat.revenue),
        }));

        const  commissionsData: AffiliateChartDataPoint[] = stats.map((stat) => ({
          date: format(new Date(stat.date), 'yyyy-MM-dd'),
          commission: Number(stat.commission_earned),
        }));

        // Fusionner toutes les données par date
        const allDates = new Set([
          ...clicksData.map((d) => d.date),
          ...salesData.map((d) => d.date),
          ...commissionsData.map((d) => d.date),
        ]);

        const  mergedData: AffiliateChartDataPoint[] = Array.from(allDates).map((date) => {
          const clicks = clicksData.find((d) => d.date === date);
          const sales = salesData.find((d) => d.date === date);
          const commissions = commissionsData.find((d) => d.date === date);

          return {
            date,
            clicks: clicks?.clicks || 0,
            sales: sales?.sales || 0,
            revenue: sales?.revenue || 0,
            commission: commissions?.commission || 0,
            conversion_rate: clicks?.clicks
              ? ((sales?.sales || 0) / clicks.clicks) * 100
              : 0,
          };
        });

        return mergedData.sort((a, b) => a.date.localeCompare(b.date));
      } catch (error) {
        logger.error('Error fetching affiliate daily stats:', error);
        throw error;
      }
    },
    enabled: !!affiliateId,
    staleTime: 60000, // Cache pendant 1 minute (les stats changent moins souvent)
  });
};

/**
 * Hook helper pour séparer les données par type
 */
export const useAffiliateDailyStatsSeparated = (
  affiliateId: string | undefined,
  days: number = 30
) => {
  const { data: allData, ...rest } = useAffiliateDailyStats(affiliateId, days);

  const clicksData = allData?.map((d) => ({
    date: d.date,
    clicks: d.clicks || 0,
  })) || [];

  const salesData = allData?.map((d) => ({
    date: d.date,
    sales: d.sales || 0,
    revenue: d.revenue || 0,
  })) || [];

  const commissionsData = allData?.map((d) => ({
    date: d.date,
    commission: d.commission || 0,
  })) || [];

  return {
    clicksData,
    salesData,
    commissionsData,
    allData,
    ...rest,
  };
};







