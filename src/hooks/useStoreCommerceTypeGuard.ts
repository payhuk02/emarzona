import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';

export interface StoreCommerceTypeChangeStatus {
  can_change: boolean;
  product_count: number;
  current_type: StoreCommerceType;
}

async function fetchStoreCommerceTypeChangeStatus(
  storeId: string
): Promise<StoreCommerceTypeChangeStatus> {
  const { data, error } = await supabase.rpc('store_commerce_type_change_status', {
    p_store_id: storeId,
  });

  if (error) {
    throw error;
  }

  const row = data as Record<string, unknown> | null;
  return {
    can_change: row?.can_change === true,
    product_count:
      typeof row?.product_count === 'number' ? row.product_count : Number(row?.product_count ?? 0),
    current_type: parseStoreCommerceType(row?.current_type),
  };
}

/**
 * Indicates whether a store's commerce_type can be changed (blocked when catalog has products).
 */
export function useStoreCommerceTypeGuard(storeId: string | null | undefined) {
  return useQuery({
    queryKey: ['store-commerce-type-guard', storeId ?? 'none'],
    queryFn: () => fetchStoreCommerceTypeChangeStatus(storeId!),
    enabled: Boolean(storeId),
    staleTime: 30_000,
  });
}
