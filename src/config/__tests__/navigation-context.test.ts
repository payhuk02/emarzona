import { describe, expect, it } from 'vitest';
import {
  CONTEXT_SIDEBAR_CONFIGS,
  getSellerNavSections,
  resolveContextSidebarNav,
} from '@/config/navigation.context';
import { SELLER_EXCLUDED_PATHS } from '@/config/navigation.enrich';
import sidebarFR from '@/i18n/locales/sidebar-fr.json';

const mockT = (key: string, opts?: { defaultValue?: string }) => {
  const parts = key.split('.');
  if (parts[0] !== 'sidebar') return opts?.defaultValue ?? key;
  const bucket = parts[1] as 'sections' | 'contextGroups' | 'items';
  const leaf = parts[2];
  const map = (sidebarFR.sidebar as Record<string, Record<string, string>>)[bucket];
  return map?.[leaf] ?? opts?.defaultValue ?? key;
};

describe('context sidebar navigation', () => {
  const sellerSections = getSellerNavSections();

  it('resolves finance section with taxes from central menu', () => {
    const nav = resolveContextSidebarNav(
      sellerSections,
      CONTEXT_SIDEBAR_CONFIGS.finance,
      mockT as never
    );
    const paths = nav.items.map(i => i.url.split('?')[0]);
    expect(paths).toContain('/dashboard/taxes');
    expect(paths).toContain('/dashboard/payments');
    expect(nav.items.length).toBeGreaterThanOrEqual(6);
  });

  it('resolves analytics section with dashboards and SEO inspector', () => {
    const nav = resolveContextSidebarNav(
      sellerSections,
      CONTEXT_SIDEBAR_CONFIGS.analytics,
      mockT as never
    );
    const paths = nav.items.map(i => i.url.split('?')[0]);
    expect(paths).toContain('/dashboard/analytics/dashboards');
    expect(paths).toContain('/dashboard/seo/inspector');
  });

  it('filters email paths for emails context', () => {
    const nav = resolveContextSidebarNav(
      sellerSections,
      CONTEXT_SIDEBAR_CONFIGS.emails,
      mockT as never
    );
    expect(nav.items.every(i => i.url.startsWith('/dashboard/emails'))).toBe(true);
    expect(nav.items.length).toBeGreaterThanOrEqual(6);
  });

  it('excludes seller discovery URLs from products section items', () => {
    const nav = resolveContextSidebarNav(
      sellerSections,
      CONTEXT_SIDEBAR_CONFIGS.products,
      mockT as never
    );
    for (const path of SELLER_EXCLUDED_PATHS) {
      expect(nav.items.some(i => i.url.split('?')[0] === path)).toBe(false);
    }
  });

  it('maps every context config to a non-empty nav', () => {
    for (const config of Object.values(CONTEXT_SIDEBAR_CONFIGS)) {
      const nav = resolveContextSidebarNav(sellerSections, config, mockT as never);
      expect(nav.items.length, config.id).toBeGreaterThan(0);
    }
  });

  it('keeps marketing groups aligned with menu items', () => {
    const nav = resolveContextSidebarNav(
      sellerSections,
      CONTEXT_SIDEBAR_CONFIGS.marketing,
      mockT as never
    );
    expect(nav.groups).not.toBeNull();
    const groupedUrls = new Set(nav.groups!.flatMap(g => g.items.map(i => i.url)));
    expect(groupedUrls.size).toBe(nav.items.length);
  });
});
