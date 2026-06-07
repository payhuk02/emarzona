import { describe, expect, it } from 'vitest';
import {
  CONTEXT_SIDEBAR_CONFIGS,
  getContextNavSections,
  resolveContextSidebarNav,
} from '@/config/navigation.context';
import { SELLER_EXCLUDED_PATHS } from '@/config/navigation.enrich';
import type { ContextSidebarConfig } from '@/config/navigation.context.types';
import type { NavItem, NavSection } from '@/config/navigation.types';

const mockT = (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key;

function pathMatches(itemUrl: string, pattern: string): boolean {
  const itemPath = itemUrl.split('?')[0];
  const patternPath = pattern.split('?')[0];
  return itemUrl === pattern || itemPath === patternPath || itemPath.startsWith(`${patternPath}/`);
}

function collectSectionItems(sections: NavSection[], config: ContextSidebarConfig): NavItem[] {
  const keys = [config.sectionKey, ...(config.additionalSectionKeys ?? [])];
  const seen = new Set<string>();
  const items: NavItem[] = [];
  for (const key of keys) {
    const section = sections.find(s => s.sectionKey === key);
    if (!section) continue;
    for (const item of section.items) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      items.push(item);
    }
  }
  return items;
}

function expectedItems(sections: NavSection[], config: ContextSidebarConfig): NavItem[] {
  if (config.staticItems?.length) {
    return config.staticItems.map(item => ({
      title: item.title,
      url: item.url,
      icon: item.icon,
      personas: ['seller'] as const,
      tier: 'extended' as const,
    }));
  }

  let items = collectSectionItems(sections, config);

  if (config.includePaths?.length) {
    items = items.filter(item => config.includePaths!.some(p => pathMatches(item.url, p)));
  }
  if (config.excludePaths?.length) {
    items = items.filter(item => !config.excludePaths!.some(p => pathMatches(item.url, p)));
  }

  if (!config.persona || config.persona === 'seller') {
    items = items.filter(item => !SELLER_EXCLUDED_PATHS.has(item.url.split('?')[0]));
  }

  if (config.supplementStaticItems?.length) {
    for (const supplement of config.supplementStaticItems) {
      if (!items.some(i => i.url === supplement.url)) {
        items.push({
          title: supplement.title,
          url: supplement.url,
          icon: supplement.icon,
          personas: ['seller'],
          tier: 'extended',
        });
      }
    }
  }

  return items;
}

describe('context sidebar link coverage', () => {
  const sections = getContextNavSections();

  for (const config of Object.values(CONTEXT_SIDEBAR_CONFIGS)) {
    it(`${config.id}: resolved items match expected section coverage`, () => {
      const expected = expectedItems(sections, config);
      const nav = resolveContextSidebarNav(sections, config, mockT as never);
      const expectedUrls = new Set(expected.map(i => i.url));
      const resolvedUrls = new Set(nav.items.map(i => i.url));

      const missing = [...expectedUrls].filter(url => !resolvedUrls.has(url));
      const extra = [...resolvedUrls].filter(url => !expectedUrls.has(url));

      expect(
        missing,
        `${config.id} missing: ${missing.map(u => u.split('?')[0]).join(', ')}`
      ).toEqual([]);
      expect(extra, `${config.id} unexpected extra: ${extra.join(', ')}`).toEqual([]);
    });

    if (config.groups?.length) {
      it(`${config.id}: all items are assigned to a group (no orphan "other")`, () => {
        const nav = resolveContextSidebarNav(sections, config, mockT as never);
        if (!nav.groups) return;
        const other = nav.groups.find(g => g.groupKey === 'other');
        expect(other?.items.length ?? 0, `${config.id} has ungrouped items`).toBe(0);
      });
    }
  }
});
