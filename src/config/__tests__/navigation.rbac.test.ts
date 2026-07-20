import { describe, expect, it } from 'vitest';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import { userMenuSections } from '@/config/navigation.menus';
import {
  dedupeNavSectionsByResolvedHref,
  filterSellerNavSectionsByAccess,
} from '@/config/navigation.rbac';
import { resolveSellerNavUrl } from '@/lib/navigation/vendor-products-nav';

function sellerSidebarSections(commerceType: 'digital' | 'course' | 'artist') {
  const base = filterNavSections(enrichNavSections(userMenuSections), 'seller', {
    sidebarOnly: true,
  });
  return filterSellerNavSectionsByAccess(base, {
    isPlatformAdmin: false,
    commerceType,
    isExpertMode: true,
  });
}

describe('filterSellerNavSectionsByAccess', () => {
  it('dedupes hub Produits vs explicit vertical list links', () => {
    for (const commerceType of ['digital', 'course', 'artist'] as const) {
      const sections = sellerSidebarSections(commerceType);
      const hrefs = sections.flatMap(section =>
        section.items.map(item => resolveSellerNavUrl(item.url, commerceType).split('?')[0])
      );
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });

  it('dedupeNavSectionsByResolvedHref keeps first occurrence', () => {
    const sections = dedupeNavSectionsByResolvedHref(
      [
        {
          label: 'Test',
          sectionKey: 'test',
          items: [
            {
              title: 'Hub',
              url: '/dashboard/products',
              icon: () => null,
              personas: ['seller'],
              tier: 'primary',
            },
            {
              title: 'List',
              url: '/dashboard/digital-products',
              icon: () => null,
              personas: ['seller'],
              tier: 'primary',
            },
          ],
        },
      ],
      'digital'
    );

    expect(sections).toHaveLength(1);
    expect(sections[0]?.items).toHaveLength(1);
    expect(resolveSellerNavUrl(sections[0]!.items[0]!.url, 'digital')).toBe(
      '/dashboard/digital-products'
    );
  });
});
