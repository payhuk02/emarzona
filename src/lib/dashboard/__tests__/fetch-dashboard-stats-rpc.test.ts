import { describe, expect, it } from 'vitest';
import { parseDashboardStatsRpcPayload } from '@/lib/dashboard/fetch-dashboard-stats-rpc';

describe('parseDashboardStatsRpcPayload', () => {
  it('maps RPC JSON to OptimizedDashboardData', () => {
    const range = {
      start: new Date('2026-06-01T00:00:00.000Z'),
      end: new Date('2026-06-30T23:59:59.999Z'),
      days: 30,
      label: '30 derniers jours',
    };

    const parsed = parseDashboardStatsRpcPayload(
      {
        baseStats: { totalProducts: 12, activeProducts: 10, avgProductPrice: 5000 },
        ordersStats: {
          totalOrders: 4,
          completedOrders: 3,
          totalRevenue: 15000,
          previousPeriodRevenue: 10000,
        },
        customersStats: { totalCustomers: 8, newCustomers30d: 2 },
        productPerformance: [
          { type: 'digital', orders: 2, revenue: 8000, quantity: 2, productsSold: 1 },
        ],
        topProducts: [
          {
            id: 'p1',
            name: 'Ebook',
            price: 4000,
            imageUrl: null,
            productType: 'digital',
            revenue: 8000,
            quantity: 2,
            orderCount: 2,
          },
        ],
        recentOrders: [
          {
            id: 'o1',
            orderNumber: 'ORD-1',
            totalAmount: 4000,
            status: 'completed',
            createdAt: '2026-06-15T10:00:00.000Z',
            customer: { id: 'c1', name: 'Alice', email: 'a@test.com' },
            productTypes: ['digital'],
          },
        ],
        operational: {
          pendingOrders: 1,
          processingOrders: 0,
          draftProducts: 2,
          lowStockProducts: 0,
          pendingReviews: 1,
          ordersToFulfill: 1,
        },
        generatedAt: '2026-06-30T12:00:00.000Z',
        periodDays: 30,
        periodLabel: '30 derniers jours',
      },
      range
    );

    expect(parsed.baseStats?.totalProducts).toBe(12);
    expect(parsed.ordersStats?.totalRevenue).toBe(15000);
    expect(parsed.customersStats?.totalCustomers).toBe(8);
    expect(parsed.topProducts).toHaveLength(1);
    expect(parsed.recentOrders[0]?.productTypes).toEqual(['digital']);
    expect(parsed.operational.pendingReviews).toBe(1);
    expect(parsed.periodLabel).toBe('30 derniers jours');
  });
});
