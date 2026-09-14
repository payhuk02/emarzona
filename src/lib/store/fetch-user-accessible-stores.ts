/**
 * Liste des boutiques accessibles à un utilisateur (owner + membres actifs).
 * Aligné sur StoreContext — une seule règle pour sidebar et hooks.
 */

import { supabase } from '@/integrations/supabase/client';
import { resolveStoreCommerceTypeFromStore } from '@/lib/commerce/store-capability-map';
import {
  flattenStoreWithAppearance,
  STORE_APPEARANCE_EMBED_SELECT,
} from '@/lib/storefront/flatten-store-appearance';

const USER_STORES_SELECT = `id, user_id, name, slug, subdomain, description, is_active, created_at, updated_at, custom_domain, domain_status, metadata, commerce_type, ${STORE_APPEARANCE_EMBED_SELECT}`;

type StoresListQuery = {
  select: (columns: string) => StoresListQuery;
  or: (filters: string) => StoresListQuery;
  eq: (column: string, value: string) => StoresListQuery;
  order: (
    column: string,
    opts: { ascending: boolean }
  ) => PromiseLike<{ data: Record<string, unknown>[] | null; error: Error | null }>;
};

export async function fetchActiveMemberStoreIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('store_members')
    .select('store_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  return (data ?? []).map(row => row.store_id).filter(Boolean);
}

/**
 * Boutiques dont l'utilisateur est propriétaire ou membre actif.
 * Ne sélectionne pas logo_url sur `stores` (Sprint 3 → store_appearance).
 */
export async function fetchUserAccessibleStores<T = Record<string, unknown>>(
  userId: string
): Promise<T[]> {
  const memberStoreIds = await fetchActiveMemberStoreIds(userId).catch(() => [] as string[]);

  const storesTable = (supabase as unknown as { from: (table: string) => StoresListQuery }).from(
    'stores'
  );

  let query = storesTable.select(USER_STORES_SELECT);

  if (memberStoreIds.length > 0) {
    query = query.or(`user_id.eq.${userId},id.in.(${memberStoreIds.join(',')})`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map(row => {
    const flattened = flattenStoreWithAppearance(row);
    return {
      ...flattened,
      commerce_type: resolveStoreCommerceTypeFromStore(flattened),
    } as T;
  });
}
