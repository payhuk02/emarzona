/**
 * Source unique pour le SEO de la landing (aligne index.html, PageSEOConfig, Landing.tsx).
 */
import { AVAILABLE_LANGUAGES, type LanguageCode, normalizeLanguageCode } from '@/i18n/languages';

export const LANDING_CANONICAL_URL = 'https://www.emarzona.com/';

export const LANDING_SEO_KEYWORDS =
  'ecommerce, marketplace, produits digitaux, produits physiques, services, cours en ligne, œuvres artiste, Afrique, paiements sécurisés, marketing intégré';

export const LANDING_SEO_DEFAULTS = {
  title: 'Emarzona — Vendez tout. Gérez tout. Sans limites.',
  description:
    "Plateforme e-commerce premium : produits digitaux, physiques, services, cours et œuvres d'artiste. Paiements sécurisés, marketing intégré, marketplace Afrique.",
  keywords: LANDING_SEO_KEYWORDS,
  imageAlt: "Emarzona — Plateforme e-commerce premium pour l'Afrique et le monde",
  url: LANDING_CANONICAL_URL,
} as const;

export type HreflangAlternate = {
  hrefLang: string;
  href: string;
};

/** Codes hreflang BCP 47 par locale landing premium */
const LANDING_HREFLANG_BY_CODE: Record<LanguageCode, string> = {
  fr: 'fr-FR',
  en: 'en',
  es: 'es',
  de: 'de',
  pt: 'pt-BR',
};

export function buildLandingLangUrl(lang: LanguageCode, baseUrl = LANDING_CANONICAL_URL): string {
  if (lang === 'fr') {
    return baseUrl;
  }
  const url = new URL(baseUrl);
  url.searchParams.set('lang', lang);
  return url.toString();
}

export function parseLandingLangFromSearch(search: string): LanguageCode | null {
  const lang = new URLSearchParams(search).get('lang');
  if (!lang) return null;
  return normalizeLanguageCode(lang);
}

/** Alternates hreflang pour la homepage (URLs distinctes par ?lang=) */
export function buildLandingHreflangAlternates(
  baseUrl = LANDING_CANONICAL_URL
): HreflangAlternate[] {
  const alternates = AVAILABLE_LANGUAGES.map(({ code }) => ({
    hrefLang: LANDING_HREFLANG_BY_CODE[code],
    href: buildLandingLangUrl(code, baseUrl),
  }));

  return [...alternates, { hrefLang: 'x-default', href: buildLandingLangUrl('fr', baseUrl) }];
}

export function getLandingSEO(overrides?: Partial<typeof LANDING_SEO_DEFAULTS>) {
  return { ...LANDING_SEO_DEFAULTS, ...overrides };
}

/** SEO homepage : français par défaut (URL canonique sans ?lang=), traduit seulement si ?lang= explicite. */
export function resolveLandingPageSEO(options: {
  langFromUrl: LanguageCode | null;
  translated?: { title: string; description: string };
}) {
  if (!options.langFromUrl) {
    const seo = getLandingSEO();
    return { ...seo, url: LANDING_CANONICAL_URL, canonical: LANDING_CANONICAL_URL };
  }

  const pageUrl = buildLandingLangUrl(options.langFromUrl);
  const seo = getLandingSEO(
    options.translated
      ? { title: options.translated.title, description: options.translated.description }
      : undefined
  );
  return { ...seo, url: pageUrl, canonical: pageUrl };
}
