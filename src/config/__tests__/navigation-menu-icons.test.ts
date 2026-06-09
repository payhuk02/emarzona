import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreditCard } from '@/components/icons';
import { resolveNavItemIcon } from '@/config/navigation.icons';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import {
  getContextNavSections,
  resolveContextSidebarNav,
  CONTEXT_SIDEBAR_CONFIGS,
} from '@/config/navigation.context';
import { adminMenuSections, userMenuSections } from '@/config/navigation.menus';

describe('navigation menu icons', () => {
  it('every raw menu item defines an icon component', () => {
    const missing: string[] = [];
    for (const section of [...userMenuSections, ...adminMenuSections]) {
      for (const item of section.items) {
        if (!item.icon) missing.push(`${section.label} → ${item.title} (${item.url})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('Paiements (/dashboard/payments) keeps its icon after enrichment', () => {
    const item = enrichNavSections(userMenuSections)
      .flatMap(s => s.items)
      .find(i => i.url === '/dashboard/payments');
    expect(item).toBeDefined();
    expect(item?.icon).toBe(CreditCard);
    const svg = renderToStaticMarkup(createElement(item!.icon, { className: 'h-4 w-4' }));
    expect(svg).toContain('<svg');
  });

  it('Paiements appears in compact seller sidebar with icon', () => {
    const compact = filterNavSections(enrichNavSections(userMenuSections), 'seller', {
      sidebarOnly: true,
    });
    const finance = compact.find(s => s.sectionKey === 'finance_paiements');
    const payments = finance?.items.find(i => i.url === '/dashboard/payments');
    expect(payments?.icon).toBe(CreditCard);
  });

  it('resolveNavItemIcon falls back to CreditCard for payments', () => {
    expect(resolveNavItemIcon('/dashboard/payments', undefined)).toBe(CreditCard);
  });

  it('finance context sidebar items all have icons', () => {
    const sections = getContextNavSections();
    const nav = resolveContextSidebarNav(
      sections,
      CONTEXT_SIDEBAR_CONFIGS.finance,
      ((_, o) => o?.defaultValue ?? _) as never
    );
    const missing = nav.items.filter(i => !i.icon).map(i => i.title);
    expect(missing).toEqual([]);
  });
});
