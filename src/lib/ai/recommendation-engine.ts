/**
 * Moteur de recommandations IA avancé pour Emarzona
 * Utilise plusieurs algorithmes pour des recommandations personnalisées
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';

type Product = Database['public']['Tables']['products']['Row'];
type User = Database['public']['Tables']['customers']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

export interface RecommendationResult {
  productId: string;
  score: number;
  reason: 'collaborative' | 'content' | 'trending' | 'personal' | 'complementary';
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface RecommendationContext {
  userId?: string;
  productId?: string;
  category?: string;
  productType?: 'digital' | 'physical' | 'service' | 'course' | 'artist'; // Type de produit pour recommandations cohérentes
  sameTypeOnly?: boolean; // Si true, recommande seulement le même type de produit
  limit?: number;
  excludeRecentlyViewed?: boolean;
  includeReasoning?: boolean;
}

interface UserInteraction {
  product_id: string;
}

/**
 * Moteur principal de recommandations
 */
export class RecommendationEngine {
  private readonly MAX_RECOMMENDATIONS = 20;
  private readonly MIN_CONFIDENCE = 0.1;

  /**
   * Obtenir des recommandations personnalisées pour un utilisateur
   */
  async getPersonalizedRecommendations(
    context: RecommendationContext
  ): Promise<RecommendationResult[]> {
    try {
      const {
        userId,
        limit = 10,
        excludeRecentlyViewed = true,
        includeReasoning = false,
      } = context;

      if (!userId) {
        return this.getTrendingRecommendations(limit);
      }

      // Récupérer l'historique de l'utilisateur
      const userHistory = await this.getUserPurchaseHistory(userId);
      const userInteractions = await this.getUserInteractions(userId);

      const recommendations: RecommendationResult[] = [];

      // 1. Recommandations collaboratives (basées sur utilisateurs similaires)
      const collaborative = await this.getCollaborativeRecommendations(userId, userHistory);
      recommendations.push(...collaborative);

      // 2. Recommandations basées sur le contenu (produits similaires)
      const contentBased = await this.getContentBasedRecommendations(userHistory);
      recommendations.push(...contentBased);

      // 3. Produits complémentaires (cross-selling)
      const complementary = await this.getComplementaryRecommendations(userHistory);
      recommendations.push(...complementary);

      // 4. Tendances personnalisées
      const trending = await this.getPersonalizedTrending(userId);
      recommendations.push(...trending);

      // Dédoublonner, scorer et trier
      const uniqueRecommendations = this.deduplicateAndScore(recommendations);

      // Exclure les produits récemment vus si demandé
      let filteredRecommendations = uniqueRecommendations;
      if (excludeRecentlyViewed) {
        const recentlyViewed = await this.getRecentlyViewedProducts(userId);
        filteredRecommendations = uniqueRecommendations.filter(
          rec => !recentlyViewed.includes(rec.productId)
        );
      }

      // Limiter et retourner
      const finalRecommendations = filteredRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      if (includeReasoning) {
        await this.addReasoningToRecommendations(finalRecommendations, userId);
      }

      logger.info('Recommendations generated', {
        userId,
        count: finalRecommendations.length,
        algorithms: ['collaborative', 'content', 'complementary', 'trending'],
      });

      return finalRecommendations;
    } catch (error) {
      logger.error('Error generating personalized recommendations', { error, context });
      return this.getFallbackRecommendations(limit || 10);
    }
  }

  /**
   * Recommandations collaboratives (basées sur utilisateurs similaires)
   */
  private async getCollaborativeRecommendations(
    userId: string,
    userHistory: string[]
  ): Promise<RecommendationResult[]> {
    try {
      // Trouver des utilisateurs similaires basés sur l'historique d'achat
      const { data: similarUsers } = await supabase.rpc('find_similar_users', {
        p_user_id: userId,
        p_limit: 50,
      });

      if (!similarUsers || similarUsers.length === 0) {
        return [];
      }

      // Récupérer les produits achetés par ces utilisateurs similaires
      interface SimilarUser {
        user_id: string;
      }
      const similarUserIds = similarUsers.map((u: SimilarUser) => u.user_id);

      const { data: similarPurchases } = await supabase
        .from('orders')
        .select('items')
        .in('customer_id', similarUserIds)
        .not('customer_id', 'eq', userId)
        .limit(1000);

      if (!similarPurchases) return [];

      // Compter la fréquence des produits
      const productFrequency: Record<string, number> = {};
      interface OrderItem {
        product_id?: string;
      }
      interface Order {
        items?: string;
      }
      similarPurchases.forEach((order: Order) => {
        if (order.items) {
          JSON.parse(order.items).forEach((item: OrderItem) => {
            if (item.product_id) {
              productFrequency[item.product_id] = (productFrequency[item.product_id] || 0) + 1;
            }
          });
        }
      });

      // Exclure les produits déjà achetés par l'utilisateur
      const userPurchasedSet = new Set(userHistory);

      return Object.entries(productFrequency)
        .filter(([productId]) => !userPurchasedSet.has(productId))
        .map(([productId, frequency]) => ({
          productId,
          score: Math.min(frequency / similarUsers.length, 1) * 0.8, // Score max 0.8
          reason: 'collaborative' as const,
          confidence: Math.min(frequency / 10, 1), // Confiance basée sur la fréquence
          metadata: { similarUsers: similarUsers.length, frequency },
        }))
        .filter(rec => rec.confidence >= this.MIN_CONFIDENCE);
    } catch (error) {
      logger.error('Error in collaborative recommendations', { error, userId });
      return [];
    }
  }

  /**
   * Recommandations basées sur le contenu (produits similaires)
   */
  private async getContentBasedRecommendations(
    userHistory: string[]
  ): Promise<RecommendationResult[]> {
    try {
      if (userHistory.length === 0) return [];

      // Récupérer les détails des produits achetés
      const { data: purchasedProducts } = await supabase
        .from('products')
        .select('id, category, tags, description')
        .in('id', userHistory);

      if (!purchasedProducts || purchasedProducts.length === 0) return [];

      // Extraire les catégories et tags préférés
      const categoryCounts: Record<string, number> = {};
      const tagCounts: Record<string, number> = {};
      const keywords: Record<string, number> = {};

      purchasedProducts.forEach(product => {
        if (product.category) {
          categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
        }

        if (product.tags) {
          JSON.parse(product.tags).forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }

        // Analyse basique des mots-clés dans la description
        if (product.description) {
          const words = product.description
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3);

          words.forEach(word => {
            keywords[word] = (keywords[word] || 0) + 1;
          });
        }
      });

      // Trouver des produits similaires
      const topCategories = Object.keys(categoryCounts)
        .sort((a, b) => categoryCounts[b] - categoryCounts[a])
        .slice(0, 3);

      const topTags = Object.keys(tagCounts)
        .sort((a, b) => tagCounts[b] - tagCounts[a])
        .slice(0, 5);

      const { data: similarProducts } = await supabase
        .from('products')
        .select('id, category, tags')
        .or(`category.in.(${topCategories.join(',')}),tags.cs.{${topTags.join(',')}}`)
        .not('id', 'in', `(${userHistory.join(',')})`)
        .limit(50);

      if (!similarProducts) return [];

      // Calculer le score de similarité
      return similarProducts
        .map(product => {
          let similarityScore = 0;
          let reasons = 0;

          // Score basé sur la catégorie
          if (product.category && categoryCounts[product.category]) {
            similarityScore += (categoryCounts[product.category] / purchasedProducts.length) * 0.6;
            reasons++;
          }

          // Score basé sur les tags
          if (product.tags) {
            const productTags = JSON.parse(product.tags);
            const matchingTags = productTags.filter((tag: string) => tagCounts[tag]);
            if (matchingTags.length > 0) {
              similarityScore += (matchingTags.length / productTags.length) * 0.4;
              reasons++;
            }
          }

          return {
            productId: product.id,
            score: similarityScore,
            reason: 'content' as const,
            confidence: reasons > 0 ? Math.min(similarityScore * 1.2, 1) : 0.3,
            metadata: { matchingReasons: reasons, categories: topCategories, tags: topTags },
          };
        })
        .filter(rec => rec.confidence >= this.MIN_CONFIDENCE);
    } catch (error) {
      logger.error('Error in content-based recommendations', { error, userHistory });
      return [];
    }
  }

  /**
   * Produits complémentaires (cross-selling)
   */
  private async getComplementaryRecommendations(
    userHistory: string[]
  ): Promise<RecommendationResult[]> {
    try {
      if (userHistory.length === 0) return [];

      // Analyser les patterns d'achat groupés en utilisant order_items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, product_id')
        .limit(1000);

      if (!orderItems) return [];

      // Grouper les items par commande pour analyser les co-occurrences
      const orderGroups: Record<string, string[]> = {};
      orderItems.forEach(item => {
        if (item.order_id && item.product_id) {
          if (!orderGroups[item.order_id]) {
            orderGroups[item.order_id] = [];
          }
          orderGroups[item.order_id].push(item.product_id);
        }
      });

      // Construire une matrice de co-occurrence
      const coOccurrence: Record<string, Record<string, number>> = {};

      Object.values(orderGroups).forEach(productIds => {
        const validProductIds = productIds.filter(Boolean);

        // Pour chaque paire de produits dans la même commande
        for (let i = 0; i < validProductIds.length; i++) {
          for (let j = i + 1; j < validProductIds.length; j++) {
            const productA = validProductIds[i];
            const productB = validProductIds[j];

            if (!coOccurrence[productA]) coOccurrence[productA] = {};
            if (!coOccurrence[productB]) coOccurrence[productB] = {};

            coOccurrence[productA][productB] = (coOccurrence[productA][productB] || 0) + 1;
            coOccurrence[productB][productA] = (coOccurrence[productB][productA] || 0) + 1;
          }
        }
      });

      const recommendations: RecommendationResult[] = [];

      // Pour chaque produit acheté par l'utilisateur, trouver les complémentaires
      userHistory.forEach(userProductId => {
        const complements = coOccurrence[userProductId];
        if (complements) {
          Object.entries(complements).forEach(([complementId, frequency]) => {
            if (!userHistory.includes(complementId)) {
              recommendations.push({
                productId: complementId,
                score: Math.min(frequency / 10, 1) * 0.7, // Score max 0.7
                reason: 'complementary' as const,
                confidence: Math.min(frequency / 5, 1),
                metadata: { baseProduct: userProductId, frequency },
              });
            }
          });
        }
      });

      return recommendations;
    } catch (error) {
      logger.error('Error in complementary recommendations', { error });
      return [];
    }
  }

  /**
   * Tendances personnalisées
   */
  private async getPersonalizedTrending(userId: string): Promise<RecommendationResult[]> {
    try {
      // Récupérer les catégories préférées de l'utilisateur
      const { data: userCategories } = await supabase.rpc('get_user_preferred_categories', {
        p_user_id: userId,
      });

      if (!userCategories || userCategories.length === 0) {
        return this.getTrendingRecommendations(5);
      }

      // Produits tendance dans les catégories préférées
      const { data: trendingProducts } = await supabase.rpc('get_trending_products_by_categories', {
        p_categories: userCategories,
        p_limit: 10,
        p_days: 30,
      });

      if (!trendingProducts) return [];

      interface TrendingProduct {
        id: string;
        trend_score?: number;
        category?: string;
      }
      return (trendingProducts as TrendingProduct[]).map((product: TrendingProduct) => ({
        productId: product.id,
        score: Math.min(product.trend_score || 0.5, 1) * 0.6,
        reason: 'trending' as const,
        confidence: 0.7,
        metadata: { trendScore: product.trend_score, category: product.category },
      }));
    } catch (error) {
      logger.error('Error in personalized trending', { error, userId });
      return [];
    }
  }

  /**
   * Tendances générales (fallback)
   */
  private async getTrendingRecommendations(limit: number): Promise<RecommendationResult[]> {
    try {
      const { data: trendingProducts } = await supabase.rpc('get_trending_products', {
        p_limit: limit,
        p_days: 7,
      });

      if (!trendingProducts) return [];

      interface TrendingProduct {
        id: string;
        trend_score?: number;
      }
      return (trendingProducts as TrendingProduct[]).map((product: TrendingProduct) => ({
        productId: product.id,
        score: Math.min(product.trend_score || 0.5, 1) * 0.5,
        reason: 'trending' as const,
        confidence: 0.6,
        metadata: { trendScore: product.trend_score },
      }));
    } catch (error) {
      logger.error('Error getting trending recommendations', { error });
      return [];
    }
  }

  /**
   * Utilitaires privés
   */
  private async getUserPurchaseHistory(userId: string): Promise<string[]> {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('items')
        .eq('customer_id', userId)
        .limit(100);

      if (!orders) return [];

      const productIds = new Set<string>();
      interface OrderItem {
        product_id?: string;
      }
      orders.forEach(order => {
        if (order.items) {
          JSON.parse(order.items).forEach((item: OrderItem) => {
            if (item.product_id) {
              productIds.add(item.product_id);
            }
          });
        }
      });

      return Array.from(productIds);
    } catch (error) {
      logger.error('Error getting user purchase history', { error, userId });
      return [];
    }
  }

  private async getUserInteractions(userId: string): Promise<UserInteraction[]> {
    // Implémentation pour récupérer les interactions utilisateur (views, wishlist, etc.)
    return [];
  }

  private async getRecentlyViewedProducts(userId: string): Promise<string[]> {
    try {
      // Récupérer les produits récemment vus (implémentation simplifiée)
      const { data: views } = await supabase
        .from('orders')
        .select('customer_id')
        .not('customer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000)
        .select('product_id')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(20);

      return views?.map(v => v.product_id).filter(Boolean) || [];
    } catch {
      return [];
    }
  }

  private deduplicateAndScore(recommendations: RecommendationResult[]): RecommendationResult[] {
    const productMap = new Map<string, RecommendationResult>();

    recommendations.forEach(rec => {
      if (productMap.has(rec.productId)) {
        const existing = productMap.get(rec.productId)!;
        // Combiner les scores (moyenne pondérée)
        const newScore = (existing.score + rec.score) / 2;
        const newConfidence = Math.max(existing.confidence, rec.confidence);

        productMap.set(rec.productId, {
          ...existing,
          score: newScore,
          confidence: newConfidence,
          metadata: { ...existing.metadata, ...rec.metadata, combined: true },
        });
      } else {
        productMap.set(rec.productId, rec);
      }
    });

    return Array.from(productMap.values());
  }

  private async addReasoningToRecommendations(
    recommendations: RecommendationResult[],
    userId: string
  ): Promise<void> {
    // Ajouter des explications textuelles pour chaque recommandation
    for (const rec of recommendations) {
      switch (rec.reason) {
        case 'collaborative':
          rec.metadata = {
            ...rec.metadata,
            reasoning: `${Math.round(rec.confidence * 100)}% des utilisateurs similaires ont acheté ce produit`,
          };
          break;
        case 'content':
          rec.metadata = {
            ...rec.metadata,
            reasoning: 'Produit similaire à vos achats précédents',
          };
          break;
        case 'complementary':
          rec.metadata = {
            ...rec.metadata,
            reasoning: 'Complète souvent vos achats',
          };
          break;
        case 'trending':
          rec.metadata = {
            ...rec.metadata,
            reasoning: 'Tendance populaire dans vos catégories préférées',
          };
          break;
      }
    }
  }

  private async getFallbackRecommendations(limit: number): Promise<RecommendationResult[]> {
    // Recommandations de fallback en cas d'erreur
    return this.getTrendingRecommendations(limit);
  }
}

// Instance globale
export const recommendationEngine = new RecommendationEngine();

// Hook React pour utiliser les recommandations
export function useAIRecommendations(context: RecommendationContext) {
  return useQuery({
    queryKey: ['ai-recommendations', context],
    queryFn: () => recommendationEngine.getPersonalizedRecommendations(context),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fonction utilitaire pour précharger des recommandations
export async function preloadRecommendations(userId: string): Promise<void> {
  try {
    await recommendationEngine.getPersonalizedRecommendations({
      userId,
      limit: 5,
      excludeRecentlyViewed: true,
      includeReasoning: false,
    });
  } catch (error) {
    logger.error('Error preloading recommendations', { error, userId });
  }
}
