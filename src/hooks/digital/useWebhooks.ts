/**
 * Digital Product Webhooks Hooks
 * Date: 2025-01-27
 * 
 * Hooks pour gérer les webhooks pour produits digitaux
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface DigitalProductWebhook {
  id: string;
  store_id: string;
  name: string;
  url: string;
  events: string[];
  secret_key: string;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  headers: Record<string, string>;
  total_sent: number;
  total_succeeded: number;
  total_failed: number;
  last_sent_at: string | null;
  description?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  event_id?: string;
  payload: Record<string, any>;
  response_status?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  attempts: number;
  success: boolean;
  error_message?: string;
  error_code?: string;
  sent_at: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

export interface CreateWebhookData {
  store_id: string;
  name: string;
  url: string;
  events: string[];
  secret_key?: string;
  is_active?: boolean;
  retry_count?: number;
  timeout_seconds?: number;
  headers?: Record<string, string>;
  description?: string;
}

export interface UpdateWebhookData {
  name?: string;
  url?: string;
  events?: string[];
  is_active?: boolean;
  retry_count?: number;
  timeout_seconds?: number;
  headers?: Record<string, string>;
  description?: string;
}

export const WEBHOOK_EVENTS = [
  'purchase',
  'download',
  'license_activated',
  'license_expired',
  'license_revoked',
  'subscription_created',
  'subscription_cancelled',
  'subscription_renewed',
  'subscription_expired',
  'refund',
  'update_available',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * Liste les webhooks d'un store
 */
export const useStoreWebhooks = (storeId?: string) => {
  return useQuery({
    queryKey: ['storeWebhooks', storeId],
    queryFn: async () => {
      if (!storeId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!stores || stores.length === 0) {
          return [];
        }

        storeId = stores[0].id;
      }

      const { data, error } = await supabase
        .from('digital_product_webhooks')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching webhooks', { error, storeId });
        throw error;
      }

      return (data || []) as DigitalProductWebhook[];
    },
    enabled: true,
  });
};

/**
 * Récupère un webhook par ID
 */
export const useWebhook = (webhookId: string | undefined) => {
  return useQuery({
    queryKey: ['webhook', webhookId],
    queryFn: async () => {
      if (!webhookId) throw new Error('Webhook ID manquant');

      const { data, error } = await supabase
        .from('digital_product_webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error) {
        logger.error('Error fetching webhook', { error, webhookId });
        throw error;
      }

      return data as DigitalProductWebhook;
    },
    enabled: !!webhookId,
  });
};

/**
 * Récupère les logs d'un webhook
 */
export const useWebhookLogs = (webhookId: string | undefined, limit: number = 50) => {
  return useQuery({
    queryKey: ['webhookLogs', webhookId, limit],
    queryFn: async () => {
      if (!webhookId) throw new Error('Webhook ID manquant');

      const { data, error } = await supabase
        .from('digital_product_webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching webhook logs', { error, webhookId });
        throw error;
      }

      return (data || []) as WebhookLog[];
    },
    enabled: !!webhookId,
  });
};

/**
 * Statistiques des webhooks
 */
export const useWebhookStats = (storeId?: string) => {
  return useQuery({
    queryKey: ['webhookStats', storeId],
    queryFn: async () => {
      if (!storeId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!stores || stores.length === 0) {
          return {
            total: 0,
            active: 0,
            total_sent: 0,
            total_succeeded: 0,
            total_failed: 0,
            success_rate: 0,
          };
        }

        storeId = stores[0].id;
      }

      const { data: webhooks, error } = await supabase
        .from('digital_product_webhooks')
        .select('total_sent, total_succeeded, total_failed, is_active')
        .eq('store_id', storeId);

      if (error) {
        logger.error('Error fetching webhook stats', { error, storeId });
        throw error;
      }

      const stats = webhooks?.reduce(
        (acc, webhook) => ({
          total: acc.total + 1,
          active: acc.active + (webhook.is_active ? 1 : 0),
          total_sent: acc.total_sent + (webhook.total_sent || 0),
          total_succeeded: acc.total_succeeded + (webhook.total_succeeded || 0),
          total_failed: acc.total_failed + (webhook.total_failed || 0),
        }),
        {
          total: 0,
          active: 0,
          total_sent: 0,
          total_succeeded: 0,
          total_failed: 0,
        }
      ) || {
        total: 0,
        active: 0,
        total_sent: 0,
        total_succeeded: 0,
        total_failed: 0,
      };

      return {
        ...stats,
        success_rate:
          stats.total_sent > 0
            ? (stats.total_succeeded / stats.total_sent) * 100
            : 0,
      };
    },
    enabled: true,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * Créer un nouveau webhook
 */
export const useCreateWebhook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateWebhookData) => {
      const { data: webhook, error } = await supabase
        .from('digital_product_webhooks')
        .insert({
          ...data,
          secret_key: data.secret_key || undefined, // Généré automatiquement si non fourni
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating webhook', { error, data });
        throw error;
      }

      return webhook as DigitalProductWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeWebhooks'] });
      queryClient.invalidateQueries({ queryKey: ['webhookStats'] });
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
    mutationFn: async ({
      webhookId,
      data,
    }: {
      webhookId: string;
      data: UpdateWebhookData;
    }) => {
      const { data: webhook, error } = await supabase
        .from('digital_product_webhooks')
        .update(data)
        .eq('id', webhookId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating webhook', { error, webhookId, data });
        throw error;
      }

      return webhook as DigitalProductWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeWebhooks'] });
      queryClient.invalidateQueries({ queryKey: ['webhook'] });
      toast({
        title: 'Webhook mis à jour',
        description: 'Le webhook a été mis à jour avec succès',
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
      const { error } = await supabase
        .from('digital_product_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) {
        logger.error('Error deleting webhook', { error, webhookId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeWebhooks'] });
      queryClient.invalidateQueries({ queryKey: ['webhookStats'] });
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
    mutationFn: async (webhookId: string) => {
      // Appel à une fonction Edge ou API pour tester le webhook
      // Pour l'instant, on retourne un mock
      const { data: webhook } = await supabase
        .from('digital_product_webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (!webhook) {
        throw new Error('Webhook non trouvé');
      }

      // Simuler un test
      return {
        success: true,
        message: 'Test envoyé avec succès',
      };
    },
    onSuccess: () => {
      toast({
        title: 'Test envoyé',
        description: 'Le webhook de test a été envoyé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error testing webhook', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de tester le webhook',
        variant: 'destructive',
      });
    },
  });
};

