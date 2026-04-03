/**
 * Moteur de recommandations IA avancé pour Emarzona
 * Utilise l'analyse comportementale pour des recommandations personnalisées
 */

import { logger } from '../logger';
import { supabase } from '@/integrations/supabase/client';

export interface UserBehavior {
  userId: string;
  productId: string;
  action: 'view' | 'cart' | 'purchase' | 'favorite' | 'share';
  timestamp: Date;
  duration?: number; // durée de visualisation en secondes
  context?: {
    category?: string;
    price?: number;
    tags?: string[];
    referrer?: string;
  };
}

export interface RecommendationContext {
  userId?: string;
  productId?: string;
  category?: string;
  productType?: 'digital' | 'physical' | 'service' | 'course' | 'artist'; // Type de produit pour recommandations cohérentes
  sameTypeOnly?: boolean; // Si true, recommande seulement le même type de produit
  currentSession?: {
    viewedProducts: string[];
    cartItems: string[];
    searchTerms: string[];
  };
  userHistory?: {
    purchasedProducts: string[];
    favoriteCategories: string[];
    favoriteProductTypes?: ('digital' | 'physical' | 'service' | 'course' | 'artist')[]; // Types de produits préférés
    averageOrderValue: number;
    lastPurchaseDate?: Date;
  };
}

export interface ProductRecommendation {
  productId: string;
  score: number;
  reason: 'behavioral' | 'collaborative' | 'content' | 'trending' | 'personalized';
  confidence: number;
  metadata: {
    category?: string;
    price?: number;
    tags?: string[];
    productType?: 'digital' | 'physical' | 'service' | 'course' | 'artist'; // Type de produit recommandé
    reasonText?: string;
  };
}

export interface RecommendationResult {
  recommendations: ProductRecommendation[];
  algorithm: string;
  processingTime: number;
  contextUsed: string[];
}

/**
 * Moteur principal de recommandations IA
 */
export class AIRecommendationEngine {
  private readonly MAX_RECOMMENDATIONS = 20;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.3;

  /**
   * Génère des recommandations personnalisées pour un utilisateur
   */
  async generateRecommendations(context: RecommendationContext): Promise<RecommendationResult> {
    const startTime = Date.now();

    try {
      logger.info('Generating AI recommendations', { context });

      // Récupérer les données comportementales de l'utilisateur
      const userBehavior = await this.getUserBehaviorData(context.userId);

      // Calculer différents types de recommandations
      const [behavioralRecs, collaborativeRecs, contentRecs, trendingRecs] = await Promise.all([
        this.generateBehavioralRecommendations(context, userBehavior),
        this.generateCollaborativeRecommendations(context),
        this.generateContentBasedRecommendations(context),
        this.generateTrendingRecommendations(context)
      ]);

      // Fusionner et scorer les recommandations
      const allRecommendations = this.mergeRecommendations([
        ...behavioralRecs,
        ...collaborativeRecs,
        ...contentRecs,
        ...trendingRecs
      ]);

      // Trier par score et filtrer
      const filteredRecommendations = allRecommendations
        .filter(rec => rec.confidence >= this.MIN_CONFIDENCE_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, this.MAX_RECOMMENDATIONS);

      const processingTime = Date.now() - startTime;

      return {
        recommendations: filteredRecommendations,
        algorithm: 'hybrid-ai-v1',
        processingTime,
        contextUsed: this.analyzeContextUsage(context)
      };

    } catch (error) {
      logger.error('Error generating recommendations', { error, context });
      return {
        recommendations: [],
        algorithm: 'fallback',
        processingTime: Date.now() - startTime,
        contextUsed: []
      };
    }
  }

  /**
   * Enregistre le comportement d'un utilisateur
   */
  async trackUserBehavior(behavior: UserBehavior): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_behavior_tracking')
        .insert({
          user_id: behavior.userId,
          product_id: behavior.productId,
          action: behavior.action,
          timestamp: behavior.timestamp.toISOString(),
          duration: behavior.duration,
          context: behavior.context
        });

      if (error) throw error;

      logger.debug('User behavior tracked', { behavior });

    } catch (error) {
      logger.error('Error tracking user behavior', { error, behavior });
    }
  }

  /**
   * Récupère les données comportementales d'un utilisateur
   */
  private async getUserBehaviorData(userId?: string): Promise<UserBehavior[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('user_behavior_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data.map(item => ({
        userId: item.user_id,
        productId: item.product_id,
        action: item.action,
        timestamp: new Date(item.timestamp),
        duration: item.duration,
        context: item.context
      }));

    } catch (error) {
      logger.error('Error fetching user behavior data', { error, userId });
      return [];
    }
  }

  /**
   * Génère des recommandations basées sur le comportement de l'utilisateur
   */
  private async generateBehavioralRecommendations(
    context: RecommendationContext,
    userBehavior: UserBehavior[]
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    if (!userBehavior.length) return recommendations;

    // Analyser les produits récemment consultés
    const recentViews = userBehavior
      .filter(b => b.action === 'view')
      .slice(0, 10);

    // Trouver des produits similaires
    for (const behavior of recentViews) {
      // Par défaut, recommander le même type pour cohérence comportementale
      const similarProducts = await this.findSimilarProducts(behavior.productId, true);
      similarProducts.forEach(product => {
        recommendations.push({
          productId: product.id,
          score: this.calculateBehavioralScore(behavior, product),
          reason: 'behavioral',
          confidence: 0.8,
          metadata: {
            category: product.category,
            price: product.price,
            tags: product.tags,
            productType: product.product_type,
            reasonText: `Parce que vous avez regardé ${behavior.context?.category || 'ce type de produit'}`
          }
        });
      });
    }

    return recommendations;
  }

  /**
   * Génère des recommandations collaboratives (produits populaires chez les utilisateurs similaires)
   */
  private async generateCollaborativeRecommendations(context: RecommendationContext): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    if (!context.userId) return recommendations;

    try {
      // Trouver les utilisateurs avec un comportement similaire
      // Utiliser la signature standardisée p_user_id et p_limit
      const { data: similarUsers, error } = await supabase
        .rpc('find_similar_users', {
          p_user_id: context.userId,
          p_limit: 50
        });

      if (error || !similarUsers?.length) return recommendations;

      // Récupérer les produits populaires chez ces utilisateurs
      const userIds = similarUsers.map((u: any) => u.user_id);
      const { data: popularProducts, error: productsError } = await supabase
        .rpc('get_popular_products_by_users', {
          p_user_ids: userIds,
          p_action: 'purchase',
          p_limit: 10,
          p_product_type: context.productType || null // Filtrer par type si spécifié
        });

      if (productsError || !popularProducts?.length) return recommendations;

      for (const product of popularProducts) {
        recommendations.push({
          productId: product.product_id,
          score: parseInt(product.popularity) * 0.1,
          reason: 'collaborative',
          confidence: 0.7,
          metadata: {
            productType: product.product_type,
            reasonText: 'Populaire chez les utilisateurs avec des goûts similaires'
          }
        });
      }

      // Si un type de produit est spécifié, filtrer pour ce type
      if (context.productType) {
        // Récupérer les types des produits recommandés pour filtrer
        const productIds = recommendations.map(r => r.productId);
        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from('products')
            .select('id, product_type')
            .in('id', productIds);

          if (productsData) {
            // Filtrer pour garder seulement le même type
            const filteredRecs = recommendations.filter(rec => {
              const product = productsData.find(p => p.id === rec.productId);
              return product?.product_type === context.productType;
            });

            // Si on a des résultats filtrés, les utiliser
            if (filteredRecs.length > 0) {
              return filteredRecs;
            }
          }
        }
      }

    } catch (error) {
      logger.error('Error generating collaborative recommendations', { error });
    }

    return recommendations;
  }

  /**
   * Génère des recommandations basées sur le contenu du produit actuel
   * Prend en compte le type de produit pour des recommandations cohérentes
   */
  private async generateContentBasedRecommendations(context: RecommendationContext): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    if (!context.productId) return recommendations;

    try {
      // Utiliser sameTypeOnly du contexte ou true par défaut pour cohérence
      // Si productType est spécifié, on force sameTypeOnly pour cohérence
      const sameTypeOnly = context.productType ? true : (context.sameTypeOnly !== false);
      const similarProducts = await this.findSimilarProducts(context.productId, sameTypeOnly);

      // Calculer les scores de similarité en parallèle
      const similarityScores = await Promise.all(
        similarProducts.map(product => 
          this.calculateContentSimilarity(context.productId!, product.id)
        )
      );

      similarProducts.forEach((product, index) => {
        recommendations.push({
          productId: product.id,
          score: similarityScores[index],
          reason: 'content',
          confidence: 0.9,
          metadata: {
            category: product.category,
            tags: product.tags,
            reasonText: `Similaire au produit que vous consultez`
          }
        });
      });

    } catch (error) {
      logger.error('Error generating content-based recommendations', { error });
    }

    return recommendations;
  }

  /**
   * Génère des recommandations de produits tendance
   * Prend en compte le type de produit si spécifié
   */
  private async generateTrendingRecommendations(context: RecommendationContext): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    try {
      // Si un type de produit est spécifié, utiliser la fonction dédiée
      if (context.productType) {
        const { data: trendingProducts, error } = await supabase
          .rpc('get_recommendations_by_product_type', {
            p_product_type: context.productType,
            p_user_id: context.userId || null,
            p_limit: 15
          });

        if (!error && trendingProducts?.length) {
          for (const product of trendingProducts) {
            recommendations.push({
              productId: product.product_id,
              score: (product.recommendation_score || 0) / 100, // Normaliser le score
              reason: 'trending',
              confidence: 0.6,
              metadata: {
                category: product.category,
                price: product.price,
                productType: product.product_type,
                reasonText: product.recommendation_reason || 'Tendance cette semaine'
              }
            });
          }
          return recommendations;
        }
      }

      // Sinon, utiliser la fonction générale (peut filtrer par type si spécifié)
      const { data: trendingProducts, error } = await supabase
        .rpc('get_trending_products_by_behavior', {
          p_days: 7,
          p_limit: 15,
          p_product_type: context.productType || null // Filtrer par type si spécifié
        });

      if (error || !trendingProducts?.length) return recommendations;

      for (const product of trendingProducts) {
        recommendations.push({
          productId: product.product_id,
          score: parseInt(product.trend_score) * 0.05,
          reason: 'trending',
          confidence: 0.6,
          metadata: {
            productType: product.product_type,
            reasonText: 'Tendance cette semaine'
          }
        });
      }

    } catch (error) {
      logger.error('Error generating trending recommendations', { error });
    }

    return recommendations;
  }

  /**
   * Trouve des produits similaires
   * Prend en compte le type de produit pour des recommandations cohérentes
   */
  private async findSimilarProducts(productId: string, sameTypeOnly: boolean = true): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('find_similar_products', {
          target_product_id: productId,
          limit_count: 10,
          p_same_type_only: sameTypeOnly
        });

      if (error) throw error;
      return data || [];

    } catch (error) {
      logger.error('Error finding similar products', { error, productId });
      return [];
    }
  }

  /**
   * Calcule le score comportemental
   */
  private calculateBehavioralScore(behavior: UserBehavior, product: any): number {
    let score = 1;

    // Bonus basé sur la durée de consultation
    if (behavior.duration && behavior.duration > 30) {
      score += 0.5;
    }

    // Bonus pour les achats récents
    const daysSinceBehavior = (Date.now() - behavior.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceBehavior < 7) {
      score += 0.3;
    }

    // Bonus pour les catégories similaires
    if (behavior.context?.category === product.category) {
      score += 0.4;
    }

    // Malus pour les prix trop différents
    if (behavior.context?.price && product.price) {
      const priceDiff = Math.abs(behavior.context.price - product.price) / behavior.context.price;
      if (priceDiff > 0.5) {
        score -= 0.2;
      }
    }

    return Math.max(0, Math.min(5, score));
  }

  /**
   * Calcule la similarité de contenu en utilisant la fonction SQL
   */
  private async calculateContentSimilarity(sourceProductId: string, targetProductId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_content_similarity', {
          source_product_id: sourceProductId,
          target_product_id: targetProductId
        });

      if (error || data === null) {
        logger.warn('Error calculating content similarity, using fallback', { error, sourceProductId, targetProductId });
        return 2; // Score de fallback
      }

      // Convertir le score de 0-100 à 0-5 pour correspondre à l'échelle utilisée
      return (data as number) / 20;
    } catch (error) {
      logger.error('Exception calculating content similarity', { error, sourceProductId, targetProductId });
      return 2; // Score de fallback
    }
  }

  /**
   * Fusionne les recommandations et évite les doublons
   */
  private mergeRecommendations(recommendations: ProductRecommendation[]): ProductRecommendation[] {
    const merged = new Map<string, ProductRecommendation>();

    for (const rec of recommendations) {
      const existing = merged.get(rec.productId);

      if (!existing) {
        merged.set(rec.productId, rec);
      } else {
        // Combiner les scores et améliorer la confiance
        existing.score = Math.max(existing.score, rec.score);
        existing.confidence = Math.min(1, existing.confidence + rec.confidence * 0.1);
        existing.metadata = { ...existing.metadata, ...rec.metadata };
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Analyse l'utilisation du contexte
   */
  private analyzeContextUsage(context: RecommendationContext): string[] {
    const used: string[] = [];

    if (context.userId) used.push('user_history');
    if (context.productId) used.push('current_product');
    if (context.productType) used.push(`product_type:${context.productType}`);
    if (context.category) used.push('category_filter');
    if (context.currentSession?.viewedProducts.length) used.push('session_views');
    if (context.currentSession?.cartItems.length) used.push('cart_items');
    if (context.userHistory?.purchasedProducts.length) used.push('purchase_history');
    if (context.userHistory?.favoriteProductTypes?.length) used.push('favorite_product_types');

    return used;
  }
}

// Instance globale du moteur de recommandations
export const recommendationEngine = new AIRecommendationEngine();

/**
 * Fonctions utilitaires pour l'intégration facile
 */
export const RecommendationService = {
  /**
   * Obtient des recommandations pour un produit
   * Prend en compte le type de produit pour des recommandations cohérentes
   */
  async getProductRecommendations(
    productId: string,
    userId?: string,
    limit: number = 6,
    productType?: 'digital' | 'physical' | 'service' | 'course' | 'artist',
    sameTypeOnly: boolean = true
  ): Promise<ProductRecommendation[]> {
    const result = await recommendationEngine.generateRecommendations({
      productId,
      userId,
      productType,
      sameTypeOnly
    });

    return result.recommendations.slice(0, limit);
  },

  /**
   * Obtient des recommandations pour un utilisateur
   * Prend en compte les types de produits préférés de l'utilisateur
   */
  async getUserRecommendations(
    userId: string,
    limit: number = 12,
    preferredTypes?: ('digital' | 'physical' | 'service' | 'course' | 'artist')[]
  ): Promise<ProductRecommendation[]> {
    // Récupérer les types de produits préférés depuis l'historique si non fournis
    let favoriteTypes = preferredTypes;
    if (!favoriteTypes) {
      try {
        const { data: purchases } = await supabase
          .from('orders')
          .select(`
            order_items!inner (
              products!inner (
                product_type
              )
            )
          `)
          .eq('customer_id', userId)
          .eq('payment_status', 'paid')
          .limit(50);

        if (purchases) {
          const types = new Set<string>();
          purchases.forEach((order: any) => {
            if (order.order_items) {
              order.order_items.forEach((item: any) => {
                if (item.products?.product_type) {
                  types.add(item.products.product_type);
                }
              });
            }
          });
          favoriteTypes = Array.from(types) as ('digital' | 'physical' | 'service' | 'course' | 'artist')[];
        }
      } catch (error) {
        logger.warn('Error fetching user favorite product types', { error });
      }
    }

    const result = await recommendationEngine.generateRecommendations({
      userId,
      userHistory: {
        favoriteProductTypes: favoriteTypes,
        purchasedProducts: [],
        favoriteCategories: [],
        averageOrderValue: 0
      }
    });

    return result.recommendations.slice(0, limit);
  },

  /**
   * Obtient des recommandations tendance
   */
  async getTrendingRecommendations(limit: number = 8): Promise<ProductRecommendation[]> {
    const result = await recommendationEngine.generateRecommendations({});

    return result.recommendations
      .filter(rec => rec.reason === 'trending')
      .slice(0, limit);
  },

  /**
   * Enregistre une action utilisateur
   */
  async trackUserAction(
    userId: string,
    productId: string,
    action: UserBehavior['action'],
    context?: Partial<UserBehavior['context']>
  ): Promise<void> {
    await recommendationEngine.trackUserBehavior({
      userId,
      productId,
      action,
      timestamp: new Date(),
      context
    });
  }
};