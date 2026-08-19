import { describe, expect, it } from 'vitest';
import de from '@/i18n/locales/landing-premium/de.json';
import en from '@/i18n/locales/landing-premium/en.json';
import es from '@/i18n/locales/landing-premium/es.json';
import fr from '@/i18n/locales/landing-premium/fr.json';
import pt from '@/i18n/locales/landing-premium/pt.json';
import {
  LANDING_PREMIUM_MEGA_MENUS,
  LANDING_PREMIUM_NAV_FORBIDDEN_COPY,
  LANDING_PREMIUM_TOP_NAV,
  isLandingPremiumInternalHref,
  listLandingPremiumMegaLinks,
  listLandingPremiumNavHrefs,
} from '@/config/landing-premium-nav';

const locales = { fr, en, es, de, pt } as const;

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return acc;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) collectStrings(nested, acc);
  }
  return acc;
}

describe('landing premium nav IA', () => {
  it('keeps five top-level items with mega menus on solutions, features, resources', () => {
    expect(LANDING_PREMIUM_TOP_NAV.map(item => item.key)).toEqual([
      'marketplace',
      'solutions',
      'features',
      'pricing',
      'resources',
    ]);
    expect(LANDING_PREMIUM_TOP_NAV.filter(item => item.mega).map(item => item.mega)).toEqual([
      'solutions',
      'features',
      'resources',
    ]);
  });

  it('uses absolute homepage hashes so they work from /blog and /faq', () => {
    expect(LANDING_PREMIUM_TOP_NAV.find(item => item.key === 'features')?.href).toBe(
      '/#fonctionnalites'
    );
    expect(LANDING_PREMIUM_TOP_NAV.find(item => item.key === 'solutions')?.href).toBe(
      '/#solutions'
    );
    expect(LANDING_PREMIUM_TOP_NAV.find(item => item.key === 'pricing')?.href).toBe('/#tarifs');
    expect(LANDING_PREMIUM_TOP_NAV.find(item => item.key === 'resources')?.href).toBe('/blog');
  });

  it('only exposes internal hrefs', () => {
    for (const href of listLandingPremiumNavHrefs()) {
      expect(isLandingPremiumInternalHref(href), href).toBe(true);
    }
  });

  it('ships the five sell-ways plus Protect, and mobile money without vendor rails', () => {
    const featureKeys = LANDING_PREMIUM_MEGA_MENUS.features.columns.flatMap(col =>
      col.items.map(item => item.key)
    );
    expect(LANDING_PREMIUM_MEGA_MENUS.solutions.columns[0]?.items.map(item => item.key)).toEqual([
      'physical',
      'digital',
      'service',
      'courses',
      'artist',
    ]);
    expect(LANDING_PREMIUM_MEGA_MENUS.solutions.featured?.key).toBe('protect');
    expect(LANDING_PREMIUM_MEGA_MENUS.solutions.featured?.href).toBe('/solutions/protect');
    expect(featureKeys).toContain('mobileMoney');
    expect(featureKeys).not.toContain('geniusPay');
    expect(listLandingPremiumMegaLinks().some(link => link.key === 'mobileMoney')).toBe(true);
  });
});

describe('landing premium nav copy', () => {
  it('has mega copy in every landing locale', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      const mega = (messages as { nav?: { mega?: unknown } }).nav?.mega;
      expect(mega, locale).toBeTruthy();
      const title = (
        messages as { nav: { mega: { features: { items: { mobileMoney: { title: string } } } } } }
      ).nav.mega.features.items.mobileMoney.title;
      expect(title.toLowerCase(), locale).toMatch(/mobile[\s-]?money/);
    }
  });

  it('never mentions MoneyFusion, GeniusPay, Stripe, PayPal, or 24/7', () => {
    const blobs = Object.values(locales).flatMap(messages =>
      collectStrings((messages as { nav: { mega: unknown } }).nav.mega)
    );
    blobs.push(...listLandingPremiumNavHrefs());
    for (const blob of blobs) {
      for (const pattern of LANDING_PREMIUM_NAV_FORBIDDEN_COPY) {
        expect(blob, `${pattern} in "${blob}"`).not.toMatch(pattern);
      }
    }
  });
});
