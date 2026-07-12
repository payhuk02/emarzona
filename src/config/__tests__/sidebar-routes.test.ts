import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import { adminMenuSections, userMenuSections } from '@/config/navigation.menus';

const ROUTE_FILES = [
  'src/routes/dashboardRoutes.tsx',
  'src/routes/customerRoutes.tsx',
  'src/routes/adminRoutes.tsx',
  'src/routes/publicRoutes.tsx',
  'src/routes/storeSubdomainRoutes.tsx',
];

function loadRegisteredRoutePatterns(): string[] {
  const content = ROUTE_FILES.map(f => fs.readFileSync(path.join(process.cwd(), f), 'utf8')).join(
    '\n'
  );
  const patterns: string[] = [];
  for (const re of [/(?:pr|protectedRoute)\(\s*['`]([^'`]+)['`]/g, /path=["']([^"']+)["']/g]) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(content))) {
      patterns.push(match[1]);
    }
  }
  return [...new Set(patterns)];
}

function routeExists(url: string, patterns: string[]): boolean {
  const itemPath = url.split('?')[0];
  for (const pattern of patterns) {
    if (pattern === itemPath) return true;
    // Skip empty or invalid patterns
    if (!pattern || pattern === '*' || pattern === '') continue;
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
    if (regex.test(itemPath)) return true;
  }
  return false;
}

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
  const patterns = loadRegisteredRoutePatterns();
  const sidebarUrls = collectSidebarUrls();

  it('registers route patterns from route modules', () => {
    expect(patterns.length).toBeGreaterThan(50);
  });

  it('resolves every sidebar URL to a registered route', () => {
    const missing = sidebarUrls.filter(entry => !routeExists(entry.url, patterns));
    expect(missing, missing.map(m => `${m.scope} → ${m.url} (${m.title})`).join('\n')).toEqual([]);
  });

  it('keeps seller primary navigation within compact target', () => {
    const enriched = enrichNavSections(userMenuSections);
    const compact = filterNavSections(enriched, 'seller', { sidebarOnly: true });
    const linkCount = compact.reduce((sum, s) => sum + s.items.length, 0);
    expect(linkCount).toBeGreaterThanOrEqual(25);
    expect(linkCount).toBeLessThanOrEqual(45);
  });
});
