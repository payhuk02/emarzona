import { describe, expect, it } from 'vitest';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import { userMenuSections } from '@/config/navigation.menus';
import { filterSellerNavSectionsByAccess } from '@/config/navigation.rbac';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE } from '@/lib/commerce/store-capability-map';
import { PRIMARY_CREATE_NAV_BY_TYPE } from '@/config/navigation.create';

function createNavItems(commerceType: StoreCommerceType | null | undefined) {
  const base = filterNavSections(enrichNavSections(userMenuSections), 'seller', {
    sidebarOnly: true,
  });
  const sections = filterSellerNavSectionsByAccess(base, {
    isPlatformAdmin: false,
    commerceType,
    isExpertMode: true,
  });
  const create = sections.find(s => s.sectionKey === 'creer' || s.label === 'Créer');
  return (create?.items ?? []).map(i => ({ title: i.title, url: i.url.split('?')[0] }));
}

const OTHER_CREATE_PATHS = [
  '/dashboard/products/new/digital',
  '/dashboard/products/new/physical',
  '/dashboard/products/new/service',
  '/dashboard/products/new/artist',
  '/dashboard/courses/new',
  '/dashboard/products/new',
] as const;

describe('seller create nav by commerce type', () => {
  it.each(['digital', 'physical', 'service', 'course', 'artist'] as const)(
    '%s store only sees its own create wizard',
    commerceType => {
      const items = createNavItems(commerceType);
      const urls = items.map(i => i.url);
      const expected = PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE[commerceType];

      expect(urls).toEqual([expected]);
      expect(items[0]?.title).toBe(PRIMARY_CREATE_NAV_BY_TYPE[commerceType].title);

      for (const path of OTHER_CREATE_PATHS) {
        if (path === expected) continue;
        expect(urls).not.toContain(path);
      }
    }
  );

  it('null commerceType hides CRÉER (fail closed — no physical leak)', () => {
    expect(createNavItems(null)).toEqual([]);
    expect(createNavItems(undefined)).toEqual([]);
  });
});
