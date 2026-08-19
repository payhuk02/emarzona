import { FEATURES_PAGES } from '@/config/features-pages-config';
import { SOLUTIONS_PAGES } from '@/config/solutions-pages-config';

export type MarketingHeroGroup = 'solutions' | 'features';

export type MarketingHeroPage = {
  slug: string;
  group: MarketingHeroGroup;
  pageSlug: string;
  label: string;
  route: string;
  defaultUrl: string;
};

export function marketingHeroSlug(group: MarketingHeroGroup, pageSlug: string): string {
  return `${group}.${pageSlug}`;
}

export const MARKETING_HERO_PAGES: readonly MarketingHeroPage[] = [
  ...Object.values(SOLUTIONS_PAGES).map(page => ({
    slug: marketingHeroSlug('solutions', page.slug),
    group: 'solutions' as const,
    pageSlug: page.slug,
    label: page.heroTag,
    route: page.route,
    defaultUrl: page.heroImage,
  })),
  ...Object.values(FEATURES_PAGES).map(page => ({
    slug: marketingHeroSlug('features', page.slug),
    group: 'features' as const,
    pageSlug: page.slug,
    label: page.heroTag,
    route: page.route,
    defaultUrl: page.heroImage,
  })),
];

export const MARKETING_HERO_PAGE_BY_SLUG = Object.fromEntries(
  MARKETING_HERO_PAGES.map(page => [page.slug, page])
) as Record<string, MarketingHeroPage>;
