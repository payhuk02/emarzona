/**
 * Hook pour Prévisions de Demande
 * Date: 3 Février 2025
 * 
 * Système de prévisions basé sur l'historique des ventes
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface DemandForecast {
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  sku: string;
  
  // Historique
  historical_sales: {
    date: string;
    quantity: number;
  }[];
  
  // Prévisions
  forecasted_quantity: number;
  forecasted_quantity_30d: number;
  forecasted_quantity_60d: number;
  forecasted_quantity_90d: number;
  
  // Métriques
  average_daily_sales: number;
  sales_velocity: number; // Taux de vente (unités/jour)
  days_of_inventory: number; // Jours de stock restants
  confidence_level: 'high' | 'medium' | 'low'; // Niveau de confiance de la prévision
  
  // Recommandations
  recommended_reorder_quantity: number;
  recommended_reorder_date: string;
  stockout_risk: 'high' | 'medium' | 'low';
}

export interface DemandForecastOptions {
  period?: '7d' | '30d' | '60d' | '90d';
  method?: 'moving_average' | 'exponential_smoothing' | 'linear_regression';
  confidence_threshold?: number;
}

// =====================================================
// FONCTIONS DE CALCUL
// =====================================================

/**
 * Calcul de la moyenne mobile simple
 */
function calculateMovingAverage(
  sales: { date: string; quantity: number }[],
  period: number
): number {
  if (sales.length === 0) return 0;
  
  const recentSales = sales.slice(-period);
  const sum = recentSales.reduce((acc, sale) => acc + sale.quantity, 0);
  return sum / recentSales.length;
}

/**
 * Calcul de lissage exponentiel
 */
function calculateExponentialSmoothing(
  sales: { date: string; quantity: number }[],
  alpha: number = 0.3
): number {
  if (sales.length === 0) return 0;
  if (sales.length === 1) return sales[0].quantity;
  
  let forecast = sales[0].quantity;
  
  for (let i = 1; i < sales.length; i++) {
    forecast = alpha * sales[i].quantity + (1 - alpha) * forecast;
  }
  
  return forecast;
}

/**
 * Calcul de régression linéaire simple
 */
function calculateLinearRegression(
  sales: { date: string; quantity: number }[]
): { slope: number; intercept: number } {
  if (sales.length < 2) {
    return { slope: 0, intercept: sales[0]?.quantity || 0 };
  }
  
  const n = sales.length;
  const x = sales.map((_, i) => i);
  const y = sales.map((s) => s.quantity);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * Calcule le niveau de confiance
 */
function calculateConfidenceLevel(
  sales: { date: string; quantity: number }[],
  variance: number
): 'high' | 'medium' | 'low' {
  if (sales.length < 7) return 'low';
  if (sales.length < 30) return 'medium';
  
  const coefficientOfVariation = Math.sqrt(variance) / (sales.reduce((sum, s) => sum + s.quantity, 0) / sales.length);
  
  if (coefficientOfVariation < 0.2) return 'high';
  if (coefficientOfVariation < 0.5) return 'medium';
  return 'low';
}

/**
 * Calcule la prévision de demande
 */
function forecastDemand(
  sales: { date: string; quantity: number }[],
  method: 'moving_average' | 'exponential_smoothing' | 'linear_regression' = 'moving_average',
  days: number = 30
): number {
  if (sales.length === 0) return 0;
  
  switch (method) {
    case 'moving_average': {
      const period = Math.min(30, sales.length);
      const dailyAverage = calculateMovingAverage(sales, period);
      return dailyAverage * days;
    }
    
    case 'exponential_smoothing': {
      const dailyAverage = calculateExponentialSmoothing(sales);
      return dailyAverage * days;
    }
    
    case 'linear_regression': {
      const { slope, intercept } = calculateLinearRegression(sales);
      const lastIndex = sales.length - 1;
      const futureIndex = lastIndex + days;
      return Math.max(0, slope * futureIndex + intercept);
    }
    
    default:
      return 0;
  }
}

// =====================================================
// HOOKS
// =====================================================

/**
 * Récupère les prévisions de demande pour un produit
 */
export function useDemandForecast(
  productId: string,
  variantId?: string,
  options: DemandForecastOptions = {}
) {
  const { period = '30d', method = 'moving_average' } = options;
  
  return useQuery({
    queryKey: ['demand-forecast', productId, variantId, period, method],
    queryFn: async (): Promise<DemandForecast | null> => {
      // Récupérer l'historique des ventes
      const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '60d' ? 60 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack * 2); // Récupérer 2x plus de données pour calculer
      
      // Récupérer les commandes avec items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          order_items!inner (
            id,
            product_id,
            variant_id,
            quantity,
            product_type
          )
        `)
        .eq('order_items.product_id', productId)
        .eq('order_items.product_type', 'physical')
        .gte('created_at', startDate.toISOString())
        .in('status', ['completed', 'shipped', 'delivered'])
        .order('created_at', { ascending: true });
      
      if (ordersError) {
        logger.error('Error fetching orders for demand forecast', { error: ordersError });
        throw ordersError;
      }
      
      // Filtrer par variant si spécifié
      const filteredOrders = variantId
        ? orders?.filter((order) =>
            order.order_items?.some((item: { variant_id?: string }) => item.variant_id === variantId)
          )
        : orders;
      
      // Agréger les ventes par jour
      const salesByDate = new Map<string, number>();
      
      filteredOrders?.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        const quantity = order.order_items?.reduce(
          (sum: number, item: { quantity: number; variant_id?: string }) => {
            if (!variantId || item.variant_id === variantId) {
              return sum + item.quantity;
            }
            return sum;
          },
          0
        ) || 0;
        
        if (quantity > 0) {
          salesByDate.set(date, (salesByDate.get(date) || 0) + quantity);
        }
      });
      
      // Convertir en array trié
      const historicalSales = Array.from(salesByDate.entries())
        .map(([date, quantity]) => ({ date, quantity }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      if (historicalSales.length === 0) {
        return null;
      }
      
      // Calculer les métriques
      const totalSales = historicalSales.reduce((sum, s) => sum + s.quantity, 0);
      const daysWithSales = historicalSales.length;
      const averageDailySales = totalSales / daysWithSales;
      
      // Calculer la variance pour le niveau de confiance
      const mean = averageDailySales;
      const variance = historicalSales.reduce(
        (sum, s) => sum + Math.pow(s.quantity - mean, 2),
        0
      ) / daysWithSales;
      
      // Prévisions
      const forecasted30d = forecastDemand(historicalSales, method, 30);
      const forecasted60d = forecastDemand(historicalSales, method, 60);
      const forecasted90d = forecastDemand(historicalSales, method, 90);
      
      // Récupérer le stock actuel
      const { data: inventory } = await supabase
        .from('physical_product_inventory')
        .select('quantity_available')
        .eq('product_id', productId)
        .maybeSingle();
      
      const currentStock = inventory?.quantity_available || 0;
      const daysOfInventory = averageDailySales > 0 ? currentStock / averageDailySales : 0;
      
      // Recommandations
      const leadTime = 7; // Jours de délai de réapprovisionnement (par défaut)
      const safetyStock = averageDailySales * leadTime * 1.5; // Stock de sécurité
      const recommendedReorderQuantity = Math.max(
        forecasted30d + safetyStock - currentStock,
        0
      );
      
      const daysUntilReorder = Math.max(0, daysOfInventory - leadTime);
      const recommendedReorderDate = new Date();
      recommendedReorderDate.setDate(recommendedReorderDate.getDate() + daysUntilReorder);
      
      // Risque de rupture
      let stockoutRisk: 'high' | 'medium' | 'low' = 'low';
      if (daysOfInventory < leadTime) {
        stockoutRisk = 'high';
      } else if (daysOfInventory < leadTime * 2) {
        stockoutRisk = 'medium';
      }
      
      // Récupérer les infos du produit
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();
      
      return {
        product_id: productId,
        product_name: product?.name || 'Produit inconnu',
        variant_id,
        variant_name: undefined, // TODO: Récupérer depuis variants
        sku: '', // TODO: Récupérer depuis inventory
        historical_sales: historicalSales,
        forecasted_quantity: forecasted30d,
        forecasted_quantity_30d: forecasted30d,
        forecasted_quantity_60d: forecasted60d,
        forecasted_quantity_90d: forecasted90d,
        average_daily_sales: averageDailySales,
        sales_velocity: averageDailySales,
        days_of_inventory: daysOfInventory,
        confidence_level: calculateConfidenceLevel(historicalSales, variance),
        recommended_reorder_quantity: Math.ceil(recommendedReorderQuantity),
        recommended_reorder_date: recommendedReorderDate.toISOString().split('T')[0],
        stockout_risk: stockoutRisk,
      };
    },
    enabled: !!productId,
  });
}

/**
 * Récupère les prévisions pour tous les produits d'une boutique
 */
export function useStoreDemandForecasts(
  storeId: string,
  options: DemandForecastOptions = {}
) {
  const { period = '30d', method = 'moving_average' } = options;
  
  return useQuery({
    queryKey: ['store-demand-forecasts', storeId, period, method],
    queryFn: async (): Promise<DemandForecast[]> => {
      // Récupérer tous les produits physiques de la boutique
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('product_type', 'physical');
      
      if (productsError) throw productsError;
      
      // Calculer les prévisions pour chaque produit
      const forecasts: DemandForecast[] = [];
      
      // Extraire la logique de prévision dans une fonction réutilisable
      const calculateForecast = async (productId: string, variantId?: string): Promise<DemandForecast | null> => {
        // Récupérer l'historique des ventes (même logique que useDemandForecast)
        const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '60d' ? 60 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack * 2);
        
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            order_items!inner (
              id,
              product_id,
              variant_id,
              quantity,
              product_type
            )
          `)
          .eq('order_items.product_id', productId)
          .eq('order_items.product_type', 'physical')
          .gte('created_at', startDate.toISOString())
          .in('status', ['completed', 'shipped', 'delivered'])
          .order('created_at', { ascending: true });
        
        if (ordersError || !orders) return null;
        
        const filteredOrders = variantId
          ? orders.filter((order) =>
              order.order_items?.some((item: { variant_id?: string }) => item.variant_id === variantId)
            )
          : orders;
        
        const salesByDate = new Map<string, number>();
        filteredOrders.forEach((order) => {
          const date = new Date(order.created_at).toISOString().split('T')[0];
          const quantity = order.order_items?.reduce(
            (sum: number, item: { quantity: number; variant_id?: string }) => {
              if (!variantId || item.variant_id === variantId) {
                return sum + item.quantity;
              }
              return sum;
            },
            0
          ) || 0;
          
          if (quantity > 0) {
            salesByDate.set(date, (salesByDate.get(date) || 0) + quantity);
          }
        });
        
        const historicalSales = Array.from(salesByDate.entries())
          .map(([date, quantity]) => ({ date, quantity }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        if (historicalSales.length === 0) return null;
        
        const totalSales = historicalSales.reduce((sum, s) => sum + s.quantity, 0);
        const daysWithSales = historicalSales.length;
        const averageDailySales = totalSales / daysWithSales;
        const mean = averageDailySales;
        const variance = historicalSales.reduce(
          (sum, s) => sum + Math.pow(s.quantity - mean, 2),
          0
        ) / daysWithSales;
        
        const forecasted30d = forecastDemand(historicalSales, method, 30);
        const forecasted60d = forecastDemand(historicalSales, method, 60);
        const forecasted90d = forecastDemand(historicalSales, method, 90);
        
        const { data: inventory } = await supabase
          .from('physical_product_inventory')
          .select('quantity_available')
          .eq('product_id', productId)
          .maybeSingle();
        
        const currentStock = inventory?.quantity_available || 0;
        const daysOfInventory = averageDailySales > 0 ? currentStock / averageDailySales : 0;
        const leadTime = 7;
        const safetyStock = averageDailySales * leadTime * 1.5;
        const recommendedReorderQuantity = Math.max(forecasted30d + safetyStock - currentStock, 0);
        const daysUntilReorder = Math.max(0, daysOfInventory - leadTime);
        const recommendedReorderDate = new Date();
        recommendedReorderDate.setDate(recommendedReorderDate.getDate() + daysUntilReorder);
        
        let stockoutRisk: 'high' | 'medium' | 'low' = 'low';
        if (daysOfInventory < leadTime) {
          stockoutRisk = 'high';
        } else if (daysOfInventory < leadTime * 2) {
          stockoutRisk = 'medium';
        }
        
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', productId)
          .single();
        
        return {
          product_id: productId,
          product_name: product?.name || 'Produit inconnu',
          variant_id,
          variant_name: undefined,
          sku: '',
          historical_sales: historicalSales,
          forecasted_quantity: forecasted30d,
          forecasted_quantity_30d: forecasted30d,
          forecasted_quantity_60d: forecasted60d,
          forecasted_quantity_90d: forecasted90d,
          average_daily_sales: averageDailySales,
          sales_velocity: averageDailySales,
          days_of_inventory: daysOfInventory,
          confidence_level: calculateConfidenceLevel(historicalSales, variance),
          recommended_reorder_quantity: Math.ceil(recommendedReorderQuantity),
          recommended_reorder_date: recommendedReorderDate.toISOString().split('T')[0],
          stockout_risk: stockoutRisk,
        };
      };
      
      for (const product of products || []) {
        try {
          const forecast = await calculateForecast(product.id);
          if (forecast) {
            forecasts.push(forecast);
          }
        } catch (error) {
          logger.warn('Error forecasting demand for product', { productId: product.id, error });
        }
      }
      
      return forecasts.sort((a, b) => b.stockout_risk.localeCompare(a.stockout_risk));
    },
    enabled: !!storeId,
  });
}

/**
 * Alias pour useStoreDemandForecasts (compatibilité)
 */
export const useDemandForecasts = useStoreDemandForecasts;

/**
 * Hook pour calculer une prévision (placeholder - à implémenter si nécessaire)
 */
export function useCalculateForecast() {
  // TODO: Implémenter si nécessaire
  return {
    mutateAsync: async (params: any) => {
      throw new Error('useCalculateForecast not implemented');
    },
  };
}

/**
 * Interface pour les recommandations de réapprovisionnement
 */
export interface ReorderRecommendation {
  id: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  sku: string;
  current_stock: number;
  recommended_quantity: number;
  recommended_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'ordered';
}

/**
 * Hook pour récupérer les recommandations de réapprovisionnement (placeholder)
 */
export function useReorderRecommendations(storeId?: string) {
  return {
    data: [] as ReorderRecommendation[],
    isLoading: false,
  };
}

/**
 * Hook pour générer des recommandations (placeholder)
 */
export function useGenerateReorderRecommendations() {
  return {
    mutateAsync: async (storeId: string) => {
      throw new Error('useGenerateReorderRecommendations not implemented');
    },
  };
}

/**
 * Hook pour mettre à jour le statut d'une recommandation (placeholder)
 */
export function useUpdateRecommendationStatus() {
  return {
    mutateAsync: async (params: { recommendationId: string; status: string }) => {
      throw new Error('useUpdateRecommendationStatus not implemented');
    },
  };
}