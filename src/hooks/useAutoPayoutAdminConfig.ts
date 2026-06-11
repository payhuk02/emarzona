import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AutoPayoutVendorConfig {
  enabled: boolean;
  delay_days: number;
  min_amount: number;
}

const DEFAULT_CONFIG: AutoPayoutVendorConfig = {
  enabled: false,
  delay_days: 7,
  min_amount: 50_000,
};

export function useAutoPayoutAdminConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['auto-payout-admin-config'],
    queryFn: async (): Promise<AutoPayoutVendorConfig> => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('settings')
        .eq('key', 'admin')
        .maybeSingle();

      if (error) throw error;
      const raw = (data?.settings as Record<string, unknown> | null)?.auto_payout_vendors as
        | Record<string, unknown>
        | undefined;
      if (!raw) return DEFAULT_CONFIG;

      return {
        enabled: Boolean(raw.enabled),
        delay_days: Number(raw.delay_days ?? 7),
        min_amount: Number(raw.min_amount ?? 50_000),
      };
    },
  });

  const save = useMutation({
    mutationFn: async (config: AutoPayoutVendorConfig) => {
      const { data, error } = await supabase.rpc('update_auto_payout_vendor_config', {
        p_enabled: config.enabled,
        p_delay_days: config.delay_days,
        p_min_amount: config.min_amount,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-payout-admin-config'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-auto-payout-policy'] });
      toast({
        title: 'Programme de suggestion de retrait mis à jour',
        description: 'Les vendeurs verront la politique actualisée sur la page Retraits.',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  return { ...query, save: save.mutate, isSaving: save.isPending };
}
