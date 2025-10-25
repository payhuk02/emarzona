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
  PayCommissionForm
} from '@/types/affiliate';
import { logger } from '@/lib/logger';

export const useAffiliateCommissions = (filters?: CommissionFilters) => {
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommissions = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('affiliate_commissions')
        .select(`
          *,
          product:products(name, image_url),
          affiliate:affiliates(display_name, email, affiliate_code),
          order:orders(order_number)
        `)
        .order('created_at', { ascending: false });

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

      if (error) throw error;

      setCommissions(data || []);

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
    } catch (error: any) {
      logger.error('Error fetching commissions:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const approveCommission = async (formData: ApproveCommissionForm): Promise<boolean> => {
    try {
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

      if (error) throw error;

      toast({ 
        title: 'Commission approuvée ✅',
        description: 'La commission peut maintenant être payée' 
      });
      
      await fetchCommissions();
      return true;
    } catch (error: any) {
      logger.error('Error approving commission:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const rejectCommission = async (formData: RejectCommissionForm): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: formData.rejection_reason,
        })
        .eq('id', formData.commission_id);

      if (error) throw error;

      toast({ 
        title: 'Commission rejetée',
        description: 'La commission a été refusée' 
      });
      
      await fetchCommissions();
      return true;
    } catch (error: any) {
      logger.error('Error rejecting commission:', error);
      toast({
        title: 'Erreur',
        description: error.message,
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

      if (commissionError) throw commissionError;

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
      
      await fetchCommissions();
      return true;
    } catch (error: any) {
      logger.error('Error marking commission as paid:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelCommission = async (commissionId: string, reason: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'cancelled',
          notes: reason,
        })
        .eq('id', commissionId);

      if (error) throw error;

      toast({ 
        title: 'Commission annulée',
        description: 'La commission a été annulée' 
      });
      
      await fetchCommissions();
      return true;
    } catch (error: any) {
      logger.error('Error cancelling commission:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [JSON.stringify(filters)]);

  return {
    commissions,
    stats,
    loading,
    approveCommission,
    rejectCommission,
    markAsPaid,
    cancelCommission,
    refetch: fetchCommissions,
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

