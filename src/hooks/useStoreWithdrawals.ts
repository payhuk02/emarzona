/**
 * Hook: useStoreWithdrawals
 * Description: Gestion des demandes de retrait des vendeurs
 * Date: 2025-01-31
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVisibilityAwarePolling } from '@/hooks/useVisibilityAwarePolling';
import {
  StoreWithdrawal,
  StoreWithdrawalRequestForm,
  StoreWithdrawalFilters,
  StoreWithdrawalStats,
  StoreWithdrawalStatus,
} from '@/types/store-withdrawals';
import { logger } from '@/lib/logger';
export const useStoreWithdrawals = (filters?: StoreWithdrawalFilters) => {
  const [withdrawals, setWithdrawals] = useState<StoreWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const previousStatusesRef = useRef<Map<string, StoreWithdrawalStatus>>(new Map());

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('store_withdrawals')
        .select(
          `
          *,
          store:stores(id, name, slug, user_id)
        `
        )
        .order('created_at', { ascending: false });

      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
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

      if (filters?.max_amount !== undefined) {
        query = query.lte('amount', filters.max_amount);
      }

      const { data, error } = await query;

      if (error) throw error;

      setWithdrawals(data || []);
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching withdrawals', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les retraits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [
    filters?.store_id,
    filters?.status,
    filters?.payment_method,
    filters?.date_from,
    filters?.date_to,
    filters?.min_amount,
    filters?.max_amount,
  ]);

  const requestWithdrawal = async (
    storeId: string,
    formData: StoreWithdrawalRequestForm
  ): Promise<StoreWithdrawal | null> => {
    try {
      // Vérifier le solde disponible
      const { data: earnings, error: earningsError } = await supabase
        .from('store_earnings')
        .select('available_balance')
        .eq('store_id', storeId)
        .single();

      if (earningsError) {
        // Si les revenus n'existent pas, les créer
        await supabase.rpc('update_store_earnings', { p_store_id: storeId });

        const { data: newEarnings, error: newError } = await supabase
          .from('store_earnings')
          .select('available_balance')
          .eq('store_id', storeId)
          .single();

        if (newError) throw newError;

        // Calculer le solde disponible moins les retraits en attente
        const { data: pendingWithdrawals } = await supabase
          .from('store_withdrawals')
          .select('amount')
          .eq('store_id', storeId)
          .in('status', ['pending', 'processing']);

        const pendingAmount =
          pendingWithdrawals?.reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0;
        const availableAfterPending = (newEarnings.available_balance || 0) - pendingAmount;

        if (formData.amount > availableAfterPending) {
          throw new Error(
            `Solde insuffisant. Disponible après retraits en attente : ${availableAfterPending} XOF`
          );
        }
      } else {
        // Calculer le solde disponible moins les retraits en attente
        const { data: pendingWithdrawals } = await supabase
          .from('store_withdrawals')
          .select('amount')
          .eq('store_id', storeId)
          .in('status', ['pending', 'processing']);

        const pendingAmount =
          pendingWithdrawals?.reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0;
        const availableAfterPending = (earnings.available_balance || 0) - pendingAmount;

        if (formData.amount > availableAfterPending) {
          throw new Error(
            `Solde insuffisant. Disponible après retraits en attente : ${availableAfterPending} XOF`
          );
        }
      }

      // Vérifier le montant minimum (ex: 10000 XOF)
      const MIN_WITHDRAWAL = 10000;
      if (formData.amount < MIN_WITHDRAWAL) {
        throw new Error(`Le montant minimum de retrait est de ${MIN_WITHDRAWAL} XOF`);
      }

      // Créer la demande de retrait
      const { data, error } = await supabase
        .from('store_withdrawals')
        .insert({
          store_id: storeId,
          amount: formData.amount,
          currency: 'XOF',
          payment_method: formData.payment_method,
          payment_details: formData.payment_details,
          notes: formData.notes,
          status: 'pending',
        })
        .select(
          `
          *,
          store:stores(id, name, slug, user_id)
        `
        )
        .single();

      if (error) throw error;

      toast({
        title: 'Demande envoyée ! 📤',
        description: `Retrait de ${formData.amount} XOF en cours de traitement`,
      });

      await fetchWithdrawals();
      return data;
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error requesting withdrawal', { error });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de créer la demande de retrait',
        variant: 'destructive',
      });
      return null;
    }
  };

  const cancelWithdrawal = async (withdrawalId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('store_withdrawals')
        .update({ status: 'cancelled' })
        .eq('id', withdrawalId)
        .eq('status', 'pending'); // Seulement si en attente

      if (error) throw error;

      toast({
        title: 'Retrait annulé',
        description: 'La demande de retrait a été annulée',
      });

      await fetchWithdrawals();
      return true;
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error cancelling withdrawal', { error });
      toast({
        title: 'Erreur',
        description: "Impossible d'annuler le retrait",
        variant: 'destructive',
      });
      return false;
    }
  };

  const getWithdrawalStats = useCallback(async (): Promise<StoreWithdrawalStats | null> => {
    try {
      let query = supabase.from('store_withdrawals').select('amount, status');

      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats: StoreWithdrawalStats = {
        total_withdrawals: data?.length || 0,
        total_amount: data?.reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0,
        pending_count: data?.filter(w => w.status === 'pending').length || 0,
        pending_amount:
          data
            ?.filter(w => w.status === 'pending')
            .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0,
        completed_count: data?.filter(w => w.status === 'completed').length || 0,
        completed_amount:
          data
            ?.filter(w => w.status === 'completed')
            .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0,
        failed_count: data?.filter(w => w.status === 'failed').length || 0,
        failed_amount:
          data
            ?.filter(w => w.status === 'failed')
            .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0,
      };

      return stats;
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting withdrawal stats', { error });
      return null;
    }
  }, [filters]);

  useEffect(() => {
    fetchWithdrawals();
  }, [
    filters?.store_id,
    filters?.status,
    filters?.payment_method,
    filters?.date_from,
    filters?.date_to,
    filters?.min_amount,
    filters?.max_amount,
  ]);

  useVisibilityAwarePolling(fetchWithdrawals, 90_000, true);

  // Initialiser les statuts précédents après le fetch
  useEffect(() => {
    withdrawals.forEach(w => {
      previousStatusesRef.current.set(w.id, w.status);
    });
  }, [withdrawals]);

  return {
    withdrawals,
    loading,
    requestWithdrawal,
    cancelWithdrawal,
    getWithdrawalStats,
    refetch: fetchWithdrawals,
  };
};
