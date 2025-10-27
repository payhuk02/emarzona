/**
 * Hooks pour la gestion des liens affiliés de cours
 * Création, récupération et statistiques des liens
 * Date : 27 octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AffiliateLink {
  id: string;
  affiliate_code: string;
  product_id: string;
  user_id: string;
  status: 'active' | 'inactive';
  clicks_count: number;
  conversions_count: number;
  total_commission: number;
  custom_name?: string;
  created_at: string;
  updated_at: string;
}

interface AffiliateLinkStats {
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
}

/**
 * Hook pour récupérer les liens affiliés d'un utilisateur pour un cours
 */
export const useMyAffiliateLinks = (productId: string) => {
  return useQuery({
    queryKey: ['my-affiliate-links', productId],
    queryFn: async (): Promise<AffiliateLink[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Non connecté');
      }

      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!productId,
  });
};

/**
 * Hook pour créer un nouveau lien affilié
 */
export const useCreateAffiliateLink = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      customName,
    }: {
      productId: string;
      customName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Non connecté');
      }

      // Vérifier si l'affiliation est activée pour ce produit
      const { data: settings } = await supabase
        .from('product_affiliate_settings')
        .select('affiliate_enabled, require_approval')
        .eq('product_id', productId)
        .single();

      if (!settings || !settings.affiliate_enabled) {
        throw new Error('Le programme d\'affiliation n\'est pas activé pour ce cours');
      }

      // Générer un code affilié unique
      const affiliateCode = `${user.id.substring(0, 8)}-${Date.now().toString(36)}`.toUpperCase();

      // Créer le lien
      const { data, error } = await supabase
        .from('affiliate_links')
        .insert({
          product_id: productId,
          user_id: user.id,
          affiliate_code: affiliateCode,
          custom_name: customName,
          status: settings.require_approval ? 'pending' : 'active',
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: '✅ Lien créé avec succès !',
        description: data.status === 'pending' 
          ? 'Votre lien est en attente d\'approbation'
          : 'Votre lien est maintenant actif',
      });
      queryClient.invalidateQueries({ queryKey: ['my-affiliate-links', variables.productId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer les statistiques d'un lien affilié
 */
export const useAffiliateLinkStats = (linkId: string) => {
  return useQuery({
    queryKey: ['affiliate-link-stats', linkId],
    queryFn: async (): Promise<AffiliateLinkStats> => {
      // Récupérer le lien
      const { data: link, error: linkError } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('id', linkId)
        .single();

      if (linkError) {
        throw new Error(linkError.message);
      }

      // Récupérer les clics
      const { count: clicksCount } = await supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('affiliate_link_id', linkId);

      // Récupérer les commissions
      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('amount, status')
        .eq('affiliate_link_id', linkId);

      const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const paidCommission = commissions
        ?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0) || 0;
      const pendingCommission = totalCommission - paidCommission;

      const conversionRate = clicksCount && link.conversions_count
        ? (link.conversions_count / clicksCount) * 100
        : 0;

      return {
        total_clicks: clicksCount || 0,
        total_conversions: link.conversions_count || 0,
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        paid_commission: paidCommission,
      };
    },
    enabled: !!linkId,
  });
};

/**
 * Hook pour récupérer les statistiques globales d'un utilisateur pour un cours
 */
export const useMyAffiliateCourseStats = (productId: string) => {
  return useQuery({
    queryKey: ['my-affiliate-course-stats', productId],
    queryFn: async (): Promise<AffiliateLinkStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Non connecté');
      }

      // Récupérer tous les liens de l'utilisateur pour ce cours
      const { data: links } = await supabase
        .from('affiliate_links')
        .select('id, conversions_count')
        .eq('product_id', productId)
        .eq('user_id', user.id);

      if (!links || links.length === 0) {
        return {
          total_clicks: 0,
          total_conversions: 0,
          conversion_rate: 0,
          total_commission: 0,
          pending_commission: 0,
          paid_commission: 0,
        };
      }

      const linkIds = links.map(l => l.id);

      // Récupérer les clics totaux
      const { count: clicksCount } = await supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true })
        .in('affiliate_link_id', linkIds);

      // Récupérer les commissions totales
      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('amount, status')
        .in('affiliate_link_id', linkIds);

      const totalConversions = links.reduce((sum, l) => sum + (l.conversions_count || 0), 0);
      const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const paidCommission = commissions
        ?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0) || 0;
      const pendingCommission = totalCommission - paidCommission;

      const conversionRate = clicksCount && totalConversions
        ? (totalConversions / clicksCount) * 100
        : 0;

      return {
        total_clicks: clicksCount || 0,
        total_conversions: totalConversions,
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        paid_commission: paidCommission,
      };
    },
    enabled: !!productId,
  });
};

/**
 * Helper pour générer l'URL complète d'un lien affilié
 */
export const generateAffiliateUrl = (productSlug: string, affiliateCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/courses/${productSlug}?ref=${affiliateCode}`;
};

