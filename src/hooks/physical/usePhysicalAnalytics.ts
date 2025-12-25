/**
 * Hooks React Query pour analytics produits physiques
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface ProductAnalytics {
  id: string;
  physical_product_id: string;
  variant_id?: string;
  warehouse_id?: string;
  period_start: string;
  period_end: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  units_sold: number;
  revenue: number;
  average_order_value: number;
  conversion_rate: number;
  average_stock_level: number;
  stock_turnover_rate: number;
  days_of_inventory: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_profit_margin: number;
  shipping_costs: number;
  total_costs: number;
  net_profit: number;
  net_profit_margin: number;
  return_rate: number;
  refund_rate: number;
  average_rating: number;
  review_count: number;
  calculated_at: string;
}

export interface SalesForecast {
  id: string;
  physical_product_id: string;
  variant_id?: string;
  warehouse_id?: string;
  forecast_date: string;
  forecast_type: 'short_term' | 'medium_term' | 'long_term';
  forecast_method: 'moving_average' | 'exponential_smoothing' | 'linear_regression' | 'seasonal' | 'manual';
  predicted_units: number;
  confidence_level: number;
  lower_bound?: number;
  upper_bound?: number;
  actual_units?: number;
  accuracy_percentage?: number;
  notes?: string;
  created_by?: string;
}

export interface WarehousePerformance {
  id: string;
  warehouse_id: string;
  period_start: string;
  period_end: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  total_orders_fulfilled: number;
  total_units_shipped: number;
  average_fulfillment_time_hours: number;
  on_time_delivery_rate: number;
  total_inventory_value: number;
  average_stock_level: number;
  stock_accuracy_rate: number;
  shrinkage_rate: number;
  operational_costs: number;
  shipping_costs: number;
  storage_costs: number;
  labor_costs: number;
  total_costs: number;
  total_revenue: number;
  net_profit: number;
  profit_margin: number;
  orders_per_hour: number;
  units_per_hour: number;
  cost_per_order: number;
  cost_per_unit: number;
}

export interface GeographicSalesPerformance {
  id: string;
  store_id: string;
  country: string;
  region?: string;
  city?: string;
  postal_code?: string;
  period_start: string;
  period_end: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  total_orders: number;
  total_units_sold: number;
  total_revenue: number;
  average_order_value: number;
  unique_customers: number;
  repeat_customer_rate: number;
  customer_acquisition_cost: number;
  customer_lifetime_value: number;
  top_selling_product_id?: string;
  top_selling_variant_id?: string;
}

export interface StockRotationReport {
  id: string;
  physical_product_id: string;
  variant_id?: string;
  warehouse_id?: string;
  period_start: string;
  period_end: string;
  beginning_inventory: number;
  ending_inventory: number;
  average_inventory: number;
  units_sold: number;
  cost_of_goods_sold: number;
  inventory_turnover_ratio: number;
  days_sales_of_inventory: number;
  stock_velocity: 'fast' | 'medium' | 'slow' | 'stagnant';
  previous_period_turnover?: number;
  turnover_change_percentage?: number;
}

// =====================================================
// HOOKS: Product Analytics
// =====================================================

/**
 * Get product analytics for a specific product
 */
export const useProductAnalytics = (
  physicalProductId: string,
  options?: {
    variantId?: string;
    warehouseId?: string;
    periodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['physical-product-analytics', physicalProductId, options],
    queryFn: async () => {
      let query = supabase
        .from('physical_product_analytics')
        .select('*')
        .eq('physical_product_id', physicalProductId)
        .order('period_start', { ascending: false });

      if (options?.variantId) {
        query = query.eq('variant_id', options.variantId);
      }
      if (options?.warehouseId) {
        query = query.eq('warehouse_id', options.warehouseId);
      }
      if (options?.periodType) {
        query = query.eq('period_type', options.periodType);
      }
      if (options?.startDate) {
        query = query.gte('period_start', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('period_end', options.endDate);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as ProductAnalytics[];
    },
    enabled: !!physicalProductId,
  });
};

/**
 * Get aggregated analytics for all products in a store
 */
export const useStorePhysicalAnalytics = (
  storeId: string,
  options?: {
    periodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['store-physical-analytics', storeId, options],
    queryFn: async () => {
      // Get all physical products for this store
      const { data: products, error: productsError } = await supabase
        .from('physical_products')
        .select('id, product:products!inner(store_id)')
        .eq('product.store_id', storeId);

      if (productsError) throw productsError;

      const productIds = products?.map((p) => p.id) || [];

      if (productIds.length === 0) {
        return {
          total_revenue: 0,
          total_units_sold: 0,
          total_products: 0,
          average_order_value: 0,
          total_gross_profit: 0,
          total_net_profit: 0,
          average_gross_margin: 0,
          average_net_margin: 0,
        };
      }

      let query = supabase
        .from('physical_product_analytics')
        .select('*')
        .in('physical_product_id', productIds)
        .order('period_start', { ascending: false });

      if (options?.periodType) {
        query = query.eq('period_type', options.periodType);
      }
      if (options?.startDate) {
        query = query.gte('period_start', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('period_end', options.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate data
      const analytics = data as ProductAnalytics[];
      const totalRevenue = analytics.reduce((sum, a) => sum + (a.revenue || 0), 0);
      const totalUnitsSold = analytics.reduce((sum, a) => sum + (a.units_sold || 0), 0);
      const totalGrossProfit = analytics.reduce((sum, a) => sum + (a.gross_profit || 0), 0);
      const totalNetProfit = analytics.reduce((sum, a) => sum + (a.net_profit || 0), 0);
      const totalOrders = analytics.reduce((sum, a) => sum + (a.units_sold || 0), 0);

      return {
        total_revenue: totalRevenue,
        total_units_sold: totalUnitsSold,
        total_products: new Set(analytics.map((a) => a.physical_product_id)).size,
        average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        total_gross_profit: totalGrossProfit,
        total_net_profit: totalNetProfit,
        average_gross_margin: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
        average_net_margin: totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0,
        analytics,
      };
    },
    enabled: !!storeId,
  });
};

// =====================================================
// HOOKS: Sales Forecasts
// =====================================================

/**
 * Get sales forecasts for a product
 */
export const useSalesForecasts = (
  physicalProductId: string,
  options?: {
    variantId?: string;
    warehouseId?: string;
    forecastType?: 'short_term' | 'medium_term' | 'long_term';
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['sales-forecasts', physicalProductId, options],
    queryFn: async () => {
      let query = supabase
        .from('sales_forecasts')
        .select('*')
        .eq('physical_product_id', physicalProductId)
        .order('forecast_date', { ascending: true });

      if (options?.variantId) {
        query = query.eq('variant_id', options.variantId);
      }
      if (options?.warehouseId) {
        query = query.eq('warehouse_id', options.warehouseId);
      }
      if (options?.forecastType) {
        query = query.eq('forecast_type', options.forecastType);
      }
      if (options?.startDate) {
        query = query.gte('forecast_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('forecast_date', options.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SalesForecast[];
    },
    enabled: !!physicalProductId,
  });
};

/**
 * Create or update a sales forecast
 */
export const useCreateSalesForecast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (forecast: Omit<SalesForecast, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('sales_forecasts')
        .upsert(forecast, {
          onConflict: 'physical_product_id,variant_id,warehouse_id,forecast_date,forecast_type',
        })
        .select()
        .single();

      if (error) throw error;
      return data as SalesForecast;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['sales-forecasts', data.physical_product_id],
      });
    },
  });
};

// =====================================================
// HOOKS: Warehouse Performance
// =====================================================

/**
 * Get warehouse performance metrics
 */
export const useWarehousePerformance = (
  warehouseId: string,
  options?: {
    periodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['warehouse-performance', warehouseId, options],
    queryFn: async () => {
      let query = supabase
        .from('warehouse_performance')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .order('period_start', { ascending: false });

      if (options?.periodType) {
        query = query.eq('period_type', options.periodType);
      }
      if (options?.startDate) {
        query = query.gte('period_start', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('period_end', options.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WarehousePerformance[];
    },
    enabled: !!warehouseId,
  });
};

/**
 * Get performance for all warehouses in a store
 */
export const useStoreWarehousePerformance = (
  storeId: string,
  options?: {
    periodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['store-warehouse-performance', storeId, options],
    queryFn: async () => {
      // Get all warehouses for this store
      const { data: warehouses, error: warehousesError } = await supabase
        .from('warehouses')
        .select('id')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (warehousesError) throw warehousesError;

      const warehouseIds = warehouses?.map((w) => w.id) || [];

      if (warehouseIds.length === 0) {
        return [];
      }

      let query = supabase
        .from('warehouse_performance')
        .select('*')
        .in('warehouse_id', warehouseIds)
        .order('period_start', { ascending: false });

      if (options?.periodType) {
        query = query.eq('period_type', options.periodType);
      }
      if (options?.startDate) {
        query = query.gte('period_start', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('period_end', options.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WarehousePerformance[];
    },
    enabled: !!storeId,
  });
};

// =====================================================
// HOOKS: Geographic Sales Performance
// =====================================================

/**
 * Get geographic sales performance
 */
export const useGeographicSalesPerformance = (
  storeId: string,
  options?: {
    country?: string;
    region?: string;
    periodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['geographic-sales', storeId, options],
    queryFn: async () => {
      let query = supabase
        .from('geographic_sales_performance')
        .select('*')
        .eq('store_id', storeId)
        .order('total_revenue', { ascending: false });

      if (options?.country) {
        query = query.eq('country', options.country);
      }
      if (options?.region) {
        query = query.eq('region', options.region);
      }
      if (options?.periodType) {
        query = query.eq('period_type', options.periodType);
      }
      if (options?.startDate) {
        query = query.gte('period_start', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('period_end', options.endDate);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as GeographicSalesPerformance[];
    },
    enabled: !!storeId,
  });
};

// =====================================================
// HOOKS: Stock Rotation Reports
// =====================================================

/**
 * Get stock rotation reports
 */
export const useStockRotationReports = (
  physicalProductId?: string,
  options?: {
    variantId?: string;
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['stock-rotation-reports', physicalProductId, options],
    queryFn: async () => {
      let query = supabase
        .from('stock_rotation_reports')
        .select('*')
        .order('period_start', { ascending: false });

      if (physicalProductId) {
        query = query.eq('physical_product_id', physicalProductId);
      }
      if (options?.variantId) {
        query = query.eq('variant_id', options.variantId);
      }
      if (options?.warehouseId) {
        query = query.eq('warehouse_id', options.warehouseId);
      }
      if (options?.startDate) {
        query = query.gte('period_start', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('period_end', options.endDate);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as StockRotationReport[];
    },
  });
};

// =====================================================
// HOOKS: Calculate Analytics (Mutations)
// =====================================================

/**
 * Calculate product analytics for a period
 */
export const useCalculateProductAnalytics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      physicalProductId,
      variantId,
      warehouseId,
      periodStart,
      periodEnd,
      periodType = 'daily',
    }: {
      physicalProductId: string;
      variantId?: string;
      warehouseId?: string;
      periodStart: string;
      periodEnd: string;
      periodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    }) => {
      const { data, error } = await supabase.rpc('calculate_product_analytics', {
        p_physical_product_id: physicalProductId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_variant_id: variantId || null,
        p_warehouse_id: warehouseId || null,
        p_period_type: periodType,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['physical-product-analytics', variables.physicalProductId],
      });
    },
  });
};

/**
 * Calculate stock rotation for a period
 */
export const useCalculateStockRotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      physicalProductId,
      variantId,
      warehouseId,
      periodStart,
      periodEnd,
    }: {
      physicalProductId: string;
      variantId?: string;
      warehouseId?: string;
      periodStart: string;
      periodEnd: string;
    }) => {
      const { data, error } = await supabase.rpc('calculate_stock_rotation', {
        p_physical_product_id: physicalProductId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_variant_id: variantId || null,
        p_warehouse_id: warehouseId || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-rotation-reports', variables.physicalProductId],
      });
    },
  });
};
