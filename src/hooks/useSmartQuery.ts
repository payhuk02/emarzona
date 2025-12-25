/**
 * Hook useSmartQuery - Wrapper intelligent pour React Query
 * Combine les meilleures pratiques : cache, error handling, prefetching, optimizations
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSmartQuery({
 *   queryKey: ['products', storeId],
 *   queryFn: () => fetchProducts(storeId),
 *   dataType: 'products', // Utilise la stratégie de cache optimale
 * });
 * ```
 */

import { useQuery, UseQueryOptions, UseQueryResult, QueryKey } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorHandler } from './useErrorHandler';
import { useToastHelpers } from './useToastHelpers';
import { cacheStrategies } from '@/lib/cache-optimization';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

export interface SmartQueryOptions<TData, TError = Error> extends Omit<
  UseQueryOptions<TData, TError>,
  'queryKey' | 'queryFn'
> {
  /**
   * Clé de la requête
   */
  queryKey: QueryKey;
  /**
   * Fonction de requête
   */
  queryFn: () => Promise<TData>;
  /**
   * Type de données pour stratégie de cache optimale
   * Options: 'products' | 'orders' | 'search' | 'analytics' | 'static' | 'user'
   */
  dataType?: keyof typeof cacheStrategies;
  /**
   * Afficher un toast d'erreur automatiquement
   * @default true
   */
  showErrorToast?: boolean;
  /**
   * Message d'erreur personnalisé
   */
  errorMessage?: string;
  /**
   * Activer le prefetching de la page suivante (pour pagination)
   * @default false
   */
  enablePrefetch?: boolean;
  /**
   * Activer le cache LocalStorage
   * @default false
   */
  useLocalCache?: boolean;
  /**
   * Durée du cache LocalStorage en ms
   * @default 5 minutes
   */
  localCacheTTL?: number;
}

/**
 * Hook intelligent pour les requêtes React Query
 */
export function useSmartQuery<TData = unknown, TError = Error>(
  options: SmartQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const {
    queryKey,
    queryFn,
    dataType,
    showErrorToast = true,
    errorMessage,
    enablePrefetch = false,
    useLocalCache = false,
    localCacheTTL = 5 * 60 * 1000,
    ...queryOptions
  } = options;

  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({ silent: !showErrorToast });
  const { showError } = useToastHelpers();
  const prefetchedRef = useRef<Set<string>>(new Set());

  // Obtenir la stratégie de cache optimale selon le type de données
  const cacheStrategy = dataType ? cacheStrategies[dataType] : undefined;
  const staleTime = queryOptions.staleTime ?? cacheStrategy?.staleTime ?? 5 * 60 * 1000;
  const gcTime = queryOptions.gcTime ?? cacheStrategy?.gcTime ?? 10 * 60 * 1000;

  // Gestion du cache LocalStorage
  const getCachedData = useCallback((): TData | undefined => {
    if (!useLocalCache || typeof window === 'undefined') return undefined;

    try {
      const cacheKey = `smart-query-${JSON.stringify(queryKey)}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < localCacheTTL) {
          return data as TData;
        }
        localStorage.removeItem(cacheKey);
      }
    } catch (error) {
      // ✅ PHASE 2: Remplacer console.warn par logger
      logger.warn('Failed to read from localStorage cache', { error, queryKey });
    }
    return undefined;
  }, [useLocalCache, queryKey, localCacheTTL]);

  const setCachedData = useCallback(
    (data: TData) => {
      if (!useLocalCache || typeof window === 'undefined') return;

      try {
        const cacheKey = `smart-query-${JSON.stringify(queryKey)}`;
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        // ✅ PHASE 2: Remplacer console.warn par logger
        logger.warn('Failed to write to localStorage cache', { error, queryKey });
      }
    },
    [useLocalCache, queryKey]
  );

  // Prefetching intelligent pour pagination
  useEffect(() => {
    if (!enablePrefetch) return;

    const isPaginated = queryKey.some(
      key => typeof key === 'object' && key !== null && ('page' in key || 'offset' in key)
    );

    if (isPaginated) {
      const pageKey = queryKey.find(
        key => typeof key === 'object' && key !== null && ('page' in key || 'offset' in key)
      ) as { page?: number; offset?: number } | undefined;

      if (pageKey) {
        const currentPage = pageKey.page || 1;
        const nextPage = currentPage + 1;

        const nextPageKey = queryKey.map(key => {
          if (typeof key === 'object' && key !== null && ('page' in key || 'offset' in key)) {
            return { ...key, page: nextPage };
          }
          return key;
        });

        const prefetchKey = JSON.stringify(nextPageKey);
        if (!prefetchedRef.current.has(prefetchKey)) {
          queryClient.prefetchQuery({
            queryKey: nextPageKey,
            queryFn,
            staleTime,
          });
          prefetchedRef.current.add(prefetchKey);
        }
      }
    }
  }, [enablePrefetch, queryKey, queryFn, queryClient, staleTime]);

  // Requête optimisée
  const query = useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      const data = await queryFn();

      // Sauvegarder dans le cache LocalStorage si activé
      if (useLocalCache && data) {
        setCachedData(data);
      }

      return data;
    },
    staleTime,
    gcTime,
    retry: queryOptions.retry ?? 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Éviter les refetch inutiles
    refetchOnMount: queryOptions.refetchOnMount ?? true,
    refetchOnReconnect: true,
    structuralSharing: true, // Optimiser les re-renders
    initialData: getCachedData(), // Utiliser le cache LocalStorage comme initialData
    ...queryOptions,
    onError: (error: TError) => {
      // Gérer l'erreur avec le système d'erreur
      const normalized = handleError(error, {
        queryKey: queryKey as string[],
        dataType,
      });

      // Afficher un toast si demandé
      if (showErrorToast) {
        const message = errorMessage || normalized.userMessage || 'Une erreur est survenue';
        showError(message);
      }

      // Appeler le callback personnalisé si fourni
      queryOptions.onError?.(error);
    },
  });

  return query;
}

/**
 * Hook spécialisé pour les requêtes de produits
 */
export function useSmartProductQuery<TData = unknown>(
  options: Omit<SmartQueryOptions<TData>, 'dataType'>
) {
  return useSmartQuery<TData>({
    ...options,
    dataType: 'products',
  });
}

/**
 * Hook spécialisé pour les requêtes de commandes
 */
export function useSmartOrderQuery<TData = unknown>(
  options: Omit<SmartQueryOptions<TData>, 'dataType'>
) {
  return useSmartQuery<TData>({
    ...options,
    dataType: 'orders',
  });
}

/**
 * Hook spécialisé pour les recherches
 */
export function useSmartSearchQuery<TData = unknown>(
  options: Omit<SmartQueryOptions<TData>, 'dataType'>
) {
  return useSmartQuery<TData>({
    ...options,
    dataType: 'search',
  });
}
