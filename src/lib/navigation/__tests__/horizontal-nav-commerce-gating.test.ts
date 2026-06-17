import { describe, expect, it } from 'vitest';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { resolveHorizontalNavDomains } from '@/lib/navigation/resolveHorizontalNav';

const mockT = ((key: string, opts?: { defaultValue?: string }) =>
  opts?.defaultValue ?? key) as never;

const NON_PHYSICAL_TYPES: StoreCommerceType[] = ['digital', 'service', 'course', 'artist'];

const PHYSICAL_PATH_PATTERNS = [
  '/dashboard/physical-',
  '/dashboard/physical/',
  '/dashboard/inventory',
  '/dashboard/shipping',
  '/dashboard/multi-currency',
  '/products/compare',
  '/dashboard/products/new/physical',
];

function allSellerHorizontalPaths(commerceType: StoreCommerceType): string[] {
  const domains = resolveHorizontalNavDomains({
    persona: 'seller',
    isPlatformAdmin: false,
    commerceType,
    pathname: '/dashboard',
    search: '',
    t: mockT,
  });

  const paths = new Set<string>();
  for (const domain of domains) {
    for (const item of domain.items) paths.add(item.path);
    for (const group of domain.subgroups ?? []) {
      for (const item of group.items) paths.add(item.path);
    }
  }
  return [...paths];
}

function autresPaths(commerceType: StoreCommerceType): string[] {
  const domains = resolveHorizontalNavDomains({
    persona: 'seller',
    isPlatformAdmin: false,
    commerceType,
    pathname: '/dashboard',
    search: '',
    t: mockT,
  });

  return domains.flatMap(
    d => d.subgroups?.find(g => g.groupKey === 'other')?.items.map(i => i.path) ?? []
  );
}

describe('horizontal nav commerce gating', () => {
  it('does not expose physical modules in non-physical stores (including Autres)', () => {
    for (const commerceType of NON_PHYSICAL_TYPES) {
      const paths = allSellerHorizontalPaths(commerceType);
      const autres = autresPaths(commerceType);

      for (const pattern of PHYSICAL_PATH_PATTERNS) {
        expect(paths.some(p => p === pattern || p.startsWith(`${pattern}/`))).toBe(false);
        expect(autres.some(p => p === pattern || p.startsWith(`${pattern}/`))).toBe(false);
      }
    }
  });

  it('places physical logistics links in Produits physiques group (not Autres) for physical stores', () => {
    const domains = resolveHorizontalNavDomains({
      persona: 'seller',
      isPlatformAdmin: false,
      commerceType: 'physical',
      pathname: '/dashboard/orders',
      search: '',
      t: mockT,
    });

    const ventes = domains.find(d => d.domainKey === 'ventes_logistique');
    const physicalGroup = ventes?.subgroups?.find(g => g.groupKey === 'produits_physiques');
    expect(physicalGroup).toBeDefined();
    expect(physicalGroup!.items.map(i => i.path)).toContain('/dashboard/physical-products');

    const autres = ventes?.subgroups?.find(g => g.groupKey === 'other');
    const autresPathsList = autres?.items.map(i => i.path) ?? [];
    expect(autresPathsList).not.toContain('/dashboard/physical-products');
    expect(autresPathsList).not.toContain('/dashboard/physical-inventory');
  });

  it('hides gamification and affiliates from service stores in marketing mega-menu', () => {
    const paths = allSellerHorizontalPaths('service');
    expect(paths).not.toContain('/dashboard/gamification');
    expect(paths).not.toContain('/dashboard/affiliates');
    expect(paths).toContain('/dashboard/integrations');
  });

  it('shows course gamification and affiliates for course stores', () => {
    const paths = allSellerHorizontalPaths('course');
    expect(paths).toContain('/dashboard/gamification');
    expect(paths).toContain('/dashboard/affiliates');
  });

  it('shows gamification and webhooks for artist and service stores', () => {
    expect(allSellerHorizontalPaths('artist')).toContain('/dashboard/gamification');
    expect(allSellerHorizontalPaths('service')).toContain('/dashboard/webhooks');
    expect(allSellerHorizontalPaths('service')).not.toContain('/dashboard/gamification');
  });
});
