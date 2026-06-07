import { describe, expect, it, vi } from 'vitest';
import {
  enrichNavSections,
  filterNavSections,
  SELLER_EXCLUDED_PATHS,
} from '@/config/navigation.enrich';
import {
  collectSidebarI18nKeys,
  translateNavSections,
  urlToSidebarItemKey,
} from '@/config/navigation.i18n';
import { filterAdminNavSectionsByRbac } from '@/config/navigation.rbac';
import { adminMenuSections, userMenuSections } from '@/config/navigation.menus';
import sidebarFR from '@/i18n/locales/sidebar-fr.json';
import sidebarEN from '@/i18n/locales/sidebar-en.json';

const mockT = (key: string, opts?: { defaultValue?: string }) => {
  const parts = key.split('.');
  const leaf = parts[parts.length - 1];
  const ns = parts[0] === 'sidebar' ? (parts[1] === 'sections' ? 'sections' : 'items') : '';
  const bucket =
    ns === 'sections'
      ? (sidebarFR.sidebar.sections as Record<string, string>)
      : ns === 'items'
        ? (sidebarFR.sidebar.items as Record<string, string>)
        : {};
  return bucket[leaf] ?? opts?.defaultValue ?? key;
};

describe('navigation Phase 4 — extended cleanup', () => {
  it('excludes public/discovery URLs from seller extended palette', () => {
    const enriched = enrichNavSections(userMenuSections);
    const extended = filterNavSections(enriched, 'seller', { sidebarOnly: false });
    const sellerUrls = new Set(extended.flatMap(s => s.items.map(i => i.url.split('?')[0])));

    for (const path of SELLER_EXCLUDED_PATHS) {
      expect(sellerUrls.has(path), `seller should not include ${path}`).toBe(false);
    }
  });

  it('keeps seller dashboard AI tools in extended palette', () => {
    const enriched = enrichNavSections(userMenuSections);
    const extended = filterNavSections(enriched, 'seller', { sidebarOnly: false });
    const sellerUrls = extended.flatMap(s => s.items.map(i => i.url.split('?')[0]));
    expect(sellerUrls).toContain('/dashboard/ai-chatbot');
  });
});

describe('navigation Phase 4 — RBAC', () => {
  const enrichedAdmin = enrichNavSections(adminMenuSections);

  it('hides admin routes without matching permissions', () => {
    const can = vi.fn((key: string) => key === 'users.manage');
    const filtered = filterAdminNavSectionsByRbac(enrichedAdmin, can, false);
    const urls = filtered.flatMap(s => s.items.map(i => i.url));

    expect(urls).toContain('/admin/users');
    expect(urls).not.toContain('/admin/settings');
    expect(urls).toContain('/collections');
  });

  it('shows all admin routes for super admin', () => {
    const can = vi.fn(() => false);
    const filtered = filterAdminNavSectionsByRbac(enrichedAdmin, can, true);
    const urls = new Set(filtered.flatMap(s => s.items.map(i => i.url.split('?')[0])));

    expect(urls.has('/admin/settings')).toBe(true);
    expect(urls.has('/admin/users')).toBe(true);
  });
});

describe('navigation Phase 4 — i18n', () => {
  it('maps every sidebar item URL to a locale key', () => {
    const enriched = enrichNavSections([...userMenuSections, ...adminMenuSections]);
    const { itemKeys, sectionKeys } = collectSidebarI18nKeys(enriched);

    for (const key of sectionKeys) {
      const leaf = key.replace('sidebar.sections.', '');
      expect(sidebarFR.sidebar.sections, leaf).toHaveProperty(leaf);
      expect(sidebarEN.sidebar.sections, leaf).toHaveProperty(leaf);
    }

    for (const key of itemKeys) {
      const leaf = key.replace('sidebar.items.', '');
      expect(sidebarFR.sidebar.items, leaf).toHaveProperty(leaf);
      expect(sidebarEN.sidebar.items, leaf).toHaveProperty(leaf);
    }
  });

  it('translates section labels via sidebar keys', () => {
    const enriched = enrichNavSections(userMenuSections.slice(0, 1));
    const translated = translateNavSections(enriched, mockT as never);
    expect(translated[0].sectionKey).toBe('principal');
    expect(translated[0].label).toBe('Principal');
  });

  it('uses stable url keys for items', () => {
    expect(urlToSidebarItemKey('/dashboard/products/new?type=digital')).toBe(
      'dashboard_products_new'
    );
  });
});
