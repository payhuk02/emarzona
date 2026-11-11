import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { resolveStorePublicTrust } from '@/lib/commerce/store-public-trust';
import type { Store } from '@/hooks/useStores';
import { useDeferredMount } from '@/hooks/useDeferredMount';

export function useStoreTrustMetrics(
  store:
    | Pick<Store, 'id' | 'domain_status' | 'domain_verified_at' | 'metadata' | 'active_clients'>
    | null
    | undefined
) {
  const storeId = store?.id ?? null;
  const hasStoredClients = typeof store?.active_clients === 'number' && store.active_clients > 0;
  /** Hors chemin LCP catalogue — la requête orders peut être lourde. */
  const idleReady = useDeferredMount(Boolean(storeId) && !hasStoredClients, 3200);

  const customersQuery = useQuery({
    queryKey: ['store-active-clients', storeId],
    enabled: Boolean(storeId) && !hasStoredClients && idleReady,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!storeId) return 0;

      const { data, error } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('store_id', storeId)
        .eq('status', 'completed');

      if (error) {
        logger.warn('Store active clients fallback failed', { error, storeId });
        return 0;
      }

      const uniqueCustomers = new Set(
        (data ?? []).map(row => row.customer_id).filter((id): id is string => Boolean(id))
      );
      return uniqueCustomers.size;
    },
  });

  return resolveStorePublicTrust(store, customersQuery.data);
}
