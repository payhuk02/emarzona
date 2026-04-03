/**
 * Moteur d'analytics prédictif avancé pour Emarzona
 * Utilise des algorithmes statistiques pour prévoir les ventes et comportements
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface SalesPrediction {
  productId: string;
  predictedSales: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: {
    pattern: string;
    strength: number;
  };
}

export interface StockPrediction {
  productId: string;
  currentStock: number;
  predictedDemand: number;
  recommendedStock: number;
  restockDate: Date;
  confidence: number;
}

export interface CustomerBehaviorPrediction {
  segment: string;
  predictedChurnRisk: number;
  predictedLifetimeValue: number;
  recommendedActions: string[];
  confidence: number;
}

export interface TrendAnalysis {
  category: string;
  trendStrength: number;
  predictedGrowth: number;
  topProducts: Array<{
    productId: string;
    predictedGrowth: number;
  }>;
}

/**
 * Moteur d'analytics prédictif
 */
export class PredictiveAnalyticsEngine {
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly PREDICTION_HORIZON_DAYS = 30;

  /**
   * Prédire les ventes futures pour un produit
   */
  async predictProductSales(productId: string, days: number = this.PREDICTION_HORIZON_DAYS): Promise<SalesPrediction> {
    try {
      // Récupérer l'historique des ventes
      const salesHistory = await this.getProductSalesHistory(productId, 90); // 90 jours d'historique

      if (salesHistory.length < 7) {
        return {
          productId,
          predictedSales: 0,
          confidence: 0.1,
          trend: 'stable'
        };
      }

      // Analyse de tendance simple (régression linéaire)
      const trend = this.calculateTrend(salesHistory);

      // Analyse de saisonnalité
      const seasonality = this.detectSeasonality(salesHistory);

      // Calcul de la prédiction
      const lastSales = salesHistory[salesHistory.length - 1].sales;
      const predictedSales = Math.max(0, lastSales * (1 + trend.slope * days));

      // Calcul de la confiance basé sur la volatilité et la quantité de données
      const volatility = this.calculateVolatility(salesHistory);
      const confidence = Math.min(1, Math.max(0.1, 1 - volatility)) * (salesHistory.length / 90);

      return {
        productId,
        predictedSales: Math.round(predictedSales),
        confidence,
        trend: trend.direction,
        seasonality: seasonality.strength > 0.3 ? seasonality : undefined
      };
    } catch (error) {
      logger.error('Error predicting product sales', { error, productId });
      return {
        productId,
        predictedSales: 0,
        confidence: 0,
        trend: 'stable'
      };
    }
  }

  /**
   * Prédire les besoins en stock
   */
  async predictStockNeeds(productId: string): Promise<StockPrediction> {
    try {
      // Récupérer les données actuelles du produit
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity, stock_alert_threshold')
        .eq('id', productId)
        .single();

      if (!product) {
        throw new Error('Product not found');
      }

      // Prédire les ventes futures
      const salesPrediction = await this.predictProductSales(productId, 30);
      const dailyDemand = salesPrediction.predictedSales / 30;

      // Calculer le stock recommandé (30 jours de couverture)
      const recommendedStock = Math.max(
        product.stock_alert_threshold || 10,
        Math.ceil(dailyDemand * 45) // 45 jours de couverture recommandée
      );

      // Calculer la date de réapprovisionnement
      const daysUntilRestock = product.stock_quantity / Math.max(dailyDemand, 0.1);
      const restockDate = new Date();
      restockDate.setDate(restockDate.getDate() + Math.max(0, daysUntilRestock - 7)); // Alerte 7 jours avant

      return {
        productId,
        currentStock: product.stock_quantity,
        predictedDemand: salesPrediction.predictedSales,
        recommendedStock,
        restockDate,
        confidence: salesPrediction.confidence
      };
    } catch (error) {
      logger.error('Error predicting stock needs', { error, productId });
      throw error;
    }
  }

  /**
   * Analyser les tendances par catégorie
   */
  async analyzeCategoryTrends(category: string): Promise<TrendAnalysis> {
    try {
      // Récupérer tous les produits de la catégorie
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .eq('category', category)
        .eq('is_active', true);

      if (!products || products.length === 0) {
        return {
          category,
          trendStrength: 0,
          predictedGrowth: 0,
          topProducts: []
        };
      }

      // Analyser chaque produit
      const productPredictions = await Promise.all(
        products.map(async (product) => {
          const prediction = await this.predictProductSales(product.id, 30);
          const currentSales = await this.getCurrentSales(product.id);

          return {
            productId: product.id,
            name: product.name,
            predictedGrowth: prediction.predictedSales - currentSales,
            confidence: prediction.confidence
          };
        })
      );

      // Trier par croissance prédite
      const sortedProducts = productPredictions
        .filter(p => p.confidence > this.CONFIDENCE_THRESHOLD)
        .sort((a, b) => b.predictedGrowth - a.predictedGrowth)
        .slice(0, 5);

      // Calculer la tendance globale de la catégorie
      const totalCurrentSales = productPredictions.reduce((sum, p) => sum + this.getCurrentSales(p.productId), 0);
      const totalPredictedSales = productPredictions.reduce((sum, p) => sum + (this.getCurrentSales(p.productId) + p.predictedGrowth), 0);
      const predictedGrowth = totalPredictedSales - totalCurrentSales;
      const trendStrength = Math.min(1, Math.abs(predictedGrowth) / Math.max(totalCurrentSales, 1));

      return {
        category,
        trendStrength,
        predictedGrowth,
        topProducts: sortedProducts.map(p => ({
          productId: p.productId,
          predictedGrowth: p.predictedGrowth
        }))
      };
    } catch (error) {
      logger.error('Error analyzing category trends', { error, category });
      return {
        category,
        trendStrength: 0,
        predictedGrowth: 0,
        topProducts: []
      };
    }
  }

  /**
   * Prédire le comportement client
   */
  async predictCustomerBehavior(userId: string): Promise<CustomerBehaviorPrediction> {
    try {
      // Récupérer l'historique du client
      const customerHistory = await this.getCustomerHistory(userId);

      if (customerHistory.length === 0) {
        return {
          segment: 'new_customer',
          predictedChurnRisk: 0.8,
          predictedLifetimeValue: 50,
          recommendedActions: ['send_welcome_email', 'offer_discount'],
          confidence: 0.3
        };
      }

      // Calculer la valeur vie client (CLV)
      const clv = this.calculateCustomerLifetimeValue(customerHistory);

      // Calculer le risque de désabonnement
      const churnRisk = this.calculateChurnRisk(customerHistory);

      // Déterminer le segment
      const segment = this.determineCustomerSegment(customerHistory, clv);

      // Recommandations d'actions
      const recommendedActions = this.generateActionRecommendations(segment, churnRisk, clv);

      return {
        segment,
        predictedChurnRisk: churnRisk,
        predictedLifetimeValue: clv,
        recommendedActions,
        confidence: 0.8 // Confiance élevée basée sur l'historique
      };
    } catch (error) {
      logger.error('Error predicting customer behavior', { error, userId });
      return {
        segment: 'unknown',
        predictedChurnRisk: 0.5,
        predictedLifetimeValue: 0,
        recommendedActions: [],
        confidence: 0
      };
    }
  }

  // Méthodes utilitaires privées

  private async getProductSalesHistory(productId: string, days: number): Promise<Array<{ date: Date; sales: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('orders')
      .select('created_at, items')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    const salesByDay: Record<string, number> = {};

    data?.forEach(order => {
      if (order.items) {
        const items = JSON.parse(order.items);
        const dayKey = new Date(order.created_at).toDateString();

        items.forEach((item: { product_id: string; quantity: number }) => {
          if (item.product_id === productId) {
            salesByDay[dayKey] = (salesByDay[dayKey] || 0) + item.quantity;
          }
        });
      }
    });

    return Object.entries(salesByDay).map(([date, sales]) => ({
      date: new Date(date),
      sales
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private async getCurrentSales(productId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('orders')
      .select('items')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    let totalSales = 0;
    data?.forEach(order => {
      if (order.items) {
        const items = JSON.parse(order.items);
        items.forEach((item: { product_id: string; quantity: number }) => {
          if (item.product_id === productId) {
            totalSales += item.quantity;
          }
        });
      }
    });

    return totalSales;
  }

  private calculateTrend(salesHistory: Array<{ date: Date; sales: number }>) {
    if (salesHistory.length < 2) {
      return { slope: 0, direction: 'stable' as const };
    }

    const n = salesHistory.length;
    const sumX = salesHistory.reduce((sum, _, i) => sum + i, 0);
    const sumY = salesHistory.reduce((sum, item) => sum + item.sales, 0);
    const sumXY = salesHistory.reduce((sum, item, i) => sum + i * item.sales, 0);
    const sumXX = salesHistory.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

    return { slope, direction };
  }

  private detectSeasonality(salesHistory: Array<{ date: Date; sales: number }>) {
    // Détection simple de saisonnalité (jour de la semaine)
    const dayOfWeekSales: Record<number, number[]> = {};

    salesHistory.forEach(item => {
      const dayOfWeek = item.date.getDay();
      if (!dayOfWeekSales[dayOfWeek]) dayOfWeekSales[dayOfWeek] = [];
      dayOfWeekSales[dayOfWeek].push(item.sales);
    });

    const dayAverages = Object.entries(dayOfWeekSales).map(([day, sales]) => ({
      day: parseInt(day),
      average: sales.reduce((sum, sale) => sum + sale, 0) / sales.length
    }));

    const overallAverage = dayAverages.reduce((sum, day) => sum + day.average, 0) / dayAverages.length;

    const maxVariation = Math.max(...dayAverages.map(day => Math.abs(day.average - overallAverage)));
    const strength = maxVariation / overallAverage;

    const bestDay = dayAverages.reduce((best, current) =>
      current.average > best.average ? current : best
    );

    return {
      pattern: `weekday_${bestDay.day}`,
      strength
    };
  }

  private calculateVolatility(salesHistory: Array<{ date: Date; sales: number }>): number {
    if (salesHistory.length < 2) return 1;

    const values = salesHistory.map(item => item.sales);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;

    return Math.sqrt(variance) / mean; // Coefficient de variation
  }

  private async getCustomerHistory(userId: string) {
    const { data } = await supabase
      .from('orders')
      .select('created_at, total_amount, items')
      .eq('customer_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(50);

    return data || [];
  }

  private calculateCustomerLifetimeValue(history: any[]): number {
    if (history.length === 0) return 0;

    const totalSpent = history.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const avgOrderValue = totalSpent / history.length;

    // Facteur de récurrence basé sur la fréquence des achats
    const firstOrder = new Date(history[history.length - 1].created_at);
    const lastOrder = new Date(history[0].created_at);
    const daysSinceFirstOrder = (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24);

    const purchaseFrequency = daysSinceFirstOrder > 0 ? history.length / daysSinceFirstOrder : 0;
    const recurrenceFactor = Math.min(1, purchaseFrequency * 30); // Achat par mois

    return Math.round(totalSpent * (1 + recurrenceFactor));
  }

  private calculateChurnRisk(history: any[]): number {
    if (history.length === 0) return 1;

    const lastOrder = new Date(history[0].created_at);
    const daysSinceLastOrder = (new Date().getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24);

    // Risque basé sur le temps écoulé depuis le dernier achat
    const recencyRisk = Math.min(1, daysSinceLastOrder / 90); // 90 jours = risque élevé

    // Risque basé sur la fréquence
    const purchaseFrequency = history.length / Math.max(1, daysSinceLastOrder / 30);
    const frequencyRisk = purchaseFrequency < 0.5 ? 0.7 : purchaseFrequency < 1 ? 0.4 : 0.1;

    return Math.max(recencyRisk, frequencyRisk);
  }

  private determineCustomerSegment(history: any[], clv: number): string {
    const totalOrders = history.length;
    const totalSpent = history.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    if (totalOrders === 1) return 'first_time';
    if (totalSpent > 1000) return 'high_value';
    if (totalOrders > 10) return 'loyal';
    if (clv > 500) return 'potential_high_value';

    return 'regular';
  }

  private generateActionRecommendations(segment: string, churnRisk: number, clv: number): string[] {
    const recommendations: string[] = [];

    if (churnRisk > 0.7) {
      recommendations.push('send_reactivation_email', 'offer_special_discount');
    } else if (churnRisk > 0.4) {
      recommendations.push('send_engagement_email', 'offer_loyalty_bonus');
    }

    if (segment === 'high_value') {
      recommendations.push('send_premium_offers', 'invite_to_vip_program');
    } else if (segment === 'first_time') {
      recommendations.push('send_welcome_series', 'offer_first_purchase_discount');
    } else if (segment === 'potential_high_value') {
      recommendations.push('send_upgrade_offers', 'offer_bundle_deals');
    }

    if (clv > 300) {
      recommendations.push('send_personalized_recommendations');
    }

    return recommendations.slice(0, 3); // Maximum 3 recommandations
  }
}

// Instance globale
export const predictiveAnalytics = new PredictiveAnalyticsEngine();

// Hooks React pour utiliser l'analytics prédictif
export function useSalesPredictions(productIds: string[]) {
  return useQuery({
    queryKey: ['sales-predictions', productIds],
    queryFn: async () => {
      const predictions = await Promise.all(
        productIds.map(id => predictiveAnalytics.predictProductSales(id))
      );
      return predictions;
    },
    enabled: productIds.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useStockPredictions(productIds: string[]) {
  return useQuery({
    queryKey: ['stock-predictions', productIds],
    queryFn: async () => {
      const predictions = await Promise.all(
        productIds.map(id => predictiveAnalytics.predictStockNeeds(id))
      );
      return predictions;
    },
    enabled: productIds.length > 0,
    staleTime: 60 * 60 * 1000, // 1 heure
  });
}

export function useCustomerPredictions(userIds: string[]) {
  return useQuery({
    queryKey: ['customer-predictions', userIds],
    queryFn: async () => {
      const predictions = await Promise.all(
        userIds.map(id => predictiveAnalytics.predictCustomerBehavior(id))
      );
      return predictions;
    },
    enabled: userIds.length > 0,
    staleTime: 24 * 60 * 60 * 1000, // 24 heures
  });
}

export function useCategoryTrends(categories: string[]) {
  return useQuery({
    queryKey: ['category-trends', categories],
    queryFn: async () => {
      const trends = await Promise.all(
        categories.map(category => predictiveAnalytics.analyzeCategoryTrends(category))
      );
      return trends;
    },
    enabled: categories.length > 0,
    staleTime: 6 * 60 * 60 * 1000, // 6 heures
  });
}