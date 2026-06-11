import { describe, expect, it } from 'vitest';
import {
  canAccessSellerPath,
  requiredPhysicalFeatureForPath,
  requiredPlanLabelForPath,
} from '@/lib/billing/physical-route-capabilities';

describe('physical-route-capabilities', () => {
  it('maps premium route to required feature', () => {
    expect(requiredPhysicalFeatureForPath('/dashboard/physical-lots')).toBe(
      'lots_expiration.manage'
    );
  });

  it('supports nested route matching by prefix', () => {
    expect(requiredPhysicalFeatureForPath('/dashboard/physical-lots/abc')).toBe(
      'lots_expiration.manage'
    );
  });

  it('returns null for routes without plan requirement', () => {
    expect(requiredPhysicalFeatureForPath('/dashboard/products')).toBeNull();
  });

  it('blocks basic on premium route', () => {
    expect(canAccessSellerPath('/dashboard/physical-lots', 'physical_basic')).toBe(false);
  });

  it('allows standard on standard route and blocks premium route', () => {
    expect(canAccessSellerPath('/dashboard/suppliers', 'physical_standard')).toBe(true);
    expect(canAccessSellerPath('/dashboard/batch-shipping', 'physical_standard')).toBe(false);
  });

  it('allows premium on premium route', () => {
    expect(canAccessSellerPath('/dashboard/batch-shipping', 'physical_premium')).toBe(true);
  });

  it('returns required plan label for blocked route', () => {
    expect(requiredPlanLabelForPath('/dashboard/batch-shipping')).toBe('PREMIUM');
  });

  it('gates email routes to Professional plan', () => {
    expect(requiredPhysicalFeatureForPath('/dashboard/emails/campaigns')).toBe('emails.manage');
    expect(canAccessSellerPath('/dashboard/emails/sequences', 'physical_basic')).toBe(false);
    expect(canAccessSellerPath('/dashboard/emails/campaigns', 'physical_standard')).toBe(true);
  });
});
