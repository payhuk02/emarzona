/**
 * Hook: useWithdrawalHistory
 * Description: Gestion de l'historique des changements de statut des retraits
 * Date: 2025-02-03
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StoreWithdrawalStatusHistory } from '@/types/store-withdrawals';
import { logger } from '@/lib/logger';

interface UseWithdrawalHistoryOptions {
  withdrawalId?: string;
  storeId?: string;
}

export const useWithdrawalHistory = (options: UseWithdrawalHistoryOptions = {}) => {
  const { withdrawalId, storeId } = options;
  const [history, setHistory] = useState<StoreWithdrawalStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    if (!withdrawalId && !storeId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let query = supabase
        .from('store_withdrawal_status_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (withdrawalId) {
        query = query.eq('withdrawal_id', withdrawalId);
      } else if (storeId) {
        // Récupérer les IDs des retraits du store
        const { data: withdrawalIds, error: withdrawalIdsError } = await supabase
          .from('store_withdrawals')
          .select('id')
          .eq('store_id', storeId);

        if (withdrawalIdsError) throw withdrawalIdsError;

        if (withdrawalIds && withdrawalIds.length > 0) {
          query = query.in(
            'withdrawal_id',
            withdrawalIds.map((w) => w.id)
          );
        } else {
          setHistory([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setHistory(data || []);
    } catch (error: any) {
      logger.error('Error fetching withdrawal history', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'historique',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [withdrawalId, storeId, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    refetch: fetchHistory,
  };
};

