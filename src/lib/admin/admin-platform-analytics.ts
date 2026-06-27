/**
 * Analytics plateforme admin — RPC get_platform_admin_analytics
 */

import { supabase } from '@/integrations/supabase/client';

export type PlatformProductTypeBreakdown = {
  product_type: string;
  revenue: number;
  orders: number;
};

export type PlatformMonthlyRevenue = {
  month: string;
  revenue: number;
  orders: number;
};

export type PlatformAdminAnalytics = {
  periodDays: number;
  totalRevenue: number;
  previousRevenue: number;
  revenueGrowthPct: number;
  totalOrders: number;
  previousOrders: number;
  ordersGrowthPct: number;
  paidOrders: number;
  paymentConversionRate: number;
  totalUsers: number;
  newUsersPeriod: number;
  totalStores: number;
  newStoresPeriod: number;
  totalProducts: number;
  activeProducts: number;
  averageOrderValue: number;
  activeUsers7d: number;
  revenueByProductType: PlatformProductTypeBreakdown[];
  monthlyRevenue: PlatformMonthlyRevenue[];
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  physical: 'Produits physiques',
  digital: 'Produits digitaux',
  service: 'Services',
  course: 'Cours en ligne',
  artist: 'Œuvres artiste',
  unknown: 'Autre',
};

export function computeGrowthPct(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatGrowthLabel(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}% vs période précédente`;
}

export function productTypeLabel(productType: string): string {
  return PRODUCT_TYPE_LABELS[productType] ?? productType;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapPlatformAdminAnalyticsPayload(payload: unknown): PlatformAdminAnalytics {
  const raw = (payload ?? {}) as Record<string, unknown>;

  const totalRevenue = asNumber(raw.total_revenue);
  const previousRevenue = asNumber(raw.previous_revenue);
  const totalOrders = asNumber(raw.total_orders);
  const previousOrders = asNumber(raw.previous_orders);
  const paidOrders = asNumber(raw.paid_orders);

  const revenueByProductType = Array.isArray(raw.revenue_by_product_type)
    ? raw.revenue_by_product_type.map(row => {
        const item = row as Record<string, unknown>;
        return {
          product_type: String(item.product_type ?? 'unknown'),
          revenue: asNumber(item.revenue),
          orders: asNumber(item.orders),
        };
      })
    : [];

  const monthlyRevenue = Array.isArray(raw.monthly_revenue)
    ? raw.monthly_revenue.map(row => {
        const item = row as Record<string, unknown>;
        return {
          month: String(item.month ?? ''),
          revenue: asNumber(item.revenue),
          orders: asNumber(item.orders),
        };
      })
    : [];

  return {
    periodDays: asNumber(raw.period_days, 30),
    totalRevenue,
    previousRevenue,
    revenueGrowthPct: computeGrowthPct(totalRevenue, previousRevenue),
    totalOrders,
    previousOrders,
    ordersGrowthPct: computeGrowthPct(totalOrders, previousOrders),
    paidOrders,
    paymentConversionRate: totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0,
    totalUsers: asNumber(raw.total_users),
    newUsersPeriod: asNumber(raw.new_users_period),
    totalStores: asNumber(raw.total_stores),
    newStoresPeriod: asNumber(raw.new_stores_period),
    totalProducts: asNumber(raw.total_products),
    activeProducts: asNumber(raw.active_products),
    averageOrderValue: paidOrders > 0 ? totalRevenue / paidOrders : 0,
    activeUsers7d: asNumber(raw.active_users_7d),
    revenueByProductType,
    monthlyRevenue,
  };
}

export async function fetchPlatformAdminAnalytics(
  periodDays = 30
): Promise<PlatformAdminAnalytics> {
  const { data, error } = await supabase.rpc('get_platform_admin_analytics', {
    p_period_days: periodDays,
  });

  if (error) throw error;
  return mapPlatformAdminAnalyticsPayload(data);
}
