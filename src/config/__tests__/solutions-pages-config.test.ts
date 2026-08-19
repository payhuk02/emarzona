import { describe, expect, it } from 'vitest';
import { SOLUTIONS_PAGES } from '@/config/solutions-pages-config';

describe('SOLUTIONS_PAGES copy encoding', () => {
  it('keeps French accents in courses hero copy', () => {
    expect(SOLUTIONS_PAGES.courses.heroTitleHighlight).toContain('\u00e9');
    expect(SOLUTIONS_PAGES.courses.heroTitleHighlight).toBe('mon\u00e9tisez votre savoir.');
    expect(SOLUTIONS_PAGES.courses.heroSubtitle).toContain('Cr\u00e9ez');
    expect(SOLUTIONS_PAGES.courses.heroSubtitle).not.toContain('\uFFFD');
  });

  it('does not use replacement characters on any solutions page', () => {
    for (const page of Object.values(SOLUTIONS_PAGES)) {
      const blob = [
        page.heroTag,
        page.heroTitle,
        page.heroTitleHighlight,
        page.heroSubtitle,
        page.seoTitle,
        page.seoDescription,
        ...page.statsItems.map(item => item.label),
        ...page.categories.map(item => item.label),
        ...page.features.flatMap(item => [item.title, item.description]),
        ...page.steps.flatMap(item => [item.title, item.description]),
      ].join('\n');
      expect(blob).not.toContain('\uFFFD');
    }
  });
});
