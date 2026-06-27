import { describe, expect, it } from 'vitest';
import {
  computeGrowthPct,
  mapPlatformAdminAnalyticsPayload,
  productTypeLabel,
} from '@/lib/admin/admin-platform-analytics';

describe('admin-platform-analytics', () => {
  it('computes growth percentage', () => {
    expect(computeGrowthPct(120, 100)).toBe(20);
    expect(computeGrowthPct(0, 0)).toBe(0);
    expect(computeGrowthPct(50, 0)).toBe(100);
  });

  it('maps RPC payload to typed analytics', () => {
    const mapped = mapPlatformAdminAnalyticsPayload({
      period_days: 30,
      total_revenue: 10000,
      previous_revenue: 8000,
      total_orders: 40,
      previous_orders: 32,
      paid_orders: 30,
      total_users: 100,
      new_users_period: 5,
      total_stores: 20,
      new_stores_period: 2,
      total_products: 300,
      active_products: 250,
      active_users_7d: 12,
      revenue_by_product_type: [
        { product_type: 'digital', revenue: 6000, orders: 10 },
        { product_type: 'physical', revenue: 4000, orders: 8 },
      ],
      monthly_revenue: [{ month: '2026-06', revenue: 10000, orders: 30 }],
    });

    expect(mapped.totalRevenue).toBe(10000);
    expect(mapped.revenueGrowthPct).toBe(25);
    expect(mapped.paymentConversionRate).toBe(75);
    expect(mapped.averageOrderValue).toBeCloseTo(333.33, 1);
    expect(mapped.revenueByProductType).toHaveLength(2);
  });

  it('labels product types for display', () => {
    expect(productTypeLabel('digital')).toMatch(/digitaux/i);
    expect(productTypeLabel('custom')).toBe('custom');
  });
});
