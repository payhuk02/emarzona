/**
 * useOrdersOptimized Hook
 * Date: 28 Janvier 2025
 * 
 * Hook optimisé pour les commandes avec React Query
 * Migration de useState vers React Query pour meilleure gestion d'erreurs et cache
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { shouldRetryError, getRetryDelay } from '@/lib/error-handling';
import type { Order, SortColumn, SortDirection } from './useOrders';

export interface UseOrdersOptions {
  page?: number;
  pageSize?: number;
  sortBy?: SortColumn;
  sortDirection?: SortDirection;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Hook optimisé pour récupérer les commandes avec React Query
 */
export const useOrdersOptimized = (
  storeId?: string,
  options: UseOrdersOptions = {}
): {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} => {
  const { page = 0, pageSize = 25, sortBy = 'created_at', sortDirection = 'desc' } = options;

  const query = useQuery<OrdersResponse>({
    queryKey: ['orders-optimized', storeId, page, pageSize, sortBy, sortDirection],
    queryFn: async () => {
      if (!storeId) {
        return {
          orders: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }

      try {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error: queryError, count } = await supabase
          .from('orders')
          .select(`
            *,
            customers (
              name,
              email,
              phone
            )
          `, { count: 'exact' })
          .eq('store_id', storeId)
          .order(sortBy, { ascending: sortDirection === 'asc' })
          .range(from, to);

        if (queryError) {
          // Ne pas afficher de toast si c'est juste que la table n'existe pas encore
          if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
            logger.warn('Table orders n\'existe pas encore', {
              code: queryError.code,
              message: queryError.message,
            });
            return {
              orders: [],
              total: 0,
              page,
              pageSize,
              totalPages: 0,
            };
          }
          throw queryError;
        }

        const orders = (data || []) as Order[];
        const total = count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
          orders,
          total,
          page,
          pageSize,
          totalPages,
        };
      } catch (error: unknown) {
        logger.error('Erreur dans useOrdersOptimized', {
          error: error instanceof Error ? error.message : String(error),
          storeId,
          page,
          pageSize,
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
    orders: query.data?.orders || [],
    total: query.data?.total || 0,
    page: query.data?.page || page,
    pageSize: query.data?.pageSize || pageSize,
    totalPages: query.data?.totalPages || 0,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};

