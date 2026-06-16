/**
 * Système centralisé de tags de cache — équivalent Next.js cache tags pour SPA Vite/React.
 * Chaque tag mappe vers des clés React Query, Redis et localStorage.
 */

export const CACHE_TAG_VERSION = 'v1';

/** Tags de premier niveau — invalidation en cascade via invalidation-engine */
export const CacheTag = {
  // Catalogue marketplace
  PRODUCT: 'product',
  PRODUCTS_LIST: 'products-list',
  PRODUCT_DETAIL: 'product-detail',
  DIGITAL_PRODUCT: 'digital-product',
  PHYSICAL_PRODUCT: 'physical-product',
  SERVICE: 'service',
  COURSE: 'course',
  ARTIST: 'artist',
  ARTIST_COLLECTION: 'artist-collection',
  AUCTION: 'auction',

  // Navigation & discovery
  STORE: 'store',
  STORE_DETAIL: 'store-detail',
  CATEGORY: 'category',
  COLLECTION: 'collection',
  SEARCH: 'search',
  FACETS: 'facets',
  RECOMMENDATIONS: 'recommendations',
  HOMEPAGE: 'homepage',
  MARKETPLACE: 'marketplace',

  // Contenu institutionnel
  LEGAL: 'legal',
  FAQ: 'faq',
  INSTITUTIONAL: 'institutional',

  // Données temps réel / privées
  ORDER: 'order',
  CART: 'cart',
  NOTIFICATION: 'notification',
  MESSAGE: 'message',
  USER: 'user',
  ANALYTICS: 'analytics',
  STATS: 'stats',

  // SEO & edge
  SEO_META: 'seo-meta',
  SITEMAP: 'sitemap',
} as const;

export type CacheTagValue = (typeof CacheTag)[keyof typeof CacheTag];

/** Tag composé pour une entité spécifique (ex: product:abc-123) */
export function entityTag(tag: CacheTagValue, id: string): string {
  return `${tag}:${id}`;
}

/** Tag scopé par boutique (multi-tenant) */
export function storeScopedTag(tag: CacheTagValue, storeId: string): string {
  return `store:${storeId}:${tag}`;
}

/** Préfixe Redis standardisé */
export function redisKey(namespace: string, key: string): string {
  return `emz:${CACHE_TAG_VERSION}:${namespace}:${key}`;
}

/** Tous les tags invalidés lors d'une mutation produit */
export const PRODUCT_MUTATION_CASCADE: CacheTagValue[] = [
  CacheTag.PRODUCT,
  CacheTag.PRODUCTS_LIST,
  CacheTag.PRODUCT_DETAIL,
  CacheTag.STORE,
  CacheTag.CATEGORY,
  CacheTag.SEARCH,
  CacheTag.FACETS,
  CacheTag.RECOMMENDATIONS,
  CacheTag.HOMEPAGE,
  CacheTag.MARKETPLACE,
  CacheTag.SEO_META,
];

export const STORE_MUTATION_CASCADE: CacheTagValue[] = [
  CacheTag.STORE,
  CacheTag.STORE_DETAIL,
  CacheTag.PRODUCTS_LIST,
  CacheTag.HOMEPAGE,
  CacheTag.MARKETPLACE,
  CacheTag.SEO_META,
];

export const SERVICE_MUTATION_CASCADE: CacheTagValue[] = [
  CacheTag.SERVICE,
  CacheTag.PRODUCTS_LIST,
  CacheTag.SEARCH,
  CacheTag.FACETS,
  CacheTag.MARKETPLACE,
  CacheTag.SEO_META,
];

export const COURSE_MUTATION_CASCADE: CacheTagValue[] = [
  CacheTag.COURSE,
  CacheTag.PRODUCTS_LIST,
  CacheTag.SEARCH,
  CacheTag.FACETS,
  CacheTag.MARKETPLACE,
  CacheTag.SEO_META,
];

export const ARTIST_MUTATION_CASCADE: CacheTagValue[] = [
  CacheTag.ARTIST,
  CacheTag.ARTIST_COLLECTION,
  CacheTag.AUCTION,
  CacheTag.PRODUCTS_LIST,
  CacheTag.SEARCH,
  CacheTag.MARKETPLACE,
  CacheTag.SEO_META,
];
