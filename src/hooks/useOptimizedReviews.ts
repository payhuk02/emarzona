/**
 * Hook optimisé pour les reviews avec cache intelligent
 * Date : 27 octobre 2025
 */

import { useQueryClient } from '@tanstack/react-query';
import { useProductReviews, useProductReviewStats } from './useReviews';
import { useEffect } from 'react';

/**
 * Hook avec préchargement intelligent des reviews
 */
export const useOptimizedProductReviews = (productId: string, params?: any) => {
  const queryClient = useQueryClient();
  
  // Query principale
  const reviewsQuery = useProductReviews(productId, {
    ...params,
    // Cache plus long pour les reviews (ils changent rarement)
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const statsQuery = useProductReviewStats(productId);

  // Préchargement des reviews populaires au hover
  useEffect(() => {
    if (reviewsQuery.data && reviewsQuery.data.length > 0) {
      // Précharger les images des reviews dans le navigateur
      reviewsQuery.data.forEach((review: any) => {
        if (review.review_media && Array.isArray(review.review_media)) {
          review.review_media.forEach((media: any) => {
            if (media.media_type === 'image') {
              const img = new Image();
              img.src = media.media_url;
            }
          });
        }
      });
    }
  }, [reviewsQuery.data]);

  return {
    reviews: reviewsQuery.data || [],
    stats: statsQuery.data,
    isLoading: reviewsQuery.isLoading || statsQuery.isLoading,
    error: reviewsQuery.error || statsQuery.error,
    refetch: reviewsQuery.refetch,
  };
};

/**
 * Préchargement des reviews d'un produit
 * À utiliser sur hover d'un ProductCard par exemple
 */
export const usePrefetchProductReviews = () => {
  const queryClient = useQueryClient();

  return {
    prefetchReviews: async (productId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['product-reviews', productId],
        staleTime: 10 * 60 * 1000,
      });
    },
    prefetchStats: async (productId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['product-review-stats', productId],
        staleTime: 10 * 60 * 1000,
      });
    },
  };
};

/**
 * Hook avec optimistic updates pour les votes
 */
export const useOptimisticVote = (reviewId: string, productId: string) => {
  const queryClient = useQueryClient();

  const optimisticUpdate = (voteType: 'helpful' | 'not_helpful', increment: boolean) => {
    queryClient.setQueryData(
      ['product-reviews', productId],
      (old: any) => {
        if (!old) return old;
        
        return old.map((review: any) => {
          if (review.id === reviewId) {
            const key = voteType === 'helpful' ? 'helpful_count' : 'not_helpful_count';
            return {
              ...review,
              [key]: increment ? review[key] + 1 : review[key] - 1,
            };
          }
          return review;
        });
      }
    );
  };

  return { optimisticUpdate };
};

/**
 * Hook pour invalidation sélective du cache
 */
export const useReviewsCacheControl = () => {
  const queryClient = useQueryClient();

  return {
    // Invalider seulement les reviews d'un produit
    invalidateProductReviews: (productId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['product-reviews', productId],
      });
    },
    // Invalider seulement les stats
    invalidateReviewStats: (productId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['product-review-stats', productId],
      });
    },
    // Clear tout le cache reviews (utile après logout)
    clearAllReviewsCache: () => {
      queryClient.removeQueries({
        queryKey: ['product-reviews'],
      });
      queryClient.removeQueries({
        queryKey: ['product-review-stats'],
      });
    },
    // Précharger plusieurs reviews à la fois (ex: page marketplace)
    prefetchMultipleReviews: async (productIds: string[]) => {
      await Promise.all(
        productIds.map((productId) =>
          queryClient.prefetchQuery({
            queryKey: ['product-review-stats', productId],
            staleTime: 10 * 60 * 1000,
          })
        )
      );
    },
  };
};

