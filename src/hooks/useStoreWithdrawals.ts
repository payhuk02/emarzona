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

      // Hint FK explicitly: PostgREST sees store_id on many views (PGRST201 → 400).
      let query = supabase
        .from('store_withdrawals')
        .select(
          `
          *,
          store:stores!store_withdrawals_store_id_fkey(id, name, slug, user_id)
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
    } catch (error: unknown) {
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
      // Appeler la nouvelle fonction RPC sécurisée
      const { data, error } = await supabase.rpc('request_store_withdrawal', {
        p_store_id: storeId,
        p_amount: formData.amount,
        p_payment_method: formData.payment_method,
        p_payment_details: formData.payment_details,
        p_notes: formData.notes,
      });

      if (error) {
        // Gérer le retour d'erreur de la base de données (message métier)
        throw new Error(error.message);
      }

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
