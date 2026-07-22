/**
 * Hook optimisé pour les statistiques du dashboard
 * Utilise React Query pour le cache, le refetch automatique et la déduplication
 */

import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { isRpcUnavailableError, logRpcFallback } from '@/lib/dashboard/rpc-error-utils';
import {
  fetchDashboardStatsFromRpc,
  isDashboardRpcUnavailableError,
} from '@/lib/dashboard/fetch-dashboard-stats-rpc';
import { fetchWebMetricsFromRpc, ZERO_WEB_METRICS } from '@/lib/dashboard/fetch-web-metrics';
import { transformOptimizedData } from '@/services/dashboardStatsTransform';
import {
  isOrderEligibleForRevenue,
  orderNetRevenueAmount,
} from '@/lib/orders/order-revenue-eligibility';

export type { DashboardStats, UseDashboardStatsOptions } from '@/types/dashboard-stats';
import type {
  DashboardStats,
  UseDashboardStatsOptions,
  OptimizedDashboardData,
  RecentOrder,
  TopProduct,
  ProductPerformance,
  DashboardOperational,
} from '@/types/dashboard-stats';

interface PeriodRange {
  start: Date;
  end: Date;
  days: number;
  label: string;
}

function getPeriodDays(period?: string): number {
  if (period === '7d') return 7;
  if (period === '90d') return 90;
  return 30;
}

function resolvePeriodRange(options?: UseDashboardStatsOptions): PeriodRange {
  const end = options?.customEndDate ? new Date(options.customEndDate) : new Date();
  end.setHours(23, 59, 59, 999);

  if (options?.period === 'custom' && options.customStartDate) {
    const start = new Date(options.customStartDate);
    start.setHours(0, 0, 0, 0);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const label = `${start.toLocaleDateString('fr-FR')} – ${end.toLocaleDateString('fr-FR')}`;
    return { start, end, days, label };
  }

  const days = getPeriodDays(options?.period);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const labels: Record<string, string> = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '90 derniers jours',
  };
  return {
    start,
    end,
    days,
    label: labels[options?.period || '30d'] || `${days} derniers jours`,
  };
}

function isInRange(dateStr: string, start: Date, end: Date): boolean {
  const t = new Date(dateStr).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function tolerateQueryError(
  tableName: string,
  err: { code?: string; message?: string } | null
): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';
  const isNonBlocking =
    code === '42501' ||
    code === '42P01' ||
    msg.includes('permission denied') ||
    msg.includes('does not exist') ||
    msg.includes('rls');

  if (isNonBlocking) {
    logger.warn(`[Dashboard] Non-blocking query error on ${tableName}`, {
      table: tableName,
      code,
      message: err.message,
    });
  }
  return isNonBlocking;
}

async function fetchOperationalCounts(storeId: string): Promise<DashboardOperational> {
  const [pendingRes, processingRes, draftRes, lowStockRes, reviewsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('status', 'pending'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .in('status', ['processing', 'confirmed']),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_draft', true),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('product_type', 'physical')
      .eq('is_active', true)
      .not('stock', 'is', null)
      .lte('stock', 5),
    supabase
      .from('reviews')
      .select('id, products!inner(store_id)', { count: 'exact', head: true })
      .eq('products.store_id', storeId)
      .eq('is_approved', false),
  ]);

  const pendingOrders = pendingRes.count ?? 0;
  const processingOrders = processingRes.count ?? 0;

  return {
    pendingOrders,
    processingOrders,
    draftProducts: draftRes.count ?? 0,
    lowStockProducts: lowStockRes.count ?? 0,
    pendingReviews: reviewsRes.count ?? 0,
    ordersToFulfill: pendingOrders + processingOrders,
  };
}

type OrderRow = {
  id: string;
  status: string;
  payment_status: string | null;
  total_amount: number | null;
  refunded_amount: number | null;
  created_at: string;
  customer_id: string | null;
  order_number: string | null;
  customers: { name: string; email: string } | { name: string; email: string }[] | null;
};

type ProductRow = {
  product_type: string;
  price: number | null;
  is_active: boolean | null;
  is_draft?: boolean | null;
  created_at?: string | null;
};

const EMPTY_ORDERS_BY_TYPE = {
  digital: 0,
  physical: 0,
  service: 0,
  course: 0,
  artist: 0,
};

async function fetchOrderItemTypeAggregates(orderIds: string[]): Promise<{
  ordersByType: Record<string, number>;
  typesByOrderId: Map<string, string[]>;
}> {
  if (orderIds.length === 0) {
    return { ordersByType: { ...EMPTY_ORDERS_BY_TYPE }, typesByOrderId: new Map() };
  }

  const { data: items, error } = await supabase
    .from('order_items')
    .select('order_id, product_type')
    .in('order_id', orderIds);

  if (error) {
    if (!tolerateQueryError('order_items', error)) throw error;
    return { ordersByType: { ...EMPTY_ORDERS_BY_TYPE }, typesByOrderId: new Map() };
  }

  const ordersByType = { ...EMPTY_ORDERS_BY_TYPE };
  const typesByOrderId = new Map<string, Set<string>>();

  for (const item of items ?? []) {
    const type = item.product_type;
    if (type && type in ordersByType) {
      ordersByType[type as keyof typeof ordersByType] += 1;
    }
    if (item.order_id && type) {
      const set = typesByOrderId.get(item.order_id) ?? new Set<string>();
      set.add(type);
      typesByOrderId.set(item.order_id, set);
    }
  }

  return {
    ordersByType,
    typesByOrderId: new Map(
      [...typesByOrderId.entries()].map(([orderId, types]) => [orderId, [...types]])
    ),
  };
}

type OrderItemRow = {
  order_id: string | null;
  product_id: string | null;
  quantity: number | null;
  total_price: number | null;
  product_type: string | null;
  products: {
    id: string;
    name: string;
    price: number | null;
    image_url: string | null;
    product_type: string;
  } | null;
};

async function fetchTopProductsFromItems(
  storeId: string,
  completedOrderIds: string[],
  limit = 5
): Promise<TopProduct[]> {
  if (completedOrderIds.length === 0) return [];

  const { data: items, error } = await supabase
    .from('order_items')
    .select(
      'order_id, product_id, quantity, total_price, product_type, products!inner(id, name, price, image_url, product_type, store_id)'
    )
    .in('order_id', completedOrderIds)
    .eq('products.store_id', storeId);

  if (error) {
    if (!tolerateQueryError('order_items', error)) throw error;
    return [];
  }

  const agg = new Map<
    string,
    {
      product: NonNullable<OrderItemRow['products']>;
      revenue: number;
      quantity: number;
      orders: Set<string>;
    }
  >();

  for (const item of (items || []) as OrderItemRow[]) {
    if (!item.product_id || !item.products) continue;
    const pid = item.product_id;
    const existing = agg.get(pid) ?? {
      product: item.products,
      revenue: 0,
      quantity: 0,
      orders: new Set<string>(),
    };
    existing.revenue += Number(item.total_price) || 0;
    existing.quantity += Number(item.quantity) || 0;
    if (item.order_id) existing.orders.add(item.order_id);
    agg.set(pid, existing);
  }

  return [...agg.entries()]
    .map(([id, v]) => ({
      id,
      name: v.product.name,
      price: v.product.price || 0,
      imageUrl: v.product.image_url,
      productType: v.product.product_type,
      revenue: v.revenue,
      quantity: v.quantity,
      orderCount: v.orders.size || v.quantity,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

async function fetchTopProductsRpc(storeId: string, limit = 5): Promise<TopProduct[]> {
  const { data, error } = await supabase.rpc('get_top_selling_products', {
    store_uuid: storeId,
    limit_count: limit,
  });

  if (error) {
    if (isRpcUnavailableError(error)) {
      logRpcFallback('get_top_selling_products', error, { storeId });
    } else if (!tolerateQueryError('get_top_selling_products', error)) {
      logger.warn('[Dashboard] RPC top products unavailable', { error: error.message });
    }
    return [];
  }

  return (data || []).map(
    (p: {
      id: string;
      name: string;
      price: number;
      image_url: string | null;
      product_type: string;
      revenue: number;
      quantity: number;
      order_count: number;
    }) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      imageUrl: p.image_url,
      productType: p.product_type,
      revenue: Number(p.revenue) || 0,
      quantity: Number(p.quantity) || 0,
      orderCount: Number(p.order_count) || 0,
    })
  );
}

function buildProductPerformance(
  topProducts: TopProduct[],
  ordersByType: Record<string, number>
): ProductPerformance[] {
  const types = ['digital', 'physical', 'service', 'course', 'artist'] as const;
  return types.map(type => {
    const matching = topProducts.filter(p => p.productType === type);
    const revenue = matching.reduce((s, p) => s + p.revenue, 0);
    const orders = ordersByType[type] || 0;
    return {
      type,
      orders,
      revenue,
      quantity: matching.reduce((s, p) => s + p.quantity, 0),
      avgOrderValue: orders > 0 ? revenue / orders : 0,
      productsSold: matching.length,
      orders30d: orders,
      revenue30d: revenue,
    };
  });
}

async function fetchDashboardStatsFromTables(
  storeId: string,
  range: PeriodRange
): Promise<DashboardStats> {
  const compareStart = new Date(range.start);
  compareStart.setDate(compareStart.getDate() - range.days);

  const [productsResult, ordersResult, customersResult, operational] = await Promise.all([
    supabase
      .from('products')
      .select('product_type, price, is_active, is_draft, created_at')
      .eq('store_id', storeId),
    supabase
      .from('orders')
      .select(
        'id, status, payment_status, total_amount, refunded_amount, created_at, customer_id, order_number, customers(name, email)'
      )
      .eq('store_id', storeId)
      .gte('created_at', compareStart.toISOString())
      .lte('created_at', range.end.toISOString())
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('customers').select('created_at').eq('store_id', storeId).limit(3000),
    fetchOperationalCounts(storeId),
  ]);

  if (productsResult.error && !tolerateQueryError('products', productsResult.error)) {
    throw productsResult.error;
  }
  if (ordersResult.error && !tolerateQueryError('orders', ordersResult.error)) {
    throw ordersResult.error;
  }
  if (customersResult.error && !tolerateQueryError('customers', customersResult.error)) {
    throw customersResult.error;
  }

  const products = (productsResult.data || []) as ProductRow[];
  const allOrders = (ordersResult.data || []) as OrderRow[];
  const customers = customersResult.data || [];

  const periodOrders = allOrders.filter(o => isInRange(o.created_at, range.start, range.end));
  const previousOrders = allOrders.filter(
    o =>
      isInRange(o.created_at, compareStart, range.start) &&
      !isInRange(o.created_at, range.start, range.end)
  );

  const completedInPeriod = periodOrders.filter(o =>
    isOrderEligibleForRevenue(o.status, o.payment_status)
  );
  const completedPrevious = previousOrders.filter(o =>
    isOrderEligibleForRevenue(o.status, o.payment_status)
  );

  const periodRevenue = completedInPeriod.reduce(
    (s, o) => s + orderNetRevenueAmount(o.total_amount, o.refunded_amount),
    0
  );
  const previousRevenue = completedPrevious.reduce(
    (s, o) => s + orderNetRevenueAmount(o.total_amount, o.refunded_amount),
    0
  );

  const newCustomersInPeriod = customers.filter(c =>
    isInRange(c.created_at, range.start, range.end)
  ).length;
  const newCustomersPrevious = customers.filter(
    c =>
      isInRange(c.created_at, compareStart, range.start) &&
      !isInRange(c.created_at, range.start, range.end)
  ).length;

  const activeProducts = products.filter(p => p.is_active && !p.is_draft);
  const countType = (type: string) => activeProducts.filter(p => p.product_type === type).length;

  const periodOrderIds = periodOrders.map(o => o.id);
  const { ordersByType, typesByOrderId } = await fetchOrderItemTypeAggregates(periodOrderIds);

  const newProductsInPeriod = products.filter(p =>
    p.created_at ? isInRange(p.created_at, range.start, range.end) : false
  ).length;
  const previousNewProductsInPeriod = products.filter(
    p =>
      p.created_at &&
      isInRange(p.created_at, compareStart, range.start) &&
      !isInRange(p.created_at, range.start, range.end)
  ).length;

  const completedOrderIds = completedInPeriod.map(o => o.id);
  let topProducts = await fetchTopProductsFromItems(storeId, completedOrderIds, 5);
  if (topProducts.length === 0) {
    topProducts = await fetchTopProductsRpc(storeId, 5);
  }

  const productPerformance = buildProductPerformance(topProducts, ordersByType);

  const recentOrders: RecentOrder[] = periodOrders.slice(0, 5).map(o => {
    const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    return {
      id: o.id,
      orderNumber: o.order_number || '',
      totalAmount: o.total_amount || 0,
      status: o.status,
      createdAt: o.created_at,
      customer: cust ? { id: o.customer_id || '', name: cust.name, email: cust.email } : null,
      productTypes: typesByOrderId.get(o.id) ?? [],
    };
  });

  const optimizedData: OptimizedDashboardData = {
    baseStats: {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      digitalProducts: countType('digital'),
      physicalProducts: countType('physical'),
      serviceProducts: countType('service'),
      courseProducts: countType('course'),
      artistProducts: countType('artist'),
      avgProductPrice:
        products.length > 0
          ? products.reduce((s, p) => s + (p.price || 0), 0) / products.length
          : 0,
      newProductsInPeriod,
      previousNewProductsInPeriod,
    },
    ordersStats: {
      totalOrders: periodOrders.length,
      completedOrders: completedInPeriod.length,
      pendingOrders: periodOrders.filter(o => o.status === 'pending').length,
      cancelledOrders: periodOrders.filter(o => o.status === 'cancelled').length,
      totalRevenue: periodRevenue,
      avgOrderValue: completedInPeriod.length > 0 ? periodRevenue / completedInPeriod.length : 0,
      revenue30d: periodRevenue,
      orders30d: periodOrders.length,
      revenue7d: periodRevenue,
      orders7d: periodOrders.length,
      revenue90d: periodRevenue,
      orders90d: periodOrders.length,
      previousPeriodRevenue: previousRevenue,
      previousPeriodOrders: previousOrders.length,
      previousPeriodCustomers: newCustomersPrevious,
    },
    customersStats: {
      totalCustomers: customers.length,
      newCustomers30d: newCustomersInPeriod,
      newCustomers7d: newCustomersInPeriod,
      newCustomers90d: newCustomersInPeriod,
      customersWithOrders: new Set(periodOrders.map(o => o.customer_id).filter(Boolean)).size,
    },
    productPerformance,
    topProducts,
    recentOrders,
    operational,
    webMetrics: await fetchWebMetricsFromRpc(storeId, range),
    generatedAt: new Date().toISOString(),
    periodDays: range.days,
    periodLabel: range.label,
  };

  return transformOptimizedData(optimizedData);
}

async function fetchDashboardStats(storeId: string, range: PeriodRange): Promise<DashboardStats> {
  try {
    const optimizedData = await fetchDashboardStatsFromRpc(storeId, range);
    if (!optimizedData.webMetrics) {
      optimizedData.webMetrics = await fetchWebMetricsFromRpc(storeId, range);
    }
    return transformOptimizedData(optimizedData);
  } catch (err) {
    const cause =
      err instanceof Error && 'cause' in err
        ? (err.cause as { code?: string; message?: string })
        : null;
    const rpcErr = cause ?? (err as { code?: string; message?: string });

    if (
      (err instanceof Error && err.message === 'DASHBOARD_RPC_UNAVAILABLE') ||
      isDashboardRpcUnavailableError(rpcErr)
    ) {
      logger.info('[Dashboard] RPC agrégée indisponible — fallback requêtes client', {
        storeId,
      });
      return fetchDashboardStatsFromTables(storeId, range);
    }

    throw err;
  }
}

export const useDashboardStatsOptimized = (options?: UseDashboardStatsOptions) => {
  const { user } = useAuth();
  const storeId = options?.storeId ?? null;
  const range = useMemo(
    () => resolvePeriodRange(options),
    [options?.period, options?.customStartDate, options?.customEndDate]
  );

  const queryKey = [
    'dashboard-stats',
    storeId,
    range.days,
    range.start.toISOString(),
    range.end.toISOString(),
  ] as const;

  const { data, isLoading, isFetching, isPlaceholderData, error, refetch } =
    useQuery<DashboardStats>({
      queryKey,
      queryFn: () => {
        if (!storeId) throw new Error('No store');
        return fetchDashboardStats(storeId, range);
      },
      enabled: !!user && !!storeId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      /** Garde le contenu visible entre périodes — pas de flash skeleton complet */
      placeholderData: keepPreviousData,
      retry: (failureCount, err) => {
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code?: string }).code)
            : '';
        if (code === '42501') return false;
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'DASHBOARD_RPC_UNAVAILABLE') return failureCount < 1;
        return failureCount < 2;
      },
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
      meta: {
        errorMessage: 'Erreur de chargement des statistiques',
      },
    });

  const hasData = data != null;
  /** Ne pas afficher de faux KPIs à zéro — skeleton ou erreur tant qu’il n’y a pas de données réelles */
  const stats = hasData ? data : null;
  const errorMessage = error
    ? error.message?.includes('fetch') || error.message?.includes('Network')
      ? 'Problème de connexion temporaire.'
      : 'Erreur de chargement des statistiques.'
    : null;

  return {
    stats,
    hasData,
    /** Premier chargement uniquement — pas lors des refetch / changement de période */
    loading: isLoading && !hasData,
    error: errorMessage,
    /** Refetch ou changement de période — contenu précédent conservé via keepPreviousData */
    isUpdating: isFetching && hasData && !isLoading,
    isPlaceholderData,
    refetch: () => {
      refetch();
    },
  };
};

/** @deprecated Use useDashboardStatsOptimized */
export const useDashboardStats = useDashboardStatsOptimized;
