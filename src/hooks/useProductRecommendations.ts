/**
 * Hook pour les recommandations de produits personnalisées
 * Utilise les préférences de style pour générer des recommandations IA
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import type { StyleProfile } from '@/components/personalization/StyleQuiz';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'] & {
  store?: Database['public']['Tables']['stores']['Row'];
  average_rating?: number;
  total_reviews?: number;
};

interface RecommendationResult {
  products: Product[];
  reasoning: string[];
  confidence: number;
  categories: string[];
}

export function useProductRecommendations() {
  const { user } = useAuth();

  // Obtenir les recommandations personnalisées basées sur le profil de style
  const getPersonalizedRecommendations = async (
    profile: StyleProfile,
    limit: number = 20
  ): Promise<Product[]> => {
    try {
      logger.info('Fetching personalized recommendations', { profile, userId: user?.id });

      // Essayer d'abord la fonction RPC si elle existe
      try {
        // Construire les filtres basés sur le profil
        const filters = buildRecommendationFilters(profile);

        const { data, error } = await supabase.rpc('get_personalized_recommendations', {
          p_user_id: user?.id || null,
          p_style_profile: profile,
          p_filters: filters,
          p_limit: limit
        });

        if (!error && data) {
          logger.info('Personalized recommendations fetched via RPC', {
            count: data?.length || 0,
            profile,
            userId: user?.id
          });
          return data || [];
        }
      } catch (rpcError) {
        logger.warn('RPC get_personalized_recommendations not available, using fallback', { rpcError });
      }

      // Fallback: retourner des produits populaires
      logger.info('Using fallback recommendations', { profile });
      return getFallbackRecommendations(limit);
    } catch (error) {
      logger.error('Failed to get personalized recommendations', { error, profile });
      // Fallback: retourner des produits populaires
      return getFallbackRecommendations(limit);
    }
  };

  // Hook pour les recommandations générales
  const {
    data: recommendations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['personalized-recommendations', user?.id],
    queryFn: async (): Promise<RecommendationResult | null> => {
      if (!user?.id) return null;

      // Récupérer les préférences de style d'abord
      const { data: preferences } = await supabase
        .from('user_style_preferences')
        .select('profile')
        .eq('user_id', user.id)
        .single();

      if (!preferences?.profile) return null;

      const products = await getPersonalizedRecommendations(preferences.profile);

      return {
        products,
        reasoning: generateRecommendationReasoning(preferences.profile),
        confidence: calculateConfidenceScore(preferences.profile),
        categories: extractProductCategories(products)
      };
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Recommandations similaires à un produit
  const getSimilarProducts = async (
    productId: string,
    limit: number = 8
  ): Promise<Product[]> => {
    try {
      const { data, error } = await supabase.rpc('get_similar_products', {
        p_product_id: productId,
        p_user_id: user?.id || null,
        p_limit: limit
      });

      if (error) {
        logger.error('Error fetching similar products', { error, productId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get similar products', { error, productId });
      return [];
    }
  };

  // Recommandations basées sur l'historique d'achat
  const getHistoryBasedRecommendations = async (limit: number = 15): Promise<Product[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase.rpc('get_history_based_recommendations', {
        p_user_id: user.id,
        p_limit: limit
      });

      if (error) {
        logger.error('Error fetching history-based recommendations', { error, userId: user.id });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get history-based recommendations', { error, userId: user.id });
      return [];
    }
  };

  // Recommandations tendance
  const getTrendingRecommendations = async (limit: number = 12): Promise<Product[]> => {
    try {
      const { data, error } = await supabase.rpc('get_trending_recommendations', {
        p_limit: limit,
        p_user_id: user?.id || null
      });

      if (error) {
        logger.error('Error fetching trending recommendations', { error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get trending recommendations', { error });
      return getFallbackRecommendations(limit);
    }
  };

  return {
    recommendations,
    isLoading,
    error,
    refetch,
    getPersonalizedRecommendations,
    getSimilarProducts,
    getHistoryBasedRecommendations,
    getTrendingRecommendations,
    hasPreferences: !!recommendations?.products?.length,
    confidenceScore: recommendations?.confidence || 0
  };
}

// Fonctions utilitaires privées

function buildRecommendationFilters(profile: StyleProfile) {
  const filters: Record<string, string | number | boolean> = {};

  // Filtres basés sur le budget
  switch (profile.budgetRange) {
    case 'budget':
      filters.max_price = 50;
      break;
    case 'midrange':
      filters.min_price = 30;
      filters.max_price = 200;
      break;
    case 'premium':
      filters.min_price = 150;
      filters.max_price = 1000;
      break;
    case 'luxury':
      filters.min_price = 500;
      break;
  }

  // Filtres basés sur les préférences de couleur et style
  filters.style_tags = [profile.aesthetic, profile.colorPalette];
  filters.occasion_tags = [profile.occasionFocus];

  // Préférences de durabilité
  if (profile.sustainability === 'very_important') {
    filters.sustainability_only = true;
  } else if (profile.sustainability === 'somewhat') {
    filters.include_sustainable = true;
  }

  return filters;
}

function generateRecommendationReasoning(profile: StyleProfile): string[] {
  const reasoning = [];

  switch (profile.aesthetic) {
    case 'minimalist':
      reasoning.push('Style épuré et fonctionnel');
      break;
    case 'bohemian':
      reasoning.push('Esthétique artistique et libre');
      break;
    case 'luxury':
      reasoning.push('Produits haut de gamme et raffinés');
      break;
    case 'streetwear':
      reasoning.push('Style urbain et contemporain');
      break;
  }

  switch (profile.budgetRange) {
    case 'budget':
      reasoning.push('Sélection dans votre gamme de prix abordable');
      break;
    case 'luxury':
      reasoning.push('Pièces exceptionnelles pour les occasions spéciales');
      break;
  }

  if (profile.sustainability === 'very_important') {
    reasoning.push('Focus sur les produits durables et éthiques');
  }

  return reasoning;
}

function calculateConfidenceScore(profile: StyleProfile): number {
  // Score basé sur la complétude du profil
  let score = 50; // Base score

  // Bonus pour les préférences bien définies
  if (profile.aesthetic) score += 10;
  if (profile.colorPalette) score += 10;
  if (profile.budgetRange) score += 10;
  if (profile.occasionFocus) score += 10;
  if (profile.sustainability !== 'not_important') score += 10;

  return Math.min(score, 100);
}

function extractProductCategories(products: Product[]): string[] {
  const categories = new Set<string>();

  products.forEach(product => {
    if (product.category) {
      categories.add(product.category);
    }
  });

  return Array.from(categories);
}

// Hook pour les produits fréquemment achetés ensemble
export function useFrequentlyBoughtTogether(productId: string, limit: number = 4) {
  return useQuery({
    queryKey: ['frequently-bought-together', productId, limit],
    queryFn: async (): Promise<Product[]> => {
      try {
        // Pour le moment, retourner des produits similaires
        // TODO: Implémenter la vraie logique de produits fréquemment achetés ensemble
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            store:stores(*)
          `)
          .eq('is_active', true)
          .neq('id', productId)
          .limit(limit);

        if (error) throw error;
        return (data || []) as Product[];
      } catch (error) {
        logger.error('Error fetching frequently bought together', { error, productId });
        return [];
      }
    },
    enabled: !!productId
  });
}

async function getFallbackRecommendations(limit: number): Promise<Product[]> {
  // Fallback: produits populaires quand la personnalisation échoue
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        stores(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) // Utiliser created_at au lieu de total_sales
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Fallback recommendations failed', { error });
    return [];
  }
}

// Types et exports supplémentaires pour compatibilité
export interface ProductRecommendation extends Product {}

export function useUserProductRecommendations(userId: string, limit: number = 8) {
  return useQuery({
    queryKey: ['user-product-recommendations', userId, limit],
    queryFn: async (): Promise<Product[]> => {
      try {
        // TODO: Implémenter les vraies recommandations utilisateur
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            store:stores(*)
          `)
          .eq('is_active', true)
          .limit(limit);

        if (error) throw error;
        return (data || []) as Product[];
      } catch (error) {
        logger.error('Error fetching user product recommendations', { error, userId });
        return [];
      }
    },
    enabled: !!userId
  });
}