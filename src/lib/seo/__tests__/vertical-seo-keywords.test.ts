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

  it('embeds each vertical in platform keywords without pulling long packs', () => {
    const lower = PLATFORM_SEO_KEYWORDS.toLowerCase();
    expect(lower).toContain('produits digitaux');
    expect(lower).toContain('produits physiques');
    expect(lower).toContain('services');
    expect(lower).toContain('cours en ligne');
    expect(lower).toContain("œuvres d'artiste");
    expect(PLATFORM_SEO_KEYWORDS.length).toBeLessThan(280);
  });

  it('merges product extras without duplicating vertical terms', () => {
    const merged = mergeVerticalKeywords('digital', 'ebook, Mon Pack');
    expect(merged.toLowerCase()).toContain('produits digitaux');
    expect(merged).toContain('Mon Pack');
    expect(getVerticalSeoKeywords('artist')).toContain("œuvres d'artiste");
  });
});
