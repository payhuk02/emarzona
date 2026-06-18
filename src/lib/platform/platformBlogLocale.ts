/** Locales supportées pour le contenu blog (colonne `translations` JSONB). */
export const PLATFORM_BLOG_CONTENT_LOCALES = ['fr', 'en'] as const;
export type PlatformBlogContentLocale = (typeof PLATFORM_BLOG_CONTENT_LOCALES)[number];

export function resolvePlatformBlogLocale(language: string | undefined): PlatformBlogContentLocale {
  const base = (language ?? 'fr').split('-')[0]?.toLowerCase();
  if (base === 'en') return 'en';
  return 'fr';
}

export type PlatformBlogTranslations = Partial<
  Record<PlatformBlogContentLocale, Record<string, string>>
>;
