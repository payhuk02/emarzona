/** Locales supportées pour le contenu FAQ (colonne `translations` JSONB). */
export const PLATFORM_FAQ_CONTENT_LOCALES = ['fr', 'en'] as const;
export type PlatformFaqContentLocale = (typeof PLATFORM_FAQ_CONTENT_LOCALES)[number];

export function resolvePlatformFaqLocale(language: string | undefined): PlatformFaqContentLocale {
  const base = (language ?? 'fr').split('-')[0]?.toLowerCase();
  if (base === 'en') return 'en';
  return 'fr';
}

export type PlatformFaqTranslations = Partial<
  Record<PlatformFaqContentLocale, Record<string, string>>
>;

export function readFaqTranslation(
  translations: PlatformFaqTranslations | null | undefined,
  locale: PlatformFaqContentLocale,
  field: string,
  fallback: string
): string {
  const value = translations?.[locale]?.[field]?.trim();
  return value && value.length > 0 ? value : fallback;
}
