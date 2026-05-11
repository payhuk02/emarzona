/**
 * Détection automatique du contexte ImageStudioField à partir d'un nom de champ.
 *
 * Gère :
 *  - snake_case, kebab-case, camelCase, PascalCase
 *  - suffixes courants (_url, Url, _src, _image, Image, _photo, Photo, _img)
 *  - variantes FR / EN / abbréviations
 *
 * Retourne aussi une confiance + suggestions alternatives pour les cas ambigus.
 *
 * Exemples :
 *   detectImageContext('image_produit')     // product
 *   detectImageContext('productImageUrl')   // product
 *   detectImageContext('fond_studio')       // product
 *   detectImageContext('photoProfilUrl')    // profile
 *   detectImageContext('shopBanner')        // cover (ambigu: shop aussi)
 *   detectImageContext('avatar')            // profile
 *   detectImageContext('serviceCoverUrl')   // cover (ambigu: services aussi)
 */

import type { ImageStudioContext } from '@/components/images/ImageStudioField';

interface Rule {
  context: ImageStudioContext;
  keywords: RegExp;
  /** Poids de la règle (plus élevé = gagne en cas de conflit). */
  weight: number;
}

/**
 * Normalise un nom de champ :
 *  - CamelCase → snake_case (userAvatar → user_avatar)
 *  - Retire les suffixes techniques (_url, _src, _image, _photo, _img, _link, _path)
 *  - Minuscules + séparateurs uniformes
 */
function normalize(name: string): string {
  let s = name.trim();
  // camelCase/PascalCase → insère un séparateur avant chaque majuscule
  s = s.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  s = s.toLowerCase();
  // Uniformise les séparateurs
  s = s.replace(/[-\s.]+/g, '_');
  // Retire les suffixes techniques répétés (ex: image_url_src)
  const TECH_SUFFIX = /(_?)(url|uri|src|image|img|photo|picture|pic|link|path|file|media|thumb|thumbnail|avatar_?url)$/i;
  let prev = '';
  while (prev !== s && TECH_SUFFIX.test(s)) {
    prev = s;
    s = s.replace(TECH_SUFFIX, '');
  }
  return s.replace(/_+$/g, '');
}

const RULES: Rule[] = [
  // Profil / avatar — prioritaire (très spécifique)
  {
    context: 'profile',
    weight: 10,
    keywords:
      /(avatar|profil|profile|user_?pic|me_?photo|headshot|portrait|user_?photo|trombinoscope)/i,
  },

  // Couverture / bannière / hero — spécifique
  {
    context: 'cover',
    weight: 9,
    keywords:
      /(cover|couverture|banner|banni[eè]re|hero|header|bandeau|billboard|splash)/i,
  },

  // Produit / e-commerce / fond studio — spécifique
  {
    context: 'product',
    weight: 8,
    keywords:
      /(product|produit|item|article|fond_?studio|white_?bg|catalog|catalogue|sku|variant|packshot|e_?commerce)/i,
  },

  // Service / prestation / mission
  {
    context: 'services',
    weight: 7,
    keywords:
      /(service|prestation|mission|offer|offre|gig|freelance|assignment|job|booking)/i,
  },

  // Boutique — moins prioritaire (mot parfois générique)
  {
    context: 'shop',
    weight: 6,
    keywords: /(shop|boutique|store|magasin|marchand|vendor|seller|merchant|storefront)/i,
  },
];

export interface ContextDetection {
  context: ImageStudioContext;
  /** 'high' si une seule règle matche, 'low' si ambigu. */
  confidence: 'high' | 'low' | 'none';
  /** Contextes alternatifs détectés (en cas d'ambiguïté). */
  suggestions: ImageStudioContext[];
  /** Nom normalisé utilisé pour la détection. */
  normalized: string;
}

/**
 * Version riche qui renvoie aussi la confiance et les suggestions.
 */
export function detectImageContextDetailed(
  fieldName: string | undefined | null,
): ContextDetection {
  if (!fieldName) {
    return { context: 'generic', confidence: 'none', suggestions: [], normalized: '' };
  }
  const normalized = normalize(String(fieldName));
  if (!normalized) {
    return { context: 'generic', confidence: 'none', suggestions: [], normalized: '' };
  }

  const matches: Rule[] = RULES.filter((r) => r.keywords.test(normalized));
  if (matches.length === 0) {
    return { context: 'generic', confidence: 'none', suggestions: [], normalized };
  }

  matches.sort((a, b) => b.weight - a.weight);
  const winner = matches[0].context;
  const others = matches
    .slice(1)
    .map((m) => m.context)
    .filter((c, i, arr) => c !== winner && arr.indexOf(c) === i);

  return {
    context: winner,
    confidence: matches.length === 1 ? 'high' : 'low',
    suggestions: others,
    normalized,
  };
}

/** API rétrocompatible : retourne juste le contexte. */
export function detectImageContext(
  fieldName: string | undefined | null,
): ImageStudioContext {
  return detectImageContextDetailed(fieldName).context;
}
