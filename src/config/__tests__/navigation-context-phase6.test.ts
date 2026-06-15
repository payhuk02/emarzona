import { describe, expect, it } from 'vitest';
import {
  CONTEXT_SIDEBAR_CONFIGS,
  getContextNavSections,
  resolveContextSidebarNav,
} from '@/config/navigation.context';
import { PHASE6_CONTEXT_CONFIGS } from '@/config/navigation.context.phase6';
import { SETTINGS_TAB_ITEMS } from '@/config/navigation.context.settings';
import sidebarFR from '@/i18n/locales/sidebar-fr.json';

const mockT = (key: string, opts?: { defaultValue?: string }) => {
  const parts = key.split('.');
  if (parts[0] !== 'sidebar') return opts?.defaultValue ?? key;
  const bucket = parts[1] as 'sections' | 'contextGroups' | 'items';
  const leaf = parts[2];
  const map = (sidebarFR.sidebar as Record<string, Record<string, string>>)[bucket];
  return map?.[leaf] ?? opts?.defaultValue ?? key;
};

describe('context sidebar Phase 6', () => {
  const sections = getContextNavSections();

  it('resolves sales sidebar with grouped ventes items', () => {
    const nav = resolveContextSidebarNav(sections, PHASE6_CONTEXT_CONFIGS.sales, mockT as never);
    expect(nav.groups).not.toBeNull();
    expect(nav.groups!.length).toBeGreaterThanOrEqual(6);
    const paths = nav.items.map(i => i.url.split('?')[0]);
    expect(paths).toContain('/dashboard/suppliers');
    expect(paths).toContain('/dashboard/taxes');
    expect(paths).toContain('/dashboard/payment-methods');
    expect(paths).toContain('/dashboard/payments-customers');
    expect(paths).toContain('/dashboard/payment-management');
  });

  it('resolves bookings from ventes section including new service routes', () => {
    const nav = resolveContextSidebarNav(sections, PHASE6_CONTEXT_CONFIGS.bookings, mockT as never);
    const paths = nav.items.map(i => i.url.split('?')[0]);
    expect(paths).toContain('/dashboard/services/waitlist');
    expect(paths).toContain('/dashboard/services/reminders');
  });

  it('resolves account portal without seller gamification leak', () => {
    const nav = resolveContextSidebarNav(sections, PHASE6_CONTEXT_CONFIGS.account, mockT as never);
    const paths = nav.items.map(i => i.url.split('?')[0]);
    expect(paths).toContain('/account/profile');
    expect(paths).toContain('/account/warranties');
    expect(paths).toContain('/account/bookings');
    expect(paths).not.toContain('/dashboard/gamification');
    expect(nav.groups!.find(g => g.groupKey === 'other')).toBeUndefined();
  });

  it('resolves physical portal with full physical ops links', () => {
    const nav = resolveContextSidebarNav(
      sections,
      PHASE6_CONTEXT_CONFIGS.physicalPortal,
      mockT as never
    );
    const paths = nav.items.map(i => i.url.split('?')[0]);
    expect(paths).toContain('/dashboard/physical-lots');
    expect(paths).toContain('/dashboard/physical-preorders');
    expect(paths).toContain('/account/returns');
  });

  it('resolves settings tabs as static items', () => {
    const nav = resolveContextSidebarNav(
      sections,
      CONTEXT_SIDEBAR_CONFIGS.settings,
      mockT as never
    );
    expect(nav.items.length).toBe(SETTINGS_TAB_ITEMS.length);
    expect(nav.items.every(i => i.url.includes('tab='))).toBe(true);
  });

  it('resolves every Phase 6 config with items', () => {
    for (const config of Object.values(PHASE6_CONTEXT_CONFIGS)) {
      const nav = resolveContextSidebarNav(sections, config, mockT as never);
      expect(nav.items.length, config.id).toBeGreaterThan(0);
    }
  });
});
