import { describe, expect, it } from 'vitest';
import {
  isPhysicalCommerceStore,
  isPhysicalOnlySellerPath,
  shouldApplyPhysicalPlanGating,
} from '@/lib/billing/store-commerce-access';
import { canAccessSellerPath } from '@/lib/billing/physical-route-capabilities';

describe('store-commerce-access', () => {
  it('treats missing commerce type as physical (legacy)', () => {
    expect(isPhysicalCommerceStore(null)).toBe(true);
    expect(isPhysicalCommerceStore(undefined)).toBe(true);
    expect(shouldApplyPhysicalPlanGating(null)).toBe(true);
  });

  it('does not apply physical gating for digital/service/course/artist', () => {
    expect(isPhysicalCommerceStore('digital')).toBe(false);
    expect(shouldApplyPhysicalPlanGating('service')).toBe(false);
    expect(shouldApplyPhysicalPlanGating('course')).toBe(false);
    expect(shouldApplyPhysicalPlanGating('artist')).toBe(false);
  });

  it('identifies physical-only routes but not emailing', () => {
    expect(isPhysicalOnlySellerPath('/dashboard/warehouses')).toBe(true);
    expect(isPhysicalOnlySellerPath('/dashboard/emails/campaigns')).toBe(false);
    expect(isPhysicalOnlySellerPath('/dashboard/products')).toBe(false);
  });

  it('unlocks email routes for non-physical stores regardless of plan', () => {
    expect(canAccessSellerPath('/dashboard/emails/campaigns', null, 'digital')).toBe(true);
    expect(canAccessSellerPath('/dashboard/emails/sequences', 'physical_basic', 'artist')).toBe(
      true
    );
  });

  it('blocks physical-only routes for non-physical stores', () => {
    expect(canAccessSellerPath('/dashboard/warehouses', 'physical_premium', 'digital')).toBe(false);
    expect(canAccessSellerPath('/dashboard/batch-shipping', 'physical_premium', 'course')).toBe(
      false
    );
  });
});
