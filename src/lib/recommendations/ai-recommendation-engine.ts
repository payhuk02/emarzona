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
  currentSession?: {
    viewedProducts: string[];
    cartItems: string[];
    searchTerms: string[];
  };
  userHistory?: {
    purchasedProducts: string[];
    favoriteCategories: string[];
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
      const similarProducts = await this.findSimilarProducts(behavior.productId);
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
      const { data: similarUsers, error } = await supabase
        .rpc('find_similar_users', {
          target_user_id: context.userId,
          limit_count: 50
        });

      if (error || !similarUsers?.length) return recommendations;

      // Récupérer les produits populaires chez ces utilisateurs
      const userIds = similarUsers.map((u: any) => u.user_id);
      const { data: popularProducts, error: productsError } = await supabase
        .from('user_behavior_tracking')
        .select('product_id, COUNT(*) as popularity')
        .in('user_id', userIds)
        .eq('action', 'purchase')
        .group('product_id')
        .order('popularity', { ascending: false })
        .limit(10);

      if (productsError || !popularProducts?.length) return recommendations;

      for (const product of popularProducts) {
        recommendations.push({
          productId: product.product_id,
          score: parseInt(product.popularity) * 0.1,
          reason: 'collaborative',
          confidence: 0.7,
          metadata: {
            reasonText: 'Populaire chez les utilisateurs avec des goûts similaires'
          }
        });
      }

    } catch (error) {
      logger.error('Error generating collaborative recommendations', { error });
    }

    return recommendations;
  }

  /**
   * Génère des recommandations basées sur le contenu du produit actuel
   */
  private async generateContentBasedRecommendations(context: RecommendationContext): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    if (!context.productId) return recommendations;

    try {
      const similarProducts = await this.findSimilarProducts(context.productId);

      similarProducts.forEach(product => {
        recommendations.push({
          productId: product.id,
          score: this.calculateContentSimilarity(context.productId!, product),
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
   */
  private async generateTrendingRecommendations(context: RecommendationContext): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    try {
      // Récupérer les produits tendance des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: trendingProducts, error } = await supabase
        .from('user_behavior_tracking')
        .select('product_id, COUNT(*) as trend_score')
        .gte('timestamp', sevenDaysAgo.toISOString())
        .in('action', ['view', 'cart', 'purchase'])
        .group('product_id')
        .order('trend_score', { ascending: false })
        .limit(15);

      if (error || !trendingProducts?.length) return recommendations;

      for (const product of trendingProducts) {
        recommendations.push({
          productId: product.product_id,
          score: parseInt(product.trend_score) * 0.05,
          reason: 'trending',
          confidence: 0.6,
          metadata: {
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
   */
  private async findSimilarProducts(productId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('find_similar_products', {
          target_product_id: productId,
          limit_count: 10
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
   * Calcule la similarité de contenu
   */
  private calculateContentSimilarity(sourceProductId: string, targetProduct: any): number {
    // Implémentation simplifiée - en production, utiliserait des algorithmes plus sophistiqués
    return Math.random() * 2 + 2; // Score entre 2 et 4
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
    if (context.category) used.push('category_filter');
    if (context.currentSession?.viewedProducts.length) used.push('session_views');
    if (context.currentSession?.cartItems.length) used.push('cart_items');
    if (context.userHistory?.purchasedProducts.length) used.push('purchase_history');

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
   */
  async getProductRecommendations(
    productId: string,
    userId?: string,
    limit: number = 6
  ): Promise<ProductRecommendation[]> {
    const result = await recommendationEngine.generateRecommendations({
      productId,
      userId
    });

    return result.recommendations.slice(0, limit);
  },

  /**
   * Obtient des recommandations pour un utilisateur
   */
  async getUserRecommendations(
    userId: string,
    limit: number = 12
  ): Promise<ProductRecommendation[]> {
    const result = await recommendationEngine.generateRecommendations({
      userId
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