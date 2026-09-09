/**
 * Admin config — agrégateurs & opérateurs (platform_settings.payment_rails)
 */
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { logAdminAction } from '@/lib/audit';
import {
  PAYMENT_RAILS_SETTINGS_KEY,
  mergePaymentRailsConfig,
  type PaymentRailAggregatorId,
  type PaymentRailsConfig,
} from '@/lib/payments/payment-rails-catalog';
import type { Json } from '@/integrations/supabase/types';

const QUERY_KEY = ['payment-rails-config'] as const;
const LOGO_BUCKET = 'platform-assets';

async function fetchPaymentRailsConfig(): Promise<PaymentRailsConfig> {
  const { data, error } = await (
    supabase as unknown as {
      rpc: (fn: string) => Promise<{ data: unknown; error: { message?: string } | null }>;
    }
  ).rpc('get_payment_rails_config');

  if (error) {
    logger.warn('get_payment_rails_config failed, trying direct select', { error });
    const { data: row, error: selErr } = await supabase
      .from('platform_settings')
      .select('settings')
      .eq('key', PAYMENT_RAILS_SETTINGS_KEY)
      .maybeSingle();
    if (selErr) throw selErr;
    return mergePaymentRailsConfig(row?.settings);
  }

  return mergePaymentRailsConfig(data);
}

function extFromFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  if (file.type === 'image/svg+xml') return 'svg';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/png') return 'png';
  return 'png';
}

export async function uploadPaymentOperatorLogo(
  aggregatorId: PaymentRailAggregatorId,
  operatorId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Fichier image requis (PNG, JPG, WebP, SVG).');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Logo trop volumineux (max 2 Mo).');
  }

  const ext = extFromFile(file);
  const path = `payment-operators/${aggregatorId}/${operatorId}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
    contentType: file.type || `image/${ext}`,
  });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);

  // Bust CDN cache after replace
  return `${publicUrl}?v=${Date.now()}`;
}

export function usePaymentRailsConfig(options?: { enabled?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<PaymentRailsConfig | null>(null);
  const [uploadingLogoKey, setUploadingLogoKey] = useState<string | null>(null);

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPaymentRailsConfig,
    enabled: options?.enabled !== false,
    staleTime: 30_000,
  });

  const config = local ?? query.data ?? mergePaymentRailsConfig(null);

  const setAggregatorEnabled = useCallback(
    (id: PaymentRailAggregatorId, enabled: boolean) => {
      setLocal(prev => {
        const base = prev ?? query.data ?? mergePaymentRailsConfig(null);
        return {
          ...base,
          [id]: { ...base[id], enabled },
        };
      });
    },
    [query.data]
  );

  const setOperatorEnabled = useCallback(
    (aggregatorId: PaymentRailAggregatorId, operatorId: string, enabled: boolean) => {
      setLocal(prev => {
        const base = prev ?? query.data ?? mergePaymentRailsConfig(null);
        return {
          ...base,
          [aggregatorId]: {
            ...base[aggregatorId],
            operators: {
              ...base[aggregatorId].operators,
              [operatorId]: enabled,
            },
          },
        };
      });
    },
    [query.data]
  );

  const setOperatorLogo = useCallback(
    (aggregatorId: PaymentRailAggregatorId, operatorId: string, logoUrl: string | null) => {
      setLocal(prev => {
        const base = prev ?? query.data ?? mergePaymentRailsConfig(null);
        const logos = { ...(base[aggregatorId].logos || {}) };
        if (logoUrl) logos[operatorId] = logoUrl;
        else delete logos[operatorId];
        return {
          ...base,
          [aggregatorId]: {
            ...base[aggregatorId],
            logos,
          },
        };
      });
    },
    [query.data]
  );

  const uploadOperatorLogo = useCallback(
    async (aggregatorId: PaymentRailAggregatorId, operatorId: string, file: File) => {
      const key = `${aggregatorId}:${operatorId}`;
      setUploadingLogoKey(key);
      try {
        const url = await uploadPaymentOperatorLogo(aggregatorId, operatorId, file);
        setOperatorLogo(aggregatorId, operatorId, url);
        toast({
          title: 'Logo prêt',
          description: 'Enregistrez pour publier le logo sur le checkout.',
        });
        return url;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload impossible';
        logger.error('payment operator logo upload failed', { error, aggregatorId, operatorId });
        toast({ title: 'Erreur upload', description: message, variant: 'destructive' });
        throw error;
      } finally {
        setUploadingLogoKey(null);
      }
    },
    [setOperatorLogo, toast]
  );

  const resetLocal = useCallback(() => {
    setLocal(null);
  }, []);

  const isDirty = useMemo(() => {
    if (!local || !query.data) return !!local;
    return JSON.stringify(local) !== JSON.stringify(query.data);
  }, [local, query.data]);

  const saveMutation = useMutation({
    mutationFn: async (next: PaymentRailsConfig) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: existing } = await supabase
        .from('platform_settings')
        .select('key')
        .eq('key', PAYMENT_RAILS_SETTINGS_KEY)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({
            settings: next as unknown as Json,
            updated_at: new Date().toISOString(),
            updated_by: user?.id ?? null,
          })
          .eq('key', PAYMENT_RAILS_SETTINGS_KEY);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('platform_settings').insert({
          key: PAYMENT_RAILS_SETTINGS_KEY,
          settings: next as unknown as Json,
          updated_by: user?.id ?? null,
        });
        if (error) throw error;
      }

      await logAdminAction({
        action: 'UPDATE_PAYMENT_RAILS',
        targetType: 'settings',
        metadata: { key: PAYMENT_RAILS_SETTINGS_KEY },
      });

      return next;
    },
    onSuccess: data => {
      queryClient.setQueryData(QUERY_KEY, data);
      queryClient.setQueryData([...QUERY_KEY, 'public'], data);
      setLocal(null);
      toast({ title: 'Enregistré', description: 'Configuration des agrégateurs mise à jour.' });
    },
    onError: (error: Error) => {
      logger.error('Failed to save payment_rails', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d’enregistrer la configuration.',
        variant: 'destructive',
      });
    },
  });

  const save = useCallback(() => {
    return saveMutation.mutateAsync(config);
  }, [config, saveMutation]);

  return {
    config,
    isLoading: query.isLoading,
    isError: query.isError,
    isDirty,
    isSaving: saveMutation.isPending,
    uploadingLogoKey,
    setAggregatorEnabled,
    setOperatorEnabled,
    setOperatorLogo,
    uploadOperatorLogo,
    resetLocal,
    save,
    refetch: query.refetch,
  };
}

/** Lecture checkout (guests OK via RPC). */
export function usePaymentRailsConfigPublic() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'public'],
    queryFn: fetchPaymentRailsConfig,
    staleTime: 60_000,
  });
}
