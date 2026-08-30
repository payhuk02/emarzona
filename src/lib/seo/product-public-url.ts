/**
 * URLs publiques produit sur www.emarzona.com (marketplace / catalogue plateforme).
 * Les boutiques vendeurs utilisent *.myemarzona.shop/products/:slug (voir store-utils).
 */
import { generateProductUrl } from '@/lib/store-utils';

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
      return `/service/${id}`;
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

/** Lien « Voir » sur une carte marketplace — chemin www si disponible, sinon boutique. */
export function resolveMarketplaceProductCardUrl(
  product: MarketplaceProductRef,
  store?: MarketplaceCardStoreRef | null
): string {
  const marketplacePath = buildWwwProductPublicPath(product);
  if (marketplacePath) return marketplacePath;

  if (store?.slug && product.slug) {
    return generateProductUrl(store.slug, product.slug, store.subdomain);
  }

  return product.slug ? `/products/${product.slug}` : `/products/${product.id}`;
}

/** Lien carte produit sur la boutique (*.myemarzona.shop) — chemins relatifs sur le sous-domaine. */
export function resolveStoreProductCardUrl(product: MarketplaceProductRef): string {
  if (product.product_type === 'service') {
    return `/service/${product.id}`;
  }
  if (product.product_type === 'course' && product.slug) {
    return `/courses/${product.slug}`;
  }
  return product.slug ? `/products/${product.slug}` : `/products/${product.id}`;
}
