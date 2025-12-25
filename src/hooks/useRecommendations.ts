/**
 * Hook React pour utiliser le système de recommandations
 */

import { useQuery } from '@tanstack/react-query';
import { recommendationEngine, type RecommendationRequest, type RecommendationResult } from '@/lib/ai/recommendations';

export function useRecommendations(request: RecommendationRequest) {
  return useQuery<RecommendationResult>({
    queryKey: ['recommendations', request.context, request.userId, request.productId, request.categoryId, request.limit],
    queryFn: () => recommendationEngine.getRecommendations(request),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!request.context || !!request.userId || !!request.productId || !!request.categoryId,
  });
}

/**
 * Hook pour obtenir des recommandations basées sur un produit
 */
export function useProductRecommendations(productId: string, limit: number = 10) {
  return useRecommendations({
    productId,
    limit,
    context: 'product',
  });
}

/**
 * Hook pour obtenir des recommandations basées sur une catégorie
 */
export function useCategoryRecommendations(categoryId: string, limit: number = 10) {
  return useRecommendations({
    categoryId,
    limit,
    context: 'category',
  });
}

/**
 * Hook pour obtenir des recommandations pour la page d'accueil
 */
export function useHomeRecommendations(userId?: string, limit: number = 10) {
  return useRecommendations({
    userId,
    limit,
    context: 'home',
  });
}

/**
 * Hook pour obtenir des recommandations basées sur le panier
 */
export function useCartRecommendations(userId: string, limit: number = 10) {
  return useRecommendations({
    userId,
    limit,
    context: 'cart',
  });
}


