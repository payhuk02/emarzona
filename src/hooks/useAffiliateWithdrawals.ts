/**
 * Hook: useAffiliateWithdrawals
 * Description: Gestion des demandes de retrait des affiliés
 * Date: 25/10/2025
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AffiliateWithdrawal, 
  WithdrawalRequestForm,
  WithdrawalFilters 
} from '@/types/affiliate';
import { logger } from '@/lib/logger';

const AFFILIATE_WITHDRAWAL_FIELDS =
  'id, affiliate_id, amount, currency, payment_method, payment_details, status, approved_at, approved_by, rejected_at, rejection_reason, processed_at, processed_by, transaction_reference, proof_url, failed_at, failure_reason, notes, admin_notes, created_at, updated_at';

export const useAffiliateWithdrawals = (filters?: WithdrawalFilters) => {
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);

      let  query= supabase
        .from('affiliate_withdrawals')
        .select(`
          ${AFFILIATE_WITHDRAWAL_FIELDS},
          affiliate:affiliates(display_name, email, affiliate_code)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.affiliate_id) {
        query = query.eq('affiliate_id', filters.affiliate_id);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.min_amount !== undefined) {
        query = query.gte('amount', filters.min_amount);
      }

      if (filters?.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }

      const { data, error } = await query;

      if (error) throw error;

      setWithdrawals(data || []);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching withdrawals:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = async (
    affiliateId: string,
    formData: WithdrawalRequestForm
  ): Promise<AffiliateWithdrawal | null> => {
    try {
      // Vérifier le solde disponible
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('total_commission_earned, total_commission_paid, pending_commission')
        .eq('id', affiliateId)
        .single();

      if (affiliateError) throw affiliateError;

      const availableBalance = affiliate.total_commission_earned - affiliate.total_commission_paid;

      if (formData.amount > availableBalance) {
        throw new Error(`Solde insuffisant. Disponible : ${availableBalance} XOF`);
      }

      // Vérifier le montant minimum (ex: 10000 XOF)
      const MIN_WITHDRAWAL = 10000;
      if (formData.amount < MIN_WITHDRAWAL) {
        throw new Error(`Le montant minimum de retrait est de ${MIN_WITHDRAWAL} XOF`);
      }

      // Créer la demande de retrait
      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .insert({
          affiliate_id: affiliateId,
          amount: formData.amount,
          currency: 'XOF',
          payment_method: formData.payment_method,
          payment_details: formData.payment_details,
          notes: formData.notes,
          status: 'pending',
        })
        .select(`
          ${AFFILIATE_WITHDRAWAL_FIELDS},
          affiliate:affiliates(display_name, email, affiliate_code)
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Demande envoyée ! 📤',
        description: `Retrait de ${formData.amount} XOF en cours de traitement`,
      });

      await fetchWithdrawals();
      return data;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error requesting withdrawal:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const approveWithdrawal = async (withdrawalId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status: 'processing',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: 'Demande approuvée ✅',
        description: 'Le retrait est en cours de traitement',
      });

      await fetchWithdrawals();
      return true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error approving withdrawal:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const rejectWithdrawal = async (
    withdrawalId: string, 
    reason: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status: 'cancelled',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: 'Demande rejetée',
        description: 'La demande de retrait a été annulée',
      });

      await fetchWithdrawals();
      return true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error rejecting withdrawal:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const completeWithdrawal = async (
    withdrawalId: string,
    transactionReference: string,
    proofUrl?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Récupérer le retrait
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('affiliate_withdrawals')
        .select(AFFILIATE_WITHDRAWAL_FIELDS)
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError) throw withdrawalError;

      // Marquer comme complété
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
          transaction_reference: transactionReference,
          proof_url: proofUrl,
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      // Mettre à jour les stats de l'affilié (déduire du pending)
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({
          pending_commission: supabase.sql`pending_commission - ${withdrawal.amount}`,
        })
        .eq('id', withdrawal.affiliate_id);

      if (updateError) logger.warn('Error updating affiliate stats:', updateError);

      toast({
        title: 'Retrait complété 💰',
        description: `${withdrawal.amount} XOF versés avec succès`,
      });

      await fetchWithdrawals();
      return true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error completing withdrawal:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const markAsFailed = async (
    withdrawalId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: reason,
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: 'Retrait échoué',
        description: 'Le retrait n\'a pas pu être effectué',
        variant: 'destructive',
      });

      await fetchWithdrawals();
      return true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error marking withdrawal as failed:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelWithdrawal = async (withdrawalId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status: 'cancelled',
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: 'Demande annulée',
        description: 'La demande de retrait a été annulée',
      });

      await fetchWithdrawals();
      return true;
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error cancelling withdrawal:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [JSON.stringify(filters)]);

  return {
    withdrawals,
    loading,
    requestWithdrawal,
    approveWithdrawal,
    rejectWithdrawal,
    completeWithdrawal,
    markAsFailed,
    cancelWithdrawal,
    refetch: fetchWithdrawals,
  };
};

/**
 * Hook: usePendingWithdrawals
 * Description: Retraits en attente (pour admin)
 */
export const usePendingWithdrawals = () => {
  const [pending, setPending] = useState<AffiliateWithdrawal[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { data, error } = await supabase
          .from('affiliate_withdrawals')
          .select(`
            ${AFFILIATE_WITHDRAWAL_FIELDS},
            affiliate:affiliates(display_name, email, affiliate_code)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        if (error) throw error;

        setPending(data || []);
        
        const total = data?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
        setTotalAmount(total);
      } catch (error) {
        logger.error('Error fetching pending withdrawals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  return { pending, totalAmount, loading };
};

/**
 * Hook: useAffiliateBalance
 * Description: Solde disponible pour retrait d'un affilié
 */
export const useAffiliateBalance = (affiliateId?: string) => {
  const [balance, setBalance] = useState({
    total_earned: 0,
    total_paid: 0,
    pending: 0,
    available: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!affiliateId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('affiliates')
          .select('total_commission_earned, total_commission_paid, pending_commission')
          .eq('id', affiliateId)
          .single();

        if (error) throw error;

        setBalance({
          total_earned: data.total_commission_earned,
          total_paid: data.total_commission_paid,
          pending: data.pending_commission,
          available: data.total_commission_earned - data.total_commission_paid,
        });
      } catch (error) {
        logger.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [affiliateId]);

  return { balance, loading };
};







