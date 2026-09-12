import type { Product } from '@/types/marketplace';

type RpcStoreRow = {
  store_id?: string;
  store_name?: string | null;
  store_slug?: string | null;
  store_logo_url?: string | null;
  stores?: Product['stores'];
  created_at?: string;
  is_sponsored?: boolean | null;
  active_sponsorship_id?: string | null;
  sponsored_until?: string | null;
};

/**
 * Les RPC marketplace / filter_* renvoient store_* à plat.
 * Les cartes attendent `stores.logo_url` — normalise avant transform.
 */
export function nestMarketplaceStoreFields<T extends RpcStoreRow>(row: T): T & Partial<Product> {
  const existing = row.stores;
  const appearanceRaw = (
    existing as
      | { store_appearance?: { logo_url?: string | null } | { logo_url?: string | null }[] }
      | null
      | undefined
  )?.store_appearance;
  const appearance = Array.isArray(appearanceRaw) ? appearanceRaw[0] : appearanceRaw;
  const logoFromNested = existing?.logo_url ?? appearance?.logo_url ?? null;
  const logoUrl = (logoFromNested || row.store_logo_url || null) as string | null;
  const name = existing?.name || row.store_name || null;
  const slug = existing?.slug || row.store_slug || null;
  const id = existing?.id || row.store_id;

  const stores =
    id && name
      ? {
          id,
          name,
          slug: slug || '',
          logo_url: typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : null,
          created_at: existing?.created_at || row.created_at || new Date().toISOString(),
        }
      : (existing ?? null);

  return {
    ...row,
    stores,
    is_sponsored: Boolean(
      row.is_sponsored ??
      (row.sponsored_until != null && new Date(String(row.sponsored_until)).getTime() > Date.now())
    ),
    active_sponsorship_id: row.active_sponsorship_id ?? null,
  };
}

export function nestMarketplaceStoreFieldsList<T extends RpcStoreRow>(
  rows: T[] | null | undefined
): Array<T & Partial<Product>> {
  return (rows ?? []).map(nestMarketplaceStoreFields);
}
