import { describe, expect, it } from 'vitest';
import {
  PLATFORM_SEO_KEYWORDS,
  PLATFORM_VERTICAL_IDS,
  VERTICAL_SEO_KEYWORDS,
  getVerticalSeoKeywords,
  mergeVerticalKeywords,
} from '@/lib/seo/vertical-seo-keywords';

describe('vertical-seo-keywords', () => {
  it('covers all five ecommerce verticals', () => {
    expect(PLATFORM_VERTICAL_IDS).toEqual(['digital', 'physical', 'service', 'course', 'artist']);
    for (const id of PLATFORM_VERTICAL_IDS) {
      const pack = VERTICAL_SEO_KEYWORDS[id];
      expect(pack.keywords.length).toBeGreaterThan(20);
      expect(pack.coreTerms.length).toBeGreaterThanOrEqual(3);
      expect(pack.label.length).toBeGreaterThan(3);
    }
  });

  it('embeds every vertical core term in platform keywords', () => {
    const lower = PLATFORM_SEO_KEYWORDS.toLowerCase();
    for (const id of PLATFORM_VERTICAL_IDS) {
      for (const term of VERTICAL_SEO_KEYWORDS[id].coreTerms) {
        expect(lower).toContain(term.toLowerCase());
      }
    }
  });

  it('merges product extras without duplicating vertical terms', () => {
    const merged = mergeVerticalKeywords('digital', 'ebook, Mon Pack');
    expect(merged.toLowerCase()).toContain('produits digitaux');
    expect(merged).toContain('Mon Pack');
    expect(getVerticalSeoKeywords('artist')).toContain("œuvres d'artiste");
  });
});
