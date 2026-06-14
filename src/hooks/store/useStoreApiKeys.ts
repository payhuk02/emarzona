/**
 * Epic 4.6 — Hooks clés API vendeur
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type StoreApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  description: string | null;
  permissions: Record<string, boolean>;
  is_active: boolean | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const API_KEY_LIST_FIELDS =
  'id, name, key_prefix, description, permissions, is_active, last_used_at, expires_at, created_at';

export function useStoreApiKeys(storeId: string | undefined) {
  return useQuery({
    queryKey: ['store-api-keys', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('api_keys')
        .select(API_KEY_LIST_FIELDS)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as StoreApiKeyRow[]) ?? [];
    },
    enabled: !!storeId,
  });
}

export function useCreateStoreApiKey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      name,
      description,
      permissions,
    }: {
      storeId: string;
      name: string;
      description?: string;
      permissions?: Record<string, boolean>;
    }) => {
      const { data, error } = await supabase.rpc('create_store_api_key', {
        p_store_id: storeId,
        p_name: name,
        p_description: description ?? null,
        p_permissions: permissions ?? {
          'products:read': true,
          'orders:read': true,
          'customers:read': true,
          'analytics:read': true,
        },
      });
      if (error) throw error;
      return data?.[0] as { id: string; key: string; key_prefix: string; name: string };
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['store-api-keys', vars.storeId] });
    },
    onError: (e: Error) => {
      const msg = e.message.includes('plan_required')
        ? 'Plan Professionnel ou Enterprise requis pour l’API REST.'
        : e.message;
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    },
  });
}

export function useRevokeStoreApiKey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, storeId }: { id: string; storeId: string }) => {
      const { error } = await supabase.from('api_keys').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      await supabase.rpc('log_store_audit_event', {
        p_store_id: storeId,
        p_action: 'api_key.revoke',
        p_target_type: 'api_key',
        p_target_id: id,
        p_source: 'api',
      });
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['store-api-keys', vars.storeId] });
      toast({ title: 'Clé révoquée' });
    },
  });
}

export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return base ? `${base}/functions/v1/api/v1` : '';
}
