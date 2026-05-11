/**
 * Hook: useStoreEarnings
 * Description: Gestion des revenus et du solde disponible des stores
 * Date: 2025-01-31
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StoreEarnings } from '@/types/store-withdrawals';
import { logger } from '@/lib/logger';

const STORE_EARNINGS_FIELDS = 'id, store_id, available_balance, pending_balance, total_earned, total_withdrawn, total_refunded, last_calculated_at, created_at, updated_at';

export const useStoreEarnings = (storeId: string | undefined) => {
  const [earnings, setEarnings] = useState<StoreEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

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
    } catch ( _error: any) {
      logger.error('Error fetching store earnings', { error });
      
      // Vérifier si c'est une erreur de table/fonction manquante
      const isMissingTable = error?.code === '42P01' || error?.message?.includes('does not exist');
      const isMissingFunction = error?.code === '42883' || error?.message?.includes('function') && error?.message?.includes('does not exist');
      
      if (isMissingTable || isMissingFunction) {
        toast({
          title: 'Migration requise',
          description: 'La migration SQL pour les retraits n\'a pas été exécutée. Veuillez exécuter la migration 20250131_store_withdrawals_system.sql dans Supabase.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: error?.message || 'Impossible de charger les revenus du store',
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
    } catch ( _error: any) {
      logger.error('Error refreshing store earnings', { error });
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

  // Synchronisation en temps réel avec Supabase Realtime
  useEffect(() => {
    if (!storeId) return;

    // Nettoyer le channel précédent
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Créer un nouveau channel pour écouter les changements sur store_earnings
    channelRef.current = supabase
      .channel(`store-earnings-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_earnings',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          logger.info('🔔 Store earnings updated in real-time', { eventType: payload.eventType });
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Mettre à jour les revenus avec les nouvelles données
            setEarnings(payload.new as StoreEarnings);
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [storeId]);

  return {
    earnings,
    loading,
    refreshEarnings,
    refetch: fetchEarnings,
  };
};







