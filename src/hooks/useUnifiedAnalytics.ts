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
import { fetchWebMetricsForPeriod } from '@/lib/dashboard/fetch-web-metrics';
import {
  isOrderEligibleForRevenue,
  orderNetRevenueAmount,
} from '@/lib/orders/order-revenue-eligibility';

export type ProductType = 'digital' | 'physical' | 'service' | 'course' | 'artist';
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

interface AnalyticsOrderProduct {
  id: string;
  name: string;
  product_type?: string | null;
  price?: string | number | null;
}

interface AnalyticsOrderItem {
  price: string | number;
  quantity?: number | null;
  products?: AnalyticsOrderProduct | null;
}

interface AnalyticsOrderRow {
  customer_id?: string | null;
  total_amount: string | number;
  refunded_amount?: string | number | null;
  created_at: string;
  status?: string | null;
  payment_status?: string | null;
  order_items?: AnalyticsOrderItem[] | null;
}

interface ProductTypeAccumulator {
  revenue: number;
  orders: number;
  units: number;
  products: Set<string>;
}

type ProductTypeMetrics = UnifiedAnalytics['byProductType'][ProductType];

function calcGrowthPercent(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function accumulateByProductType(orders: AnalyticsOrderRow[]) {
  const acc: Record<ProductType, ProductTypeAccumulator> = {
    digital: { revenue: 0, orders: 0, units: 0, products: new Set() },
    physical: { revenue: 0, orders: 0, units: 0, products: new Set() },
    service: { revenue: 0, orders: 0, units: 0, products: new Set() },
    course: { revenue: 0, orders: 0, units: 0, products: new Set() },
    artist: { revenue: 0, orders: 0, units: 0, products: new Set() },
  };

  orders.forEach(order => {
    (order.order_items ?? []).forEach(item => {
      const product = item.products;
      const type = product?.product_type as ProductType | undefined;
      if (!type || !acc[type]) return;
      acc[type].revenue += parseFloat(String(item.price)) * (item.quantity || 1);
      acc[type].orders += 1;
      acc[type].units += item.quantity || 1;
      if (product?.id) acc[type].products.add(product.id);
    });
  });

  return acc;
}

export interface UnifiedAnalytics {
  // Vue d'ensemble
  overview: {
    totalRevenue: number;
    totalOrders: number;
    /** Acheteurs distincts sur la période (customer_id commandes). */
    totalCustomers: number;
    /** Effectif CRM boutique (table customers), hors filtre période. */
    crmCustomersTotal: number;
    activeProducts: number;
    totalProducts: number;
    averageOrderValue: number;
    conversionRate: number;
    growthRate: number;
  };

  // Par type de produit
  byProductType: Record<
    ProductType,
    {
      revenue: number;
      orders: number;
      units: number;
      averagePrice: number;
      growth: number;
    }
  >;

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
    crmCustomersTotal: 0,
    activeProducts: 0,
    totalProducts: 0,
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

export const useUnifiedAnalytics = (
  timeRange: TimeRange = '30d',
  options?: { enabled?: boolean }
) => {
  const enabled = options?.enabled !== false;
  const [analytics, setAnalytics] = useState<UnifiedAnalytics>(getFallbackAnalytics());
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const { store } = useStore();

  const getDateRange = useCallback((range: TimeRange) => {
    const now = new Date();
    const ranges: Record<TimeRange, Date> = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      all: new Date(0),
    };
    return ranges[range];
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!enabled) return;
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
        .select(
          `
          id,
          total_amount,
          refunded_amount,
          status,
          payment_status,
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
        `
        )
        .eq('store_id', store.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Récupérer les commandes précédentes pour les tendances
      const { data: previousOrders } = await supabase
        .from('orders')
        .select(
          `
          total_amount,
          refunded_amount,
          status,
          payment_status,
          created_at,
          customer_id,
          order_items (
            quantity,
            price,
            products ( id, product_type )
          )
        `
        )
        .eq('store_id', store.id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Clients CRM + catalogue produits (totaux exacts, hors pagination)
      const [
        { count: crmCustomersTotal },
        { count: totalProducts },
        { count: activeProducts },
        { data: customers },
      ] = await Promise.all([
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .eq('is_active', true)
          .or('is_draft.eq.false,is_draft.is.null'),
        supabase.from('customers').select('id, name, email').eq('store_id', store.id),
      ]);

      // Calculer les analytics (aligné dashboard : revenu éligible)
      const periodOrders = (orders ?? []) as AnalyticsOrderRow[];
      const previousPeriodOrders = (previousOrders ?? []) as AnalyticsOrderRow[];
      const revenueOrders = periodOrders.filter(o =>
        isOrderEligibleForRevenue(o.status, o.payment_status)
      );
      const previousRevenueOrders = previousPeriodOrders.filter(o =>
        isOrderEligibleForRevenue(o.status, o.payment_status)
      );
      const totalRevenue = revenueOrders.reduce(
        (sum, o) => sum + orderNetRevenueAmount(o.total_amount, o.refunded_amount),
        0
      );
      const totalOrders = periodOrders.length;
      const totalCustomers = new Set(periodOrders.map(o => o.customer_id).filter(Boolean)).size;
      const previousCustomers = new Set(
        previousPeriodOrders.map(o => o.customer_id).filter(Boolean)
      ).size;
      const averageOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

      // Revenus par type de produit (sur commandes éligibles)
      const byProductType = accumulateByProductType(revenueOrders);
      const previousByType = accumulateByProductType(previousRevenueOrders);

      // Convertir en format final
      const byProductTypeFinal: Record<ProductType, ProductTypeMetrics> = {
        digital: {
          revenue: byProductType.digital.revenue,
          orders: byProductType.digital.orders,
          units: byProductType.digital.units,
          averagePrice:
            byProductType.digital.units > 0
              ? byProductType.digital.revenue / byProductType.digital.units
              : 0,
          growth: calcGrowthPercent(byProductType.digital.revenue, previousByType.digital.revenue),
        },
        physical: {
          revenue: byProductType.physical.revenue,
          orders: byProductType.physical.orders,
          units: byProductType.physical.units,
          averagePrice:
            byProductType.physical.units > 0
              ? byProductType.physical.revenue / byProductType.physical.units
              : 0,
          growth: calcGrowthPercent(
            byProductType.physical.revenue,
            previousByType.physical.revenue
          ),
        },
        service: {
          revenue: byProductType.service.revenue,
          orders: byProductType.service.orders,
          units: byProductType.service.units,
          averagePrice:
            byProductType.service.units > 0
              ? byProductType.service.revenue / byProductType.service.units
              : 0,
          growth: calcGrowthPercent(byProductType.service.revenue, previousByType.service.revenue),
        },
        course: {
          revenue: byProductType.course.revenue,
          orders: byProductType.course.orders,
          units: byProductType.course.units,
          averagePrice:
            byProductType.course.units > 0
              ? byProductType.course.revenue / byProductType.course.units
              : 0,
          growth: calcGrowthPercent(byProductType.course.revenue, previousByType.course.revenue),
        },
        artist: {
          revenue: byProductType.artist.revenue,
          orders: byProductType.artist.orders,
          units: byProductType.artist.units,
          averagePrice:
            byProductType.artist.units > 0
              ? byProductType.artist.revenue / byProductType.artist.units
              : 0,
          growth: calcGrowthPercent(byProductType.artist.revenue, previousByType.artist.revenue),
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
      revenueOrders.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!revenueByDate[date]) {
          revenueByDate[date] = {
            revenue: 0,
            orders: 0,
            digital: 0,
            physical: 0,
            service: 0,
            course: 0,
            artist: 0,
          };
        }
        revenueByDate[date].revenue += orderNetRevenueAmount(
          order.total_amount,
          order.refunded_amount
        );
        revenueByDate[date].orders += 1;

        const items = order.order_items ?? [];
        items.forEach(item => {
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
      revenueOrders.forEach(order => {
        const items = order.order_items ?? [];
        items.forEach(item => {
          const product = item.products;
          if (product) {
            if (!productRevenue[product.id]) {
              productRevenue[product.id] = {
                id: product.id,
                name: product.name,
                type: product.product_type ?? '',
                revenue: 0,
                orders: 0,
                units: 0,
              };
            }
            productRevenue[product.id].revenue +=
              parseFloat(item.price.toString()) * (item.quantity || 1);
            productRevenue[product.id].orders += 1;
            productRevenue[product.id].units += item.quantity || 1;
          }
        });
      });

      const topProducts = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(p => ({
          ...p,
          type: p.type as ProductType,
          growth: byProductTypeFinal[p.type as ProductType]?.growth ?? 0,
        }));

      // Top clients
      interface CustomerStatsData {
        id: string;
        totalSpent: number;
        orders: number;
        lastOrderDate: string;
      }
      const customerStats: Record<string, CustomerStatsData> = {};
      revenueOrders.forEach(order => {
        if (order.customer_id) {
          if (!customerStats[order.customer_id]) {
            customerStats[order.customer_id] = {
              id: order.customer_id,
              totalSpent: 0,
              orders: 0,
              lastOrderDate: order.created_at,
            };
          }
          customerStats[order.customer_id].totalSpent += orderNetRevenueAmount(
            order.total_amount,
            order.refunded_amount
          );
          customerStats[order.customer_id].orders += 1;
          if (
            new Date(order.created_at) > new Date(customerStats[order.customer_id].lastOrderDate)
          ) {
            customerStats[order.customer_id].lastOrderDate = order.created_at;
          }
        }
      });

      const topCustomers = Object.values(customerStats)
        .map(c => {
          const customer = customers?.find(cust => cust.id === c.id);
          return {
            id: c.id,
            name: customer?.name || 'Client inconnu',
            email: customer?.email || '',
            totalSpent: c.totalSpent,
            orders: c.orders,
            averageOrderValue: c.orders > 0 ? c.totalSpent / c.orders : 0,
            lastOrderDate: c.lastOrderDate,
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      // Tendances (période précédente, mêmes règles de revenu)
      const previousRevenue = previousRevenueOrders.reduce(
        (sum, o) => sum + orderNetRevenueAmount(o.total_amount, o.refunded_amount),
        0
      );
      const revenueGrowth = calcGrowthPercent(totalRevenue, previousRevenue);
      const orderGrowth = calcGrowthPercent(totalOrders, previousPeriodOrders.length);
      const customerGrowth = calcGrowthPercent(totalCustomers, previousCustomers);

      // Métriques web (période courante — analytics_events + user_sessions)
      const webMetrics = await fetchWebMetricsForPeriod(store.id, startDate);
      const pageViews = webMetrics.pageViews;
      const bounceRate = webMetrics.bounceRate;
      const averageSessionDuration = webMetrics.sessionDuration;

      const totalConversions = revenueOrders.length;
      const conversionRate = pageViews > 0 ? (totalConversions / pageViews) * 100 : 0;

      const customersWithMultipleOrders = Object.values(customerStats).filter(
        c => c.orders > 1
      ).length;
      const repeatPurchaseRate =
        totalCustomers > 0 ? (customersWithMultipleOrders / totalCustomers) * 100 : 0;

      setAnalytics({
        overview: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          crmCustomersTotal: crmCustomersTotal ?? 0,
          activeProducts: activeProducts ?? 0,
          totalProducts: totalProducts ?? 0,
          averageOrderValue,
          conversionRate,
          growthRate: revenueGrowth,
        },
        byProductType: byProductTypeFinal,
        revenueOverTime,
        topProducts,
        topCustomers,
        performance: {
          customerRetention: repeatPurchaseRate,
          repeatPurchaseRate,
          cartAbandonmentRate: 0,
          averageSessionDuration,
          pageViews,
          bounceRate,
        },
        trends: {
          revenueTrend: revenueGrowth > 5 ? 'up' : revenueGrowth < -5 ? 'down' : 'stable',
          orderTrend: orderGrowth > 5 ? 'up' : orderGrowth < -5 ? 'down' : 'stable',
          customerTrend: customerGrowth > 5 ? 'up' : customerGrowth < -5 ? 'down' : 'stable',
          revenueGrowth,
          orderGrowth,
          customerGrowth,
        },
        geographic: [],
      });

      logger.info('Unified analytics loaded', { storeId: store.id, timeRange });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error fetching unified analytics', { error: errorMessage });
      setError(errorMessage);
      setAnalytics(getFallbackAnalytics());
    } finally {
      setLoading(false);
    }
  }, [store?.id, timeRange, getDateRange, enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchAnalytics();
  }, [fetchAnalytics, enabled]);

  return { analytics, loading, error, refetch: fetchAnalytics };
};
