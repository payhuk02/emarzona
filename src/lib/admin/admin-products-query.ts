import { supabase } from '@/integrations/supabase/client';

export const ADMIN_PRODUCT_FIELDS = `
  id,
  name,
  price,
  currency,
  is_active,
  store_id,
  created_at,
  stores(name)
`;

export const ADMIN_PRODUCT_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_ADMIN_PRODUCT_PAGE_SIZE = 25;

export type AdminProductRow = {
  id: string;
  name: string;
  price: number;
  currency: string;
  is_active: boolean;
  store_id: string;
  created_at: string;
  stores: { name: string } | null;
};

function baseAdminProductsQuery() {
  return supabase
    .from('products')
    .select(ADMIN_PRODUCT_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false });
}

type ProductsQuery = ReturnType<typeof baseAdminProductsQuery>;

export function applyAdminProductSearchFilter(query: ProductsQuery, search: string): ProductsQuery {
  const q = search.trim();
  if (q.length < 2) return query;
  return query.or(`name.ilike.%${q}%,stores.name.ilike.%${q}%`);
}

export async function fetchAdminProductsPage(options: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<{ rows: AdminProductRow[]; totalCount: number }> {
  const { page, pageSize, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = baseAdminProductsQuery();
  query = applyAdminProductSearchFilter(query, search);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as AdminProductRow[],
    totalCount: count ?? 0,
  };
}
