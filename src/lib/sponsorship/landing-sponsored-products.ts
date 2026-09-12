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

/** Fenêtre de 9 cartes ; avance d’un cran à chaque tick pour une rotation fluide. */
export function pickSponsoredWindow<T>(
  pool: readonly T[],
  offset: number,
  slotCount: number = LANDING_SPONSORED_SLOT_COUNT
): T[] {
  if (pool.length === 0) return [];
  if (pool.length <= slotCount) return [...pool];

  const start = ((offset % pool.length) + pool.length) % pool.length;
  return Array.from({ length: slotCount }, (_, i) => pool[(start + i) % pool.length]);
}
