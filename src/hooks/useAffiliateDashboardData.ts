/**
 * Hook: useAffiliateDashboardData
 * Description: Utilise la vue SQL optimisée pour récupérer toutes les données du dashboard en une seule requête
 * Date: 28/01/2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { handleSupabaseError } from '@/lib/affiliate-errors';

export interface AffiliateDashboardData {
  affiliate_id: string;
  user_id: string | null;
  email: string;
  display_name: string | null;
  affiliate_code: string;
  status: string;
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission_earned: number;
  total_commission_paid: number;
  pending_commission: number;
  conversion_rate: number;
  avg_order_value: number;
  avg_commission_per_sale: number;
  active_links_count: number;
  total_links_count: number;
  pending_commissions_count: number;
  approved_commissions_count: number;
  pending_withdrawals_count: number;
  pending_withdrawals_amount: number;
  created_at: string;
  last_login_at: string | null;
  last_link_used_at: string | null;
}

/**
 * Hook pour récupérer toutes les données du dashboard affilié en une seule requête optimisée
 */
export const useAffiliateDashboardData = (affiliateId: string | undefined) => {
  return useQuery({
    queryKey: ['affiliate-dashboard-data', affiliateId],
    queryFn: async (): Promise<AffiliateDashboardData | null> => {
      if (!affiliateId) {
        return null;
      }

      try {
        // Utiliser la fonction RPC optimisée
        const { data, error } = await supabase.rpc('get_affiliate_dashboard_data', {
          p_affiliate_id: affiliateId,
        });

        if (error) {
          throw handleSupabaseError(error);
        }

        if (!data || data.length === 0) {
          return null;
        }

        return data[0] as AffiliateDashboardData;
      } catch (error) {
        logger.error('Error fetching affiliate dashboard data:', error);
        throw error;
      }
    },
    enabled: !!affiliateId,
    staleTime: 30000, // Cache pendant 30 secondes
  });
};







