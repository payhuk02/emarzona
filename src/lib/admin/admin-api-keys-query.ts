import { supabase } from '@/integrations/supabase/client';

export const ADMIN_API_KEY_FIELDS = `
  id,
  name,
  key_prefix,
  is_active,
  last_used_at,
  expires_at,
  created_at,
  store_id,
  stores ( name, slug )
`;

export const ADMIN_API_KEY_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_ADMIN_API_KEY_PAGE_SIZE = 25;

export type AdminApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  store_id: string;
  stores: { name: string; slug: string } | null;
};

function baseAdminApiKeysQuery() {
  return supabase
    .from('api_keys')
    .select(ADMIN_API_KEY_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false });
}

type ApiKeysQuery = ReturnType<typeof baseAdminApiKeysQuery>;

export function applyAdminApiKeySearchFilter(query: ApiKeysQuery, search: string): ApiKeysQuery {
  const q = search.trim();
  if (q.length < 2) return query;
  return query.or(`name.ilike.%${q}%,key_prefix.ilike.%${q}%,stores.name.ilike.%${q}%`);
}

export async function fetchAdminApiKeysPage(options: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<{ rows: AdminApiKeyRow[]; totalCount: number }> {
  const { page, pageSize, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = baseAdminApiKeysQuery();
  query = applyAdminApiKeySearchFilter(query, search);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as AdminApiKeyRow[],
    totalCount: count ?? 0,
  };
}
