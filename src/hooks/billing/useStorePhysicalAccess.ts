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
  currentPeriodEnd: string | null;
  pendingPlanSlug: string | null;
  refresh: () => Promise<void>;
};

type StorePlatformSubRow = {
  status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  metadata: Record<string, unknown> | null;
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
  currentPeriodEnd: null,
  pendingPlanSlug: null,
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const fetchWithTimeout = async <T>(promise: Promise<T>, ms: number = 8000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Supabase request timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export function useStorePhysicalAccess(storeId?: string | null): StorePhysicalAccessState {
  const [state, setState] = useState(defaultState);
  const [fetchedStoreId, setFetchedStoreId] = useState<string | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    setFetchedStoreId(storeId);
    if (!storeId) {
      setState({ ...defaultState, loading: false });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const query = supabase
        .from('store_platform_subscriptions' as never)
        .select(
          `
          status,
          trial_ends_at,
          current_period_end,
          metadata,
          platform_vendor_plans ( name, slug, monthly_price, trial_days )
        `
        )
        .eq('store_id', storeId)
        .maybeSingle();

      const { data, error } = await fetchWithTimeout(query, 8000);

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
        currentPeriodEnd: row.current_period_end,
        pendingPlanSlug:
          typeof row.metadata?.pending_plan_slug === 'string'
            ? row.metadata.pending_plan_slug
            : null,
      });
    } catch {
      setState({ ...defaultState, loading: false });
    }
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isSynchronizing = fetchedStoreId !== storeId;

  return { ...state, loading: state.loading || isSynchronizing, refresh };
}

export { PHYSICAL_TRIAL_DAYS };
