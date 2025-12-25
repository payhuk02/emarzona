import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type StoreInfo = { name: string; logo_url?: string | null };

/**
 * Cache store info by id to avoid N calls per product card on mobile lists.
 */
export function useStoreInfo(storeId?: string | null) {
  return useQuery({
    queryKey: ['store-info', storeId],
    queryFn: async (): Promise<StoreInfo | null> => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('stores')
        .select('name, logo_url')
        .eq('id', storeId)
        .maybeSingle();
      if (error) return null;
      return data ?? null;
    },
    enabled: !!storeId,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
