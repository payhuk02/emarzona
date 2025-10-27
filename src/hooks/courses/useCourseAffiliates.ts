/**
 * Hooks pour la gestion de l'affiliation des cours
 * Récupération des settings, statistiques, et gestion des affiliés
 * Date : 27 octobre 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateSettings {
  id: string;
  product_id: string;
  store_id: string;
  affiliate_enabled: boolean;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  fixed_commission_amount: number;
  cookie_duration_days: number;
  max_commission_per_sale?: number;
  min_order_amount: number;
  allow_self_referral: boolean;
  require_approval: boolean;
  terms_and_conditions: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook pour récupérer les paramètres d'affiliation d'un cours
 */
export const useCourseAffiliateSettings = (productId: string) => {
  return useQuery({
    queryKey: ['course-affiliate-settings', productId],
    queryFn: async (): Promise<AffiliateSettings | null> => {
      const { data, error } = await supabase
        .from('product_affiliate_settings')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!productId,
  });
};

/**
 * Hook pour vérifier si l'affiliation est active pour un cours
 */
export const useIsAffiliateEnabled = (productId: string) => {
  const { data: settings, isLoading } = useCourseAffiliateSettings(productId);

  return {
    isEnabled: settings?.affiliate_enabled || false,
    settings,
    isLoading,
  };
};

/**
 * Hook pour calculer la commission estimée pour un affilié
 */
export const useCalculateCommission = (
  productId: string,
  productPrice: number
) => {
  const { data: settings } = useCourseAffiliateSettings(productId);

  const calculateCommission = () => {
    if (!settings || !settings.affiliate_enabled) {
      return 0;
    }

    if (settings.commission_type === 'percentage') {
      // Commission sur le montant vendeur (après commission plateforme 10%)
      const sellerAmount = productPrice * 0.90;
      let commission = (sellerAmount * settings.commission_rate) / 100;

      // Appliquer la limite max si définie
      if (settings.max_commission_per_sale && commission > settings.max_commission_per_sale) {
        commission = settings.max_commission_per_sale;
      }

      return commission;
    }

    return settings.fixed_commission_amount;
  };

  return {
    commission: calculateCommission(),
    settings,
  };
};

/**
 * Hook pour récupérer les statistiques d'affiliation d'un cours
 * (nombre d'affiliés actifs, clics, inscriptions, commissions versées)
 */
export const useCourseAffiliateStats = (productId: string) => {
  return useQuery({
    queryKey: ['course-affiliate-stats', productId],
    queryFn: async () => {
      // Récupérer le nombre d'affiliés actifs
      const { count: affiliatesCount, error: affiliatesError } = await supabase
        .from('affiliate_links')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('status', 'active');

      if (affiliatesError && affiliatesError.code !== 'PGRST116') {
        console.error('Erreur affiliés:', affiliatesError);
      }

      // Récupérer le total des clics
      const { count: clicksCount, error: clicksError } = await supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);

      if (clicksError && clicksError.code !== 'PGRST116') {
        console.error('Erreur clics:', clicksError);
      }

      // Récupérer le total des commissions
      const { data: commissions, error: commissionsError } = await supabase
        .from('affiliate_commissions')
        .select('amount')
        .eq('product_id', productId)
        .eq('status', 'paid');

      if (commissionsError && commissionsError.code !== 'PGRST116') {
        console.error('Erreur commissions:', commissionsError);
      }

      const totalCommissions = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;

      return {
        totalAffiliates: affiliatesCount || 0,
        totalClicks: clicksCount || 0,
        totalCommissions,
      };
    },
    enabled: !!productId,
  });
};

