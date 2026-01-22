/**
 * Hook dashboard avec cache React Query avancé
 * Optimisations supplémentaires sur useDashboardStatsOptimized
 * Cache intelligent, synchronisation temps réel, stratégie de rechargement
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useDashboardStatsOptimized as useDashboardStatsOptimizedBase, transformOptimizedData } from './useDashboardStatsOptimized';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from './useStore';
import { logger } from '@/lib/logger';
import { useEffect, useCallback } from 'react';

export interface UseDashboardStatsCachedOptions {
  period?: '7d' | '30d' | '90d' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
  // Options de cache avancées
  staleTime?: number; // Temps avant que les données soient considérées comme périmées
  cacheTime?: number; // Temps de conservation en cache
  refetchOnWindowFocus?: boolean; // Recharger lors du focus fenêtre
  refetchOnReconnect?: boolean; // Recharger lors de la reconnexion
  refetchInterval?: number; // Rechargement automatique périodique
  enabled?: boolean; // Activer/désactiver la requête
}

// Clés de cache pour React Query
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: (storeId: string) => [...dashboardQueryKeys.all, 'stats', storeId] as const,
  statsWithPeriod: (storeId: string, period: string) => [...dashboardQueryKeys.stats(storeId), period] as const,
  statsFull: (storeId: string, options: UseDashboardStatsCachedOptions) =>
    [...dashboardQueryKeys.statsWithPeriod(storeId, options.period || '30d'), options] as const,
};

export const useDashboardStatsCached = (options: UseDashboardStatsCachedOptions = {}) => {
  const { store } = useStore();
  const queryClient = useQueryClient();

  // Configuration par défaut du cache
  const defaultOptions = {
    staleTime: 5 * 60 * 1000, // 5 minutes (données fraîches)
    cacheTime: 30 * 60 * 1000, // 30 minutes (conservation en cache)
    refetchOnWindowFocus: false, // Pas de rechargement au focus (optimisation)
    refetchOnReconnect: true, // Rechargement à la reconnexion
    refetchInterval: 10 * 60 * 1000, // Rechargement automatique toutes les 10 minutes
    enabled: !!store?.id, // Uniquement si boutique disponible
    ...options,
  };

  // Clé de cache unique pour cette requête
  const queryKey = dashboardQueryKeys.statsFull(store?.id || '', defaultOptions);

  // Requête principale avec cache React Query
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!store?.id) {
        throw new Error('Aucune boutique sélectionnée');
      }

      logger.info('🔄 [useDashboardStatsCached] Chargement avec cache:', {
        storeId: store.id,
        period: defaultOptions.period,
        fromCache: false, // Cette fonction est appelée seulement si pas en cache
      });

      // Utiliser le hook optimisé de base pour récupérer les données
      // Note: On ne peut pas utiliser directement le hook ici, on simule l'appel
      const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id: store.id,
        period_days: defaultOptions.period === '7d' ? 7 :
                    defaultOptions.period === '90d' ? 90 : 30,
      });

      if (error) {
        logger.error('❌ [useDashboardStatsCached] Erreur RPC:', error);
        throw error;
      }

      logger.info('✅ [useDashboardStatsCached] Données chargées depuis Supabase');

      // Transformer les données (même logique que useDashboardStatsOptimized)
      return transformOptimizedData(data, defaultOptions);
    },
    ...defaultOptions,
    // Stratégies de cache avancées
    retry: (failureCount, error) => {
      // Retry intelligent: pas de retry pour erreurs 4xx, retry limité pour 5xx
      if (error?.code && error.code >= 400 && error.code < 500) {
        return false; // Pas de retry pour erreurs client
      }
      return failureCount < 3; // Maximum 3 retries pour erreurs serveur
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponentiel
  });

  // Mutation pour rafraîchir manuellement les données
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error('Aucune boutique sélectionnée');

      logger.info('🔄 [useDashboardStatsCached] Rafraîchissement manuel');

      const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
        store_id: store.id,
        period_days: defaultOptions.period === '7d' ? 7 :
                    defaultOptions.period === '90d' ? 90 : 30,
      });

      if (error) throw error;
      return transformOptimizedData(data, defaultOptions);
    },
    onSuccess: (data) => {
      // Mettre à jour le cache avec les nouvelles données
      queryClient.setQueryData(queryKey, data);
      logger.info('✅ [useDashboardStatsCached] Cache mis à jour manuellement');
    },
    onError: (error) => {
      logger.error('❌ [useDashboardStatsCached] Erreur rafraîchissement:', error);
    },
  });

  // Invalidation intelligente du cache lors de changements externes
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.stats(store?.id || ''),
      refetchType: 'active', // Ne refetch que les queries actives
    });
    logger.info('🔄 [useDashboardStatsCached] Cache invalidé');
  }, [queryClient, store?.id]);

  // Préchargement intelligent pour périodes adjacentes
  useEffect(() => {
    if (!store?.id || !query.data) return;

    // Précharger la période suivante (lazy prefetching)
    const nextPeriod = defaultOptions.period === '7d' ? '30d' :
                      defaultOptions.period === '30d' ? '90d' : null;

    if (nextPeriod) {
      const nextQueryKey = dashboardQueryKeys.statsFull(store.id, { ...defaultOptions, period: nextPeriod });
      queryClient.prefetchQuery({
        queryKey: nextQueryKey,
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
            store_id: store.id,
            period_days: nextPeriod === '7d' ? 7 :
                        nextPeriod === '90d' ? 90 : 30,
          });
          if (error) throw error;
          return transformOptimizedData(data, { ...defaultOptions, period: nextPeriod });
        },
        staleTime: 10 * 60 * 1000, // Préchargement moins agressif
      });
    }
  }, [store?.id, query.data, defaultOptions.period, queryClient]);

  // Métriques de performance du cache
  const cacheMetrics = {
    isStale: query.isStale,
    dataUpdatedAt: query.dataUpdatedAt,
    errorUpdatedAt: query.errorUpdatedAt,
    failureCount: query.failureCount,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
  };

  return {
    // Données principales
    stats: query.data,
    loading: query.isLoading,
    error: query.error?.message || null,
    isError: query.isError,
    isSuccess: query.isSuccess,

    // Cache et performance
    isStale: query.isStale,
    cacheMetrics,

    // Actions
    refetch: query.refetch,
    refresh: refreshMutation.mutate,
    invalidateCache,
    isRefreshing: refreshMutation.isPending,

    // Métadonnées
    lastUpdated: query.dataUpdatedAt,
    queryKey,
  };
};

// Fonction utilitaire pour transformer les données (extraite pour réutilisation)
// La fonction transformOptimizedData du hook useDashboardStatsOptimizedBase est maintenant utilisée directement.

// Hook utilitaire pour précharger plusieurs périodes
export const useDashboardStatsBulk = (storeId: string, periods: string[] = ['7d', '30d', '90d']) => {
  const queryClient = useQueryClient();

  const preloadAll = useCallback(async () => {
    const promises = periods.map(async (period) => {
      const queryKey = dashboardQueryKeys.statsWithPeriod(storeId, period);
      return queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
            store_id: storeId,
            period_days: period === '7d' ? 7 : period === '90d' ? 90 : 30,
          });
          if (error) throw error;
          return transformOptimizedData(data, { period: period, customStartDate: options.customStartDate, customEndDate: options.customEndDate });
        },
        staleTime: 5 * 60 * 1000,
      });
    });

    await Promise.all(promises);
    logger.info('✅ [useDashboardStatsBulk] Toutes les périodes préchargées');
  }, [storeId, periods, queryClient]);

  return { preloadAll };
};