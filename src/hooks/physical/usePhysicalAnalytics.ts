/**
 * Physical Products Analytics Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour dashboard analytics produits physiques
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface PhysicalProductsKPIs {
  total_revenue: number;
  total_orders: number;
  total_units_sold: number;
  average_order_value: number;
  total_returns: number;
  return_rate: number;
  low_stock_count: number;
  out_of_stock_count: number;
  top_selling_product_id: string | null;
  top_selling_product_name: string | null;
  revenue_growth: number;
  orders_growth: number;
}

export interface PhysicalProductsTrend {
  date: string;
  revenue: number;
  orders: number;
  units_sold: number;
  returns: number;
}

export interface TopPhysicalProduct {
  product_id: string;
  product_name: string;
  image_url?: string;
  total_units_sold: number;
  total_revenue: number;
  average_rating: number;
  current_stock: number;
  return_rate: number;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * usePhysicalProductsKPIs - Récupère les KPIs
 */
export const usePhysicalProductsKPIs = (
  storeId: string | undefined,
  dateFrom?: Date,
  dateTo?: Date
) => {
  return useQuery({
    queryKey: ['physical-kpis', storeId, dateFrom, dateTo],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase.rpc('get_physical_products_kpis', {
        p_store_id: storeId,
        p_date_from: dateFrom?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_date_to: dateTo?.toISOString() || new Date().toISOString(),
      });

      if (error) {
        logger.error('Error fetching physical products KPIs', { error, storeId });
        throw error;
      }

      return (data?.[0] || {}) as PhysicalProductsKPIs;
    },
    enabled: !!storeId,
  });
};

/**
 * usePhysicalProductsTrends - Récupère les tendances
 */
export const usePhysicalProductsTrends = (
  storeId: string | undefined,
  days: number = 30
) => {
  return useQuery({
    queryKey: ['physical-trends', storeId, days],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase.rpc('get_physical_products_trends', {
        p_store_id: storeId,
        p_days: days,
      });

      if (error) {
        logger.error('Error fetching physical products trends', { error, storeId });
        throw error;
      }

      return (data || []) as PhysicalProductsTrend[];
    },
    enabled: !!storeId,
  });
};

/**
 * useTopPhysicalProducts - Récupère les top produits
 */
export const useTopPhysicalProducts = (
  storeId: string | undefined,
  limit: number = 10,
  days: number = 30
) => {
  return useQuery({
    queryKey: ['top-physical-products', storeId, limit, days],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase.rpc('get_top_physical_products', {
        p_store_id: storeId,
        p_limit: limit,
        p_days: days,
      });

      if (error) {
        logger.error('Error fetching top physical products', { error, storeId });
        throw error;
      }

      return (data || []) as TopPhysicalProduct[];
    },
    enabled: !!storeId,
  });
};

/**
 * usePhysicalProductsSalesSummary - Récupère le résumé des ventes
 */
export const usePhysicalProductsSalesSummary = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ['physical-sales-summary', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('physical_products_sales_summary')
        .select('*')
        .eq('store_id', storeId)
        .order('total_revenue', { ascending: false });

      if (error) {
        logger.error('Error fetching physical products sales summary', { error, storeId });
        throw error;
      }

      return (data || []);
    },
    enabled: !!storeId,
  });
};

