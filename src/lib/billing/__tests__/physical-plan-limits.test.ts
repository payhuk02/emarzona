import { describe, expect, it } from 'vitest';
import {
  isWithinVariantLimit,
  variantLimitMessage,
  type PhysicalPlanLimitsSnapshot,
} from '@/lib/billing/physical-plan-limits';

const baseLimits: PhysicalPlanLimitsSnapshot = {
  plan_slug: 'physical_basic',
  allowed: true,
  max_products: 10,
  max_variants_per_product: 3,
  max_warehouses: 0,
  active_physical_products: 1,
  warehouse_count: 0,
};

describe('physical-plan-limits', () => {
  it('allows variants within plan limit', () => {
    expect(isWithinVariantLimit(baseLimits, 3)).toBe(true);
  });

  it('rejects variants above plan limit', () => {
    expect(isWithinVariantLimit(baseLimits, 4)).toBe(false);
  });

  it('treats null max_variants_per_product as unlimited', () => {
    expect(isWithinVariantLimit({ ...baseLimits, max_variants_per_product: null }, 100)).toBe(true);
  });

  it('formats variant limit message', () => {
    expect(variantLimitMessage(3)).toContain('3');
  });
});
