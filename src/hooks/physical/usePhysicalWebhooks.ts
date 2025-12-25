/**
 * Physical Products Webhooks Hooks
 * Date: 2025-01-27
 * 
 * Hooks React Query pour gérer les webhooks de produits physiques
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  triggerWebhooks,
  PhysicalProductWebhook,
  PhysicalProductWebhookLog,
} from '@/services/webhooks/physicalProductWebhooks';

export const WEBHOOK_EVENTS = [
  'purchase',
  'shipment_created',
  'shipment_updated',
  'shipment_delivered',
  'return_requested',
  'return_approved',
  'return_rejected',
  'return_received',
  'return_refunded',
  'stock_low',
  'stock_out',
  'price_changed',
  'product_updated',
] as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[number];

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * Liste les webhooks d'un store
 */
export const useStoreWebhooks = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ['physicalWebhooks', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('physical_product_webhooks')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching webhooks', { error, storeId });
        throw error;
      }

      return (data || []) as PhysicalProductWebhook[];
    },
    enabled: !!storeId,
  });
};

/**
 * Récupère un webhook spécifique
 */
export const useWebhook = (webhookId: string | undefined) => {
  return useQuery({
    queryKey: ['physicalWebhook', webhookId],
    queryFn: async () => {
      if (!webhookId) throw new Error('Webhook ID manquant');

      const { data, error } = await supabase
        .from('physical_product_webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error) {
        logger.error('Error fetching webhook', { error, webhookId });
        throw error;
      }

      return data as PhysicalProductWebhook;
    },
    enabled: !!webhookId,
  });
};

/**
 * Liste les logs d'un webhook
 */
export const useWebhookLogs = (webhookId: string | undefined) => {
  return useQuery({
    queryKey: ['physicalWebhookLogs', webhookId],
    queryFn: async () => {
      if (!webhookId) throw new Error('Webhook ID manquant');

      const { data, error } = await supabase
        .from('physical_product_webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        logger.error('Error fetching webhook logs', { error, webhookId });
        throw error;
      }

      return (data || []) as PhysicalProductWebhookLog[];
    },
    enabled: !!webhookId,
  });
};

/**
 * Récupère les statistiques d'un webhook
 */
export const useWebhookStats = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ['physicalWebhookStats', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data: webhooks } = await supabase
        .from('physical_product_webhooks')
        .select('id')
        .eq('store_id', storeId);

      if (!webhooks || webhooks.length === 0) {
        return {
          total_webhooks: 0,
          active_webhooks: 0,
          total_triggered: 0,
          total_success: 0,
          total_failures: 0,
          success_rate: 0,
        };
      }

      const statsPromises = webhooks.map(async (webhook) => {
        const { data } = await supabase.rpc('get_physical_webhook_stats', {
          webhook_id_param: webhook.id,
        });
        return data?.[0] || null;
      });

      const stats = await Promise.all(statsPromises);
      const validStats = stats.filter((s) => s !== null);

      const total_triggered = validStats.reduce((sum, s) => sum + (s.total_triggered || 0), 0);
      const total_success = validStats.reduce(
        (sum, s) => sum + (s.total_triggered || 0) * ((s.success_rate || 0) / 100),
        0
      );
      const total_failures = total_triggered - total_success;
      const success_rate = total_triggered > 0 ? (total_success / total_triggered) * 100 : 0;

      const { data: activeCount } = await supabase
        .from('physical_product_webhooks')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('is_active', true);

      return {
        total_webhooks: webhooks.length,
        active_webhooks: activeCount || 0,
        total_triggered,
        total_success: Math.round(total_success),
        total_failures,
        success_rate: Math.round(success_rate * 100) / 100,
      };
    },
    enabled: !!storeId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * Créer un webhook
 */
export const useCreateWebhook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      store_id: string;
      event_type: WebhookEventType;
      target_url: string;
      is_active?: boolean;
    }) => {
      const { data: webhook, error } = await supabase
        .from('physical_product_webhooks')
        .insert({
          store_id: data.store_id,
          event_type: data.event_type,
          target_url: data.target_url,
          is_active: data.is_active !== false,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating webhook', { error, data });
        throw error;
      }

      return webhook as PhysicalProductWebhook;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['physicalWebhooks', data.store_id] });
      queryClient.invalidateQueries({ queryKey: ['physicalWebhookStats', data.store_id] });
      toast({
        title: 'Webhook créé',
        description: 'Le webhook a été créé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateWebhook', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le webhook',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Mettre à jour un webhook
 */
export const useUpdateWebhook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      event_type?: WebhookEventType;
      target_url?: string;
      is_active?: boolean;
    }) => {
      const { data: webhook, error } = await supabase
        .from('physical_product_webhooks')
        .update({
          event_type: data.event_type,
          target_url: data.target_url,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating webhook', { error, data });
        throw error;
      }

      return webhook as PhysicalProductWebhook;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['physicalWebhooks'] });
      queryClient.invalidateQueries({ queryKey: ['physicalWebhook', data.id] });
      queryClient.invalidateQueries({ queryKey: ['physicalWebhookStats', data.store_id] });
      toast({
        title: 'Webhook mis à jour',
        description: 'Le webhook a été modifié avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useUpdateWebhook', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le webhook',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Supprimer un webhook
 */
export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      // Récupérer le store_id avant la suppression
      const { data: webhook } = await supabase
        .from('physical_product_webhooks')
        .select('store_id')
        .eq('id', webhookId)
        .single();

      const { error } = await supabase.from('physical_product_webhooks').delete().eq('id', webhookId);

      if (error) {
        logger.error('Error deleting webhook', { error, webhookId });
        throw error;
      }

      return webhook?.store_id;
    },
    onSuccess: (storeId) => {
      if (storeId) {
        queryClient.invalidateQueries({ queryKey: ['physicalWebhooks', storeId] });
        queryClient.invalidateQueries({ queryKey: ['physicalWebhookStats', storeId] });
      }
      toast({
        title: 'Webhook supprimé',
        description: 'Le webhook a été supprimé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useDeleteWebhook', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le webhook',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Tester un webhook
 */
export const useTestWebhook = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ webhookId, storeId }: { webhookId: string; storeId: string }) => {
      const { data: webhook, error } = await supabase
        .from('physical_product_webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error || !webhook) {
        throw new Error('Webhook non trouvé');
      }

      const testPayload = {
        test_data: 'This is a test payload from Emarzona',
        timestamp: new Date().toISOString(),
        webhook_id: webhook.id,
        event_type: 'test_event',
      };

      // Utiliser le système unifié pour les tests
      const { triggerUnifiedWebhook } = await import('@/lib/webhooks/unified-webhook-service');
      await triggerUnifiedWebhook(storeId, webhook.event_type, testPayload, `test-${Date.now()}`);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Webhook de test envoyé',
        description: 'Vérifiez les logs pour le statut.',
      });
    },
    onError: (error: Error) => {
      logger.error('Error testing webhook', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer le webhook de test',
        variant: 'destructive',
      });
    },
  });
};

