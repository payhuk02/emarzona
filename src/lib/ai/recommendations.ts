/**
 * AI Recommendations System
 * Système de recommandations basé sur ML pour produits et contenu
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface RecommendationRequest {
  userId?: string;
  productId?: string;
  categoryId?: string;
  limit?: number;
  context?: 'product' | 'category' | 'home' | 'cart' | 'checkout';
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  currency: string;
  score: number; // Score de pertinence (0-1)
  reason: string; // Raison de la recommandation
  type: 'similar' | 'complementary' | 'trending' | 'personalized' | 'popular';
}

export interface RecommendationResult {
  recommendations: ProductRecommendation[];
  total: number;
  context: string;
  algorithm: string;
  timestamp: string;
}

/**
 * Classe principale pour le système de recommandations
 */
export class RecommendationEngine {
  private cache: Map<string, { data: RecommendationResult; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Obtenir des recommandations pour un utilisateur
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    try {
      const cacheKey = this.getCacheKey(request);
      const cached = this.cache.get(cacheKey);

      // Vérifier le cache
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      const limit = request.limit || 10;
      let recommendations: ProductRecommendation[] = [];

      // Stratégie de recommandation basée sur le contexte
      switch (request.context) {
        case 'product':
          recommendations = await this.getProductBasedRecommendations(request, limit);
          break;
        case 'category':
          recommendations = await this.getCategoryBasedRecommendations(request, limit);
          break;
        case 'cart':
          recommendations = await this.getCartBasedRecommendations(request, limit);
          break;
        case 'checkout':
          recommendations = await this.getCheckoutRecommendations(request, limit);
          break;
        case 'home':
        default:
          recommendations = await this.getHomeRecommendations(request, limit);
          break;
      }

      // Mélanger et trier par score
      recommendations = this.shuffleAndSort(recommendations);

      const result: RecommendationResult = {
        recommendations: recommendations.slice(0, limit),
        total: recommendations.length,
        context: request.context || 'home',
        algorithm: this.getAlgorithmName(request.context || 'home'),
        timestamp: new Date().toISOString(),
      };

      // Mettre en cache
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      logger.error('RecommendationEngine.getRecommendations error', { error, request });
      throw error;
    }
  }

  /**
   * Recommandations basées sur un produit (produits similaires)
   */
  private async getProductBasedRecommendations(
    request: RecommendationRequest,
    limit: number
  ): Promise<ProductRecommendation[]> {
    if (!request.productId) {
      return [];
    }

    try {
      // 1. Récupérer les détails du produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, category_id, price, currency, images, tags')
        .eq('id', request.productId)
        .single();

      if (productError || !product) {
        return [];
      }

      // 2. Trouver des produits similaires (même catégorie, tags similaires)
      const { data: similarProducts, error: similarError } = await supabase
        .from('products')
        .select('id, name, price, currency, images, category_id, tags, views_count, sales_count')
        .eq('category_id', product.category_id)
        .neq('id', request.productId)
        .eq('status', 'active')
        .limit(limit * 2);

      if (similarError || !similarProducts) {
        return [];
      }

      // 3. Calculer les scores de similarité
      const recommendations: ProductRecommendation[] = similarProducts.map((p) => {
        const score = this.calculateSimilarityScore(product, p);
        return {
          productId: p.id,
          productName: p.name,
          productImage: Array.isArray(p.images) ? p.images[0] : p.images,
          price: p.price || 0,
          currency: p.currency || 'XOF',
          score,
          reason: 'Produit similaire',
          type: 'similar',
        };
      });

      return recommendations;
    } catch (error) {
      logger.error('RecommendationEngine.getProductBasedRecommendations error', { error, request });
      return [];
    }
  }

  /**
   * Recommandations basées sur une catégorie
   */
  private async getCategoryBasedRecommendations(
    request: RecommendationRequest,
    limit: number
  ): Promise<ProductRecommendation[]> {
    if (!request.categoryId) {
      return [];
    }

    try {
      // Récupérer les produits les plus populaires de la catégorie
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, currency, images, views_count, sales_count, rating')
        .eq('category_id', request.categoryId)
        .eq('status', 'active')
        .order('sales_count', { ascending: false })
        .order('rating', { ascending: false })
        .limit(limit * 2);

      if (error || !products) {
        return [];
      }

      const recommendations: ProductRecommendation[] = products.map((p) => {
        const score = this.calculatePopularityScore(p);
        return {
          productId: p.id,
          productName: p.name,
          productImage: Array.isArray(p.images) ? p.images[0] : p.images,
          price: p.price || 0,
          currency: p.currency || 'XOF',
          score,
          reason: 'Populaire dans cette catégorie',
          type: 'popular',
        };
      });

      return recommendations;
    } catch (error) {
      logger.error('RecommendationEngine.getCategoryBasedRecommendations error', { error, request });
      return [];
    }
  }

  /**
   * Recommandations basées sur le panier (produits complémentaires)
   */
  private async getCartBasedRecommendations(
    request: RecommendationRequest,
    limit: number
  ): Promise<ProductRecommendation[]> {
    if (!request.userId) {
      return [];
    }

    try {
      // Récupérer les produits du panier
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('product_id')
        .eq('user_id', request.userId);

      if (cartError || !cartItems || cartItems.length === 0) {
        return [];
      }

      const productIds = cartItems.map((item) => item.product_id);

      // Trouver des produits fréquemment achetés ensemble
      const { data: complementaryProducts, error: compError } = await supabase
        .from('order_items')
        .select('product_id, order_id')
        .in('product_id', productIds)
        .limit(100);

      if (compError || !complementaryProducts) {
        return [];
      }

      // Analyser les produits fréquemment achetés ensemble
      const complementaryMap = new Map<string, number>();
      complementaryProducts.forEach((item) => {
        const count = complementaryMap.get(item.product_id) || 0;
        complementaryMap.set(item.product_id, count + 1);
      });

      // Récupérer les produits complémentaires
      const topComplementaryIds = Array.from(complementaryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      if (topComplementaryIds.length === 0) {
        return [];
      }

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, currency, images')
        .in('id', topComplementaryIds)
        .eq('status', 'active')
        .limit(limit);

      if (productsError || !products) {
        return [];
      }

      const recommendations: ProductRecommendation[] = products.map((p) => ({
        productId: p.id,
        productName: p.name,
        productImage: Array.isArray(p.images) ? p.images[0] : p.images,
        price: p.price || 0,
        currency: p.currency || 'XOF',
        score: 0.7, // Score par défaut pour produits complémentaires
        reason: 'Fréquemment acheté ensemble',
        type: 'complementary',
      }));

      return recommendations;
    } catch (error) {
      logger.error('RecommendationEngine.getCartBasedRecommendations error', { error, request });
      return [];
    }
  }

  /**
   * Recommandations pour la page d'accueil
   */
  private async getHomeRecommendations(
    request: RecommendationRequest,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      const recommendations: ProductRecommendation[] = [];

      // 1. Produits tendance (basés sur les vues et ventes récentes)
      const { data: trendingProducts, error: trendingError } = await supabase
        .from('products')
        .select('id, name, price, currency, images, views_count, sales_count, rating, created_at')
        .eq('status', 'active')
        .order('views_count', { ascending: false })
        .order('sales_count', { ascending: false })
        .limit(Math.ceil(limit * 0.4));

      if (!trendingError && trendingProducts) {
        trendingProducts.forEach((p) => {
          recommendations.push({
            productId: p.id,
            productName: p.name,
            productImage: Array.isArray(p.images) ? p.images[0] : p.images,
            price: p.price || 0,
            currency: p.currency || 'XOF',
            score: this.calculateTrendingScore(p),
            reason: 'Tendance actuelle',
            type: 'trending',
          });
        });
      }

      // 2. Produits populaires (basés sur les ventes totales)
      const { data: popularProducts, error: popularError } = await supabase
        .from('products')
        .select('id, name, price, currency, images, sales_count, rating')
        .eq('status', 'active')
        .order('sales_count', { ascending: false })
        .order('rating', { ascending: false })
        .limit(Math.ceil(limit * 0.4));

      if (!popularError && popularProducts) {
        popularProducts.forEach((p) => {
          recommendations.push({
            productId: p.id,
            productName: p.name,
            productImage: Array.isArray(p.images) ? p.images[0] : p.images,
            price: p.price || 0,
            currency: p.currency || 'XOF',
            score: this.calculatePopularityScore(p),
            reason: 'Populaire',
            type: 'popular',
          });
        });
      }

      // 3. Produits personnalisés (si utilisateur connecté)
      if (request.userId) {
        const personalizedProducts = await this.getPersonalizedRecommendations(request.userId, Math.ceil(limit * 0.2));
        recommendations.push(...personalizedProducts);
      }

      return recommendations;
    } catch (error) {
      logger.error('RecommendationEngine.getHomeRecommendations error', { error, request });
      return [];
    }
  }

  /**
   * Recommandations personnalisées basées sur l'historique utilisateur
   */
  private async getPersonalizedRecommendations(
    userId: string,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      // Récupérer l'historique d'achat de l'utilisateur
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', userId)
        .eq('status', 'completed')
        .limit(10);

      if (ordersError || !orders || orders.length === 0) {
        return [];
      }

      const orderIds = orders.map((o) => o.id);

      // Récupérer les produits achetés
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id')
        .in('order_id', orderIds);

      if (itemsError || !orderItems) {
        return [];
      }

      const purchasedProductIds = [...new Set(orderItems.map((item) => item.product_id))];

      // Trouver des produits similaires aux produits achetés
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, currency, images, category_id')
        .in('category_id', await this.getCategoriesFromProducts(purchasedProductIds))
        .not('id', 'in', `(${purchasedProductIds.join(',')})`)
        .eq('status', 'active')
        .limit(limit);

      if (productsError || !products) {
        return [];
      }

      return products.map((p) => ({
        productId: p.id,
        productName: p.name,
        productImage: Array.isArray(p.images) ? p.images[0] : p.images,
        price: p.price || 0,
        currency: p.currency || 'XOF',
        score: 0.8,
        reason: 'Basé sur vos achats précédents',
        type: 'personalized',
      }));
    } catch (error) {
      logger.error('RecommendationEngine.getPersonalizedRecommendations error', { error, userId });
      return [];
    }
  }

  /**
   * Recommandations pour la page de checkout
   */
  private async getCheckoutRecommendations(
    request: RecommendationRequest,
    limit: number
  ): Promise<ProductRecommendation[]> {
    // Pour le checkout, on recommande des produits complémentaires ou des produits à prix réduit
    return this.getCartBasedRecommendations(request, limit);
  }

  /**
   * Calculer le score de similarité entre deux produits
   */
  private calculateSimilarityScore(product1: any, product2: any): number {
    let score = 0;

    // Même catégorie = +0.5
    if (product1.category_id === product2.category_id) {
      score += 0.5;
    }

    // Tags similaires = +0.3
    const tags1 = Array.isArray(product1.tags) ? product1.tags : [];
    const tags2 = Array.isArray(product2.tags) ? product2.tags : [];
    const commonTags = tags1.filter((tag: string) => tags2.includes(tag));
    if (commonTags.length > 0) {
      score += 0.3 * (commonTags.length / Math.max(tags1.length, tags2.length));
    }

    // Prix similaire = +0.2
    const priceDiff = Math.abs((product1.price || 0) - (product2.price || 0));
    const maxPrice = Math.max(product1.price || 0, product2.price || 0);
    if (maxPrice > 0) {
      score += 0.2 * (1 - priceDiff / maxPrice);
    }

    return Math.min(score, 1);
  }

  /**
   * Calculer le score de popularité
   */
  private calculatePopularityScore(product: any): number {
    const salesCount = product.sales_count || 0;
    const viewsCount = product.views_count || 0;
    const rating = product.rating || 0;

    // Normaliser les scores
    const salesScore = Math.min(salesCount / 100, 1); // Max 100 ventes = 1.0
    const viewsScore = Math.min(viewsCount / 1000, 1); // Max 1000 vues = 1.0
    const ratingScore = rating / 5; // Max 5 étoiles = 1.0

    // Ponderer les scores
    return salesScore * 0.5 + viewsScore * 0.3 + ratingScore * 0.2;
  }

  /**
   * Calculer le score de tendance
   */
  private calculateTrendingScore(product: any): number {
    const salesCount = product.sales_count || 0;
    const viewsCount = product.views_count || 0;
    const rating = product.rating || 0;
    const createdAt = new Date(product.created_at || Date.now());
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Produits récents ont un bonus
    const recencyBonus = daysSinceCreation < 7 ? 0.3 : daysSinceCreation < 30 ? 0.1 : 0;

    const salesScore = Math.min(salesCount / 50, 1) * 0.4;
    const viewsScore = Math.min(viewsCount / 500, 1) * 0.3;
    const ratingScore = (rating / 5) * 0.2;

    return Math.min(salesScore + viewsScore + ratingScore + recencyBonus, 1);
  }

  /**
   * Mélanger et trier les recommandations
   */
  private shuffleAndSort(recommendations: ProductRecommendation[]): ProductRecommendation[] {
    // Trier par score décroissant
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Obtenir les catégories à partir des produits
   */
  private async getCategoriesFromProducts(productIds: string[]): Promise<string[]> {
    if (productIds.length === 0) {
      return [];
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('category_id')
      .in('id', productIds);

    if (error || !products) {
      return [];
    }

    return [...new Set(products.map((p) => p.category_id).filter(Boolean))];
  }

  /**
   * Obtenir la clé de cache
   */
  private getCacheKey(request: RecommendationRequest): string {
    return `${request.context || 'home'}_${request.userId || 'anonymous'}_${request.productId || ''}_${request.categoryId || ''}_${request.limit || 10}`;
  }

  /**
   * Obtenir le nom de l'algorithme utilisé
   */
  private getAlgorithmName(context: string): string {
    const algorithms: Record<string, string> = {
      product: 'content-based-filtering',
      category: 'category-popularity',
      cart: 'association-rules',
      checkout: 'complementary-products',
      home: 'hybrid-recommendation',
    };

    return algorithms[context] || 'hybrid-recommendation';
  }
}

// Instance singleton
export const recommendationEngine = new RecommendationEngine();


