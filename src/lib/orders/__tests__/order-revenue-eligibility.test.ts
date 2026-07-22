import { describe, expect, it } from 'vitest';
import {
  isOrderEligibleForRevenue,
  orderNetRevenueAmount,
} from '@/lib/orders/order-revenue-eligibility';

describe('isOrderEligibleForRevenue', () => {
  it('includes confirmed+paid and completed+partially_refunded', () => {
    expect(isOrderEligibleForRevenue('confirmed', 'paid')).toBe(true);
    expect(isOrderEligibleForRevenue('completed', 'partially_refunded')).toBe(true);
  });

  it('excludes unpaid and cancelled', () => {
    expect(isOrderEligibleForRevenue('completed', 'pending')).toBe(false);
    expect(isOrderEligibleForRevenue('cancelled', 'paid')).toBe(false);
    expect(isOrderEligibleForRevenue('processing', 'paid')).toBe(false);
  });
});

describe('orderNetRevenueAmount', () => {
  it('subtracts refunds with floor at 0', () => {
    expect(orderNetRevenueAmount(1000, 200)).toBe(800);
    expect(orderNetRevenueAmount(1000, 1500)).toBe(0);
    expect(orderNetRevenueAmount(null, null)).toBe(0);
  });
});
