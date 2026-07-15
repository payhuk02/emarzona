import { supabase } from '@/integrations/supabase/client';

export const ADMIN_ORDER_FIELDS = `
  id,
  order_number,
  status,
  payment_status,
  delivery_status,
  total_amount,
  currency,
  created_at,
  store_id,
  customers:fk_orders_customer(email, full_name, name)
`;

export const ADMIN_ORDER_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_ADMIN_ORDER_PAGE_SIZE = 25;

export type AdminOrderTab = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled';

export type AdminOrderRow = {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  delivery_status: string | null;
  total_amount: number;
  currency: string | null;
  created_at: string | null;
  store_id: string | null;
  stores: { name: string } | null;
  customers: { email: string | null; full_name: string | null; name: string | null } | null;
};

export type AdminOrderStats = {
  total: number;
  pending: number;
  processing: number;
  delivered: number;
  totalRevenue: number;
};

function baseAdminOrdersQuery() {
  return supabase
    .from('orders')
    .select(ADMIN_ORDER_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false });
}

type OrdersQuery = ReturnType<typeof baseAdminOrdersQuery>;

export function applyAdminOrderTabFilter(query: OrdersQuery, tab: AdminOrderTab): OrdersQuery {
  switch (tab) {
    case 'pending':
      return query.eq('payment_status', 'pending');
    case 'processing':
      return query.in('status', ['processing', 'confirmed', 'pending']);
    case 'completed':
      return query.or(
        'status.eq.completed,status.eq.delivered,payment_status.eq.completed,payment_status.eq.paid'
      );
    case 'cancelled':
      return query.eq('status', 'cancelled');
    default:
      return query;
  }
}

export function applyAdminOrderSearchFilter(query: OrdersQuery, search: string): OrdersQuery {
  const q = search.trim();
  if (q.length < 2) return query;
  return query.ilike('order_number', `%${q}%`);
}

export async function fetchAdminOrderStats(): Promise<AdminOrderStats> {
  const [totalRes, pendingRes, processingRes, deliveredRes, paidOrdersRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'pending'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['processing', 'confirmed', 'pending']),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .or('delivery_status.eq.delivered,status.eq.completed,status.eq.delivered'),
    supabase
      .from('orders')
      .select('total_amount.sum()')
      .in('payment_status', ['completed', 'paid']),
  ]);

  const totalRevenue = Number(
    (paidOrdersRes.data as { sum: number | null }[] | null)?.[0]?.sum ?? 0
  );

  return {
    total: totalRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    processing: processingRes.count ?? 0,
    delivered: deliveredRes.count ?? 0,
    totalRevenue,
  };
}

export async function fetchAdminOrdersPage(options: {
  page: number;
  pageSize: number;
  tab: AdminOrderTab;
  search: string;
}): Promise<{ rows: AdminOrderRow[]; totalCount: number }> {
  const { page, pageSize, tab, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = baseAdminOrdersQuery();

  query = applyAdminOrderTabFilter(query, tab);
  query = applyAdminOrderSearchFilter(query, search);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as AdminOrderRow[],
    totalCount: count ?? 0,
  };
}
