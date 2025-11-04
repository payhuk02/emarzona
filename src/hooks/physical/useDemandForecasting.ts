/**
 * Demand Forecasting Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les prévisions de demande et recommandations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface SalesHistory {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  order_id?: string;
  order_item_id?: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  sale_timestamp: string;
  customer_segment?: string;
  channel?: string;
  promotion_applied: boolean;
  discount_amount: number;
  created_at: string;
}

export interface DemandForecast {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  forecast_date: string;
  forecast_period_start: string;
  forecast_period_end: string;
  forecast_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  forecasted_quantity: number;
  forecasted_revenue: number;
  confidence_level: number;
  min_quantity?: number;
  max_quantity?: number;
  forecast_method: 'moving_average' | 'exponential_smoothing' | 'linear_regression' | 'seasonal_decomposition' | 'arima' | 'machine_learning';
  calculation_params: Record<string, any>;
  historical_data_points?: number;
  calculated_at: string;
  calculated_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReorderRecommendation {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  recommendation_type: 'low_stock' | 'reorder_point' | 'demand_forecast' | 'seasonal_peak' | 'trending_up';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  current_stock: number;
  forecasted_demand: number;
  days_until_stockout?: number;
  recommended_quantity: number;
  recommended_order_date?: string;
  recommended_supplier_id?: string;
  estimated_cost?: number;
  estimated_delivery_days?: number;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'dismissed';
  calculated_at: string;
  calculated_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useSalesHistory - Récupère l'historique des ventes
 */
export const useSalesHistory = (storeId?: string, filters?: {
  productId?: string;
  variantId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['sales-history', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('sales_history')
        .select(`
          *,
          product:products (id, name, image_url)
        `)
        .eq('store_id', storeId);

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.variantId) {
        query = query.eq('variant_id', filters.variantId);
      }
      if (filters?.startDate) {
        query = query.gte('sale_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('sale_date', filters.endDate);
      }

      query = query.order('sale_date', { ascending: false })
        .limit(1000);

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching sales history', { error, storeId });
        throw error;
      }

      return (data || []) as SalesHistory[];
    },
    enabled: !!storeId,
  });
};

/**
 * useDemandForecasts - Récupère les prévisions
 */
export const useDemandForecasts = (storeId?: string, filters?: {
  productId?: string;
  forecastType?: DemandForecast['forecast_type'];
  startDate?: string;
}) => {
  return useQuery({
    queryKey: ['demand-forecasts', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('demand_forecasts')
        .select(`
          *,
          product:products (id, name, image_url)
        `)
        .eq('store_id', storeId);

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.forecastType) {
        query = query.eq('forecast_type', filters.forecastType);
      }
      if (filters?.startDate) {
        query = query.gte('forecast_date', filters.startDate);
      }

      query = query.order('forecast_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching demand forecasts', { error, storeId });
        throw error;
      }

      return (data || []) as DemandForecast[];
    },
    enabled: !!storeId,
  });
};

/**
 * useReorderRecommendations - Récupère les recommandations de réapprovisionnement
 */
export const useReorderRecommendations = (storeId?: string, filters?: {
  status?: ReorderRecommendation['status'];
  priority?: ReorderRecommendation['priority'];
}) => {
  return useQuery({
    queryKey: ['reorder-recommendations', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('reorder_recommendations')
        .select(`
          *,
          product:products (id, name, image_url),
          supplier:suppliers (id, name)
        `)
        .eq('store_id', storeId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      query = query.order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching reorder recommendations', { error, storeId });
        throw error;
      }

      return (data || []) as ReorderRecommendation[];
    },
    enabled: !!storeId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCalculateForecast - Calculer une prévision
 */
export const useCalculateForecast = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      productId,
      variantId,
      forecastType,
      forecastDate,
      method,
      periods,
      alpha,
    }: {
      storeId: string;
      productId: string;
      variantId?: string;
      forecastType: DemandForecast['forecast_type'];
      forecastDate: string;
      method: 'moving_average' | 'exponential_smoothing';
      periods?: number;
      alpha?: number;
    }) => {
      let forecast: { forecasted_quantity: number; forecasted_revenue: number; confidence_level: number };

      if (method === 'moving_average') {
        const { data, error } = await supabase.rpc('calculate_moving_average_forecast', {
          p_store_id: storeId,
          p_product_id: productId,
          p_variant_id: variantId,
          p_periods: periods || 30,
          p_forecast_date: forecastDate,
        });

        if (error) throw error;
        forecast = data[0];
      } else {
        const { data, error } = await supabase.rpc('calculate_exponential_smoothing_forecast', {
          p_store_id: storeId,
          p_product_id: productId,
          p_variant_id: variantId,
          p_alpha: alpha || 0.3,
          p_forecast_date: forecastDate,
        });

        if (error) throw error;
        forecast = data[0];
      }

      // Calculer période
      const forecastDateObj = new Date(forecastDate);
      let periodStart = new Date(forecastDateObj);
      let periodEnd = new Date(forecastDateObj);

      if (forecastType === 'daily') {
        periodEnd.setDate(periodEnd.getDate() + 1);
      } else if (forecastType === 'weekly') {
        periodEnd.setDate(periodEnd.getDate() + 7);
      } else if (forecastType === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Créer ou mettre à jour prévision
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('demand_forecasts')
        .upsert({
          store_id: storeId,
          product_id: productId,
          variant_id: variantId,
          forecast_date: forecastDate,
          forecast_period_start: periodStart.toISOString().split('T')[0],
          forecast_period_end: periodEnd.toISOString().split('T')[0],
          forecast_type: forecastType,
          forecasted_quantity: forecast.forecasted_quantity,
          forecasted_revenue: forecast.forecasted_revenue,
          confidence_level: forecast.confidence_level,
          forecast_method: method,
          calculation_params: { periods, alpha },
          calculated_by: user?.id,
        }, {
          onConflict: 'store_id,product_id,variant_id,forecast_date,forecast_type',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating forecast', { error });
        throw error;
      }

      return data as DemandForecast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-forecasts'] });
      toast({
        title: '✅ Prévision calculée',
        description: 'La prévision de demande a été calculée',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCalculateForecast', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de calculer la prévision',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useGenerateReorderRecommendations - Générer recommandations
 */
export const useGenerateReorderRecommendations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (storeId: string) => {
      const { data, error } = await supabase.rpc('generate_reorder_recommendations', {
        p_store_id: storeId,
      });

      if (error) {
        logger.error('Error generating recommendations', { error });
        throw error;
      }

      return data as number; // Nombre de recommandations générées
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['reorder-recommendations'] });
      toast({
        title: '✅ Recommandations générées',
        description: `${count} recommandation${count > 1 ? 's' : ''} générée${count > 1 ? 's' : ''}`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useGenerateReorderRecommendations', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de générer les recommandations',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateRecommendationStatus - Mettre à jour le statut d'une recommandation
 */
export const useUpdateRecommendationStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      recommendationId,
      status,
    }: {
      recommendationId: string;
      status: ReorderRecommendation['status'];
    }) => {
      const { data, error } = await supabase
        .from('reorder_recommendations')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recommendationId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating recommendation status', { error, recommendationId });
        throw error;
      }

      return data as ReorderRecommendation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-recommendations'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut de la recommandation a été mis à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateRecommendationStatus', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });
};

