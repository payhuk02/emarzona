import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCartItemStoreId } from '@/lib/checkout/cart-validation';
import { STOREFRONT_STORE_PUBLIC_SELECT } from '@/lib/storefront/store-public-fields';
import type { CartItem } from '@/types/cart';
import type { Store } from '@/hooks/useStores';

function resolveSingleCartStoreId(items: CartItem[]): string | null {
  const storeIds = items.map(getCartItemStoreId).filter((id): id is string => Boolean(id));
  const unique = new Set(storeIds);
  if (unique.size !== 1) {
    return null;
  }
  return storeIds[0] ?? null;
}

/**
 * Charge le thème boutique lorsque le panier ne contient qu'une seule boutique.
 */
export function useCartThemedStore(items: CartItem[]) {
  const storeId = useMemo(() => resolveSingleCartStoreId(items), [items]);

  return useQuery({
    queryKey: ['cart-themed-store', storeId],
    enabled: Boolean(storeId),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Store | null> => {
      if (!storeId) {
        return null;
      }

      const { data, error } = await supabase
        .from('stores_public')
        .select(STOREFRONT_STORE_PUBLIC_SELECT)
        .eq('id', storeId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data as Store | null) ?? null;
    },
  });
}
