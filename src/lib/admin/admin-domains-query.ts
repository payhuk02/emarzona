import { supabase } from '@/integrations/supabase/client';

export const ADMIN_DOMAIN_FIELDS =
  'id, domain, status, ssl_status, is_primary, verified_at, created_at, store_id, stores(name, slug)';

export const ADMIN_DOMAIN_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_ADMIN_DOMAIN_PAGE_SIZE = 25;

export type AdminDomainRow = {
  id: string;
  domain: string;
  status: string;
  ssl_status: string | null;
  is_primary: boolean;
  verified_at: string | null;
  created_at: string;
  store_id: string;
  stores: { name: string; slug: string } | null;
};

export type AdminDomainStats = {
  totalCount: number;
  active: number;
  sslOk: number;
  pending: number;
};

function baseAdminDomainsQuery() {
  return supabase
    .from('custom_domains')
    .select(ADMIN_DOMAIN_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false });
}

type DomainsQuery = ReturnType<typeof baseAdminDomainsQuery>;

export function applyAdminDomainSearchFilter(query: DomainsQuery, search: string): DomainsQuery {
  const q = search.trim();
  if (q.length < 2) return query;
  return query.or(`domain.ilike.%${q}%,stores.name.ilike.%${q}%,stores.slug.ilike.%${q}%`);
}

export async function fetchAdminDomainStats(): Promise<AdminDomainStats> {
  const [totalRes, activeRes, sslRes, pendingRes] = await Promise.all([
    supabase.from('custom_domains').select('id', { count: 'exact', head: true }),
    supabase
      .from('custom_domains')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'verified']),
    supabase
      .from('custom_domains')
      .select('id', { count: 'exact', head: true })
      .eq('ssl_status', 'active'),
    supabase
      .from('custom_domains')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'verifying']),
  ]);

  return {
    totalCount: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    sslOk: sslRes.count ?? 0,
    pending: pendingRes.count ?? 0,
  };
}

export async function fetchAdminDomainsPage(options: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<{ rows: AdminDomainRow[]; totalCount: number }> {
  const { page, pageSize, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = baseAdminDomainsQuery();
  query = applyAdminDomainSearchFilter(query, search);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as AdminDomainRow[],
    totalCount: count ?? 0,
  };
}
