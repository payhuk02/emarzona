/**
 * Configuration centralisée des stratégies de cache par couche et type de donnée.
 */

import type { CacheTagValue } from './tags';
import { CacheTag } from './tags';

export type CacheLayer = 'browser' | 'cdn' | 'edge' | 'redis' | 'react-query' | 'service-worker';

export type CacheMethod =
  | 'immutable'
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'no-store';

export interface CacheStrategyEntry {
  tag: CacheTagValue;
  description: string;
  layers: CacheLayer[];
  method: CacheMethod;
  /** TTL en secondes — 0 = pas de cache */
  ttlSeconds: number;
  /** stale-while-revalidate en secondes */
  swrSeconds: number;
  /** stale-if-error en secondes */
  sieSeconds: number;
  /** Données privées (isolation tenant obligatoire) */
  isPrivate: boolean;
  invalidationTriggers: string[];
}

/** Matrice stratégique — source de vérité pour CACHE_STRATEGY_MATRIX.md */
export const CACHE_STRATEGIES: Record<string, CacheStrategyEntry> = {
  legal: {
    tag: CacheTag.LEGAL,
    description: 'CGU, CGV, mentions légales',
    layers: ['browser', 'cdn', 'service-worker'],
    method: 'immutable',
    ttlSeconds: 86400,
    swrSeconds: 604800,
    sieSeconds: 86400,
    isPrivate: false,
    invalidationTriggers: ['admin:legal-update'],
  },
  faq: {
    tag: CacheTag.FAQ,
    description: 'FAQ et pages institutionnelles',
    layers: ['browser', 'cdn', 'react-query'],
    method: 'stale-while-revalidate',
    ttlSeconds: 3600,
    swrSeconds: 86400,
    sieSeconds: 3600,
    isPrivate: false,
    invalidationTriggers: ['admin:faq-update'],
  },
  institutional: {
    tag: CacheTag.INSTITUTIONAL,
    description: 'Pages institutionnelles statiques',
    layers: ['browser', 'cdn'],
    method: 'immutable',
    ttlSeconds: 86400,
    swrSeconds: 604800,
    sieSeconds: 86400,
    isPrivate: false,
    invalidationTriggers: ['admin:content-update'],
  },
  store: {
    tag: CacheTag.STORE,
    description: 'Profils et vitrines vendeurs',
    layers: ['browser', 'cdn', 'edge', 'redis', 'react-query'],
    method: 'stale-while-revalidate',
    ttlSeconds: 300,
    swrSeconds: 600,
    sieSeconds: 3600,
    isPrivate: false,
    invalidationTriggers: ['store:update', 'store:publish'],
  },
  category: {
    tag: CacheTag.CATEGORY,
    description: 'Catégories et collections',
    layers: ['browser', 'redis', 'react-query'],
    method: 'stale-while-revalidate',
    ttlSeconds: 600,
    swrSeconds: 1800,
    sieSeconds: 3600,
    isPrivate: false,
    invalidationTriggers: ['category:update', 'product:mutation'],
  },
  product: {
    tag: CacheTag.PRODUCT,
    description: 'Fiches produit (tous types)',
    layers: ['browser', 'cdn', 'edge', 'redis', 'react-query', 'service-worker'],
    method: 'stale-while-revalidate',
    ttlSeconds: 120,
    swrSeconds: 600,
    sieSeconds: 3600,
    isPrivate: false,
    invalidationTriggers: ['product:create', 'product:update', 'product:delete', 'product:publish'],
  },
  marketplace: {
    tag: CacheTag.MARKETPLACE,
    description: 'Liste catalogue marketplace',
    layers: ['browser', 'redis', 'react-query'],
    method: 'stale-while-revalidate',
    ttlSeconds: 90,
    swrSeconds: 600,
    sieSeconds: 1800,
    isPrivate: false,
    invalidationTriggers: ['product:mutation', 'store:mutation', 'import:catalog'],
  },
  search: {
    tag: CacheTag.SEARCH,
    description: 'Résultats de recherche',
    layers: ['browser', 'redis', 'react-query'],
    method: 'stale-while-revalidate',
    ttlSeconds: 60,
    swrSeconds: 300,
    sieSeconds: 600,
    isPrivate: false,
    invalidationTriggers: ['product:mutation', 'search:index-update'],
  },
  recommendations: {
    tag: CacheTag.RECOMMENDATIONS,
    description: 'Recommandations et produits populaires',
    layers: ['browser', 'redis', 'react-query'],
    method: 'stale-while-revalidate',
    ttlSeconds: 300,
    swrSeconds: 900,
    sieSeconds: 1800,
    isPrivate: false,
    invalidationTriggers: ['product:mutation', 'analytics:rollup'],
  },
  order: {
    tag: CacheTag.ORDER,
    description: 'Commandes et paiements',
    layers: ['react-query'],
    method: 'network-first',
    ttlSeconds: 0,
    swrSeconds: 0,
    sieSeconds: 120,
    isPrivate: true,
    invalidationTriggers: ['order:create', 'order:update', 'payment:webhook'],
  },
  cart: {
    tag: CacheTag.CART,
    description: 'Panier utilisateur',
    layers: ['react-query', 'browser'],
    method: 'network-first',
    ttlSeconds: 0,
    swrSeconds: 0,
    sieSeconds: 60,
    isPrivate: true,
    invalidationTriggers: ['cart:mutation', 'product:deactivate'],
  },
  notification: {
    tag: CacheTag.NOTIFICATION,
    description: 'Notifications temps réel',
    layers: ['react-query'],
    method: 'network-only',
    ttlSeconds: 0,
    swrSeconds: 0,
    sieSeconds: 30,
    isPrivate: true,
    invalidationTriggers: ['notification:create'],
  },
  seo_meta: {
    tag: CacheTag.SEO_META,
    description: 'Meta SEO bots (edge middleware)',
    layers: ['edge', 'redis'],
    method: 'stale-while-revalidate',
    ttlSeconds: 600,
    swrSeconds: 1800,
    sieSeconds: 3600,
    isPrivate: false,
    invalidationTriggers: ['product:mutation', 'store:mutation'],
  },
  homepage: {
    tag: CacheTag.HOMEPAGE,
    description: "Page d'accueil et landing",
    layers: ['browser', 'cdn', 'redis', 'react-query'],
    method: 'stale-while-revalidate',
    ttlSeconds: 120,
    swrSeconds: 600,
    sieSeconds: 3600,
    isPrivate: false,
    invalidationTriggers: ['product:mutation', 'admin:homepage-update', 'deploy'],
  },
};

/** Headers Cache-Control pour Vercel/CDN */
export function buildCacheControlHeader(
  strategy: CacheStrategyEntry,
  options?: { isPrivate?: boolean }
): string {
  const isPrivate = options?.isPrivate ?? strategy.isPrivate;
  if (strategy.method === 'no-store' || strategy.ttlSeconds === 0) {
    return 'private, no-store, no-cache, must-revalidate';
  }
  if (strategy.method === 'immutable') {
    return 'public, max-age=31536000, immutable';
  }
  const parts = [
    isPrivate ? 'private' : 'public',
    `max-age=${strategy.ttlSeconds}`,
    `s-maxage=${strategy.ttlSeconds}`,
    `stale-while-revalidate=${strategy.swrSeconds}`,
    `stale-if-error=${strategy.sieSeconds}`,
  ];
  return parts.join(', ');
}

export function getStrategyForTag(tag: CacheTagValue): CacheStrategyEntry | undefined {
  return Object.values(CACHE_STRATEGIES).find(s => s.tag === tag);
}
