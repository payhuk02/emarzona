import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PHYSICAL_TRIAL_DAYS } from '@/lib/billing/platform-pricing';

export type StorePhysicalAccessState = {
  loading: boolean;
  allowed: boolean;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'none';
  planName: string | null;
  planSlug: string | null;
  monthlyPrice: number | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  refresh: () => Promise<void>;
};

type StorePlatformSubRow = {
  status: string | null;
  trial_ends_at: string | null;
  platform_vendor_plans: {
    name: string;
    slug: string;
    monthly_price: number;
    trial_days: number | null;
  } | null;
};

const defaultState: Omit<StorePhysicalAccessState, 'refresh'> = {
  loading: true,
  allowed: false,
  status: 'none',
  planName: null,
  planSlug: null,
  monthlyPrice: null,
  trialEndsAt: null,
  trialDaysRemaining: null,
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function useStorePhysicalAccess(storeId?: string | null): StorePhysicalAccessState {
  const [state, setState] = useState(defaultState);

  const refresh = useCallback(async () => {
    if (!storeId) {
      setState({ ...defaultState, loading: false });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase
        .from('store_platform_subscriptions' as never)
        .select(
          `
          status,
          trial_ends_at,
          platform_vendor_plans ( name, slug, monthly_price, trial_days )
        `
        )
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;

      const row = data as StorePlatformSubRow | null;

      if (!row) {
        setState({ ...defaultState, loading: false });
        return;
      }

      const plan = row.platform_vendor_plans;

      const status = (row.status ?? 'none') as StorePhysicalAccessState['status'];
      const trialEndsAt = row.trial_ends_at;
      const trialExpired =
        status === 'trialing' && trialEndsAt !== null && new Date(trialEndsAt) <= new Date();

      const allowed = status === 'active' || (status === 'trialing' && !trialExpired);

      setState({
        loading: false,
        allowed,
        status: trialExpired ? 'expired' : status,
        planName: plan?.name ?? null,
        planSlug: plan?.slug ?? null,
        monthlyPrice: plan?.monthly_price != null ? Number(plan.monthly_price) : null,
        trialEndsAt,
        trialDaysRemaining: allowed && status === 'trialing' ? daysUntil(trialEndsAt) : null,
      });
    } catch {
      setState({ ...defaultState, loading: false });
    }
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

export { PHYSICAL_TRIAL_DAYS };
