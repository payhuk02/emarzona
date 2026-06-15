import { describe, expect, it } from 'vitest';
import {
  BOTTOM_NAV_SPECS,
  TOP_NAV_PRIMARY_PATHS,
  resolveNavItems,
} from '@/lib/navigation/resolveNavItems';
import sidebarFR from '@/i18n/locales/sidebar-fr.json';

const mockT = (key: string, opts?: { defaultValue?: string }) => {
  const parts = key.split('.');
  if (parts[0] === 'sidebar' && parts[1] === 'chrome') {
    const leaf = parts[2];
    const bucket = sidebarFR.sidebar.chrome as Record<string, string>;
    return bucket[leaf] ?? opts?.defaultValue ?? key;
  }
  return opts?.defaultValue ?? key;
};

describe('resolveNavItems', () => {
  it('returns top nav links in canonical order from seller menu', () => {
    const items = resolveNavItems({
      surface: 'topnav',
      persona: 'seller',
      isPlatformAdmin: false,
      t: mockT,
    });

    const paths = items.map(i => i.path);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toEqual(TOP_NAV_PRIMARY_PATHS.filter(p => paths.includes(p)));
    expect(paths).toContain('/dashboard');
    expect(paths).toContain('/dashboard/products');
    expect(paths).toContain('/dashboard/settings');
  });

  it('excludes adminOnly items for non-platform-admin sellers in top nav', () => {
    const items = resolveNavItems({
      surface: 'topnav',
      persona: 'seller',
      isPlatformAdmin: false,
      t: mockT,
    });
    const paths = items.map(i => i.path);
    expect(paths).not.toContain('/admin');
  });

  it('includes bottom nav fallbacks for cart and account', () => {
    const items = resolveNavItems({
      surface: 'bottomnav',
      persona: 'seller',
      isPlatformAdmin: false,
      t: mockT,
    });

    const paths = items.map(i => i.path);
    expect(paths).toContain('/cart');
    expect(paths).toContain('/account');
    expect(paths.filter(p => BOTTOM_NAV_SPECS.some(s => s.path === p)).length).toBe(
      BOTTOM_NAV_SPECS.length
    );
  });

  it('translates bottom nav fallback labels', () => {
    const items = resolveNavItems({
      surface: 'bottomnav',
      persona: 'seller',
      isPlatformAdmin: false,
      t: mockT,
    });

    const cart = items.find(i => i.path === '/cart');
    expect(cart?.title).toBe('Panier');
    expect(cart?.locked).toBe(false);
  });

  it('resolves buyer bottom nav with account hub', () => {
    const items = resolveNavItems({
      surface: 'bottomnav',
      persona: 'buyer',
      isPlatformAdmin: false,
      t: mockT,
    });

    expect(items.map(i => i.path)).toEqual([
      '/account',
      '/marketplace',
      '/cart',
      '/account/orders',
      '/notifications',
    ]);
    expect(items.find(i => i.path === '/account')?.title).toBe('Compte');
  });

  it('keeps plan-locked top nav items visible with locked flag', () => {
    const items = resolveNavItems({
      surface: 'topnav',
      persona: 'seller',
      isPlatformAdmin: false,
      physicalPlanSlug: null,
      t: mockT,
    });

    const emails = items.find(i => i.path === '/dashboard/emails/campaigns');
    expect(emails).toBeDefined();
    expect(emails?.locked).toBe(true);
  });
});
