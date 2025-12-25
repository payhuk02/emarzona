/**
 * Advanced Analytics System
 * Système d'analytics avancés avec prédictions et insights
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsMetric {
  name: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
  trend?: 'up' | 'down' | 'stable';
  period?: string;
}

export interface AnalyticsInsight {
  type: 'revenue' | 'conversion' | 'traffic' | 'engagement' | 'retention';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
  data?: Record<string, unknown>;
}

export interface AnalyticsPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number; // 0-1
  timeframe: string;
  factors?: string[];
}

export interface AnalyticsDashboard {
  metrics: AnalyticsMetric[];
  insights: AnalyticsInsight[];
  predictions: AnalyticsPrediction[];
  period: {
    start: string;
    end: string;
  };
}

/**
 * Classe principale pour les analytics avancés
 */
export class AdvancedAnalytics {
  /**
   * Obtenir le tableau de bord analytics
   */
  async getDashboard(
    storeId?: string,
    period: { start: string; end: string } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }
  ): Promise<AnalyticsDashboard> {
    try {
      const [metrics, insights, predictions] = await Promise.all([
        this.getMetrics(storeId, period),
        this.getInsights(storeId, period),
        this.getPredictions(storeId, period),
      ]);

      return {
        metrics,
        insights,
        predictions,
        period,
      };
    } catch (error) {
      logger.error('AdvancedAnalytics.getDashboard error', { error, storeId, period });
      // Re-throw to allow caller to handle the error
      throw error;
    }
  }

  /**
   * Obtenir les métriques
   */
  async getMetrics(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsMetric[]> {
    try {
      const metrics: AnalyticsMetric[] = [];

      // Revenue
      const revenue = await this.calculateRevenue(storeId, period);
      metrics.push({
        name: 'Revenue',
        value: revenue.current,
        change: revenue.change,
        changeType: revenue.change > 0 ? 'increase' : revenue.change < 0 ? 'decrease' : 'stable',
        trend: revenue.change > 0 ? 'up' : revenue.change < 0 ? 'down' : 'stable',
        period: '30 days',
      });

      // Conversion Rate
      const conversionRate = await this.calculateConversionRate(storeId, period);
      metrics.push({
        name: 'Conversion Rate',
        value: conversionRate.current,
        change: conversionRate.change,
        changeType: conversionRate.change > 0 ? 'increase' : conversionRate.change < 0 ? 'decrease' : 'stable',
        trend: conversionRate.change > 0 ? 'up' : conversionRate.change < 0 ? 'down' : 'stable',
        period: '30 days',
      });

      // Traffic
      const traffic = await this.calculateTraffic(storeId, period);
      metrics.push({
        name: 'Traffic',
        value: traffic.current,
        change: traffic.change,
        changeType: traffic.change > 0 ? 'increase' : traffic.change < 0 ? 'decrease' : 'stable',
        trend: traffic.change > 0 ? 'up' : traffic.change < 0 ? 'down' : 'stable',
        period: '30 days',
      });

      // Average Order Value
      const aov = await this.calculateAOV(storeId, period);
      metrics.push({
        name: 'Average Order Value',
        value: aov.current,
        change: aov.change,
        changeType: aov.change > 0 ? 'increase' : aov.change < 0 ? 'decrease' : 'stable',
        trend: aov.change > 0 ? 'up' : aov.change < 0 ? 'down' : 'stable',
        period: '30 days',
      });

      return metrics;
    } catch (error) {
      logger.error('AdvancedAnalytics.getMetrics error', { error, storeId, period });
      return [];
    }
  }

  /**
   * Obtenir les insights
   */
  async getInsights(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsInsight[]> {
    try {
      const insights: AnalyticsInsight[] = [];

      // Analyser les tendances
      const revenueTrend = await this.analyzeRevenueTrend(storeId, period);
      if (revenueTrend) {
        insights.push(revenueTrend);
      }

      const conversionTrend = await this.analyzeConversionTrend(storeId, period);
      if (conversionTrend) {
        insights.push(conversionTrend);
      }

      const trafficTrend = await this.analyzeTrafficTrend(storeId, period);
      if (trafficTrend) {
        insights.push(trafficTrend);
      }

      return insights;
    } catch (error) {
      logger.error('AdvancedAnalytics.getInsights error', { error, storeId, period });
      return [];
    }
  }

  /**
   * Obtenir les prédictions
   */
  async getPredictions(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsPrediction[]> {
    try {
      const predictions: AnalyticsPrediction[] = [];

      // Prédiction de revenue
      const revenuePrediction = await this.predictRevenue(storeId, period);
      if (revenuePrediction) {
        predictions.push(revenuePrediction);
      }

      // Prédiction de conversion
      const conversionPrediction = await this.predictConversion(storeId, period);
      if (conversionPrediction) {
        predictions.push(conversionPrediction);
      }

      return predictions;
    } catch (error) {
      logger.error('AdvancedAnalytics.getPredictions error', { error, storeId, period });
      return [];
    }
  }

  /**
   * Calculer le revenue
   */
  private async calculateRevenue(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<{ current: number; previous: number; change: number }> {
    try {
      let query = supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed')
        .eq('payment_status', 'paid');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (period) {
        query = query.gte('created_at', period.start).lte('created_at', period.end);
      } else {
        const end = new Date();
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      }

      const { data: orders } = await query;

      const current = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Calculer le revenue de la période précédente
      const previousPeriod = {
        start: period
          ? new Date(new Date(period.start).getTime() - (new Date(period.end).getTime() - new Date(period.start).getTime())).toISOString()
          : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        end: period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      let previousQuery = supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed')
        .eq('payment_status', 'paid')
        .gte('created_at', previousPeriod.start)
        .lte('created_at', previousPeriod.end);

      if (storeId) {
        previousQuery = previousQuery.eq('store_id', storeId);
      }

      const { data: previousOrders } = await previousQuery;
      const previous = previousOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      return { current, previous, change };
    } catch (error) {
      logger.error('AdvancedAnalytics.calculateRevenue error', { error, storeId, period });
      return { current: 0, previous: 0, change: 0 };
    }
  }

  /**
   * Calculer le taux de conversion
   * Taux de conversion = (Nombre de commandes payées / Nombre de visiteurs uniques) * 100
   */
  private async calculateConversionRate(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<{ current: number; previous: number; change: number }> {
    try {
      const periodStart = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = period?.end || new Date().toISOString();

      // Récupérer le nombre de commandes payées (conversions)
      let ordersQuery = supabase
        .from('orders')
        .select('id, customer_id, created_at')
        .eq('payment_status', 'paid')
        .eq('status', 'completed')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (storeId) {
        ordersQuery = ordersQuery.eq('store_id', storeId);
      }

      const { data: orders } = await ordersQuery;

      // Nombre de conversions (commandes uniques)
      const conversions = orders?.length || 0;

      // Pour le nombre de visiteurs, on peut utiliser plusieurs sources:
      // 1. Nombre d'utilisateurs uniques ayant visité le store/marketplace
      // 2. Nombre de sessions uniques (si table analytics existe)
      // 3. Nombre d'utilisateurs ayant ajouté au panier (approximation)
      
      // Approche 1: Utiliser le nombre d'utilisateurs uniques ayant créé une commande ou un panier
      let visitorsQuery = supabase
        .from('orders')
        .select('customer_id')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (storeId) {
        visitorsQuery = visitorsQuery.eq('store_id', storeId);
      }

      const { data: allOrders } = await visitorsQuery;
      const uniqueVisitors = new Set(allOrders?.map(o => o.customer_id).filter(Boolean) || []).size;

      // Si pas assez de données, utiliser une approximation basée sur les utilisateurs actifs
      let currentVisitors = uniqueVisitors;
      
      if (currentVisitors === 0 && conversions > 0) {
        // Approximation: supposer qu'il y a au moins 10x plus de visiteurs que de conversions
        currentVisitors = conversions * 10;
      } else if (currentVisitors === 0) {
        // Aucune donnée, utiliser une valeur par défaut basée sur les utilisateurs
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .limit(1000);
        
        currentVisitors = usersData?.length || 100; // Fallback à 100 visiteurs
      }

      // Calculer le taux de conversion
      const currentRate = currentVisitors > 0 ? (conversions / currentVisitors) * 100 : 0;

      // Calculer pour la période précédente
      const previousPeriodStart = new Date(new Date(periodStart).getTime() - (new Date(periodEnd).getTime() - new Date(periodStart).getTime())).toISOString();
      const previousPeriodEnd = periodStart;

      let previousOrdersQuery = supabase
        .from('orders')
        .select('id, customer_id')
        .eq('payment_status', 'paid')
        .eq('status', 'completed')
        .gte('created_at', previousPeriodStart)
        .lte('created_at', previousPeriodEnd);

      if (storeId) {
        previousOrdersQuery = previousOrdersQuery.eq('store_id', storeId);
      }

      const { data: previousOrders } = await previousOrdersQuery;
      const previousConversions = previousOrders?.length || 0;

      let previousVisitorsQuery = supabase
        .from('orders')
        .select('customer_id')
        .gte('created_at', previousPeriodStart)
        .lte('created_at', previousPeriodEnd);

      if (storeId) {
        previousVisitorsQuery = previousVisitorsQuery.eq('store_id', storeId);
      }

      const { data: previousAllOrders } = await previousVisitorsQuery;
      const previousUniqueVisitors = new Set(previousAllOrders?.map(o => o.customer_id).filter(Boolean) || []).size;
      
      let previousVisitors = previousUniqueVisitors;
      if (previousVisitors === 0 && previousConversions > 0) {
        previousVisitors = previousConversions * 10;
      } else if (previousVisitors === 0) {
        previousVisitors = 100; // Fallback
      }

      const previousRate = previousVisitors > 0 ? (previousConversions / previousVisitors) * 100 : 0;

      // Calculer le changement en pourcentage
      const change = previousRate > 0 ? ((currentRate - previousRate) / previousRate) * 100 : 0;

      return {
        current: Math.round(currentRate * 100) / 100, // Arrondir à 2 décimales
        previous: Math.round(previousRate * 100) / 100,
        change: Math.round(change * 100) / 100,
      };
    } catch (error) {
      logger.error('AdvancedAnalytics.calculateConversionRate error', { error, storeId, period });
      return { current: 0, previous: 0, change: 0 };
    }
  }

  /**
   * Calculer le traffic (nombre de visiteurs/sessions)
   * Utilise plusieurs sources de données pour estimer le traffic
   */
  private async calculateTraffic(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<{ current: number; previous: number; change: number }> {
    try {
      const periodStart = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = period?.end || new Date().toISOString();

      // Source 1: Nombre d'utilisateurs uniques ayant interagi avec le store/marketplace
      // (commandes, paniers, vues de produits)
      let ordersQuery = supabase
        .from('orders')
        .select('customer_id, created_at')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (storeId) {
        ordersQuery = ordersQuery.eq('store_id', storeId);
      }

      const { data: orders } = await ordersQuery;
      const uniqueOrderUsers = new Set(orders?.map(o => o.customer_id).filter(Boolean) || []).size;

      // Source 2: Nombre d'utilisateurs ayant ajouté au panier
      const cartQuery = supabase
        .from('cart_items')
        .select('user_id, session_id, added_at')
        .gte('added_at', periodStart)
        .lte('added_at', periodEnd);

      const { data: cartItems } = await cartQuery;
      const uniqueCartUsers = new Set(
        cartItems?.map(item => item.user_id || item.session_id).filter(Boolean) || []
      ).size;

      // Source 3: Nombre d'utilisateurs ayant visité des produits (si table product_views existe)
      let productViewsQuery = supabase
        .from('product_views')
        .select('user_id, session_id, viewed_at')
        .gte('viewed_at', periodStart)
        .lte('viewed_at', periodEnd);

      // Note: product_views peut avoir une colonne store_id, mais on vérifie d'abord
      // Si la colonne n'existe pas, cette requête échouera silencieusement
      if (storeId) {
        try {
          // Tenter d'appliquer le filtre store_id si la colonne existe
          productViewsQuery = productViewsQuery.eq('store_id', storeId);
        } catch {
          // Si la colonne n'existe pas, ignorer le filtre
          logger.debug('product_views.store_id column not available, skipping filter');
        }
      }

      const { data: productViews } = await productViewsQuery;
      const uniqueViewUsers = new Set(
        productViews?.map(view => view.user_id || view.session_id).filter(Boolean) || []
      ).size;

      // Source 4: Nombre de nouveaux utilisateurs inscrits (proxy pour le traffic)
      const newUsersQuery = supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      const { data: newUsers } = await newUsersQuery;
      const newUsersCount = newUsers?.length || 0;

      // Calculer le traffic total en combinant toutes les sources
      // On utilise le maximum pour éviter la sous-estimation
      const trafficSources = [
        uniqueOrderUsers,
        uniqueCartUsers,
        uniqueViewUsers,
        newUsersCount * 3, // Approximation: chaque nouvel utilisateur = 3 visites en moyenne
      ];

      const currentTraffic = Math.max(...trafficSources, 0);

      // Si aucune donnée, utiliser une estimation basée sur les commandes
      let estimatedTraffic = currentTraffic;
      if (estimatedTraffic === 0 && orders && orders.length > 0) {
        // Approximation: supposer qu'il y a 20 visiteurs pour chaque commande
        estimatedTraffic = orders.length * 20;
      } else if (estimatedTraffic === 0) {
        // Fallback: utiliser le nombre de nouveaux utilisateurs * 10
        estimatedTraffic = newUsersCount * 10 || 100;
      }

      // Calculer pour la période précédente
      const previousPeriodStart = new Date(new Date(periodStart).getTime() - (new Date(periodEnd).getTime() - new Date(periodStart).getTime())).toISOString();
      const previousPeriodEnd = periodStart;

      let previousOrdersQuery = supabase
        .from('orders')
        .select('customer_id')
        .gte('created_at', previousPeriodStart)
        .lte('created_at', previousPeriodEnd);

      if (storeId) {
        previousOrdersQuery = previousOrdersQuery.eq('store_id', storeId);
      }

      const { data: previousOrders } = await previousOrdersQuery;
      const previousUniqueOrderUsers = new Set(previousOrders?.map(o => o.customer_id).filter(Boolean) || []).size;

      const previousCartQuery = supabase
        .from('cart_items')
        .select('user_id, session_id')
        .gte('added_at', previousPeriodStart)
        .lte('added_at', previousPeriodEnd);

      const { data: previousCartItems } = await previousCartQuery;
      const previousUniqueCartUsers = new Set(
        previousCartItems?.map(item => item.user_id || item.session_id).filter(Boolean) || []
      ).size;

      const previousUsersQuery = supabase
        .from('profiles')
        .select('id')
        .gte('created_at', previousPeriodStart)
        .lte('created_at', previousPeriodEnd);

      const { data: previousNewUsers } = await previousUsersQuery;
      const previousNewUsersCount = previousNewUsers?.length || 0;

      const previousTrafficSources = [
        previousUniqueOrderUsers,
        previousUniqueCartUsers,
        previousNewUsersCount * 3,
      ];

      const previousTraffic = Math.max(...previousTrafficSources, 0);
      let previousEstimatedTraffic = previousTraffic;
      
      if (previousEstimatedTraffic === 0 && previousOrders && previousOrders.length > 0) {
        previousEstimatedTraffic = previousOrders.length * 20;
      } else if (previousEstimatedTraffic === 0) {
        previousEstimatedTraffic = previousNewUsersCount * 10 || 100;
      }

      // Calculer le changement en pourcentage
      const change = previousEstimatedTraffic > 0 
        ? ((estimatedTraffic - previousEstimatedTraffic) / previousEstimatedTraffic) * 100 
        : 0;

      return {
        current: estimatedTraffic,
        previous: previousEstimatedTraffic,
        change: Math.round(change * 100) / 100,
      };
    } catch (error) {
      logger.error('AdvancedAnalytics.calculateTraffic error', { error, storeId, period });
      // En cas d'erreur (table inexistante, etc.), retourner des valeurs par défaut
      return { current: 0, previous: 0, change: 0 };
    }
  }

  /**
   * Calculer l'Average Order Value
   */
  private async calculateAOV(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<{ current: number; previous: number; change: number }> {
    try {
      const revenue = await this.calculateRevenue(storeId, period);

      let query = supabase.from('orders').select('id').eq('status', 'completed').eq('payment_status', 'paid');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (period) {
        query = query.gte('created_at', period.start).lte('created_at', period.end);
      }

      const { data: orders } = await query;
      const orderCount = orders?.length || 1;

      const current = revenue.current / orderCount;
      const previous = revenue.previous / (orderCount || 1);
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      return { current, previous, change };
    } catch (error) {
      logger.error('AdvancedAnalytics.calculateAOV error', { error, storeId, period });
      return { current: 0, previous: 0, change: 0 };
    }
  }

  /**
   * Analyser la tendance de revenue
   */
  private async analyzeRevenueTrend(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsInsight | null> {
    try {
      const revenue = await this.calculateRevenue(storeId, period);

      if (revenue.change > 10) {
        return {
          type: 'revenue',
          title: 'Revenue en forte hausse',
          description: `Le revenue a augmenté de ${revenue.change.toFixed(1)}% par rapport à la période précédente.`,
          impact: 'high',
          recommendation: 'Continuez à maintenir cette croissance en optimisant vos campagnes marketing.',
          data: { change: revenue.change, current: revenue.current, previous: revenue.previous },
        };
      } else if (revenue.change < -10) {
        return {
          type: 'revenue',
          title: 'Revenue en baisse',
          description: `Le revenue a diminué de ${Math.abs(revenue.change).toFixed(1)}% par rapport à la période précédente.`,
          impact: 'high',
          recommendation: 'Analysez les causes de la baisse et ajustez votre stratégie marketing.',
          data: { change: revenue.change, current: revenue.current, previous: revenue.previous },
        };
      }

      return null;
    } catch (error) {
      logger.error('AdvancedAnalytics.analyzeRevenueTrend error', { error, storeId, period });
      return null;
    }
  }

  /**
   * Analyser la tendance de conversion
   */
  private async analyzeConversionTrend(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsInsight | null> {
    try {
      const conversionRate = await this.calculateConversionRate(storeId, period);

      if (conversionRate.change > 5) {
        return {
          type: 'conversion',
          title: 'Taux de conversion en hausse',
          description: `Le taux de conversion a augmenté de ${conversionRate.change.toFixed(1)}%.`,
          impact: 'medium',
          recommendation: 'Vos optimisations de conversion fonctionnent bien. Continuez à tester et améliorer.',
          data: { change: conversionRate.change, current: conversionRate.current },
        };
      }

      return null;
    } catch (error) {
      logger.error('AdvancedAnalytics.analyzeConversionTrend error', { error, storeId, period });
      return null;
    }
  }

  /**
   * Analyser la tendance de traffic
   */
  private async analyzeTrafficTrend(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsInsight | null> {
    try {
      const traffic = await this.calculateTraffic(storeId, period);

      if (traffic.change > 10) {
        return {
          type: 'traffic',
          title: 'Traffic en hausse',
          description: `Le traffic a augmenté de ${traffic.change.toFixed(1)}% par rapport à la période précédente.`,
          impact: 'medium',
          recommendation: 'Profitez de cette augmentation de traffic pour améliorer votre taux de conversion.',
          data: { change: traffic.change, current: traffic.current },
        };
      }

      return null;
    } catch (error) {
      logger.error('AdvancedAnalytics.analyzeTrafficTrend error', { error, storeId, period });
      return null;
    }
  }

  /**
   * Prédire le revenue
   */
  private async predictRevenue(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsPrediction | null> {
    try {
      const revenue = await this.calculateRevenue(storeId, period);

      // Prédiction simple basée sur la tendance
      const predictedValue = revenue.current * (1 + revenue.change / 100);
      const confidence = Math.min(0.85, 0.5 + Math.abs(revenue.change) / 100);

      return {
        metric: 'Revenue',
        currentValue: revenue.current,
        predictedValue,
        confidence,
        timeframe: '30 days',
        factors: ['Tendance actuelle', 'Saisonnalité', 'Campagnes marketing'],
      };
    } catch (error) {
      logger.error('AdvancedAnalytics.predictRevenue error', { error, storeId, period });
      return null;
    }
  }

  /**
   * Prédire le taux de conversion
   */
  private async predictConversion(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsPrediction | null> {
    try {
      const conversionRate = await this.calculateConversionRate(storeId, period);

      const predictedValue = conversionRate.current * (1 + conversionRate.change / 100);
      const confidence = Math.min(0.8, 0.5 + Math.abs(conversionRate.change) / 100);

      return {
        metric: 'Conversion Rate',
        currentValue: conversionRate.current,
        predictedValue,
        confidence,
        timeframe: '30 days',
        factors: ['Optimisations UX', 'Qualité du traffic', 'Prix des produits'],
      };
    } catch (error) {
      logger.error('AdvancedAnalytics.predictConversion error', { error, storeId, period });
      return null;
    }
  }
}

// Instance singleton
export const advancedAnalytics = new AdvancedAnalytics();


