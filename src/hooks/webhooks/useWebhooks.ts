// ============================================================================
// HOOKS: Webhooks Management
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type {
  Webhook,
  WebhookDelivery,
  CreateWebhookForm,
  UpdateWebhookForm,
  WebhookFilters,
  WebhookDeliveryFilters,
} from '@/types/webhooks';

// ============================================================================
// useWebhooks: Liste tous les webhooks d'un store
// ============================================================================

export const useWebhooks = (storeId: string | undefined, filters?: WebhookFilters) => {
  return useQuery({
    queryKey: ['webhooks', storeId, filters],
    queryFn: async () => {
      if (!storeId) return [];

      let query = supabase
        .from('webhooks')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.event_type) {
        query = query.contains('events', [filters.event_type]);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,url.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Webhook[];
    },
    enabled: !!storeId,
  });
};

// ============================================================================
// useWebhook: Détails d'un webhook
// ============================================================================

export const useWebhook = (webhookId: string | undefined) => {
  return useQuery({
    queryKey: ['webhook', webhookId],
    queryFn: async () => {
      if (!webhookId) return null;

      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error) throw error;
      return data as Webhook;
    },
    enabled: !!webhookId,
  });
};

// ============================================================================
// useCreateWebhook: Créer un nouveau webhook
// ============================================================================

export const useCreateWebhook = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: CreateWebhookForm & { store_id: string }) => {
      // Générer un secret si non fourni
      let secret = form.secret;
      if (!secret) {
        const { data: secretData, error: secretError } = await supabase.rpc('generate_webhook_secret');
        if (secretError) throw secretError;
        secret = secretData;
      }

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          store_id: form.store_id,
          name: form.name,
          description: form.description || null,
          url: form.url,
          secret: secret || null,
          events: form.events,
          status: form.status || 'active',
          retry_count: form.retry_count ?? 3,
          timeout_seconds: form.timeout_seconds ?? 30,
          rate_limit_per_minute: form.rate_limit_per_minute ?? 60,
          custom_headers: form.custom_headers || {},
          verify_ssl: form.verify_ssl ?? true,
          include_payload: form.include_payload ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Webhook;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', data.store_id] });
      toast({
        title: 'Webhook créé',
        description: `Le webhook "${data.name}" a été créé avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création du webhook',
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// useUpdateWebhook: Mettre à jour un webhook
// ============================================================================

export const useUpdateWebhook = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: UpdateWebhookForm) => {
      const updates: any = {};

      if (form.name !== undefined) updates.name = form.name;
      if (form.description !== undefined) updates.description = form.description;
      if (form.url !== undefined) updates.url = form.url;
      if (form.secret !== undefined) updates.secret = form.secret;
      if (form.events !== undefined) updates.events = form.events;
      if (form.status !== undefined) updates.status = form.status;
      if (form.retry_count !== undefined) updates.retry_count = form.retry_count;
      if (form.timeout_seconds !== undefined) updates.timeout_seconds = form.timeout_seconds;
      if (form.rate_limit_per_minute !== undefined) updates.rate_limit_per_minute = form.rate_limit_per_minute;
      if (form.custom_headers !== undefined) updates.custom_headers = form.custom_headers;
      if (form.verify_ssl !== undefined) updates.verify_ssl = form.verify_ssl;
      if (form.include_payload !== undefined) updates.include_payload = form.include_payload;

      const { data, error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', form.id)
        .select()
        .single();

      if (error) throw error;
      return data as Webhook;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhook', data.id] });
      queryClient.invalidateQueries({ queryKey: ['webhooks', data.store_id] });
      toast({
        title: 'Webhook mis à jour',
        description: 'Le webhook a été mis à jour avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour du webhook',
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// useDeleteWebhook: Supprimer un webhook
// ============================================================================

export const useDeleteWebhook = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      // Récupérer le store_id avant suppression
      const { data: webhook } = await supabase
        .from('webhooks')
        .select('store_id')
        .eq('id', webhookId)
        .single();

      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;
      return { webhookId, storeId: webhook?.store_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', data.storeId] });
      toast({
        title: 'Webhook supprimé',
        description: 'Le webhook a été supprimé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression du webhook',
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// useTestWebhook: Tester un webhook
// ============================================================================

export const useTestWebhook = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { data: deliveryId, error } = await supabase.rpc('test_webhook', {
        p_webhook_id: webhookId,
      });

      if (error) throw error;
      return deliveryId as string;
    },
    onSuccess: (deliveryId) => {
      queryClient.invalidateQueries({ queryKey: ['webhook-deliveries'] });
      toast({
        title: 'Test envoyé',
        description: 'Le webhook de test a été envoyé. Vérifiez l\'historique des livraisons.',
      });
      // Poll pour voir le résultat
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['webhook-delivery', deliveryId] });
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'envoi du test',
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// useWebhookDeliveries: Historique des livraisons
// ============================================================================

export const useWebhookDeliveries = (
  webhookId: string | undefined,
  filters?: WebhookDeliveryFilters
) => {
  return useQuery({
    queryKey: ['webhook-deliveries', webhookId, filters],
    queryFn: async () => {
      if (!webhookId) return [];

      let query = supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('triggered_at', { ascending: false })
        .limit(100);

      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date_from) {
        query = query.gte('triggered_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('triggered_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as WebhookDelivery[];
    },
    enabled: !!webhookId,
  });
};

// ============================================================================
// useWebhookDelivery: Détails d'une livraison
// ============================================================================

export const useWebhookDelivery = (deliveryId: string | undefined) => {
  return useQuery({
    queryKey: ['webhook-delivery', deliveryId],
    queryFn: async () => {
      if (!deliveryId) return null;

      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (error) throw error;
      return data as WebhookDelivery;
    },
    enabled: !!deliveryId,
  });
};

// ============================================================================
// useWebhookStats: Statistiques des webhooks
// ============================================================================

export const useWebhookStats = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ['webhook-stats', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      const { data: webhooks, error } = await supabase
        .from('webhooks')
        .select('total_deliveries, successful_deliveries, failed_deliveries, status')
        .eq('store_id', storeId);

      if (error) throw error;

      const stats = {
        total_webhooks: webhooks?.length || 0,
        active_webhooks: webhooks?.filter((w) => w.status === 'active').length || 0,
        inactive_webhooks: webhooks?.filter((w) => w.status !== 'active').length || 0,
        total_deliveries: webhooks?.reduce((sum, w) => sum + (w.total_deliveries || 0), 0) || 0,
        successful_deliveries: webhooks?.reduce((sum, w) => sum + (w.successful_deliveries || 0), 0) || 0,
        failed_deliveries: webhooks?.reduce((sum, w) => sum + (w.failed_deliveries || 0), 0) || 0,
      };

      const success_rate =
        stats.total_deliveries > 0
          ? (stats.successful_deliveries / stats.total_deliveries) * 100
          : 0;

      return {
        ...stats,
        success_rate: Math.round(success_rate * 100) / 100,
        average_response_time_ms: 0, // À calculer depuis deliveries si nécessaire
      };
    },
    enabled: !!storeId,
  });
};

