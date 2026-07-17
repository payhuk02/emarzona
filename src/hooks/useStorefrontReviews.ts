import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type StorefrontReviewItem = {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  product?: {
    name: string;
    product_type?: string | null;
  } | null;
};

type ReviewRow = {
  id: string;
  product_id: string;
  rating: number;
  title?: string | null;
  content?: string | null;
  comment?: string | null;
  created_at: string;
  is_approved?: boolean | null;
  is_flagged?: boolean | null;
  products?:
    | { name: string; product_type?: string | null }
    | { name: string; product_type?: string | null }[]
    | null;
};

function mapReviewRow(row: ReviewRow): StorefrontReviewItem {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;
  return {
    id: row.id,
    rating: row.rating,
    comment: row.content ?? row.comment ?? row.title ?? null,
    created_at: row.created_at,
    product: product ? { name: product.name, product_type: product.product_type } : null,
  };
}

export function useStorefrontReviews(storeId?: string | null, limit = 50) {
  return useQuery({
    queryKey: ['storefront-reviews', storeId, limit],
    enabled: Boolean(storeId),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<StorefrontReviewItem[]> => {
      if (!storeId) return [];

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (productsError) {
        logger.warn('Storefront reviews: products lookup failed', {
          error: productsError,
          storeId,
        });
        return [];
      }

      const productIds = (products ?? []).map(p => p.id);
      if (productIds.length === 0) return [];

      const query = supabase
        .from('reviews')
        .select(
          'id, product_id, rating, title, content, comment, created_at, is_approved, is_flagged, products(name, product_type)'
        )
        .in('product_id', productIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;
      if (error) {
        logger.warn('Storefront reviews fetch failed', { error, storeId });
        return [];
      }

      return ((data as ReviewRow[] | null) ?? [])
        .filter(row => row.is_approved !== false && row.is_flagged !== true)
        .map(mapReviewRow);
    },
  });
}
