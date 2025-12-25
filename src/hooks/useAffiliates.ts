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
  AffiliateStats,
  PaginationParams,
  PaginatedResponse
} from '@/types/affiliate';
import { logger } from '@/lib/logger';
import { AffiliateError, handleSupabaseError, AffiliateErrors } from '@/lib/affiliate-errors';

export const useAffiliates = (filters?: AffiliateFilters, pagination?: PaginationParams) => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pagination?.page || 1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 20);
  const { toast } = useToast();

  const fetchAffiliates = async (currentPage: number = page) => {
    try {
      setLoading(true);
      
      // Compter le total pour la pagination
      let countQuery = supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true });

      if (filters?.status) {
        countQuery = countQuery.eq('status', filters.status);
      }

      if (filters?.search) {
        countQuery = countQuery.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%,affiliate_code.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      if (filters?.date_from) {
        countQuery = countQuery.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        countQuery = countQuery.lte('created_at', filters.date_to);
      }

      if (filters?.min_sales !== undefined) {
        countQuery = countQuery.gte('total_sales', filters.min_sales);
      }

      if (filters?.min_revenue !== undefined) {
        countQuery = countQuery.gte('total_revenue', filters.min_revenue);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotal(count || 0);

      // Requête principale avec pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

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

      if (error) {
        const affiliateError = handleSupabaseError(error);
        throw affiliateError;
      }

      setAffiliates(data || []);
      setPage(currentPage);
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error fetching affiliates:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const registerAffiliate = async (formData: AffiliateRegistrationForm): Promise<Affiliate | null> => {
    try {
      // Validation
      if (!formData.email) {
        throw AffiliateErrors.validationError('email', 'L\'email est requis');
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Générer code affilié
      const { data: codeData, error: codeError } = await supabase.rpc('generate_affiliate_code', {
        p_first_name: formData.first_name,
        p_last_name: formData.last_name,
      });

      if (codeError) {
        throw handleSupabaseError(codeError);
      }

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

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({
        title: 'Inscription réussie ! 🎉',
        description: `Votre code affilié : ${data.affiliate_code}`,
      });

      await fetchAffiliates();
      return data;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error registering affiliate:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateAffiliate = async (affiliateId: string, updates: Partial<Affiliate>): Promise<boolean> => {
    try {
      if (!affiliateId) {
        throw AffiliateErrors.affiliateNotFound();
      }

      const { error } = await supabase
        .from('affiliates')
        .update(updates)
        .eq('id', affiliateId);

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({
        title: 'Succès',
        description: 'Affilié mis à jour',
      });

      await fetchAffiliates(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error updating affiliate:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const suspendAffiliate = async (affiliateId: string, reason: string): Promise<boolean> => {
    try {
      if (!affiliateId) {
        throw AffiliateErrors.affiliateNotFound();
      }

      if (!reason || reason.trim().length === 0) {
        throw AffiliateErrors.validationError('reason', 'La raison de suspension est requise');
      }

      const { error } = await supabase
        .from('affiliates')
        .update({
          status: 'suspended',
          suspension_reason: reason,
          suspended_at: new Date().toISOString(),
        })
        .eq('id', affiliateId);

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({
        title: 'Succès',
        description: 'Affilié suspendu',
      });

      await fetchAffiliates(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error suspending affiliate:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const activateAffiliate = async (affiliateId: string): Promise<boolean> => {
    try {
      if (!affiliateId) {
        throw AffiliateErrors.affiliateNotFound();
      }

      const { error } = await supabase
        .from('affiliates')
        .update({
          status: 'active',
          suspension_reason: null,
          suspended_at: null,
        })
        .eq('id', affiliateId);

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({
        title: 'Succès',
        description: 'Affilié réactivé',
      });

      await fetchAffiliates(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error activating affiliate:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const getAffiliateStats = async (affiliateId: string): Promise<AffiliateStats | null> => {
    try {
      if (!affiliateId) {
        throw AffiliateErrors.affiliateNotFound();
      }

      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      if (!affiliate) {
        throw AffiliateErrors.affiliateNotFound(affiliateId);
      }

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
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error getting affiliate stats:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAffiliates(page);
  }, [JSON.stringify(filters), page, pageSize]);

  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchAffiliates(newPage);
    }
  };

  const nextPage = () => {
    if (hasNextPage) {
      goToPage(page + 1);
    }
  };

  const previousPage = () => {
    if (hasPreviousPage) {
      goToPage(page - 1);
    }
  };

  return {
    affiliates,
    loading,
    // Pagination
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    // Navigation
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    // CRUD
    registerAffiliate,
    updateAffiliate,
    suspendAffiliate,
    activateAffiliate,
    getAffiliateStats,
    refetch: () => fetchAffiliates(page),
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        logger.error('Auth error in fetchCurrentAffiliate:', authError);
        setAffiliate(null);
        setLoading(false);
        return;
      }

      if (!user) {
        setAffiliate(null);
        setLoading(false);
        return;
      }

      // Requête avec gestion explicite des en-têtes
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter l'erreur si aucun résultat

      // PGRST116 = "No rows returned" - c'est normal si l'utilisateur n'est pas encore affilié
      if (error && error.code !== 'PGRST116') {
        // Gestion spécifique de l'erreur 406
        if (error.message?.includes('406') || error.status === 406) {
          logger.error('406 Not Acceptable error - Possible RLS or header issue:', {
            error,
            userId: user.id,
            url: supabase.supabaseUrl,
          });
          // Ne pas afficher de toast pour cette erreur spécifique, juste logger
          setAffiliate(null);
          setLoading(false);
          return;
        }
        throw error;
      }

      setAffiliate(data || null);
    } catch (error: any) {
      logger.error('Error fetching current affiliate:', {
        error,
        message: error?.message,
        code: error?.code,
        status: error?.status,
        details: error?.details,
      });
      
      // Ne pas afficher de toast pour les erreurs 406 ou PGRST116 (utilisateur non affilié)
      if (error?.code === 'PGRST116' || error?.status === 406) {
        setAffiliate(null);
        setLoading(false);
        return;
      }
      
      toast({
        title: 'Erreur',
        description: error?.message || 'Une erreur est survenue lors du chargement de votre profil affilié',
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

