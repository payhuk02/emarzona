/**
 * useOptimizedQuery Hook
 * Date: 28 Janvier 2025
 * 
 * Hook amélioré pour React Query avec retry intelligent, prefetching et cache optimisé
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface OptimizedQueryOptions<TData, TError = Error> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
  /**
   * Activer le prefetching intelligent
   */
  enablePrefetch?: boolean;
  /**
   * Préfetcher les pages suivantes
   */
  prefetchNextPages?: boolean;
  /**
   * Retry avec exponential backoff personnalisé
   */
  retryConfig?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
  /**
   * Stale time personnalisé (en ms)
   */
  staleTime?: number;
  /**
   * Cache time personnalisé (en ms)
   */
  gcTime?: number;
}

/**
 * Calculer le délai de retry avec exponential backoff
 */
function calculateRetryDelay(
  attemptIndex: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const delay = Math.min(baseDelay * Math.pow(2, attemptIndex), maxDelay);
  // Ajouter un peu de jitter pour éviter le thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
}

/**
 * Hook optimisé pour les requêtes avec retry intelligent et prefetching
 */
export function useOptimizedQuery<TData, TError = Error>(
  options: OptimizedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const {
    queryKey,
    queryFn,
    enablePrefetch = false,
    prefetchNextPages = false,
    retryConfig = {},
    staleTime = 5 * 60 * 1000, // 5 minutes par défaut
    gcTime = 10 * 60 * 1000, // 10 minutes par défaut
    ...queryOptions
  } = options;

  const queryClient = useQueryClient();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
  } = retryConfig;

  // Configuration de retry avec exponential backoff
  const retry = (failureCount: number, error: TError): boolean => {
    if (failureCount >= maxRetries) {
      logger.warn('Max retries reached', {
        queryKey,
        failureCount,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }

    // Ne pas retry sur certaines erreurs
    if (error instanceof Error) {
      // Erreurs 4xx (client) ne doivent généralement pas être retry
      if (error.message.includes('404') || error.message.includes('403') || error.message.includes('401')) {
        return false;
      }
    }

    return true;
  };

  const retryDelay = (attemptIndex: number) => {
    return calculateRetryDelay(attemptIndex, baseDelay, maxDelay);
  };

  // Prefetching intelligent
  useEffect(() => {
    if (!enablePrefetch || !prefetchNextPages) return;

    // Préfetcher les pages suivantes si c'est une requête paginée
    const isPaginated = queryKey.some((key) => 
      typeof key === 'object' && key !== null && ('page' in key || 'offset' in key)
    );

    if (isPaginated) {
      // Extraire la page actuelle
      const pageKey = queryKey.find((key) => 
        typeof key === 'object' && key !== null && ('page' in key || 'offset' in key)
      ) as { page?: number; offset?: number } | undefined;

      if (pageKey) {
        const currentPage = pageKey.page || 1;
        const nextPage = currentPage + 1;

        // Préfetcher la page suivante
        const nextPageKey = queryKey.map((key) => {
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
  }, [enablePrefetch, prefetchNextPages, queryKey, queryFn, queryClient, staleTime]);

  // Requête optimisée
  const query = useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime,
    gcTime,
    retry,
    retryDelay,
    refetchOnWindowFocus: false, // Éviter les refetch inutiles
    refetchOnMount: false, // Utiliser le cache si disponible
    refetchOnReconnect: true, // Refetch si reconnexion
    structuralSharing: true, // Optimiser les re-renders
    ...queryOptions,
  });

  return query;
}

/**
 * Hook pour les requêtes de produits avec configuration optimale
 */
export function useOptimizedProductQuery<TData>(
  options: Omit<OptimizedQueryOptions<TData>, 'staleTime' | 'gcTime'>
) {
  return useOptimizedQuery<TData>({
    ...options,
    staleTime: 5 * 60 * 1000, // 5 minutes pour les produits
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    enablePrefetch: true,
    prefetchNextPages: true,
  });
}

/**
 * Hook pour les requêtes de statistiques avec cache long
 */
export function useOptimizedStatsQuery<TData>(
  options: Omit<OptimizedQueryOptions<TData>, 'staleTime' | 'gcTime'>
) {
  return useOptimizedQuery<TData>({
    ...options,
    staleTime: 10 * 60 * 1000, // 10 minutes pour les stats
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
    refetchInterval: 5 * 60 * 1000, // Refresh toutes les 5 minutes
  });
}

