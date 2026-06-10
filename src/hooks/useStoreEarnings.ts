/**
 * Hook: useStoreEarnings
 * Description: Gestion des revenus et du solde disponible des stores
 * Date: 2025-01-31
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVisibilityAwarePolling } from '@/hooks/useVisibilityAwarePolling';
import { StoreEarnings } from '@/types/store-withdrawals';
import { logger } from '@/lib/logger';

const STORE_EARNINGS_FIELDS =
  'id, store_id, total_revenue, total_withdrawn, available_balance, platform_commission_rate, total_platform_commission, last_calculated_at, created_at, updated_at';

export const useStoreEarnings = (storeId: string | undefined) => {
  const [earnings, setEarnings] = useState<StoreEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const fetchEarnings = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Récupérer ou créer les revenus du store
      const { data: existingEarnings, error: fetchError } = await supabase
        .from('store_earnings')
        .select(STORE_EARNINGS_FIELDS)
        .eq('store_id', storeId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Si les revenus n'existent pas, les calculer et créer
      if (!existingEarnings) {
        // Appeler la fonction pour mettre à jour les revenus
        const { error: updateError } = await supabase.rpc('update_store_earnings', {
          p_store_id: storeId,
        });

        if (updateError) {
          logger.error('Error updating store earnings', { error: updateError });
          throw updateError;
        }

        // Récupérer les revenus créés
        const { data: newEarnings, error: newError } = await supabase
          .from('store_earnings')
          .select(STORE_EARNINGS_FIELDS)
          .eq('store_id', storeId)
          .single();

        if (newError) throw newError;
        setEarnings(newEarnings);
      } else {
        // Recalculer pour s'assurer que les données sont à jour
        const { error: updateError } = await supabase.rpc('update_store_earnings', {
          p_store_id: storeId,
        });

        if (updateError) {
          logger.warn('Error recalculating store earnings', { error: updateError });
          // Continuer avec les données existantes
        } else {
          // Récupérer les revenus mis à jour
          const { data: updatedEarnings, error: updatedError } = await supabase
            .from('store_earnings')
            .select(STORE_EARNINGS_FIELDS)
            .eq('store_id', storeId)
            .single();

          if (updatedError) {
            logger.warn('Error fetching updated earnings', { error: updatedError });
            setEarnings(existingEarnings);
          } else {
            setEarnings(updatedEarnings);
          }
        }
      }
    } catch (_error: unknown) {
      const err = _error as { code?: string; message?: string };
      logger.error('Error fetching store earnings', { error: _error });

      const isMissingTable = err?.code === '42P01' || err?.message?.includes('does not exist');
      const isMissingFunction =
        err?.code === '42883' ||
        (err?.message?.includes('function') && err?.message?.includes('does not exist'));

      if (isMissingTable || isMissingFunction) {
        toast({
          title: 'Migration requise',
          description:
            "La migration SQL pour les retraits n'a pas été exécutée. Veuillez exécuter la migration 20250131_store_withdrawals_system.sql dans Supabase.",
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description:
            (_error instanceof Error ? _error.message : err?.message) ||
            'Impossible de charger les revenus du store',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  const refreshEarnings = useCallback(async () => {
    if (!storeId) return;

    try {
      // Forcer le recalcul
      const { error } = await supabase.rpc('update_store_earnings', {
        p_store_id: storeId,
      });

      if (error) throw error;

      // Récupérer les revenus mis à jour
      await fetchEarnings();
    } catch (_error: unknown) {
      logger.error('Error refreshing store earnings', { error: _error });
      toast({
        title: 'Erreur',
        description: 'Impossible de rafraîchir les revenus',
        variant: 'destructive',
      });
    }
  }, [storeId, fetchEarnings, toast]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  useVisibilityAwarePolling(fetchEarnings, 120_000, !!storeId);

  return {
    earnings,
    loading,
    refreshEarnings,
    refetch: fetchEarnings,
  };
};
