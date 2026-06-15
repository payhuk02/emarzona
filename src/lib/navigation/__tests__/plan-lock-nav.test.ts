import { describe, expect, it } from 'vitest';
import { isNavPathPlanLocked } from '@/lib/navigation/plan-lock-nav';

describe('isNavPathPlanLocked', () => {
  it('returns false for routes without plan requirements', () => {
    expect(isNavPathPlanLocked('/dashboard/products', 'physical_basic')).toBe(false);
  });

  it('returns true when plan slug is missing for gated routes', () => {
    expect(isNavPathPlanLocked('/dashboard/emails/campaigns', null)).toBe(true);
  });

  it('returns true when plan lacks the required feature', () => {
    expect(isNavPathPlanLocked('/dashboard/physical-lots', 'physical_basic')).toBe(true);
  });
});
