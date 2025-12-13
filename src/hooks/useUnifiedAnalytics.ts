/**
 * Unified Analytics Hook
 * Date: 28 Janvier 2025
 * 
 * Hook unifié pour les analytics de tous les types de produits
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from './useStore';
import { logger } from '@/lib/logger';

export type ProductType = 'digital' | 'physical' | 'service' | 'course' | 'artist';
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export interface UnifiedAnalytics {
  // Vue d'ensemble
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
    growthRate: number;
  };

  // Par type de produit
  byProductType: Record<ProductType, {
    revenue: number;
    orders: number;
    units: number;
    averagePrice: number;
    growth: number;
  }>;

  // Revenus dans le temps
  revenueOverTime: Array<{
    date: string;
    revenue: number;
    orders: number;
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  }>;

  // Top produits
  topProducts: Array<{
    id: string;
    name: string;
    type: ProductType;
    revenue: number;
    orders: number;
    units: number;
    growth: number;
  }>;

  // Top clients
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    orders: number;
    averageOrderValue: number;
    lastOrderDate: string;
  }>;

  // Métriques de performance
  performance: {
    customerRetention: number;
    repeatPurchaseRate: number;
    cartAbandonmentRate: number;
    averageSessionDuration: number;
    pageViews: number;
    bounceRate: number;
  };

  // Tendances
  trends: {
    revenueTrend: 'up' | 'down' | 'stable';
    orderTrend: 'up' | 'down' | 'stable';
    customerTrend: 'up' | 'down' | 'stable';
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
  };

  // Répartition géographique (si disponible)
  geographic: Array<{
    country: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
}

const getFallbackAnalytics = (): UnifiedAnalytics => ({
  overview: {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    growthRate: 0,
  },
  byProductType: {
    digital: { revenue: 0, orders: 0, units: 0, averagePrice: 0, growth: 0 },
    physical: { revenue: 0, orders: 0, units: 0, averagePrice: 0, growth: 0 },
    service: { revenue: 0, orders: 0, units: 0, averagePrice: 0, growth: 0 },
    course: { revenue: 0, orders: 0, units: 0, averagePrice: 0, growth: 0 },
    artist: { revenue: 0, orders: 0, units: 0, averagePrice: 0, growth: 0 },
  },
  revenueOverTime: [],
  topProducts: [],
  topCustomers: [],
  performance: {
    customerRetention: 0,
    repeatPurchaseRate: 0,
    cartAbandonmentRate: 0,
    averageSessionDuration: 0,
    pageViews: 0,
    bounceRate: 0,
  },
  trends: {
    revenueTrend: 'stable',
    orderTrend: 'stable',
    customerTrend: 'stable',
    revenueGrowth: 0,
    orderGrowth: 0,
    customerGrowth: 0,
  },
  geographic: [],
});

export const useUnifiedAnalytics = (timeRange: TimeRange = '30d') => {
  const [analytics, setAnalytics] = useState<UnifiedAnalytics>(getFallbackAnalytics());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { store } = useStore();

  const getDateRange = useCallback((range: TimeRange) => {
    const now = new Date();
    const ranges: Record<TimeRange, Date> = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      'all': new Date(0),
    };
    return ranges[range];
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!store) {
      setAnalytics(getFallbackAnalytics());
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const startDate = getDateRange(timeRange);
      const previousStartDate = new Date(startDate.getTime() - (Date.now() - startDate.getTime()));

      // Récupérer les commandes
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          customer_id,
          order_items (
            id,
            product_id,
            quantity,
            price,
            products (
              id,
              name,
              product_type,
              price
            )
          )
        `)
        .eq('store_id', store.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Récupérer les commandes précédentes pour les tendances
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .eq('store_id', store.id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Récupérer les clients
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, email')
        .eq('store_id', store.id);

      // Calculer les analytics
      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0);
      const totalOrders = orders?.length || 0;
      const totalCustomers = new Set(orders?.map(o => o.customer_id).filter(Boolean)).size;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Revenus par type de produit
      const byProductType: Record<ProductType, any> = {
        digital: { revenue: 0, orders: 0, units: 0, products: new Set() },
        physical: { revenue: 0, orders: 0, units: 0, products: new Set() },
        service: { revenue: 0, orders: 0, units: 0, products: new Set() },
        course: { revenue: 0, orders: 0, units: 0, products: new Set() },
        artist: { revenue: 0, orders: 0, units: 0, products: new Set() },
      };

      completedOrders.forEach((order: any) => {
        const items = order.order_items || [];
        items.forEach((item: any) => {
          const product = item.products;
          if (product && product.product_type) {
            const type = product.product_type as ProductType;
            if (byProductType[type]) {
              byProductType[type].revenue += parseFloat(item.price.toString()) * (item.quantity || 1);
              byProductType[type].orders += 1;
              byProductType[type].units += item.quantity || 1;
              byProductType[type].products.add(product.id);
            }
          }
        });
      });

      // Convertir en format final
      const byProductTypeFinal: Record<ProductType, any> = {
        digital: {
          revenue: byProductType.digital.revenue,
          orders: byProductType.digital.orders,
          units: byProductType.digital.units,
          averagePrice: byProductType.digital.units > 0 ? byProductType.digital.revenue / byProductType.digital.units : 0,
          growth: 0, // À calculer avec les données précédentes
        },
        physical: {
          revenue: byProductType.physical.revenue,
          orders: byProductType.physical.orders,
          units: byProductType.physical.units,
          averagePrice: byProductType.physical.units > 0 ? byProductType.physical.revenue / byProductType.physical.units : 0,
          growth: 0,
        },
        service: {
          revenue: byProductType.service.revenue,
          orders: byProductType.service.orders,
          units: byProductType.service.units,
          averagePrice: byProductType.service.units > 0 ? byProductType.service.revenue / byProductType.service.units : 0,
          growth: 0,
        },
        course: {
          revenue: byProductType.course.revenue,
          orders: byProductType.course.orders,
          units: byProductType.course.units,
          averagePrice: byProductType.course.units > 0 ? byProductType.course.revenue / byProductType.course.units : 0,
          growth: 0,
        },
        artist: {
          revenue: byProductType.artist.revenue,
          orders: byProductType.artist.orders,
          units: byProductType.artist.units,
          averagePrice: byProductType.artist.units > 0 ? byProductType.artist.revenue / byProductType.artist.units : 0,
          growth: 0,
        },
      };

      // Revenus dans le temps
      interface RevenueByDateData {
        revenue: number;
        orders: number;
        digital: number;
        physical: number;
        service: number;
        course: number;
        artist: number;
      }
      const revenueByDate: Record<string, RevenueByDateData> = {};
      completedOrders.forEach((order: any) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!revenueByDate[date]) {
          revenueByDate[date] = { revenue: 0, orders: 0, digital: 0, physical: 0, service: 0, course: 0, artist: 0 };
        }
        revenueByDate[date].revenue += parseFloat(order.total_amount.toString());
        revenueByDate[date].orders += 1;

        // Par type
        const items = order.order_items || [];
        items.forEach((item: any) => {
          const product = item.products;
          if (product && product.product_type) {
            const type = product.product_type as ProductType;
            const amount = parseFloat(item.price.toString()) * (item.quantity || 1);
            if (revenueByDate[date][type] !== undefined) {
              revenueByDate[date][type] += amount;
            }
          }
        });
      });

      const revenueOverTime = Object.entries(revenueByDate)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top produits
      interface ProductRevenueData {
        id: string;
        name: string;
        type: string;
        revenue: number;
        orders: number;
        units: number;
      }
      const productRevenue: Record<string, ProductRevenueData> = {};
      completedOrders.forEach((order: any) => {
        const items = order.order_items || [];
        items.forEach((item: any) => {
          const product = item.products;
          if (product) {
            if (!productRevenue[product.id]) {
              productRevenue[product.id] = {
                id: product.id,
                name: product.name,
                type: product.product_type,
                revenue: 0,
                orders: 0,
                units: 0,
              };
            }
            productRevenue[product.id].revenue += parseFloat(item.price.toString()) * (item.quantity || 1);
            productRevenue[product.id].orders += 1;
            productRevenue[product.id].units += item.quantity || 1;
          }
        });
      });

      const topProducts = Object.values(productRevenue)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10)
        .map((p: any) => ({ ...p, growth: 0 }));

      // Top clients
      interface CustomerStatsData {
        id: string;
        totalSpent: number;
        orders: number;
        lastOrderDate: string;
      }
      const customerStats: Record<string, CustomerStatsData> = {};
      completedOrders.forEach((order: any) => {
        if (order.customer_id) {
          if (!customerStats[order.customer_id]) {
            customerStats[order.customer_id] = {
              id: order.customer_id,
              totalSpent: 0,
              orders: 0,
              lastOrderDate: order.created_at,
            };
          }
          customerStats[order.customer_id].totalSpent += parseFloat(order.total_amount.toString());
          customerStats[order.customer_id].orders += 1;
          if (new Date(order.created_at) > new Date(customerStats[order.customer_id].lastOrderDate)) {
            customerStats[order.customer_id].lastOrderDate = order.created_at;
          }
        }
      });

      const topCustomers = Object.values(customerStats)
        .map((c: { customer_id: string; total_amount: number; created_at: string }) => {
          const customer = customers?.find(cust => cust.id === c.id);
          return {
            ...c,
            name: customer?.name || 'Client inconnu',
            email: customer?.email || '',
            averageOrderValue: c.orders > 0 ? c.totalSpent / c.orders : 0,
          };
        })
        .sort((a: { totalSpent: number }, b: { totalSpent: number }) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      // Tendances
      const previousRevenue = previousOrders?.reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0) || 0;
      const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const orderGrowth = previousOrders ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100 : 0;

      setAnalytics({
        overview: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          averageOrderValue,
          conversionRate: 0, // À calculer avec les données de sessions
          growthRate: revenueGrowth,
        },
        byProductType: byProductTypeFinal,
        revenueOverTime,
        topProducts,
        topCustomers,
        performance: {
          customerRetention: 0,
          repeatPurchaseRate: 0,
          cartAbandonmentRate: 0,
          averageSessionDuration: 0,
          pageViews: 0,
          bounceRate: 0,
        },
        trends: {
          revenueTrend: revenueGrowth > 5 ? 'up' : revenueGrowth < -5 ? 'down' : 'stable',
          orderTrend: orderGrowth > 5 ? 'up' : orderGrowth < -5 ? 'down' : 'stable',
          customerTrend: 'stable',
          revenueGrowth,
          orderGrowth,
          customerGrowth: 0,
        },
        geographic: [],
      });

      logger.info('Unified analytics loaded', { storeId: store.id, timeRange });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching unified analytics', { error: errorMessage });
      setError(errorMessage);
      setAnalytics(getFallbackAnalytics());
    } finally {
      setLoading(false);
    }
  }, [store?.id, timeRange, getDateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
};

