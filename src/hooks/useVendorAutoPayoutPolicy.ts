import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorAutoPayoutPolicy {
  enabled: boolean;
  delay_days: number;
  min_amount: number;
  requires_admin_approval: boolean;
  transfer_mode: 'admin_approved_withdrawal';
}

const DEFAULT_POLICY: VendorAutoPayoutPolicy = {
  enabled: false,
  delay_days: 7,
  min_amount: 50_000,
  requires_admin_approval: true,
  transfer_mode: 'admin_approved_withdrawal',
};

export function useVendorAutoPayoutPolicy() {
  return useQuery({
    queryKey: ['vendor-auto-payout-policy'],
    queryFn: async (): Promise<VendorAutoPayoutPolicy> => {
      const { data, error } = await supabase.rpc('get_vendor_auto_payout_policy');
      if (error) {
        return DEFAULT_POLICY;
      }
      const raw = data as Record<string, unknown> | null;
      if (!raw) return DEFAULT_POLICY;
      return {
        enabled: Boolean(raw.enabled),
        delay_days: Number(raw.delay_days ?? 7),
        min_amount: Number(raw.min_amount ?? 50_000),
        requires_admin_approval: true,
        transfer_mode: 'admin_approved_withdrawal',
      };
    },
    staleTime: 5 * 60_000,
  });
}
