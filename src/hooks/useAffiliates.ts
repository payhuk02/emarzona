/**
 * Hook: useAffiliates
 * Description: Gestion des affiliés (CRUD + statistiques)
 * Date: 25/10/2025
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Affiliate, 
  AffiliateFilters, 
  AffiliateRegistrationForm,
  AffiliateStats 
} from '@/types/affiliate';
import { logger } from '@/lib/logger';

export const useAffiliates = (filters?: AffiliateFilters) => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%,affiliate_code.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.min_sales !== undefined) {
        query = query.gte('total_sales', filters.min_sales);
      }

      if (filters?.min_revenue !== undefined) {
        query = query.gte('total_revenue', filters.min_revenue);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAffiliates(data || []);
    } catch (error: any) {
      logger.error('Error fetching affiliates:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const registerAffiliate = async (formData: AffiliateRegistrationForm): Promise<Affiliate | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Générer code affilié
      const { data: codeData, error: codeError } = await supabase.rpc('generate_affiliate_code', {
        p_first_name: formData.first_name,
        p_last_name: formData.last_name,
      });

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user?.id,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          display_name: formData.display_name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim(),
          affiliate_code: codeData,
          payment_method: formData.payment_method,
          payment_details: formData.payment_details,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Inscription réussie ! 🎉',
        description: `Votre code affilié : ${data.affiliate_code}`,
      });

      await fetchAffiliates();
      return data;
    } catch (error: any) {
      logger.error('Error registering affiliate:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateAffiliate = async (affiliateId: string, updates: Partial<Affiliate>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update(updates)
        .eq('id', affiliateId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Affilié mis à jour',
      });

      await fetchAffiliates();
      return true;
    } catch (error: any) {
      logger.error('Error updating affiliate:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const suspendAffiliate = async (affiliateId: string, reason: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({
          status: 'suspended',
          suspension_reason: reason,
          suspended_at: new Date().toISOString(),
        })
        .eq('id', affiliateId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Affilié suspendu',
      });

      await fetchAffiliates();
      return true;
    } catch (error: any) {
      logger.error('Error suspending affiliate:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const activateAffiliate = async (affiliateId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({
          status: 'active',
          suspension_reason: null,
          suspended_at: null,
        })
        .eq('id', affiliateId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Affilié réactivé',
      });

      await fetchAffiliates();
      return true;
    } catch (error: any) {
      logger.error('Error activating affiliate:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getAffiliateStats = async (affiliateId: string): Promise<AffiliateStats | null> => {
    try {
      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single();

      if (error) throw error;

      const conversionRate = affiliate.total_clicks > 0 
        ? (affiliate.total_sales / affiliate.total_clicks) * 100 
        : 0;

      const averageOrderValue = affiliate.total_sales > 0 
        ? affiliate.total_revenue / affiliate.total_sales 
        : 0;

      const averageCommissionPerSale = affiliate.total_sales > 0 
        ? affiliate.total_commission_earned / affiliate.total_sales 
        : 0;

      const stats: AffiliateStats = {
        total_clicks: affiliate.total_clicks,
        total_sales: affiliate.total_sales,
        total_revenue: affiliate.total_revenue,
        total_commission_earned: affiliate.total_commission_earned,
        total_commission_paid: affiliate.total_commission_paid,
        pending_commission: affiliate.pending_commission,
        available_for_withdrawal: affiliate.total_commission_earned - affiliate.total_commission_paid,
        conversion_rate: conversionRate,
        average_order_value: averageOrderValue,
        average_commission_per_sale: averageCommissionPerSale,
      };

      return stats;
    } catch (error: any) {
      logger.error('Error getting affiliate stats:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, [JSON.stringify(filters)]);

  return {
    affiliates,
    loading,
    registerAffiliate,
    updateAffiliate,
    suspendAffiliate,
    activateAffiliate,
    getAffiliateStats,
    refetch: fetchAffiliates,
  };
};

/**
 * Hook: useCurrentAffiliate
 * Description: Récupère l'affilié connecté
 */
export const useCurrentAffiliate = () => {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCurrentAffiliate = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAffiliate(null);
        return;
      }

      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setAffiliate(data || null);
    } catch (error: any) {
      logger.error('Error fetching current affiliate:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentAffiliate();
  }, []);

  return {
    affiliate,
    loading,
    isAffiliate: !!affiliate,
    refetch: fetchCurrentAffiliate,
  };
};

