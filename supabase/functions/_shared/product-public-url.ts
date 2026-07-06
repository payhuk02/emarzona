/**
 * URLs publiques produit www.emarzona.com — partagé Edge Functions (sitemap, RAG).
 */
export const WWW_SITE_ORIGIN = 'https://www.emarzona.com';

export interface MarketplaceProductRef {
  id: string;
  slug?: string | null;
  product_type?: string | null;
}

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
  return `${origin.replace(/\/+$/, '')}${path}`;
}
