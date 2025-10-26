/**
 * Hook personnalisé qui combine React Query et notre cache LocalStorage
 * pour des performances optimales
 */

import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { cache } from '@/lib/cache';

interface CachedQueryOptions<TData> extends Omit<UseQueryOptions<TData, Error, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  /**
   * Durée du cache LocalStorage en millisecondes
   * Par défaut: 5 minutes
   */
  localCacheTTL?: number;
  /**
   * Activer le cache LocalStorage
   * Par défaut: true
   */
  useLocalCache?: boolean;
}

/**
 * Hook qui utilise à la fois React Query et le cache LocalStorage
 * 1. Vérifie d'abord le cache LocalStorage (ultra rapide)
 * 2. Puis utilise React Query pour les données fraîches
 * 3. Sauvegarde le résultat dans LocalStorage pour la prochaine fois
 */
export function useCachedQuery<TData>({
  queryKey,
  queryFn,
  localCacheTTL = 5 * 60 * 1000,
  useLocalCache = true,
  ...options
}: CachedQueryOptions<TData>) {
  const cacheKey = JSON.stringify(queryKey);

  // Essayer de récupérer depuis le cache local en premier
  const getCachedData = (): TData | undefined => {
    if (!useLocalCache) return undefined;
    const cached = cache.get<TData>(cacheKey);
    return cached || undefined;
  };

  const query = useQuery<TData, Error>({
    queryKey,
    queryFn: async () => {
      const data = await queryFn();
      
      // Sauvegarder dans le cache local
      if (useLocalCache && data) {
        cache.set(cacheKey, data, localCacheTTL);
      }
      
      return data;
    },
    // Utiliser les données en cache comme initialData si disponibles
    initialData: getCachedData,
    ...options,
  });

  return query;
}

/**
 * Hook pour les requêtes Supabase avec cache automatique
 */
export function useSupabaseCachedQuery<TData>({
  queryKey,
  queryFn,
  staleTime = 5 * 60 * 1000, // 5 minutes par défaut
  ...options
}: CachedQueryOptions<TData>) {
  return useCachedQuery<TData>({
    queryKey,
    queryFn,
    staleTime,
    localCacheTTL: staleTime * 2, // Cache local plus long
    ...options,
  });
}

/**
 * Hook pour les requêtes de produits avec cache agressif
 */
export function useProductsQuery<TData>({
  queryKey,
  queryFn,
  ...options
}: CachedQueryOptions<TData>) {
  return useCachedQuery<TData>({
    queryKey,
    queryFn,
    staleTime: 10 * 60 * 1000, // 10 minutes (les produits changent rarement)
    localCacheTTL: 30 * 60 * 1000, // 30 minutes en local
    ...options,
  });
}

/**
 * Hook pour les requêtes de statistiques avec cache modéré
 */
export function useStatsQuery<TData>({
  queryKey,
  queryFn,
  ...options
}: CachedQueryOptions<TData>) {
  return useCachedQuery<TData>({
    queryKey,
    queryFn,
    staleTime: 2 * 60 * 1000, // 2 minutes (les stats changent plus souvent)
    localCacheTTL: 5 * 60 * 1000, // 5 minutes en local
    refetchInterval: 5 * 60 * 1000, // Refresh automatique toutes les 5 minutes
    ...options,
  });
}

/**
 * Hook pour les données temps réel (pas de cache)
 */
export function useRealtimeQuery<TData>({
  queryKey,
  queryFn,
  ...options
}: CachedQueryOptions<TData>) {
  return useQuery<TData, Error>({
    queryKey,
    queryFn,
    staleTime: 0, // Toujours considérer les données comme périmées
    cacheTime: 0, // Ne pas garder en cache
    useLocalCache: false,
    refetchInterval: 30 * 1000, // Refresh toutes les 30 secondes
    ...options,
  });
}

