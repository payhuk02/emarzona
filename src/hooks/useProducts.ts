/**
 * Hook consolidé pour les produits avec pagination serveur
 * Remplace useProducts (déprécié) et useProductsOptimized
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { shouldRetryError, getRetryDelay } from '@/lib/error-handling';

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  product_type: string | null;
  rating: number;
  reviews_count: number;
  is_active: boolean;
  digital_file_url: string | null;
  stock_quantity?: number | null;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | null;
  sku?: string | null;
  track_inventory?: boolean;
  low_stock_threshold?: number | null;
  created_at: string;
  updated_at: string;
  product_affiliate_settings?: Array<{
    commission_rate: number;
    affiliate_enabled: boolean;
  }> | null;
}

export interface ProductsPaginationOptions {
  page?: number;
  itemsPerPage?: number;
  sortBy?:
    | 'recent'
    | 'oldest'
    | 'name-asc'
    | 'name-desc'
    | 'price-asc'
    | 'price-desc'
    | 'popular'
    | 'rating';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
  category?: string;
  productType?: string;
  status?: 'all' | 'active' | 'inactive';
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'needs_restock';
  priceRange?: [number, number];
}

export interface ProductsPaginationResponse {
  data: Product[];
  total: number;
  page: number;
  itemsPerPage: number;
  totalPages: number;
}

/**
 * Hook principal pour récupérer les produits avec pagination serveur.
 * Utilise React Query + RPC optimisée.
 */
export const useProductsOptimized = (
  storeId?: string | null,
  options?: ProductsPaginationOptions
): {
  products: Product[];
  total: number;
  page: number;
  itemsPerPage: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} => {
  const {
    page = 1,
    itemsPerPage = 12,
    sortBy = 'recent',
    sortOrder = 'desc',
    searchQuery = '',
    category = 'all',
    productType = 'all',
    status = 'all',
    stockStatus = 'all',
    priceRange = [0, 1000000],
  } = options || {};

  const query = useQuery<ProductsPaginationResponse>({
    queryKey: [
      'products-optimized',
      storeId,
      page,
      itemsPerPage,
      sortBy,
      sortOrder,
      searchQuery,
      category,
      productType,
      status,
      stockStatus,
      priceRange,
    ],
    queryFn: async () => {
      if (!storeId) {
        return { data: [], total: 0, page, itemsPerPage, totalPages: 0 };
      }

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_products_management', {
          p_store_id: storeId,
          p_page: page,
          p_items_per_page: itemsPerPage,
          p_sort_by: sortBy,
          p_sort_order: sortOrder,
          p_search_query: searchQuery,
          p_category: category,
          p_product_type: productType,
          p_status: status,
          p_stock_status: stockStatus,
          p_price_range_min: priceRange[0] > 0 ? priceRange[0] : null,
          p_price_range_max: priceRange[1] < 1000000 ? priceRange[1] : null,
        });

        if (rpcError) {
          logger.error('Erreur RPC products:', rpcError);
          throw rpcError;
        }

        if (rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          const firstItem = rpcData[0] as Record<string, unknown>;
          const totalCount = firstItem.total_count ? Number(firstItem.total_count) : rpcData.length;

          const products = rpcData.map((item: unknown) => {
            const product = item as Record<string, unknown>;
            return {
              id: product.id as string,
              name: product.name as string,
              slug: product.slug as string,
              description: product.description as string,
              short_description: product.short_description as string,
              image_url: product.image_url as string,
              price: Number(product.price),
              promotional_price: product.promotional_price ? Number(product.promotional_price) : null,
              currency: product.currency as string,
              category: product.category as string,
              product_type: product.product_type as string,
              licensing_type: product.licensing_type as string,
              license_terms: product.license_terms as string,
              is_active: product.is_active as boolean,
              is_featured: product.is_featured as boolean,
              rating: product.rating ? Number(product.rating) : null,
              reviews_count: product.reviews_count ? Number(product.reviews_count) : 0,
              purchases_count: product.purchases_count ? Number(product.purchases_count) : 0,
              stock_quantity: product.stock_quantity ? Number(product.stock_quantity) : null,
              created_at: product.created_at as string,
              updated_at: product.updated_at as string,
              tags: product.tags as string[],
              effective_price: Number(product.effective_price),
              sales_last_30_days: product.sales_last_30_days ? Number(product.sales_last_30_days) : 0,
              revenue_last_30_days: product.revenue_last_30_days ? Number(product.revenue_last_30_days) : 0,
              stock_status: product.stock_status as string,
              product_affiliate_settings: product.commission_rate ? {
                commission_rate: Number(product.commission_rate),
                affiliate_enabled: product.affiliate_enabled as boolean,
              } : null,
            } as Product & {
              effective_price: number;
              sales_last_30_days: number;
              revenue_last_30_days: number;
              stock_status: string;
            };
          });

          const totalPages = Math.ceil(totalCount / itemsPerPage);

          return {
            data: products,
            total: totalCount,
            page,
            itemsPerPage,
            totalPages,
          };
        }

        return { data: [], total: 0, page, itemsPerPage, totalPages: 0 };
      } catch (_error: unknown) {
        logger.error('Erreur dans useProductsOptimized', {
          error: _error instanceof Error ? _error.message : String(_error),
          storeId,
          page,
          itemsPerPage,
        });
        throw _error;
      }
    },
    enabled: !!storeId,
    retry: (failureCount, error) => shouldRetryError(error, failureCount),
    retryDelay: attemptIndex => getRetryDelay(attemptIndex),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    products: query.data?.data || [],
    total: query.data?.total || 0,
    page: query.data?.page || page,
    itemsPerPage: query.data?.itemsPerPage || itemsPerPage,
    totalPages: query.data?.totalPages || 0,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};

/**
 * @deprecated Utilisez useProductsOptimized à la place.
 */
export const useProducts = useProductsOptimized;
