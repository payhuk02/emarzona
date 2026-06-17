import { describe, expect, it } from 'vitest';
import { resolveNavItems } from '@/lib/navigation/resolveNavItems';
import type { StoreCommerceType } from '@/constants/store-commerce-types';

const COMMERCE_TYPES: readonly StoreCommerceType[] = [
  'physical',
  'digital',
  'service',
  'course',
  'artist',
] as const;

function sidebarPathsForType(commerceType: StoreCommerceType): string[] {
  return resolveNavItems({
    surface: 'sidebar',
    persona: 'seller',
    isPlatformAdmin: false,
    commerceType,
  })
    .map(item => item.path)
    .sort();
}

describe('commerce sidebar integration', () => {
  it('matches complete visible sidebar paths snapshot by commerce type', () => {
    const byType = Object.fromEntries(
      COMMERCE_TYPES.map(type => [type, sidebarPathsForType(type)])
    );
    expect(byType).toMatchSnapshot();
  });

  it('keeps shared capabilities visible for all commerce types', () => {
    const sharedPaths = [
      '/dashboard',
      '/dashboard/products',
      '/dashboard/orders',
      '/dashboard/customers',
      '/dashboard/emails/campaigns',
      '/dashboard/analytics',
      '/dashboard/settings',
    ];

    for (const commerceType of COMMERCE_TYPES) {
      const paths = sidebarPathsForType(commerceType);
      for (const path of sharedPaths) {
        expect(paths).toContain(path);
      }
    }
  });

  it('enforces type-specific modules visibility', () => {
    const digital = sidebarPathsForType('digital');
    const service = sidebarPathsForType('service');
    const course = sidebarPathsForType('course');
    const artist = sidebarPathsForType('artist');

    expect(digital).toContain('/dashboard/digital-products');
    expect(digital).not.toContain('/dashboard/services');

    expect(service).toContain('/dashboard/bookings');
    expect(service).not.toContain('/dashboard/digital-products');

    expect(course).toContain('/dashboard/my-courses');
    expect(course).not.toContain('/dashboard/services');

    expect(artist).toContain('/dashboard/auctions');
    expect(artist).toContain('/dashboard/portfolios');
    expect(artist).not.toContain('/dashboard/digital-products');
  });
});
