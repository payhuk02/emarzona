/**
 * Hook pour les recommandations IA avancées
 * Fournit une interface React pour le moteur de recommandations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import {
  RecommendationService,
  type ProductRecommendation,
  type UserBehavior,
  type RecommendationResult
} from '@/lib/recommendations/ai-recommendation-engine';
import { useStore } from './useStore';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

interface UseProductRecommendationsOptions {
  productId: string;
  limit?: number;
  enabled?: boolean;
}

interface UseUserRecommendationsOptions {
  limit?: number;
  enabled?: boolean;
}

interface UseTrendingRecommendationsOptions {
  limit?: number;
  enabled?: boolean;
  refreshInterval?: number;
}

/**
 * Hook pour obtenir des recommandations de produits similaires
 */
export function useProductRecommendations({
  productId,
  limit = 6,
  enabled = true
}: UseProductRecommendationsOptions) {
  const { store } = useStore();

  return useQuery({
    queryKey: ['recommendations', 'product', productId, limit, store?.id],
    queryFn: async (): Promise<ProductRecommendation[]> => {
      logger.debug('Fetching product recommendations', { productId, limit });
      return await RecommendationService.getProductRecommendations(productId, store?.id, limit);
    },
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook pour obtenir des recommandations personnalisées pour l'utilisateur
 */
export function useUserRecommendations({
  limit = 12,
  enabled = true
}: UseUserRecommendationsOptions = {}) {
  const { store } = useStore();

  return useQuery({
    queryKey: ['recommendations', 'user', store?.id, limit],
    queryFn: async (): Promise<ProductRecommendation[]> => {
      if (!store?.id) return [];

      logger.debug('Fetching user recommendations', { userId: store.id, limit });
      return await RecommendationService.getUserRecommendations(store.id, limit);
    },
    enabled: enabled && !!store?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

/**
 * Hook pour obtenir des recommandations de produits tendance
 */
export function useTrendingRecommendations({
  limit = 8,
  enabled = true,
  refreshInterval = 30 * 60 * 1000 // 30 minutes
}: UseTrendingRecommendationsOptions = {}) {

  return useQuery({
    queryKey: ['recommendations', 'trending', limit],
    queryFn: async (): Promise<ProductRecommendation[]> => {
      logger.debug('Fetching trending recommendations', { limit });
      return await RecommendationService.getTrendingRecommendations(limit);
    },
    enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 heure
    refetchInterval: refreshInterval,
    retry: 2,
  });
}

/**
 * Hook pour obtenir des recommandations contextuelles (combinées)
 */
export function useContextualRecommendations(options: {
  productId?: string;
  limit?: number;
  enabled?: boolean;
} = {}) {
  const { productId, limit = 10, enabled = true } = options;
  const { store } = useStore();

  // Récupérer différents types de recommandations
  const productRecs = useProductRecommendations({
    productId: productId!,
    limit: Math.floor(limit / 2),
    enabled: enabled && !!productId
  });

  const userRecs = useUserRecommendations({
    limit: Math.floor(limit / 2),
    enabled: enabled && !productId // Priorité aux recs produit si disponible
  });

  const trendingRecs = useTrendingRecommendations({
    limit: Math.floor(limit / 3),
    enabled
  });

  // Combiner et dédupliquer les recommandations
  const combinedRecommendations = useMemo(() => {
    const allRecs: ProductRecommendation[] = [];

    // Ajouter les recommandations produit (priorité haute)
    if (productRecs.data) {
      allRecs.push(...productRecs.data);
    }

    // Ajouter les recommandations utilisateur (priorité moyenne)
    if (userRecs.data) {
      // Éviter les doublons avec les recs produit
      const existingIds = new Set(allRecs.map(r => r.productId));
      allRecs.push(...userRecs.data.filter(r => !existingIds.has(r.productId)));
    }

    // Ajouter les recommandations tendance (priorité basse)
    if (trendingRecs.data) {
      // Éviter les doublons
      const existingIds = new Set(allRecs.map(r => r.productId));
      allRecs.push(...trendingRecs.data.filter(r => !existingIds.has(r.productId)));
    }

    // Limiter et trier par score
    return allRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  }, [productRecs.data, userRecs.data, trendingRecs.data, limit]);

  const isLoading = productRecs.isLoading || userRecs.isLoading || trendingRecs.isLoading;
  const error = productRecs.error || userRecs.error || trendingRecs.error;

  return {
    recommendations: combinedRecommendations,
    isLoading,
    error,
    // États individuels pour le debugging
    productRecs: productRecs.data,
    userRecs: userRecs.data,
    trendingRecs: trendingRecs.data,
  };
}

/**
 * Hook pour tracker les actions utilisateur (pour améliorer les recommandations)
 */
export function useRecommendationTracking() {
  const queryClient = useQueryClient();
  const { store } = useStore();

  const trackMutation = useMutation({
    mutationFn: async ({
      productId,
      action,
      context
    }: {
      productId: string;
      action: UserBehavior['action'];
      context?: Partial<UserBehavior['context']>;
    }) => {
      if (!store?.id) {
        throw new Error('User not authenticated');
      }

      await RecommendationService.trackUserAction(store.id, productId, action, context);
    },
    onSuccess: () => {
      // Invalider les caches de recommandations pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
    onError: (error) => {
      logger.error('Error tracking user action for recommendations', { error });
    }
  });

  // Fonctions utilitaires pour différents types d'actions
  const trackView = useCallback((productId: string, context?: Partial<UserBehavior['context']>) => {
    trackMutation.mutate({ productId, action: 'view', context });
  }, [trackMutation]);

  const trackCart = useCallback((productId: string, context?: Partial<UserBehavior['context']>) => {
    trackMutation.mutate({ productId, action: 'cart', context });
  }, [trackMutation]);

  const trackPurchase = useCallback((productId: string, context?: Partial<UserBehavior['context']>) => {
    trackMutation.mutate({ productId, action: 'purchase', context });
  }, [trackMutation]);

  const trackFavorite = useCallback((productId: string, context?: Partial<UserBehavior['context']>) => {
    trackMutation.mutate({ productId, action: 'favorite', context });
  }, [trackMutation]);

  const trackShare = useCallback((productId: string, context?: Partial<UserBehavior['context']>) => {
    trackMutation.mutate({ productId, action: 'share', context });
  }, [trackMutation]);

  return {
    // Actions de tracking
    trackView,
    trackCart,
    trackPurchase,
    trackFavorite,
    trackShare,

    // État de la mutation
    isTracking: trackMutation.isPending,
    trackingError: trackMutation.error,
  };
}

/**
 * Hook pour mesurer l'efficacité des recommandations
 */
export function useRecommendationAnalytics() {
  const { store } = useStore();

  return useQuery({
    queryKey: ['recommendations', 'analytics', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;

      // Récupérer les métriques d'efficacité des recommandations
      const { data, error } = await supabase
        .from('recommendation_analytics')
        .select('*')
        .eq('store_id', store.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      return data;
    },
    enabled: !!store?.id,
    staleTime: 60 * 60 * 1000, // 1 heure
    retry: 1,
  });
}

/**
 * Hook pour les tests A/B des recommandations
 */
export function useRecommendationABTest() {
  const { store } = useStore();

  // Déterminer le groupe de test pour l'utilisateur
  const testGroup = useMemo(() => {
    if (!store?.id) return 'control';

    // Simple hash-based group assignment pour la cohérence
    const hash = store.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return Math.abs(hash) % 2 === 0 ? 'algorithm-a' : 'algorithm-b';
  }, [store?.id]);

  return {
    testGroup,
    isControlGroup: testGroup === 'control',
    isTestGroup: testGroup !== 'control',
  };
}