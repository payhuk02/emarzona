import { describe, expect, it } from 'vitest';
import {
  enrichNavSections,
  filterNavSections,
  SELLER_PRIMARY_PATHS,
} from '@/config/navigation.enrich';
import { userMenuSections } from '@/config/navigation.menus';

describe('sidebar gap audit', () => {
  it('lists seller dashboard links absent from compact sidebar', () => {
    const all = userMenuSections.flatMap(s =>
      s.items.map(i => ({
        title: i.title,
        url: i.url.split('?')[0],
        section: s.label,
      }))
    );

    const compact = filterNavSections(enrichNavSections(userMenuSections), 'seller', {
      sidebarOnly: true,
    });
    const visible = new Set(compact.flatMap(s => s.items.map(i => i.url.split('?')[0])));

    const missing = all.filter(
      i => (i.url.startsWith('/dashboard') || i.url.startsWith('/vendor')) && !visible.has(i.url)
    );

    // Document current gap for maintainers (console on failure path)
    if (missing.length > 0) {
      const report = missing
        .sort((a, b) => a.section.localeCompare(b.section) || a.title.localeCompare(b.title))
        .map(m => `${m.section} | ${m.title} | ${m.url}`)
        .join('\n');
      // eslint-disable-next-line no-console
      console.log(`\n${missing.length} liens hors sidebar compact:\n${report}\n`);
    }

    const notInPrimary = missing.filter(m => !SELLER_PRIMARY_PATHS.has(m.url));
    expect(notInPrimary.length).toBe(missing.length);
    expect(visible.size).toBeGreaterThanOrEqual(25);
    expect(visible.size).toBeLessThanOrEqual(50);
  });
});
