/**
 * Physical Product Alerts Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les alertes produits physiques
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

// =====================================================
// TYPES
// =====================================================

export interface PhysicalProductAlert {
  id: string;
  store_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'reorder_needed' | 'high_return_rate' | 'slow_moving' | 'overstock' | 'expiring_soon' | 'price_competition';
  product_id?: string;
  variant_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  action_url?: string;
  action_label?: string;
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  dismissed_at?: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

export interface NotificationPreferences {
  id: string;
  store_id: string;
  user_id: string;
  email_low_stock: boolean;
  email_out_of_stock: boolean;
  email_new_order: boolean;
  email_order_shipped: boolean;
  email_order_delivered: boolean;
  email_return_request: boolean;
  email_refund_processed: boolean;
  push_low_stock: boolean;
  push_new_order: boolean;
  push_return_request: boolean;
  notification_frequency: 'realtime' | 'daily' | 'weekly';
  low_stock_threshold_override?: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useAlerts - Récupère les alertes d'un store
 */
export const useAlerts = (storeId?: string, filters?: {
  status?: PhysicalProductAlert['status'];
  alert_type?: PhysicalProductAlert['alert_type'];
  severity?: PhysicalProductAlert['severity'];
}) => {
  return useQuery({
    queryKey: ['alerts', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('physical_product_alerts')
        .select(`
          *,
          product:products (
            id,
            name,
            image_url
          )
        `)
        .eq('store_id', storeId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.alert_type) {
        query = query.eq('alert_type', filters.alert_type);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      query = query.order('triggered_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching alerts', { error, storeId });
        throw error;
      }

      return (data || []) as PhysicalProductAlert[];
    },
    enabled: !!storeId,
  });
};

/**
 * useActiveAlerts - Récupère uniquement les alertes actives
 */
export const useActiveAlerts = (storeId?: string) => {
  return useAlerts(storeId, { status: 'active' });
};

/**
 * useNotificationPreferences - Récupère les préférences de notifications
 */
export const useNotificationPreferences = (storeId?: string, userId?: string) => {
  return useQuery({
    queryKey: ['notification-preferences', storeId, userId],
    queryFn: async () => {
      if (!storeId || !userId) throw new Error('IDs manquants');

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .single();

      if (error) {
        // Si pas de préférences, retourner null
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Error fetching notification preferences', { error, storeId, userId });
        throw error;
      }

      return data as NotificationPreferences;
    },
    enabled: !!storeId && !!userId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useAcknowledgeAlert - Reconnaître une alerte
 */
export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('physical_product_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) {
        logger.error('Error acknowledging alert', { error, alertId });
        throw error;
      }

      return data as PhysicalProductAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: '✅ Alerte reconnue',
        description: 'L\'alerte a été marquée comme reconnue',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useAcknowledgeAlert', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de reconnaître l\'alerte',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useResolveAlert - Résoudre une alerte
 */
export const useResolveAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('physical_product_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) {
        logger.error('Error resolving alert', { error, alertId });
        throw error;
      }

      return data as PhysicalProductAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: '✅ Alerte résolue',
        description: 'L\'alerte a été marquée comme résolue',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useResolveAlert', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de résoudre l\'alerte',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useDismissAlert - Ignorer une alerte
 */
export const useDismissAlert = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('physical_product_alerts')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) {
        logger.error('Error dismissing alert', { error, alertId });
        throw error;
      }

      return data as PhysicalProductAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: '✅ Alerte ignorée',
        description: 'L\'alerte a été ignorée',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useDismissAlert', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ignorer l\'alerte',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateNotificationPreferences - Mettre à jour les préférences
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      userId,
      preferences,
    }: {
      storeId: string;
      userId: string;
      preferences: Partial<NotificationPreferences>;
    }) => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          store_id: storeId,
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error updating notification preferences', { error });
        throw error;
      }

      return data as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: '✅ Préférences mises à jour',
        description: 'Vos préférences de notifications ont été mises à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateNotificationPreferences', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour les préférences',
        variant: 'destructive',
      });
    },
  });
};

