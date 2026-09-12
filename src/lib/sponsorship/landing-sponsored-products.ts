export const LANDING_SPONSORED_SLOT_COUNT = 9;
export const LANDING_SPONSORED_ROTATE_MS = 5500;

export type LandingSponsoredProduct = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  price: number;
  promotional_price: number | null;
  currency: string;
  is_featured: boolean;
  is_sponsored: boolean;
  active_sponsorship_id: string | null;
  store: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
};

/**
 * Remplit toujours `slotCount` cartes en cyclant le pool (grille 3×3).
 * L’offset fait tourner les produits à intervalle régulier.
 */
export function pickSponsoredWindow<T>(
  pool: readonly T[],
  offset: number,
  slotCount: number = LANDING_SPONSORED_SLOT_COUNT
): T[] {
  if (pool.length === 0) return [];
  const start = ((offset % pool.length) + pool.length) % pool.length;
  return Array.from({ length: slotCount }, (_, i) => pool[(start + i) % pool.length]);
}

/** Lien produit pour la landing (évite les URLs absolues dans react-router Link). */
export function landingSponsoredProductHref(product: LandingSponsoredProduct): string {
  if (product.store?.slug && product.slug) {
    return `/stores/${encodeURIComponent(product.store.slug)}/products/${encodeURIComponent(product.slug)}`;
  }
  return `/marketplace?q=${encodeURIComponent(product.name)}`;
}
