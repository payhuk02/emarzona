import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const MISSING_RPC_USER_RECS_KEY = 'emz_missing_rpc:get_user_product_recommendations';

export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  product_slug: string;
  store_id: string;
  store_name: string;
  store_slug: string;
  image_url: string | null;
  price: number;
  promotional_price: number | null;
  currency: string;
  category: string | null;
  product_type: string | null;
  rating: number | null;
  reviews_count: number | null;
  purchases_count: number;
  recommendation_score: number;
  recommendation_reason: string;
  recommendation_type:
    | 'similar'
    | 'category'
    | 'tags'
    | 'popular'
    | 'purchase_history'
    | 'collaborative'
    | 'view_based';
}

export interface FrequentlyBoughtTogether extends ProductRecommendation {
  times_bought_together: number;
  confidence_score?: number;
}

type FrequentlyBoughtTogetherV1Row = Omit<FrequentlyBoughtTogether, 'confidence_score'>;

/**
 * Hook pour obtenir des recommandations de produits basées sur un produit
 */
export function useProductRecommendations(
  productId: string | null,
  limit: number = 6,
  enabled: boolean = true
) {
  return useQuery<ProductRecommendation[]>({
    queryKey: ['product-recommendations', productId, limit],
    queryFn: async () => {
      if (!productId) {
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('get_product_recommendations', {
          p_product_id: productId,
          p_limit: limit,
        });

        if (error) {
          const errorCode = error.code;
          const errorMessage = error.message || '';

          if (errorCode === '42883' || errorMessage.includes('does not exist')) {
            logger.warn('get_product_recommendations function does not exist.');
            return [];
          }

          if (errorCode === 'PGRST116' || errorMessage.includes('Bad Request')) {
            logger.warn('Bad Request error for get_product_recommendations.');
            return [];
          }

          logger.warn('Error fetching product recommendations (non-critical):', {
            code: errorCode,
            message: errorMessage,
          });

          return [];
        }

        return (data || []) as ProductRecommendation[];
      } catch (error) {
        logger.warn('Exception in useProductRecommendations:', error);
        return [];
      }
    },
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Ne pas réessayer en cas d'erreur pour éviter le spam console
  });
}

/**
 * Hook pour obtenir des recommandations personnalisées basées sur l'historique d'achat
 */
export function useUserProductRecommendations(
  userId: string | null,
  limit: number = 6,
  enabled: boolean = true
) {
  return useQuery<ProductRecommendation[]>({
    queryKey: ['user-product-recommendations', userId, limit],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      // Éviter d'appeler en boucle une RPC absente (améliore perf et réduit le bruit console)
      if (typeof window !== 'undefined') {
        const isMissing = window.localStorage.getItem(MISSING_RPC_USER_RECS_KEY) === '1';
        if (isMissing) {
          return [];
        }
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        logger.warn('Invalid userId format for recommendations:', userId);
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('get_user_product_recommendations', {
          p_user_id: userId,
          p_limit: limit,
        });

        if (error) {
          const errorCode = error.code;
          const errorMessage = error.message || '';

          if (errorCode === '42883' || errorMessage.includes('does not exist')) {
            logger.warn('get_user_product_recommendations function does not exist.');
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(MISSING_RPC_USER_RECS_KEY, '1');
            }
            return [];
          }

          logger.warn('Error fetching user recommendations (non-critical):', {
            code: errorCode,
            message: errorMessage,
          });

          return [];
        }

        return (data || []) as ProductRecommendation[];
      } catch (error) {
        logger.warn('Exception in useUserProductRecommendations:', error);
        return [];
      }
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook pour obtenir des recommandations collaboratives (filtrage collaboratif)
 */
export function useCollaborativeRecommendations(
  userId: string | null,
  limit: number = 10,
  enabled: boolean = true
) {
  return useQuery<ProductRecommendation[]>({
    queryKey: ['collaborative-recommendations', userId, limit],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('get_collaborative_recommendations', {
          p_user_id: userId,
          p_limit: limit,
        });

        if (error) {
          const errorCode = error.code;
          const errorMessage = error.message || '';

          if (errorCode === '42883' || errorMessage.includes('does not exist')) {
            logger.warn('get_collaborative_recommendations function does not exist.');
            return [];
          }

          logger.warn('Error fetching collaborative recommendations:', {
            code: errorCode,
            message: errorMessage,
          });

          return [];
        }

        return (data || []) as ProductRecommendation[];
      } catch (error) {
        logger.warn('Exception in useCollaborativeRecommendations:', error);
        return [];
      }
    },
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (plus stable)
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook pour obtenir des produits "Fréquemment achetés ensemble"
 */
export function useFrequentlyBoughtTogether(
  productId: string | null,
  limit: number = 4,
  enabled: boolean = true
) {
  return useQuery<FrequentlyBoughtTogether[]>({
    queryKey: ['frequently-bought-together', productId, limit],
    queryFn: async () => {
      if (!productId) {
        return [];
      }

      try {
        // Essayer d'abord la version v2 améliorée
        const { data, error } = await supabase.rpc('get_frequently_bought_together_v2', {
          p_product_id: productId,
          p_limit: limit,
        });

        if (error) {
          const errorCode = error.code;
          const errorMessage = error.message || '';

          // Si v2 n'existe pas, essayer v1
          if (errorCode === '42883' || errorMessage.includes('does not exist')) {
            const { data: v1Data, error: v1Error } = await supabase.rpc(
              'get_frequently_bought_together',
              {
                p_product_id: productId,
                p_limit: limit,
              }
            );

            if (v1Error) {
              logger.warn('Both frequently_bought_together functions do not exist.');
              return [];
            }

            return (v1Data || []).map((item: FrequentlyBoughtTogetherV1Row) => ({
              ...item,
              confidence_score: undefined,
            })) as FrequentlyBoughtTogether[];
          }

          logger.warn('Error fetching frequently bought together:', {
            code: errorCode,
            message: errorMessage,
          });

          return [];
        }

        return (data || []) as FrequentlyBoughtTogether[];
      } catch (error) {
        logger.warn('Exception in useFrequentlyBoughtTogether:', error);
        return [];
      }
    },
    enabled: enabled && !!productId,
    staleTime: 15 * 60 * 1000, // 15 minutes (données plus stables)
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook pour obtenir des recommandations basées sur les vues
 */
export function useViewBasedRecommendations(
  productId: string | null,
  limit: number = 6,
  enabled: boolean = true
) {
  return useQuery<ProductRecommendation[]>({
    queryKey: ['view-based-recommendations', productId, limit],
    queryFn: async () => {
      if (!productId) {
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('get_view_based_recommendations', {
          p_product_id: productId,
          p_limit: limit,
        });

        if (error) {
          const errorCode = error.code;
          const errorMessage = error.message || '';

          if (errorCode === '42883' || errorMessage.includes('does not exist')) {
            logger.warn('get_view_based_recommendations function does not exist.');
            return [];
          }

          logger.warn('Error fetching view-based recommendations:', {
            code: errorCode,
            message: errorMessage,
          });

          return [];
        }

        return (data || []) as ProductRecommendation[];
      } catch (error) {
        logger.warn('Exception in useViewBasedRecommendations:', error);
        return [];
      }
    },
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}






