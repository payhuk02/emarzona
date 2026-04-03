/**
 * Hook optimisé pour les statistiques du dashboard
 * Utilise React Query pour le cache, le refetch automatique et la déduplication
 *
 * Types dans src/types/dashboard-stats.ts
 * Transformation dans src/services/dashboardStatsTransform.ts
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from './useStore';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { transformOptimizedData } from '@/services/dashboardStatsTransform';
import { getFallbackStats } from '@/types/dashboard-stats';

// Re-export types for backward compatibility
export type { DashboardStats, UseDashboardStatsOptions } from '@/types/dashboard-stats';
import type { DashboardStats, UseDashboardStatsOptions, OptimizedDashboardData, RecentOrder } from '@/types/dashboard-stats';

function getPeriodDays(period?: string): number {
  if (period === '7d') return 7;
  if (period === '90d') return 90;
  return 30;
}

/**
 * Fetch stats directly from individual tables
 */
async function fetchDashboardStatsFromTables(
  storeId: string,
  periodDays: number
): Promise<DashboardStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const [productsResult, ordersResult, customersResult] = await Promise.all([
    supabase.from('products').select('product_type, price, is_active').eq('store_id', storeId),
    supabase.from('orders').select('id, status, total_amount, created_at, customer_id, order_number').eq('store_id', storeId).gte('created_at', startDate.toISOString()),
    supabase.from('customers').select('created_at').eq('store_id', storeId),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (customersResult.error) throw customersResult.error;

  const products = productsResult.data || [];
  const orders = ordersResult.data || [];
  const customers = customersResult.data || [];

  const now = Date.now();
  const ms = (days: number) => days * 24 * 60 * 60 * 1000;
  const completedOrders = orders.filter(o => o.status === 'completed');
  const revenueFor = (days: number) => completedOrders.filter(o => new Date(o.created_at).getTime() >= now - ms(days)).reduce((s, o) => s + (o.total_amount || 0), 0);
  const ordersFor = (days: number) => orders.filter(o => new Date(o.created_at).getTime() >= now - ms(days)).length;
  const customersFor = (days: number) => customers.filter(c => new Date(c.created_at).getTime() >= now - ms(days)).length;

  const activeProducts = products.filter(p => p.is_active);
  const countType = (type: string) => activeProducts.filter(p => p.product_type === type).length;

  const optimizedData: OptimizedDashboardData = {
    baseStats: {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      digitalProducts: countType('digital'),
      physicalProducts: countType('physical'),
      serviceProducts: countType('service'),
      courseProducts: countType('course'),
      artistProducts: countType('artist'),
      avgProductPrice: products.length > 0 ? products.reduce((s, p) => s + (p.price || 0), 0) / products.length : 0,
    },
    ordersStats: {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
      avgOrderValue: completedOrders.length > 0 ? completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0) / completedOrders.length : 0,
      revenue30d: revenueFor(30), orders30d: ordersFor(30),
      revenue7d: revenueFor(7), orders7d: ordersFor(7),
      revenue90d: revenueFor(90), orders90d: ordersFor(90),
    },
    customersStats: {
      totalCustomers: customers.length,
      newCustomers30d: customersFor(30),
      newCustomers7d: customersFor(7),
      newCustomers90d: customersFor(90),
      customersWithOrders: new Set(orders.map(o => o.customer_id).filter(Boolean)).size,
    },
    productPerformance: [],
    topProducts: [],
    recentOrders: orders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(o => ({
        id: o.id || '',
        orderNumber: o.order_number || '',
        totalAmount: o.total_amount || 0,
        status: o.status || 'pending',
        createdAt: o.created_at || new Date().toISOString(),
        customer: null,
        productTypes: [],
      })) as RecentOrder[],
    generatedAt: new Date().toISOString(),
    periodDays,
  };

  return transformOptimizedData(optimizedData);
}

export const useDashboardStatsOptimized = (options?: UseDashboardStatsOptions) => {
  const { store } = useStore();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const periodDays = getPeriodDays(options?.period);

  const queryKey = ['dashboard-stats', store?.id, periodDays] as const;

  const { data, isLoading, isFetching, error, refetch } = useQuery<DashboardStats>({
    queryKey,
    queryFn: () => {
      if (!store?.id) throw new Error('No store');
      return fetchDashboardStatsFromTables(store.id, periodDays);
    },
    enabled: !!user && !!store?.id,
    staleTime: 5 * 60 * 1000,      // 5 min avant de considérer les données périmées
    gcTime: 10 * 60 * 1000,         // 10 min en cache après démontage
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    meta: {
      errorMessage: 'Erreur de chargement des statistiques',
    },
  });

  const stats = data ?? getFallbackStats();
  const errorMessage = error
    ? (error.message?.includes('fetch') || error.message?.includes('Network')
        ? 'Problème de connexion temporaire.'
        : 'Erreur de chargement des statistiques.')
    : null;

  return {
    stats,
    loading: isLoading,
    error: errorMessage,
    isUpdating: isFetching && !isLoading,
    refetch: () => { refetch(); },
  };
};

/** @deprecated Use useDashboardStatsOptimized */
export const useDashboardStats = useDashboardStatsOptimized;
