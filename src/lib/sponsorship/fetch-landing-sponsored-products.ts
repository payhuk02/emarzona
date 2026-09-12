import { supabaseRead } from '@/integrations/supabase/read-client';
import { nestMarketplaceStoreFields } from '@/lib/marketplace/nest-store-fields';
import { logger } from '@/lib/logger';
import type { LandingSponsoredProduct } from '@/lib/sponsorship/landing-sponsored-products';

const FETCH_LIMIT = 36;

/**
 * Produits sponsorisés actifs pour la grille landing (RPC marketplace).
 * Types générés encore sans p_sponsored_only — cast volontaire au boundary.
 */
export async function fetchLandingSponsoredProducts(): Promise<LandingSponsoredProduct[]> {
  // POST (pas get:true) : la RPC plpgsql SECURITY DEFINER échoue en GET
  // avec 25006 « cannot execute SELECT in a read-only transaction ».
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseRead as any).rpc('get_marketplace_products_filtered', {
    p_limit: FETCH_LIMIT,
    p_offset: 0,
    p_sponsored_only: true,
    p_featured_only: false,
    p_sort_by: 'created_at',
    p_sort_order: 'desc',
  });

  if (error) {
    logger.warn('fetchLandingSponsoredProducts RPC failed', { error });
    return [];
  }

  if (!Array.isArray(data)) return [];

  try {
    const seen = new Set<string>();
    const products: LandingSponsoredProduct[] = [];

    for (const raw of data) {
      const row = nestMarketplaceStoreFields(raw as Record<string, unknown>);
      const id = String(row.id ?? '');
      const name = String(row.name ?? '').trim();
      const slug = String(row.slug ?? '').trim();
      if (!id || !name || !slug || seen.has(id)) continue;
      seen.add(id);

      products.push({
        id,
        name,
        slug,
        image_url: (row.image_url as string | null) ?? null,
        price: Number(row.price ?? 0),
        promotional_price: row.promotional_price != null ? Number(row.promotional_price) : null,
        currency: String(row.currency ?? 'XOF'),
        is_featured: Boolean(row.is_featured),
        is_sponsored: Boolean(row.is_sponsored ?? true),
        active_sponsorship_id: (row.active_sponsorship_id as string | null) ?? null,
        store: row.stores
          ? {
              id: String(row.stores.id),
              name: String(row.stores.name ?? ''),
              slug: String(row.stores.slug ?? ''),
              logo_url: (row.stores.logo_url as string | null) ?? null,
            }
          : null,
      });
    }

    return products;
  } catch (err) {
    logger.warn('fetchLandingSponsoredProducts map failed', { err });
    return [];
  }
}
