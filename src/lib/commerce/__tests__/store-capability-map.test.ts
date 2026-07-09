import { describe, expect, it } from 'vitest';
import {
  canAccessCommercePath,
  canAccessProductCreateNavPath,
  getPrimaryProductCreatePath,
  getRouteCapabilityRule,
  getVendorProductListPath,
  isGenericProductCreateChooser,
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

  it('gates physical-only logistics routes', () => {
    expect(canAccessCommercePath('/dashboard/physical-lots', 'physical')).toBe(true);
    expect(canAccessCommercePath('/dashboard/physical-lots', 'digital')).toBe(false);
    expect(canAccessCommercePath('/dashboard/billing/physical', 'service')).toBe(false);
  });

  it('enforces strict type routing by commerce type', () => {
    expect(canAccessCommercePath('/dashboard/digital-products', 'digital')).toBe(true);
    expect(canAccessCommercePath('/dashboard/digital-products', 'service')).toBe(false);

    expect(canAccessCommercePath('/dashboard/services/calendar', 'service')).toBe(true);
    expect(canAccessCommercePath('/dashboard/services/calendar', 'course')).toBe(false);

    expect(canAccessCommercePath('/dashboard/courses', 'course')).toBe(true);
    expect(canAccessCommercePath('/dashboard/courses', 'artist')).toBe(false);

    expect(canAccessCommercePath('/dashboard/artist-products', 'artist')).toBe(true);
    expect(canAccessCommercePath('/dashboard/artist-products', 'course')).toBe(false);

    expect(canAccessCommercePath('/dashboard/auctions', 'artist')).toBe(true);
    expect(canAccessCommercePath('/dashboard/auctions', 'physical')).toBe(false);
  });

  it('avoids false positives on route boundaries', () => {
    // Should not match "/dashboard/services" rule because segment is "serviceship".
    expect(canAccessCommercePath('/dashboard/serviceship', 'digital')).toBe(false);
    expect(getRouteCapabilityRule('/dashboard/serviceship')).toBeNull();

    // Should not match "/dashboard/courses" rule because segment is "courseship".
    expect(canAccessCommercePath('/dashboard/courseship', 'service')).toBe(false);
    expect(getRouteCapabilityRule('/dashboard/courseship')).toBeNull();

    // Should not match "/dashboard/digital" rule because segment is "digitalized".
    expect(canAccessCommercePath('/dashboard/digitalized', 'service')).toBe(false);
    expect(getRouteCapabilityRule('/dashboard/digitalized')).toBeNull();
  });

  it('gates product creation routes by store commerce type', () => {
    expect(canAccessCommercePath('/dashboard/products/new/physical', 'physical')).toBe(true);
    expect(canAccessCommercePath('/dashboard/products/new/physical', 'digital')).toBe(false);
    expect(canAccessCommercePath('/dashboard/products/new/digital', 'digital')).toBe(true);
    expect(canAccessCommercePath('/dashboard/products/new/service', 'course')).toBe(false);
    expect(canAccessCommercePath('/dashboard/courses/new', 'course')).toBe(true);
    expect(canAccessCommercePath('/dashboard/products/new/artist', 'artist')).toBe(true);
  });

  it('maps vendor product list path per commerce type', () => {
    expect(getVendorProductListPath('course')).toBe('/dashboard/courses');
    expect(getVendorProductListPath('artist')).toBe('/dashboard/artist-products');
    expect(getVendorProductListPath('digital')).toBe('/dashboard/digital-products');
  });

  it('maps primary product create path per commerce type', () => {
    expect(getPrimaryProductCreatePath('physical')).toBe('/dashboard/products/new/physical');
    expect(getPrimaryProductCreatePath('course')).toBe('/dashboard/courses/new');
    expect(getPrimaryProductCreatePath('artist')).toBe('/dashboard/products/new/artist');
  });

  it('hides generic product chooser in sidebar create links', () => {
    expect(canAccessProductCreateNavPath('/dashboard/products/new', 'physical')).toBe(false);
    expect(canAccessProductCreateNavPath('/dashboard/products/new', 'digital')).toBe(false);
    expect(canAccessProductCreateNavPath('/dashboard/products/new/digital', 'digital')).toBe(true);
    expect(canAccessProductCreateNavPath('/dashboard/products/new/digital', 'physical')).toBe(
      false
    );
    expect(canAccessProductCreateNavPath('/dashboard/courses/new', 'course')).toBe(true);
  });

  it('blocks generic product chooser route for all commerce types', () => {
    expect(canAccessCommercePath('/dashboard/products/new', 'physical')).toBe(false);
    expect(canAccessCommercePath('/dashboard/products/new', 'artist')).toBe(false);
    expect(isGenericProductCreateChooser('/dashboard/products/new')).toBe(true);
  });

  it('gates physical-products and multi-currency for physical stores only', () => {
    expect(canAccessCommercePath('/dashboard/physical-products', 'physical')).toBe(true);
    expect(canAccessCommercePath('/dashboard/physical-products', 'digital')).toBe(false);
    expect(canAccessCommercePath('/dashboard/multi-currency', 'service')).toBe(false);
  });

  it('gates artist public discovery and course affiliate paths', () => {
    expect(canAccessCommercePath('/collections', 'artist')).toBe(true);
    expect(canAccessCommercePath('/collections', 'course')).toBe(false);
    expect(canAccessCommercePath('/auctions', 'artist')).toBe(true);
    expect(canAccessCommercePath('/auctions', 'physical')).toBe(false);
    expect(canAccessCommercePath('/affiliate/courses', 'course')).toBe(true);
    expect(canAccessCommercePath('/affiliate/courses', 'digital')).toBe(false);
    expect(canAccessCommercePath('/digital/search', 'digital')).toBe(true);
    expect(canAccessCommercePath('/digital/search', 'physical')).toBe(false);
  });

  it('gates affiliation, gamification and integrations by commerce type', () => {
    expect(canAccessCommercePath('/dashboard/affiliates', 'digital')).toBe(true);
    expect(canAccessCommercePath('/dashboard/affiliates', 'service')).toBe(false);
    expect(canAccessCommercePath('/dashboard/affiliates', 'course')).toBe(true);
    expect(canAccessCommercePath('/affiliate/dashboard', 'artist')).toBe(true);
    expect(canAccessCommercePath('/affiliate/dashboard', 'physical')).toBe(false);

    expect(canAccessCommercePath('/dashboard/store-affiliates', 'physical')).toBe(true);
    expect(canAccessCommercePath('/dashboard/store-affiliates', 'service')).toBe(true);

    expect(canAccessCommercePath('/dashboard/gamification', 'course')).toBe(true);
    expect(canAccessCommercePath('/dashboard/gamification', 'digital')).toBe(true);
    expect(canAccessCommercePath('/dashboard/gamification', 'artist')).toBe(true);
    expect(canAccessCommercePath('/dashboard/gamification', 'physical')).toBe(false);

    expect(canAccessCommercePath('/dashboard/integrations', 'service')).toBe(true);
    expect(canAccessCommercePath('/dashboard/integrations', 'artist')).toBe(true);
    expect(canAccessCommercePath('/dashboard/webhooks', 'digital')).toBe(true);
    expect(canAccessCommercePath('/dashboard/webhooks', 'service')).toBe(true);

    expect(canAccessCommercePath('/dashboard/loyalty', 'physical')).toBe(true);
    expect(canAccessCommercePath('/dashboard/loyalty', 'artist')).toBe(false);
    expect(canAccessCommercePath('/dashboard/gift-cards', 'course')).toBe(true);

    expect(canAccessCommercePath('/products/compare', 'physical')).toBe(true);
    expect(canAccessCommercePath('/products/compare', 'digital')).toBe(false);
  });
});
