import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANDING_PREMIUM_MEGA_MENUS } from '@/config/landing-premium-nav';
import { MARKETING_HERO_PAGES, marketingHeroSlug } from '@/config/marketing-hero-images';

describe('marketing hero image catalog', () => {
  it('exposes unique slugs with solutions/features prefix', () => {
    const slugs = MARKETING_HERO_PAGES.map(p => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toHaveLength(14);
    for (const slug of slugs) {
      expect(slug).toMatch(/^(solutions|features)\.[a-z0-9-]+$/);
    }
  });

  it('has a file on disk for every default hero', () => {
    for (const page of MARKETING_HERO_PAGES) {
      const file = resolve(process.cwd(), 'public', page.defaultUrl.replace(/^\//, ''));
      expect(existsSync(file), file).toBe(true);
    }
  });

  it('matches dedicated mega-menu routes', () => {
    const solutionHrefs = [
      ...LANDING_PREMIUM_MEGA_MENUS.solutions.columns[0].items.map(item => item.href),
      LANDING_PREMIUM_MEGA_MENUS.solutions.featured!.href,
    ];
    const featureHrefs = LANDING_PREMIUM_MEGA_MENUS.features.columns
      .flatMap(col => col.items)
      .filter(item => item.href.startsWith('/features/'))
      .map(item => item.href);

    for (const href of [...new Set(solutionHrefs)]) {
      expect(
        MARKETING_HERO_PAGES.some(p => p.route === href),
        href
      ).toBe(true);
    }
    for (const href of [...new Set(featureHrefs)]) {
      expect(
        MARKETING_HERO_PAGES.some(p => p.route === href),
        href
      ).toBe(true);
    }
  });

  it('builds stable composite slugs', () => {
    expect(marketingHeroSlug('solutions', 'physical')).toBe('solutions.physical');
    expect(marketingHeroSlug('features', 'multistore')).toBe('features.multistore');
  });
});
