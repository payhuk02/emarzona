/**
 * Physical Products Notifications Hooks
 * Date: 2025-01-27
 * 
 * Hooks React Query pour gérer les notifications de produits physiques
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  sendPriceDropNotification,
  sendStockAlertNotification,
  sendPromotionAlertNotification,
  sendShipmentNotification,
  sendReturnNotification,
} from '@/utils/physicalNotifications';

// =====================================================
// TYPES
// =====================================================

export interface PriceAlert {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  original_price: number;
  target_price?: number;
  price_drop_threshold?: number;
  current_price: number;
  is_active: boolean;
  alert_sent: boolean;
  alert_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StockAlert {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  min_quantity_required: number;
  notify_on_back_in_stock: boolean;
  notify_on_low_stock: boolean;
  is_active: boolean;
  alert_sent: boolean;
  alert_sent_at?: string;
  stock_status: 'out_of_stock' | 'low_stock' | 'in_stock';
  created_at: string;
  updated_at: string;
}

export interface PromotionAlert {
  id: string;
  user_id: string;
  product_id: string;
  category_id?: string;
  min_discount_percentage?: number;
  notify_on_promotion_start: boolean;
  notify_on_promotion_end: boolean;
  is_active: boolean;
  last_alert_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_price_alerts: boolean;
  email_stock_alerts: boolean;
  email_promotion_alerts: boolean;
  email_shipment_updates: boolean;
  email_return_updates: boolean;
  email_order_updates: boolean;
  email_marketing: boolean;
  sms_price_alerts: boolean;
  sms_stock_alerts: boolean;
  sms_shipment_updates: boolean;
  sms_return_updates: boolean;
  sms_order_updates: boolean;
  push_price_alerts: boolean;
  push_stock_alerts: boolean;
  push_promotion_alerts: boolean;
  push_shipment_updates: boolean;
  push_return_updates: boolean;
  notification_frequency: 'immediate' | 'daily' | 'weekly';
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * Liste les alertes de prix de l'utilisateur
 */
export const usePriceAlerts = () => {
  return useQuery({
    queryKey: ['physicalPriceAlerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('physical_product_price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching price alerts', { error });
        throw error;
      }

      return (data || []) as PriceAlert[];
    },
  });
};

/**
 * Liste les alertes de stock de l'utilisateur
 */
export const useStockAlerts = () => {
  return useQuery({
    queryKey: ['physicalStockAlerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('physical_product_stock_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching stock alerts', { error });
        throw error;
      }

      return (data || []) as StockAlert[];
    },
  });
};

/**
 * Liste les alertes de promotion de l'utilisateur
 */
export const usePromotionAlerts = () => {
  return useQuery({
    queryKey: ['physicalPromotionAlerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('physical_product_promotion_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching promotion alerts', { error });
        throw error;
      }

      return (data || []) as PromotionAlert[];
    },
  });
};

/**
 * Récupère les préférences de notifications de l'utilisateur
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['physicalNotificationPreferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de préférences, retourner les valeurs par défaut
          return null;
        }
        logger.error('Error fetching notification preferences', { error });
        throw error;
      }

      return data as NotificationPreferences | null;
    },
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * Créer une alerte de prix
 */
export const useCreatePriceAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      product_id: string;
      variant_id?: string;
      target_price?: number;
      price_drop_threshold?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer le prix actuel du produit
      const { data: product } = await supabase
        .from('products')
        .select('price')
        .eq('id', data.product_id)
        .single();

      if (!product) throw new Error('Produit non trouvé');

      let variantPrice = product.price;
      if (data.variant_id) {
        const { data: variant } = await supabase
          .from('physical_product_variants')
          .select('price')
          .eq('id', data.variant_id)
          .single();

        if (variant?.price) {
          variantPrice = variant.price;
        }
      }

      const { data: alert, error } = await supabase
        .from('physical_product_price_alerts')
        .insert({
          user_id: user.id,
          product_id: data.product_id,
          variant_id: data.variant_id || null,
          original_price: variantPrice,
          target_price: data.target_price || null,
          price_drop_threshold: data.price_drop_threshold || null,
          current_price: variantPrice,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating price alert', { error, data });
        throw error;
      }

      return alert as PriceAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalPriceAlerts'] });
      toast({
        title: 'Alerte créée',
        description: 'Vous serez notifié lorsque le prix baissera',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreatePriceAlert', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'alerte',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Créer une alerte de stock
 */
export const useCreateStockAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      product_id: string;
      variant_id?: string;
      min_quantity_required?: number;
      notify_on_back_in_stock?: boolean;
      notify_on_low_stock?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: alert, error } = await supabase
        .from('physical_product_stock_alerts')
        .insert({
          user_id: user.id,
          product_id: data.product_id,
          variant_id: data.variant_id || null,
          min_quantity_required: data.min_quantity_required || 1,
          notify_on_back_in_stock: data.notify_on_back_in_stock !== false,
          notify_on_low_stock: data.notify_on_low_stock || false,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating stock alert', { error, data });
        throw error;
      }

      return alert as StockAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalStockAlerts'] });
      toast({
        title: 'Alerte créée',
        description: 'Vous serez notifié lorsque le produit sera de nouveau en stock',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateStockAlert', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'alerte',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Mettre à jour les préférences de notifications
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier si les préférences existent
      const { data: existing } = await supabase
        .from('user_notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;
      if (existing) {
        // Mise à jour
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .update(preferences)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Création
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: user.id,
            ...preferences,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalNotificationPreferences'] });
      toast({
        title: 'Préférences mises à jour',
        description: 'Vos préférences de notifications ont été sauvegardées',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useUpdateNotificationPreferences', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour les préférences',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Désactiver une alerte de prix
 */
export const useTogglePriceAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ alertId, isActive }: { alertId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('physical_product_price_alerts')
        .update({ is_active: isActive })
        .eq('id', alertId);

      if (error) {
        logger.error('Error toggling price alert', { error, alertId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalPriceAlerts'] });
      toast({
        title: 'Alerte mise à jour',
        description: 'Le statut de l\'alerte a été modifié',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useTogglePriceAlert', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier l\'alerte',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Désactiver une alerte de stock
 */
export const useToggleStockAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ alertId, isActive }: { alertId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('physical_product_stock_alerts')
        .update({ is_active: isActive })
        .eq('id', alertId);

      if (error) {
        logger.error('Error toggling stock alert', { error, alertId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalStockAlerts'] });
      toast({
        title: 'Alerte mise à jour',
        description: 'Le statut de l\'alerte a été modifié',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useToggleStockAlert', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier l\'alerte',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Supprimer une alerte de prix
 */
export const useDeletePriceAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('physical_product_price_alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        logger.error('Error deleting price alert', { error, alertId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalPriceAlerts'] });
      toast({
        title: 'Alerte supprimée',
        description: 'L\'alerte de prix a été supprimée',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useDeletePriceAlert', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'alerte',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Supprimer une alerte de stock
 */
export const useDeleteStockAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('physical_product_stock_alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        logger.error('Error deleting stock alert', { error, alertId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalStockAlerts'] });
      toast({
        title: 'Alerte supprimée',
        description: 'L\'alerte de stock a été supprimée',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useDeleteStockAlert', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'alerte',
        variant: 'destructive',
      });
    },
  });
};

