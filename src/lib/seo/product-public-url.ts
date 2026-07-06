/**
 * URLs publiques produit sur www.emarzona.com (marketplace / catalogue plateforme).
 * Les boutiques vendeurs utilisent *.myemarzona.shop/products/:slug (voir store-utils).
 */
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
