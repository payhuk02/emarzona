import { describe, it, expect } from 'vitest';
import {
  getLandingSEO,
  LANDING_CANONICAL_URL,
  LANDING_SEO_DEFAULTS,
  buildLandingHreflangAlternates,
  buildLandingLangUrl,
  parseLandingLangFromSearch,
} from '@/lib/landing-seo';

describe('landing-seo', () => {
  it('exposes canonical premium title and description', () => {
    const seo = getLandingSEO();
    expect(seo.title).toBe(LANDING_SEO_DEFAULTS.title);
    expect(seo.description).toContain('premium');
    expect(seo.url).toBe(LANDING_CANONICAL_URL);
    expect(seo.keywords).toContain('ecommerce');
  });

  it('allows locale overrides without mutating defaults', () => {
    const seo = getLandingSEO({ title: 'Emarzona — Sell everything' });
    expect(seo.title).toBe('Emarzona — Sell everything');
    expect(LANDING_SEO_DEFAULTS.title).toContain('Vendez tout');
  });

  it('builds hreflang alternates for all premium locales', () => {
    const alternates = buildLandingHreflangAlternates();
    expect(alternates.length).toBe(6);
    expect(alternates.map(a => a.hrefLang)).toContain('fr-FR');
    expect(alternates.map(a => a.hrefLang)).toContain('en');
    expect(alternates.find(a => a.hrefLang === 'x-default')?.href).toContain('lang=fr');
    expect(alternates.every(a => a.href.includes('lang='))).toBe(true);
  });

  it('builds lang URLs and parses search params', () => {
    expect(buildLandingLangUrl('en')).toBe('https://www.emarzona.com/?lang=en');
    expect(parseLandingLangFromSearch('?lang=en')).toBe('en');
    expect(parseLandingLangFromSearch('')).toBeNull();
  });
});
