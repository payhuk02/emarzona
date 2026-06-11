import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PhysicalPlanLimitsSnapshot } from '@/lib/billing/physical-plan-limits';

const EMPTY: PhysicalPlanLimitsSnapshot = {
  plan_slug: null,
  allowed: false,
  max_products: null,
  max_variants_per_product: null,
  max_warehouses: null,
  active_physical_products: 0,
  warehouse_count: 0,
};

export function useStorePhysicalPlanLimits(storeId?: string | null) {
  return useQuery({
    queryKey: ['store-physical-plan-limits', storeId],
    enabled: Boolean(storeId),
    queryFn: async (): Promise<PhysicalPlanLimitsSnapshot> => {
      if (!storeId) return EMPTY;

      const { data, error } = await supabase.rpc('get_store_physical_plan_limits', {
        p_store_id: storeId,
      });

      if (error) throw error;
      if (!data || typeof data !== 'object') return EMPTY;

      const raw = data as Record<string, unknown>;
      return {
        plan_slug: typeof raw.plan_slug === 'string' ? raw.plan_slug : null,
        allowed: Boolean(raw.allowed),
        max_products:
          raw.max_products === null || raw.max_products === undefined
            ? null
            : Number(raw.max_products),
        max_variants_per_product:
          raw.max_variants_per_product === null || raw.max_variants_per_product === undefined
            ? null
            : Number(raw.max_variants_per_product),
        max_warehouses:
          raw.max_warehouses === null || raw.max_warehouses === undefined
            ? null
            : Number(raw.max_warehouses),
        active_physical_products: Number(raw.active_physical_products ?? 0),
        warehouse_count: Number(raw.warehouse_count ?? 0),
        features:
          raw.features && typeof raw.features === 'object'
            ? (raw.features as Record<string, boolean>)
            : undefined,
      };
    },
    staleTime: 60_000,
  });
}
