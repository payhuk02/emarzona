/**
 * Tests pour le hook useDashboardStats (RPC + fallback, états UX sans flicker)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardStatsOptimized as useDashboardStats } from '@/hooks/useDashboardStats';
import { transformOptimizedData } from '@/services/dashboardStatsTransform';
import type { OptimizedDashboardData } from '@/types/dashboard-stats';

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/hooks/useStore', () => ({
  useStore: vi.fn(() => ({
    store: { id: 'store-1' },
    loading: false,
  })),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1' },
    loading: false,
  })),
}));

const SAMPLE_OPTIMIZED: OptimizedDashboardData = {
  baseStats: {
    totalProducts: 5,
    activeProducts: 4,
    digitalProducts: 2,
    physicalProducts: 1,
    serviceProducts: 1,
    courseProducts: 0,
    artistProducts: 0,
    avgProductPrice: 1000,
  },
  ordersStats: {
    totalOrders: 3,
    completedOrders: 2,
    pendingOrders: 1,
    cancelledOrders: 0,
    totalRevenue: 5000,
    avgOrderValue: 2500,
    revenue30d: 5000,
    orders30d: 3,
    revenue7d: 5000,
    orders7d: 3,
    revenue90d: 5000,
    orders90d: 3,
    previousPeriodRevenue: 4000,
    previousPeriodOrders: 2,
    previousPeriodCustomers: 1,
  },
  customersStats: {
    totalCustomers: 10,
    newCustomers30d: 2,
    newCustomers7d: 2,
    newCustomers90d: 2,
    customersWithOrders: 3,
  },
  productPerformance: [],
  topProducts: [],
  recentOrders: [],
  operational: {
    pendingOrders: 1,
    processingOrders: 0,
    draftProducts: 0,
    lowStockProducts: 0,
    pendingReviews: 0,
    ordersToFulfill: 1,
  },
  generatedAt: new Date().toISOString(),
  periodDays: 30,
  periodLabel: '30 derniers jours',
};

function chain(res: { data?: unknown; error?: unknown; count?: number }) {
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'gte', 'lte', 'order', 'limit', 'in', 'not']) {
    builder[m] = vi.fn(() => builder);
  }
  builder.single = vi.fn().mockResolvedValue(res);
  builder.maybeSingle = vi.fn().mockResolvedValue(res);
  Object.assign(builder, {
    then(onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) {
      return Promise.resolve(res).then(onFulfilled, onRejected);
    },
  });
  return builder;
}

describe('useDashboardStats', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({
      data: SAMPLE_OPTIMIZED,
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return chain({
          data: [{ product_type: 'digital', price: 1000, is_active: true, is_draft: false }],
          error: null,
        });
      }
      if (table === 'orders') {
        return chain({ data: [], error: null, count: 0 });
      }
      if (table === 'customers') {
        return chain({ data: [{ created_at: new Date().toISOString() }], error: null });
      }
      if (table === 'reviews') {
        return chain({ count: 0, error: null });
      }
      if (table === 'order_items') {
        return chain({ data: [], error: null });
      }
      return chain({ data: [], error: null, count: 0 });
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('returns null stats while loading (no fake zero KPIs)', async () => {
    mockRpc.mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve({ data: SAMPLE_OPTIMIZED, error: null }), 50);
        })
    );

    const { result } = renderHook(() => useDashboardStats({ storeId: 'store-1' }), { wrapper });

    expect(result.current.stats).toBeNull();
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
    });
    expect(result.current.stats?.totalRevenue).toBe(5000);
  });

  it('loads stats via RPC when available', async () => {
    const { result } = renderHook(() => useDashboardStats({ storeId: 'store-1' }), { wrapper });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'get_store_dashboard_stats_aggregated',
      expect.objectContaining({ p_store_id: 'store-1' })
    );
    expect(result.current.error).toBeNull();
  });

  it('falls back to client queries when RPC is missing', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find the function public.get_store_dashboard_stats_aggregated',
      },
    });

    const { result } = renderHook(() => useDashboardStats({ storeId: 'store-1' }), { wrapper });

    await waitFor(() => {
      expect(result.current.hasData).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalled();
    expect(result.current.stats).toEqual(
      expect.objectContaining({
        totalProducts: expect.any(Number),
      })
    );
  });

  it('keeps previous stats visible when period changes (no skeleton flash)', async () => {
    const { result, rerender } = renderHook(
      ({ period }: { period: '30d' | '7d' }) => useDashboardStats({ storeId: 'store-1', period }),
      { wrapper, initialProps: { period: '30d' } }
    );

    await waitFor(() => expect(result.current.hasData).toBe(true));
    const firstStats = result.current.stats;

    mockRpc.mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(
            () =>
              resolve({
                data: {
                  ...SAMPLE_OPTIMIZED,
                  ordersStats: { ...SAMPLE_OPTIMIZED.ordersStats, totalOrders: 99 },
                },
                error: null,
              }),
            30
          );
        })
    );

    rerender({ period: '7d' });

    expect(result.current.stats).toBe(firstStats);
    expect(result.current.loading).toBe(false);
    expect(result.current.isUpdating).toBe(true);

    await waitFor(() => {
      expect(result.current.stats?.totalOrders).toBe(99);
    });
    expect(result.current.isUpdating).toBe(false);
  });

  it('transformOptimizedData produces stable dashboard shape', () => {
    const stats = transformOptimizedData(SAMPLE_OPTIMIZED);
    expect(stats.totalRevenue).toBe(5000);
    expect(stats.periodLabel).toBe('30 derniers jours');
    expect(stats.operational.ordersToFulfill).toBe(1);
  });
});
