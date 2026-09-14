/**
 * Normalise product.store | product.stores | store_* plats → un objet boutique unique.
 */
export type NormalizedProductStore = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  subdomain?: string | null;
};

type StoreLikeInput = {
  store_id?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  store_logo_url?: string | null;
  store?: Partial<NormalizedProductStore> | null;
  stores?:
    | (Partial<NormalizedProductStore> & {
        store_appearance?: { logo_url?: string | null } | { logo_url?: string | null }[] | null;
      })
    | null;
};

function appearanceLogo(
  appearance: { logo_url?: string | null } | { logo_url?: string | null }[] | null | undefined
): string | null {
  if (!appearance) return null;
  const row = Array.isArray(appearance) ? appearance[0] : appearance;
  const logo = row?.logo_url;
  return typeof logo === 'string' && logo.trim() ? logo.trim() : null;
}

export function getProductStore(
  input: StoreLikeInput | null | undefined
): NormalizedProductStore | null {
  if (!input) return null;

  const nested = input.store ?? input.stores ?? null;
  const appearanceLogoUrl =
    nested && 'store_appearance' in nested
      ? appearanceLogo(
          (
            nested as {
              store_appearance?: { logo_url?: string | null } | { logo_url?: string | null }[];
            }
          ).store_appearance
        )
      : null;

  const id = (nested?.id || input.store_id || '').toString().trim();
  const name = (nested?.name || input.store_name || '').toString().trim();
  if (!id || !name) return null;

  const logo =
    (typeof nested?.logo_url === 'string' && nested.logo_url.trim()) ||
    appearanceLogoUrl ||
    (typeof input.store_logo_url === 'string' && input.store_logo_url.trim()) ||
    null;

  return {
    id,
    name,
    slug: (nested?.slug || input.store_slug || '').toString(),
    logo_url: logo,
    subdomain: nested?.subdomain ?? null,
  };
}
