import { describe, expect, it } from 'vitest';
import {
  COMMISSION_ONLY_PRODUCT_TYPES,
  isPhysicalSubscriptionError,
  PHYSICAL_PLAN_BASE_CURRENCY,
  PHYSICAL_PLAN_PRICES_USD,
  PHYSICAL_SUBSCRIPTION_ERROR_CODE,
  PHYSICAL_TRIAL_DAYS,
} from '@/lib/billing/platform-pricing';

describe('platform-pricing', () => {
  it('defines commission-only product types', () => {
    expect(COMMISSION_ONLY_PRODUCT_TYPES).toContain('digital');
    expect(COMMISSION_ONLY_PRODUCT_TYPES).toContain('artist');
    expect(COMMISSION_ONLY_PRODUCT_TYPES).not.toContain('physical');
  });

  it('defines physical plan prices in USD', () => {
    expect(PHYSICAL_PLAN_BASE_CURRENCY).toBe('USD');
    expect(PHYSICAL_PLAN_PRICES_USD.basic).toBe(25);
    expect(PHYSICAL_PLAN_PRICES_USD.standard).toBe(49);
    expect(PHYSICAL_PLAN_PRICES_USD.premium).toBe(79);
  });

  it('uses 30-day trial for physical', () => {
    expect(PHYSICAL_TRIAL_DAYS).toBe(30);
  });

  it('detects physical subscription errors from DB message', () => {
    expect(isPhysicalSubscriptionError(`${PHYSICAL_SUBSCRIPTION_ERROR_CODE}: test`)).toBe(true);
    expect(isPhysicalSubscriptionError('duplicate key')).toBe(false);
  });
});
