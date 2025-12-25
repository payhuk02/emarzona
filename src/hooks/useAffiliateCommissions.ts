/**
 * Hook: useAffiliateCommissions
 * Description: Gestion des commissions d'affiliation
 * Date: 25/10/2025
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AffiliateCommission, 
  CommissionFilters, 
  AffiliateStats,
  ApproveCommissionForm,
  RejectCommissionForm,
  PayCommissionForm,
  PaginationParams
} from '@/types/affiliate';
import { logger } from '@/lib/logger';
import { handleSupabaseError, AffiliateErrors } from '@/lib/affiliate-errors';

export const useAffiliateCommissions = (
  filters?: CommissionFilters,
  pagination?: PaginationParams
) => {
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pagination?.page || 1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 20);
  const { toast } = useToast();

  const fetchCommissions = async (currentPage: number = page) => {
    try {
      setLoading(true);

      // Compter le total
      let countQuery = supabase
        .from('affiliate_commissions')
        .select('*', { count: 'exact', head: true });

      if (filters?.status) {
        countQuery = countQuery.eq('status', filters.status);
      }

      if (filters?.affiliate_id) {
        countQuery = countQuery.eq('affiliate_id', filters.affiliate_id);
      }

      if (filters?.product_id) {
        countQuery = countQuery.eq('product_id', filters.product_id);
      }

      if (filters?.store_id) {
        countQuery = countQuery.eq('store_id', filters.store_id);
      }

      if (filters?.date_from) {
        countQuery = countQuery.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        countQuery = countQuery.lte('created_at', filters.date_to);
      }

      if (filters?.min_amount !== undefined) {
        countQuery = countQuery.gte('commission_amount', filters.min_amount);
      }

      if (filters?.max_amount !== undefined) {
        countQuery = countQuery.lte('commission_amount', filters.max_amount);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotal(count || 0);

      // Requête principale avec pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('affiliate_commissions')
        .select(`
          *,
          product:products(name, image_url),
          affiliate:affiliates(display_name, email, affiliate_code),
          order:orders(order_number)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.affiliate_id) {
        query = query.eq('affiliate_id', filters.affiliate_id);
      }

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.min_amount !== undefined) {
        query = query.gte('commission_amount', filters.min_amount);
      }

      if (filters?.max_amount !== undefined) {
        query = query.lte('commission_amount', filters.max_amount);
      }

      const { data, error } = await query;

      if (error) {
        const affiliateError = handleSupabaseError(error);
        throw affiliateError;
      }

      setCommissions(data || []);
      setPage(currentPage);

      // Calculer les stats
      if (data && data.length > 0) {
        const totalRevenue = data.reduce((sum, c) => sum + Number(c.order_total), 0);
        const totalCommissionEarned = data.reduce((sum, c) => sum + Number(c.commission_amount), 0);
        const totalCommissionPaid = data
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + Number(c.commission_amount), 0);
        const pendingCommission = data
          .filter(c => c.status === 'pending' || c.status === 'approved')
          .reduce((sum, c) => sum + Number(c.commission_amount), 0);

        // Récupérer le nombre de clics (nécessiterait une requête séparée)
        const totalClicks = 0; // TODO: À calculer si nécessaire

        setStats({
          total_clicks: totalClicks,
          total_sales: data.length,
          total_revenue: totalRevenue,
          total_commission_earned: totalCommissionEarned,
          total_commission_paid: totalCommissionPaid,
          pending_commission: pendingCommission,
          available_for_withdrawal: totalCommissionEarned - totalCommissionPaid,
          conversion_rate: 0, // À calculer séparément si nécessaire
          average_order_value: totalRevenue / data.length,
          average_commission_per_sale: totalCommissionEarned / data.length,
        });
      } else {
        setStats({
          total_clicks: 0,
          total_sales: 0,
          total_revenue: 0,
          total_commission_earned: 0,
          total_commission_paid: 0,
          pending_commission: 0,
          available_for_withdrawal: 0,
          conversion_rate: 0,
          average_order_value: 0,
          average_commission_per_sale: 0,
        });
      }
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error fetching commissions:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const approveCommission = async (formData: ApproveCommissionForm): Promise<boolean> => {
    try {
      if (!formData.commission_id) {
        throw AffiliateErrors.commissionNotFound();
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          notes: formData.notes,
        })
        .eq('id', formData.commission_id);

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({ 
        title: 'Commission approuvée ✅',
        description: 'La commission peut maintenant être payée' 
      });
      
      await fetchCommissions(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error approving commission:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const rejectCommission = async (formData: RejectCommissionForm): Promise<boolean> => {
    try {
      if (!formData.commission_id) {
        throw AffiliateErrors.commissionNotFound();
      }

      if (!formData.rejection_reason || formData.rejection_reason.trim().length === 0) {
        throw AffiliateErrors.validationError('rejection_reason', 'La raison du rejet est requise');
      }

      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: formData.rejection_reason,
        })
        .eq('id', formData.commission_id);

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({ 
        title: 'Commission rejetée',
        description: 'La commission a été refusée' 
      });
      
      await fetchCommissions(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error rejecting commission:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const markAsPaid = async (formData: PayCommissionForm): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Récupérer la commission
      const { data: commission, error: commissionError } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('id', formData.commission_id)
        .single();

      if (commissionError || !commission) {
        throw AffiliateErrors.commissionNotFound(formData.commission_id);
      }

      // Mettre à jour la commission
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: user?.id,
          payment_method: formData.payment_method,
          payment_reference: formData.payment_reference,
          payment_proof_url: formData.payment_proof_url,
          notes: formData.notes,
        })
        .eq('id', formData.commission_id);

      if (error) throw error;

      // Mettre à jour les stats de l'affilié
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({
          total_commission_paid: supabase.rpc('increment', { 
            row_id: commission.affiliate_id, 
            increment_value: commission.commission_amount 
          }),
          pending_commission: supabase.rpc('decrement', { 
            row_id: commission.affiliate_id, 
            decrement_value: commission.commission_amount 
          }),
        })
        .eq('id', commission.affiliate_id);

      if (updateError) logger.warn('Error updating affiliate stats:', updateError);

      toast({ 
        title: 'Commission payée 💰',
        description: `${commission.commission_amount} XOF versés` 
      });
      
      await fetchCommissions(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error marking commission as paid:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelCommission = async (commissionId: string, reason: string): Promise<boolean> => {
    try {
      if (!commissionId) {
        throw AffiliateErrors.commissionNotFound();
      }

      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'cancelled',
          notes: reason,
        })
        .eq('id', commissionId);

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({ 
        title: 'Commission annulée',
        description: 'La commission a été annulée' 
      });
      
      await fetchCommissions(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error cancelling commission:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCommissions(page);
  }, [JSON.stringify(filters), page, pageSize]);

  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchCommissions(newPage);
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
    commissions,
    stats,
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
    approveCommission,
    rejectCommission,
    markAsPaid,
    cancelCommission,
    refetch: () => fetchCommissions(page),
  };
};

/**
 * Hook: usePendingCommissions
 * Description: Commissions en attente d'approbation/paiement
 */
export const usePendingCommissions = (storeId?: string) => {
  const [pending, setPending] = useState<AffiliateCommission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        let query = supabase
          .from('affiliate_commissions')
          .select(`
            *,
            product:products(name, image_url),
            affiliate:affiliates(display_name, email, affiliate_code),
            order:orders(order_number)
          `)
          .in('status', ['pending', 'approved'])
          .order('created_at', { ascending: true });

        if (storeId) {
          query = query.eq('store_id', storeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        setPending(data || []);
      } catch (error) {
        logger.error('Error fetching pending commissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [storeId]);

  return { pending, loading };
};

