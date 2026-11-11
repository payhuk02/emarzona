/**
 * Mots-clés SEO plateforme — source unique pour les 5 verticales e-commerce Emarzona.
 * Aligné marketplace, landing, solutions et pages catalogue.
 */

export const PLATFORM_VERTICAL_IDS = [
  'digital',
  'physical',
  'service',
  'course',
  'artist',
] as const;

export type PlatformVerticalId = (typeof PLATFORM_VERTICAL_IDS)[number];

export type VerticalSeoKeywords = {
  id: PlatformVerticalId;
  label: string;
  /** Meta keywords (virgules) pour pages filtrées / solutions */
  keywords: string;
  /** Termes courts inclus dans le pack landing / marketplace global */
  coreTerms: string[];
};

/** Pack par verticale — référencement plateforme. */
export const VERTICAL_SEO_KEYWORDS: Record<PlatformVerticalId, VerticalSeoKeywords> = {
  digital: {
    id: 'digital',
    label: 'Produits digitaux',
    keywords:
      'produits digitaux, ebook, template, logiciel, téléchargement instantané, licence numérique, vente digitale, Emarzona',
    coreTerms: ['produits digitaux', 'ebook', 'template', 'téléchargement'],
  },
  physical: {
    id: 'physical',
    label: 'Produits physiques',
    keywords:
      'produits physiques, boutique en ligne, livraison, stock, ecommerce, paiement à la livraison, FedEx, Emarzona',
    coreTerms: ['produits physiques', 'livraison', 'stock', 'ecommerce'],
  },
  service: {
    id: 'service',
    label: 'Services',
    keywords:
      'services en ligne, prestation, réservation, consultation, freelance, coaching, calendrier, Emarzona',
    coreTerms: ['services', 'prestation', 'réservation', 'consultation'],
  },
  course: {
    id: 'course',
    label: 'Cours en ligne',
    keywords:
      'cours en ligne, formation, e-learning, LMS, certificat, apprendre en ligne, école en ligne, Emarzona',
    coreTerms: ['cours en ligne', 'formation', 'e-learning', 'LMS'],
  },
  artist: {
    id: 'artist',
    label: "Œuvres d'artistes",
    keywords:
      "œuvres d'artiste, art, artiste, illustration, galerie en ligne, certificat d'authenticité, édition limitée, Emarzona",
    coreTerms: ["œuvres d'artiste", 'art', 'artiste', 'illustration'],
  },
};

/**
 * Mots-clés landing (chaîne autonome).
 * Ne pas dériver de VERTICAL_SEO_KEYWORDS : ce module est dans le bundle
 * principal via AutoSEO / Landing, les packs longs restent sur les pages lazy.
 */
export const PLATFORM_SEO_KEYWORDS =
  "ecommerce, marketplace, plateforme e-commerce, produits digitaux, produits physiques, services, cours en ligne, œuvres d'artiste, Afrique, Mobile Money, paiements sécurisés, Emarzona";

export function getVerticalSeoKeywords(vertical: string | null | undefined): string {
  if (!vertical) return PLATFORM_SEO_KEYWORDS;
  const key = vertical.toLowerCase() as PlatformVerticalId;
  return VERTICAL_SEO_KEYWORDS[key]?.keywords ?? PLATFORM_SEO_KEYWORDS;
}

/** Fusion verticale + termes produit (catégorie, tags…). */
export function mergeVerticalKeywords(
  vertical: string | null | undefined,
  extra?: string | string[] | null
): string {
  const base = getVerticalSeoKeywords(vertical);
  if (!extra) return base;
  const extras = (Array.isArray(extra) ? extra : extra.split(','))
    .map(s => s.trim())
    .filter(Boolean);
  if (extras.length === 0) return base;
  const seen = new Set(base.split(',').map(s => s.trim().toLowerCase()));
  const added = extras.filter(e => !seen.has(e.toLowerCase()));
  return added.length ? `${base}, ${added.join(', ')}` : base;
}
