/**
 * Charge les stats dashboard via RPC agrégée (1 round-trip).
 * Fallback géré par l'appelant si la fonction n'est pas déployée.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  isRpcUnavailableError,
  logRpcFallback,
  type SupabaseRpcError,
} from '@/lib/dashboard/rpc-error-utils';
import type {
  DashboardOperational,
  OptimizedDashboardData,
  ProductPerformance,
  RecentOrder,
  TopProduct,
} from '@/types/dashboard-stats';
import { parseWebMetricsPayload } from '@/lib/dashboard/fetch-web-metrics';

export interface DashboardPeriodRange {
  start: Date;
  end: Date;
  days: number;
  label: string;
}

export function isDashboardRpcUnavailableError(error: SupabaseRpcError): boolean {
  return isRpcUnavailableError(error);
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function parseOperational(raw: unknown): DashboardOperational {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pending = num(o.pendingOrders);
  const processing = num(o.processingOrders);
  return {
    pendingOrders: pending,
    processingOrders: processing,
    draftProducts: num(o.draftProducts),
    lowStockProducts: num(o.lowStockProducts),
    pendingReviews: num(o.pendingReviews),
    ordersToFulfill: num(o.ordersToFulfill, pending + processing),
  };
}

function parseProductPerformance(raw: unknown): ProductPerformance[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(item => {
    const p = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const orders = num(p.orders);
    const revenue = num(p.revenue);
    return {
      type: str(p.type, 'digital'),
      orders,
      revenue,
      quantity: num(p.quantity),
      avgOrderValue: num(p.avgOrderValue, orders > 0 ? revenue / orders : 0),
      productsSold: num(p.productsSold),
      orders30d: num(p.orders30d, orders),
      revenue30d: num(p.revenue30d, revenue),
    };
  });
}

function parseTopProducts(raw: unknown): TopProduct[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(item => {
    const p = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return {
      id: str(p.id),
      name: str(p.name),
      price: num(p.price),
      imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : null,
      productType: str(p.productType, 'digital'),
      revenue: num(p.revenue),
      quantity: num(p.quantity),
      orderCount: num(p.orderCount),
    };
  });
}

function parseRecentOrders(raw: unknown): RecentOrder[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(item => {
    const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const customerRaw = o.customer;
    let customer: RecentOrder['customer'] = null;
    if (customerRaw && typeof customerRaw === 'object') {
      const c = customerRaw as Record<string, unknown>;
      customer = {
        id: str(c.id),
        name: str(c.name),
        email: str(c.email),
      };
    }
    const productTypes = Array.isArray(o.productTypes)
      ? o.productTypes.filter((t): t is string => typeof t === 'string')
      : [];
    return {
      id: str(o.id),
      orderNumber: str(o.orderNumber),
      totalAmount: num(o.totalAmount),
      status: str(o.status, 'pending'),
      createdAt: str(o.createdAt, new Date().toISOString()),
      customer,
      productTypes,
    };
  });
}

export function parseDashboardStatsRpcPayload(
  payload: unknown,
  range: DashboardPeriodRange
): OptimizedDashboardData {
  const root = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const base = (
    root.baseStats && typeof root.baseStats === 'object' ? root.baseStats : {}
  ) as Record<string, unknown>;
  const orders = (
    root.ordersStats && typeof root.ordersStats === 'object' ? root.ordersStats : {}
  ) as Record<string, unknown>;
  const customers = (
    root.customersStats && typeof root.customersStats === 'object' ? root.customersStats : {}
  ) as Record<string, unknown>;

  return {
    baseStats: {
      totalProducts: num(base.totalProducts),
      activeProducts: num(base.activeProducts),
      digitalProducts: num(base.digitalProducts),
      physicalProducts: num(base.physicalProducts),
      serviceProducts: num(base.serviceProducts),
      courseProducts: num(base.courseProducts),
      artistProducts: num(base.artistProducts),
      avgProductPrice: num(base.avgProductPrice),
    },
    ordersStats: {
      totalOrders: num(orders.totalOrders),
      completedOrders: num(orders.completedOrders),
      pendingOrders: num(orders.pendingOrders),
      cancelledOrders: num(orders.cancelledOrders),
      totalRevenue: num(orders.totalRevenue),
      avgOrderValue: num(orders.avgOrderValue),
      revenue30d: num(orders.revenue30d),
      orders30d: num(orders.orders30d),
      revenue7d: num(orders.revenue7d),
      orders7d: num(orders.orders7d),
      revenue90d: num(orders.revenue90d),
      orders90d: num(orders.orders90d),
      previousPeriodRevenue: num(orders.previousPeriodRevenue),
      previousPeriodOrders: num(orders.previousPeriodOrders),
      previousPeriodCustomers: num(orders.previousPeriodCustomers),
    },
    customersStats: {
      totalCustomers: num(customers.totalCustomers),
      newCustomers30d: num(customers.newCustomers30d),
      newCustomers7d: num(customers.newCustomers7d),
      newCustomers90d: num(customers.newCustomers90d),
      customersWithOrders: num(customers.customersWithOrders),
    },
    productPerformance: parseProductPerformance(root.productPerformance),
    topProducts: parseTopProducts(root.topProducts),
    recentOrders: parseRecentOrders(root.recentOrders),
    operational: parseOperational(root.operational),
    webMetrics: root.webMetrics ? parseWebMetricsPayload(root.webMetrics) : null,
    generatedAt: (() => {
      const raw = root.generatedAt;
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'number') return new Date(raw).toISOString();
      return new Date().toISOString();
    })(),
    periodDays: num(root.periodDays, range.days),
    periodLabel: str(root.periodLabel, range.label),
  };
}

export async function fetchDashboardStatsFromRpc(
  storeId: string,
  range: DashboardPeriodRange
): Promise<OptimizedDashboardData> {
  const { data, error } = await supabase.rpc('get_store_dashboard_stats_aggregated', {
    p_store_id: storeId,
    p_period_start: range.start.toISOString(),
    p_period_end: range.end.toISOString(),
    p_period_label: range.label,
  });

  if (error) {
    if (isDashboardRpcUnavailableError(error)) {
      logRpcFallback('get_store_dashboard_stats_aggregated', error, { storeId });
      throw Object.assign(new Error('DASHBOARD_RPC_UNAVAILABLE'), { cause: error });
    }
    throw error;
  }

  logger.debug('[Dashboard] Stats loaded via get_store_dashboard_stats_aggregated', {
    storeId,
    periodDays: range.days,
  });

  return parseDashboardStatsRpcPayload(data, range);
}
