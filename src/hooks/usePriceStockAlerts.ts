import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export interface PriceAlert {
  id: string;
  user_id: string;
  product_id: string;
  target_price: number;
  current_price: number;
  currency: string;
  notified: boolean;
  notification_sent_at: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    price: number;
    promotional_price: number | null;
    currency: string;
    stores?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface StockAlert {
  id: string;
  user_id: string;
  product_id: string;
  notified: boolean;
  notification_sent_at: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    price: number;
    promotional_price: number | null;
    currency: string;
    stock_quantity: number | null;
    stores?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

/**
 * Hook pour récupérer les alertes de prix de l'utilisateur
 */
export function usePriceAlerts(userId: string | null) {
  return useQuery<PriceAlert[]>({
    queryKey: ['price-alerts', userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from('price_alerts')
          .select(`
            *,
            products!inner (
              id,
              name,
              slug,
              image_url,
              price,
              promotional_price,
              currency,
              stores!inner (
                id,
                name,
                slug
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('Error fetching price alerts:', error);
          throw error;
        }

        return (data || []) as PriceAlert[];
      } catch (error) {
        logger.error('Error in usePriceAlerts:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer les alertes de stock de l'utilisateur
 */
export function useStockAlerts(userId: string | null) {
  return useQuery<StockAlert[]>({
    queryKey: ['stock-alerts', userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from('stock_alerts')
          .select(`
            *,
            products!inner (
              id,
              name,
              slug,
              image_url,
              price,
              promotional_price,
              currency,
              stock_quantity,
              stores!inner (
                id,
                name,
                slug
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('Error fetching stock alerts:', error);
          throw error;
        }

        return (data || []) as StockAlert[];
      } catch (error) {
        logger.error('Error in useStockAlerts:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour créer une alerte de prix
 */
export function useCreatePriceAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      productId,
      targetPrice,
    }: {
      userId: string;
      productId: string;
      targetPrice: number;
    }) => {
      const { data, error } = await supabase.rpc('create_price_alert', {
        p_user_id: userId,
        p_product_id: productId,
        p_target_price: targetPrice,
      });

      if (error) {
        logger.error('Error creating price alert:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts', variables.userId] });
      toast({
        title: 'Alerte créée',
        description: 'Vous serez notifié lorsque le prix atteint votre objectif',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'alerte de prix',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook pour créer une alerte de stock
 */
export function useCreateStockAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      productId,
    }: {
      userId: string;
      productId: string;
    }) => {
      const { data, error } = await supabase.rpc('create_stock_alert', {
        p_user_id: userId,
        p_product_id: productId,
      });

      if (error) {
        logger.error('Error creating stock alert:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts', variables.userId] });
      toast({
        title: 'Alerte créée',
        description: 'Vous serez notifié lorsque le produit sera de nouveau en stock',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'alerte de stock',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook pour supprimer une alerte de prix
 */
export function useDeletePriceAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      alertId,
      userId,
    }: {
      alertId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting price alert:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts', variables.userId] });
      toast({
        title: 'Alerte supprimée',
        description: 'L\'alerte de prix a été supprimée',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'alerte',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook pour supprimer une alerte de stock
 */
export function useDeleteStockAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      alertId,
      userId,
    }: {
      alertId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('stock_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting stock alert:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts', variables.userId] });
      toast({
        title: 'Alerte supprimée',
        description: 'L\'alerte de stock a été supprimée',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'alerte',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook pour vérifier si un produit a une alerte de prix
 */
export function useHasPriceAlert(userId: string | null, productId: string | null) {
  return useQuery<boolean>({
    queryKey: ['has-price-alert', userId, productId],
    queryFn: async () => {
      if (!userId || !productId) return false;

      try {
        const { data, error } = await supabase
          .from('price_alerts')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          logger.error('Error checking price alert:', error);
          return false;
        }

        return !!data;
      } catch (error) {
        logger.error('Error in useHasPriceAlert:', error);
        return false;
      }
    },
    enabled: !!userId && !!productId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour vérifier si un produit a une alerte de stock
 */
export function useHasStockAlert(userId: string | null, productId: string | null) {
  return useQuery<boolean>({
    queryKey: ['has-stock-alert', userId, productId],
    queryFn: async () => {
      if (!userId || !productId) return false;

      try {
        const { data, error } = await supabase
          .from('stock_alerts')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          logger.error('Error checking stock alert:', error);
          return false;
        }

        return !!data;
      } catch (error) {
        logger.error('Error in useHasStockAlert:', error);
        return false;
      }
    },
    enabled: !!userId && !!productId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}







