import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type SameStoreProduct = {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  price: number;
  promotional_price: number | null;
  currency: string | null;
  category: string | null;
  product_type: string;
  stores: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  };
};

const SAME_STORE_SELECT = `
  id, store_id, name, slug, image_url, price, promotional_price, currency, category, product_type, created_at,
  stores!inner (id, name, slug)
`;

/**
 * Produits actifs de la même boutique (exclut le produit courant).
 */
export function useSameStoreProducts(
  productId: string,
  storeId: string | undefined,
  limit = 4,
  options?: { productType?: string }
) {
  return useQuery({
    queryKey: ['same-store-products', productId, storeId, limit, options?.productType],
    queryFn: async (): Promise<SameStoreProduct[]> => {
      if (!storeId) return [];

      let query = supabase
        .from('products')
        .select(SAME_STORE_SELECT)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .neq('id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (options?.productType) {
        query = query.eq('product_type', options.productType);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching same-store products', { error, productId, storeId });
        throw error;
      }

      return (data ?? []) as SameStoreProduct[];
    },
    enabled: !!productId && !!storeId,
    staleTime: 5 * 60 * 1000,
  });
}
