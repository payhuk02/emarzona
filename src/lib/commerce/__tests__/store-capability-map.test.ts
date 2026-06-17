import { describe, expect, it } from 'vitest';
import {
  canAccessCommercePath,
  getRouteCapabilityRule,
  resolveStoreCommerceTypeFromStore,
} from '@/lib/commerce/store-capability-map';

describe('store-capability-map', () => {
  it('resolves commerce type from typed column first', () => {
    expect(
      resolveStoreCommerceTypeFromStore({
        commerce_type: 'service',
        metadata: { commerce_type: 'physical' },
      })
    ).toBe('service');
  });

  it('falls back to metadata and then physical by default', () => {
    expect(resolveStoreCommerceTypeFromStore({ metadata: { commerce_type: 'artist' } })).toBe(
      'artist'
    );
    expect(resolveStoreCommerceTypeFromStore({ metadata: {} })).toBe('physical');
  });

  it('maps shared routes as common capabilities', () => {
    const rule = getRouteCapabilityRule('/dashboard/emails/campaigns');
    expect(rule?.label).toBe('Fonctionnalites communes');
    expect(canAccessCommercePath('/dashboard/emails/campaigns', 'digital')).toBe(true);
    expect(canAccessCommercePath('/dashboard/analytics', 'course')).toBe(true);
    expect(canAccessCommercePath('/settings/notifications', 'artist')).toBe(true);
  });

  it('enforces strict type routing by commerce type', () => {
    expect(canAccessCommercePath('/dashboard/digital-products', 'digital')).toBe(true);
    expect(canAccessCommercePath('/dashboard/digital-products', 'service')).toBe(false);

    expect(canAccessCommercePath('/dashboard/services/calendar', 'service')).toBe(true);
    expect(canAccessCommercePath('/dashboard/services/calendar', 'course')).toBe(false);

    expect(canAccessCommercePath('/dashboard/my-courses', 'course')).toBe(true);
    expect(canAccessCommercePath('/dashboard/my-courses', 'artist')).toBe(false);

    expect(canAccessCommercePath('/dashboard/auctions', 'artist')).toBe(true);
    expect(canAccessCommercePath('/dashboard/auctions', 'physical')).toBe(false);
  });

  it('avoids false positives on route boundaries', () => {
    // Should not match "/dashboard/services" rule because segment is "serviceship".
    expect(canAccessCommercePath('/dashboard/serviceship', 'digital')).toBe(true);
    expect(getRouteCapabilityRule('/dashboard/serviceship')).toBeNull();

    // Should not match "/dashboard/courses" rule because segment is "courseship".
    expect(canAccessCommercePath('/dashboard/courseship', 'service')).toBe(true);
    expect(getRouteCapabilityRule('/dashboard/courseship')).toBeNull();

    // Should not match "/dashboard/digital" rule because segment is "digitalized".
    expect(canAccessCommercePath('/dashboard/digitalized', 'service')).toBe(true);
    expect(getRouteCapabilityRule('/dashboard/digitalized')).toBeNull();
  });
});
