import { describe, expect, it } from 'vitest';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import { adminMenuSections, userMenuSections } from '@/config/navigation.menus';
import {
  auditNavUrlsAgainstRoutes,
  loadAllPlatformRoutePaths,
  navUrlMatchesRegistered,
} from '@/lib/routes/platform-routes-audit';

function collectSidebarUrls(): { title: string; url: string; scope: string }[] {
  const entries: { title: string; url: string; scope: string }[] = [];
  for (const section of userMenuSections) {
    for (const item of section.items) {
      entries.push({ title: item.title, url: item.url, scope: `user:${section.label}` });
    }
  }
  for (const section of adminMenuSections) {
    for (const item of section.items) {
      entries.push({ title: item.title, url: item.url, scope: `admin:${section.label}` });
    }
  }
  return entries;
}

describe('sidebar navigation routes', () => {
  const registered = Object.values(loadAllPlatformRoutePaths()).flat();
  const sidebarUrls = collectSidebarUrls();

  it('registers route patterns from route modules', () => {
    expect(registered.length).toBeGreaterThan(50);
  });

  it('resolves every sidebar URL to a registered route', () => {
    const missing = sidebarUrls.filter(entry => !navUrlMatchesRegistered(entry.url, registered));
    expect(missing, missing.map(m => `${m.scope} → ${m.url} (${m.title})`).join('\n')).toEqual([]);
  });

  it('resolves all platform nav path literals to registered routes', () => {
    expect(auditNavUrlsAgainstRoutes(registered)).toEqual([]);
  });

  it('keeps seller primary navigation within compact target', () => {
    const enriched = enrichNavSections(userMenuSections);
    const compact = filterNavSections(enriched, 'seller', { sidebarOnly: true });
    const linkCount = compact.reduce((sum, s) => sum + s.items.length, 0);
    expect(linkCount).toBeGreaterThanOrEqual(25);
    expect(linkCount).toBeLessThanOrEqual(52);
  });
});
