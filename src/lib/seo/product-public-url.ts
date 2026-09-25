/**
 * URLs publiques produit.
 * - Boutique vendeur : *.myemarzona.shop (prioritaire dès qu'un store est connu)
 * - www.emarzona.com : chemins marketplace / catalogue plateforme (fallback)
 */
import { generateStorefrontItemUrl } from '@/lib/store-utils';
import { buildServicePublicPath } from '@/lib/service/resolve-service-product-route';

export const WWW_SITE_ORIGIN = 'https://www.emarzona.com';

export type MarketplaceProductType = 'digital' | 'physical' | 'service' | 'course' | 'artist';

export interface MarketplaceProductRef {
  id: string;
  slug?: string | null;
  product_type?: string | null;
}

/** Chemin relatif public sur le domaine principal, ou null si non indexable sur www. */
export function buildWwwProductPublicPath(product: MarketplaceProductRef): string | null {
  const type = product.product_type;
  const { id, slug } = product;

  switch (type) {
    case 'digital':
      return `/digital/${id}`;
    case 'physical':
      return `/physical/${id}`;
    case 'service':
      return buildServicePublicPath({ id, slug });
    case 'artist':
      return `/artist/${id}`;
    case 'course':
      return slug ? `/courses/${slug}` : null;
    default:
      return null;
  }
}

export function buildWwwProductPublicUrl(
  product: MarketplaceProductRef,
  origin = WWW_SITE_ORIGIN
): string | null {
  const path = buildWwwProductPublicPath(product);
  if (!path) return null;
  const base = origin.replace(/\/+$/, '');
  return `${base}${path}`;
}

export interface MarketplaceCardStoreRef {
  slug?: string;
  subdomain?: string | null;
}

/**
 * Lien « Voir » sur une carte marketplace — boutique *.myemarzona.shop si store connu,
 * sinon chemin www.
 */
export function resolveMarketplaceProductCardUrl(
  product: MarketplaceProductRef,
  store?: MarketplaceCardStoreRef | null
): string {
  if (store?.slug) {
    return generateStorefrontItemUrl(store.slug, product, store.subdomain);
  }

  const marketplacePath = buildWwwProductPublicPath(product);
  if (marketplacePath) return marketplacePath;

  if (product.slug) {
    return `/products/${product.slug}`;
  }
  return `/products/${product.id}`;
}

/** Lien carte produit sur la boutique (*.myemarzona.shop) — chemins relatifs sur le sous-domaine. */
export function resolveStoreProductCardUrl(product: MarketplaceProductRef): string {
  if (product.product_type === 'course' && product.slug) {
    // LMS uniquement sur www — SoftLink hard-nav cross-origin
    return `${WWW_SITE_ORIGIN}/courses/${product.slug}`;
  }
  if (product.product_type === 'service') {
    return buildServicePublicPath(product);
  }
  if (product.product_type === 'artist') {
    return `/artist/${product.id}`;
  }
  return product.slug ? `/products/${product.slug}` : `/products/${product.id}`;
}
