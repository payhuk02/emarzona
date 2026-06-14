/**
 * Epic 4.3 — Hooks SSO Enterprise boutique
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StoreSsoPublicConfig {
  enabled: boolean;
  store_name?: string;
  store_slug?: string;
  provider_type?: 'oidc' | 'saml';
  idp_display_name?: string;
  allowed_email_domains?: string[];
  enforce_sso?: boolean;
  reason?: string;
}

export interface StoreSsoProviderConfig {
  id?: string;
  store_id: string;
  provider_type: 'oidc' | 'saml';
  enabled: boolean;
  idp_display_name: string;
  allowed_email_domains: string[];
  default_role: 'manager' | 'staff' | 'support' | 'viewer';
  role_mappings: Record<string, string>;
  jit_provisioning: boolean;
  enforce_sso: boolean;
  oidc_issuer_url?: string;
  oidc_client_id?: string;
  oidc_client_secret?: string;
  oidc_scopes?: string;
  saml_idp_entity_id?: string;
  saml_sso_url?: string;
  saml_certificate?: string;
}

const PROVIDER_PUBLIC_FIELDS =
  'id, store_id, provider_type, enabled, idp_display_name, allowed_email_domains, default_role, role_mappings, jit_provisioning, enforce_sso, oidc_issuer_url, oidc_client_id, oidc_scopes, saml_idp_entity_id, saml_sso_url, updated_at';

export function useStoreSsoPublicConfig(storeSlug: string | undefined) {
  return useQuery({
    queryKey: ['store-sso-public', storeSlug],
    queryFn: async (): Promise<StoreSsoPublicConfig> => {
      if (!storeSlug) return { enabled: false };
      const { data, error } = await supabase.rpc('get_store_sso_public_config', {
        p_store_slug: storeSlug,
      });
      if (error) throw error;
      return (data as StoreSsoPublicConfig) ?? { enabled: false };
    },
    enabled: !!storeSlug,
  });
}

export function useStoreSsoProvider(storeId: string | undefined) {
  return useQuery({
    queryKey: ['store-sso-provider', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('store_sso_providers')
        .select(PROVIDER_PUBLIC_FIELDS)
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data as StoreSsoProviderConfig | null;
    },
    enabled: !!storeId,
  });
}

export function useUpsertStoreSsoConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      config,
    }: {
      storeId: string;
      config: Partial<StoreSsoProviderConfig>;
    }) => {
      const { data, error } = await supabase.functions.invoke('store-sso-auth', {
        body: { action: 'upsert', storeId, config },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data.provider;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['store-sso-provider', vars.storeId] });
      toast({ title: 'SSO Enterprise enregistré' });
    },
    onError: (e: Error) => {
      toast({ title: 'Erreur SSO', description: e.message, variant: 'destructive' });
    },
  });
}

export async function startStoreSsoLogin(storeSlug: string, returnUrl?: string) {
  const { data, error } = await supabase.functions.invoke<{ authUrl: string }>('store-sso-auth', {
    body: { action: 'authorize', storeSlug, returnUrl },
  });
  if (error) throw new Error(error.message);
  if (data && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }
  if (!data?.authUrl) throw new Error('URL SSO non retournée');
  window.location.href = data.authUrl;
}
