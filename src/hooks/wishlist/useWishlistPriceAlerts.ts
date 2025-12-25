/**
 * Hook pour gérer les alertes prix de la wishlist
 * Date: 27 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

/**
 * Hook pour récupérer les alertes prix disponibles
 */
export const usePriceDrops = () => {
  return useQuery({
    queryKey: ['wishlist-price-drops'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_price_drops');

      if (error) {
        logger.error('Error checking price drops', { error });
        throw error;
      }

      return data || [];
    },
    refetchInterval: 300000, // Vérifier toutes les 5 minutes
  });
};

/**
 * Hook pour mettre à jour les paramètres d'alerte prix
 */
export const useUpdatePriceAlertSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      productId,
      enabled,
      threshold,
    }: {
      productId: string;
      enabled?: boolean;
      threshold?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updates: any = {};
      if (enabled !== undefined) updates.price_drop_alert_enabled = enabled;
      if (threshold !== undefined) updates.price_drop_threshold = threshold;

      const { error } = await supabase
        .from('user_favorites')
        .update(updates)
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      toast({
        title: 'Paramètres mis à jour',
        description: 'Vos paramètres d\'alerte prix ont été enregistrés',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating price alert settings', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour les paramètres',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour marquer une alerte comme lue
 */
export const useMarkPriceAlertAsRead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_favorites')
        .update({
          price_drop_notified: true,
          last_price_check: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-price-drops'] });
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    },
    onError: (error: any) => {
      logger.error('Error marking price alert as read', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de marquer l\'alerte comme lue',
        variant: 'destructive',
      });
    },
  });
};

