/**
 * useProductsOptimized Hook
 * Date: 28 Janvier 2025
 * 
 * Hook optimisé pour les produits avec pagination serveur et gestion d'erreurs améliorée
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { shouldRetryError, getRetryDelay } from '@/lib/error-handling';
import type { Product } from './useProducts';

export interface ProductsPaginationOptions {
  page?: number;
  itemsPerPage?: number;
  sortBy?: 'recent' | 'oldest' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'popular' | 'rating';
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
 * Hook optimisé pour récupérer les produits avec pagination serveur
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
        return {
          data: [],
          total: 0,
          page,
          itemsPerPage,
          totalPages: 0,
        };
      }

      try {
        // Calculer le range pour pagination côté serveur
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        // Construire la requête de base
        let queryBuilder = supabase
          .from('products')
          .select(`
            *,
            product_affiliate_settings!left (
              commission_rate,
              affiliate_enabled
            )
          `, { count: 'exact' })
          .eq('store_id', storeId);

        // Appliquer les filtres
        if (searchQuery.trim()) {
          queryBuilder = queryBuilder.or(
            `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`
          );
        }

        if (category !== 'all') {
          queryBuilder = queryBuilder.eq('category', category);
        }

        if (productType !== 'all') {
          queryBuilder = queryBuilder.eq('product_type', productType);
        }

        if (status === 'active') {
          queryBuilder = queryBuilder.eq('is_active', true);
        } else if (status === 'inactive') {
          queryBuilder = queryBuilder.eq('is_active', false);
        }

        // Filtre prix (doit être fait côté serveur si possible)
        if (priceRange[0] > 0 || priceRange[1] < 1000000) {
          queryBuilder = queryBuilder
            .gte('price', priceRange[0])
            .lte('price', priceRange[1]);
        }

        // Appliquer le tri
        switch (sortBy) {
          case 'recent':
            queryBuilder = queryBuilder.order('created_at', { ascending: sortOrder === 'asc' });
            break;
          case 'oldest':
            queryBuilder = queryBuilder.order('created_at', { ascending: sortOrder === 'asc' });
            break;
          case 'name-asc':
          case 'name-desc':
            queryBuilder = queryBuilder.order('name', { ascending: sortBy === 'name-asc' });
            break;
          case 'price-asc':
          case 'price-desc':
            queryBuilder = queryBuilder.order('price', { ascending: sortBy === 'price-asc' });
            break;
          case 'popular':
            queryBuilder = queryBuilder.order('reviews_count', { ascending: false });
            break;
          case 'rating':
            queryBuilder = queryBuilder.order('rating', { ascending: false });
            break;
          default:
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
        }

        // Appliquer pagination côté serveur
        queryBuilder = queryBuilder.range(startIndex, endIndex);

        const { data, error, count } = await queryBuilder;

        if (error) {
          logger.error('Erreur lors de la récupération des produits', {
            error: error.message,
            code: error.code,
            storeId,
          });
          throw error;
        }

        // Filtrer par stockStatus côté client (trop complexe pour SQL)
        let filteredData = (data || []) as Product[];
        if (stockStatus !== 'all') {
          filteredData = filteredData.filter((product) => {
            if (product.track_inventory === false || product.product_type === 'digital') {
              return stockStatus === 'in_stock';
            }

            const quantity = product.stock_quantity || 0;
            const threshold = product.low_stock_threshold || 0;

            switch (stockStatus) {
              case 'in_stock':
                return quantity > threshold;
              case 'low_stock':
                return quantity > 0 && quantity <= threshold;
              case 'out_of_stock':
                return quantity === 0;
              case 'needs_restock':
                return quantity <= threshold;
              default:
                return true;
            }
          });
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / itemsPerPage);

        return {
          data: filteredData,
          total,
          page,
          itemsPerPage,
          totalPages,
        };
      } catch (error: unknown) {
        logger.error('Erreur dans useProductsOptimized', {
          error: error instanceof Error ? error.message : String(error),
          storeId,
          page,
          itemsPerPage,
        });
        throw error;
      }
    },
    enabled: !!storeId,
    retry: (failureCount, error) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => getRetryDelay(attemptIndex),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
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

