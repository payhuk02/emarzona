import { describe, expect, it } from 'vitest';
import {
  isOrderEligibleForRevenue,
  orderNetRevenueAmount,
  orderSellerProductRevenueAmount,
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

describe('orderSellerProductRevenueAmount', () => {
  it('excludes checkout fee 2%+100 from TTC (6×202 → 600 product)', () => {
    // 6 commandes × (100 produit + 102 frais) = 1212 TTC → 600 produit
    const perOrder = orderSellerProductRevenueAmount({
      total_amount: 202,
      metadata: { platform_fee: 102, subtotal: 100, platform_fee_rule: '2pct_plus_100' },
    });
    expect(perOrder).toBe(100);
    expect(perOrder * 6).toBe(600);
  });

  it('prefers itemsTotal when metadata fee missing', () => {
    expect(
      orderSellerProductRevenueAmount({
        total_amount: 202,
        itemsTotal: 100,
      })
    ).toBe(100);
  });

  it('infers product amount from 2%+100 rule', () => {
    expect(
      orderSellerProductRevenueAmount({
        total_amount: 202,
        metadata: { platform_fee_rule: '2pct_plus_100' },
      })
    ).toBe(100);
  });
});
