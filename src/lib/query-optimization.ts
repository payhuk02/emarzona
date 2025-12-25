/**
 * Optimisations de requêtes et caching
 * Date: 1 Février 2025
 * 
 * Utilitaires pour optimiser les requêtes lourdes avec :
 * - Caching intelligent
 * - Préchargement de données
 * - Requêtes batch
 * - Debouncing des requêtes fréquentes
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

/**
 * Types pour les optimisations de requêtes
 */
export interface QueryOptimizationConfig {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  retry?: number;
  retryDelay?: number | ((attemptIndex: number) => number);
}

/**
 * Configuration de cache optimisée pour différentes types de données
 */
export const cacheConfig = {
  // Données qui changent rarement - cache long
  static: {
    staleTime: 1000 * 60 * 60 * 24, // 24 heures
    cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 jours
  },
  
  // Données qui changent occasionnellement - cache moyen
  semiStatic: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60 * 2, // 2 heures
  },
  
  // Données qui changent fréquemment - cache court
  dynamic: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
  },
  
  // Données en temps réel - pas de cache
  realtime: {
    staleTime: 0,
    cacheTime: 1000 * 60 * 5, // 5 minutes
  },
};

/**
 * Précharge les données critiques au démarrage
 */
export function prefetchCriticalData(queryClient: QueryClient, userId?: string, storeId?: string) {
  if (!userId || !storeId) return;

  // Précharger les données du store
  queryClient.prefetchQuery({
    queryKey: ['store', storeId],
    staleTime: cacheConfig.semiStatic.staleTime,
  });

  // Précharger les produits actifs
  queryClient.prefetchQuery({
    queryKey: ['products', storeId, 'active'],
    staleTime: cacheConfig.semiStatic.staleTime,
  });

  // Précharger les commandes récentes
  queryClient.prefetchQuery({
    queryKey: ['orders', storeId, 'recent'],
    staleTime: cacheConfig.dynamic.staleTime,
  });
}

/**
 * Optimise une requête avec debouncing pour éviter les appels multiples
 */
export function createDebouncedQuery<T>(
  queryFn: () => Promise<T>,
  delay: number = 300
): () => Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let cachedPromise: Promise<T> | null = null;

  return () => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          if (!cachedPromise) {
            cachedPromise = queryFn();
          }
          const result = await cachedPromise;
          cachedPromise = null;
          resolve(result);
        } catch (error) {
          cachedPromise = null;
          reject(error);
        }
      }, delay);
    });
  };
}

/**
 * Batch plusieurs requêtes en une seule
 */
export async function batchQueries<T>(
  queries: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(query => query()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Invalide intelligemment le cache en fonction des changements
 */
export function invalidateRelatedQueries(
  queryClient: QueryClient,
  queryKey: string[],
  relatedKeys: string[][] = []
) {
  // Invalider la requête principale
  queryClient.invalidateQueries({ queryKey });
  
  // Invalider les requêtes liées
  relatedKeys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: key });
  });
}

/**
 * Optimise les requêtes de liste avec pagination
 */
export interface PaginatedQueryOptions {
  page: number;
  pageSize: number;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function createPaginatedQueryKey(
  baseKey: string[],
  options: PaginatedQueryOptions
): string[] {
  return [
    ...baseKey,
    'paginated',
    options.page.toString(),
    options.pageSize.toString(),
    ...(options.filters ? [JSON.stringify(options.filters)] : []),
    ...(options.sortBy ? [options.sortBy, options.sortOrder || 'asc'] : []),
  ];
}

/**
 * Nettoie le cache des données obsolètes
 */
export function cleanupStaleCache(queryClient: QueryClient) {
  const now = Date.now();
  const cache = (queryClient as any).queryCache;
  
  if (!cache) return;
  
  const queries = cache.getAll();
  let cleaned = 0;
  
  queries.forEach((query: any) => {
    const cacheTime = query.meta?.cacheTime || 0;
    const lastUpdated = query.state.dataUpdatedAt || 0;
    
    // Si les données sont plus anciennes que le cacheTime, les supprimer
    if (now - lastUpdated > cacheTime && cacheTime > 0) {
      queryClient.removeQueries({ queryKey: query.queryKey });
      cleaned++;
    }
  });
  
  if (cleaned > 0) {
    logger.info('Cache cleanup', { cleaned, total: queries.length });
  }
}

/**
 * Configure le QueryClient avec des optimisations
 */
export function createOptimizedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: cacheConfig.semiStatic.staleTime,
        cacheTime: cacheConfig.semiStatic.cacheTime,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

/**
 * Précharge les données d'une route avant la navigation
 */
export async function prefetchRouteData(
  queryClient: QueryClient,
  route: string,
  params?: Record<string, string>
) {
  const prefetchMap: Record<string, () => Promise<any>> = {
    '/dashboard/products': async () => {
      // Précharger la liste des produits
      // Implémentation spécifique selon vos hooks
    },
    '/dashboard/orders': async () => {
      // Précharger les commandes
    },
    '/dashboard/analytics': async () => {
      // Précharger les analytics
    },
  };

  const prefetchFn = prefetchMap[route];
  if (prefetchFn) {
    try {
      await queryClient.prefetchQuery({
        queryKey: [route, params],
        queryFn: prefetchFn,
        staleTime: cacheConfig.semiStatic.staleTime,
      });
    } catch (error) {
      logger.warn('Failed to prefetch route data', { route, error });
    }
  }
}

