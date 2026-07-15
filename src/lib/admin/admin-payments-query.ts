import { supabase } from '@/integrations/supabase/client';

export const ADMIN_PAYMENT_FIELDS = `
  id,
  order_number,
  payment_status,
  total_amount,
  currency,
  created_at,
  stores(name),
  customers:fk_orders_customer(email, full_name, name)
`;

export const ADMIN_PAYMENT_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_ADMIN_PAYMENT_PAGE_SIZE = 25;

export type AdminPaymentTab = 'all' | 'completed' | 'pending' | 'failed';

export type AdminPaymentRow = {
  id: string;
  order_number: string;
  payment_status: string | null;
  total_amount: number;
  currency: string | null;
  created_at: string;
  stores: { name: string } | null;
  customers: { email: string | null; full_name: string | null; name: string | null } | null;
};

export type AdminPaymentStats = {
  totalAmount: number;
  completed: number;
  pending: number;
  failed: number;
  totalCount: number;
};

function baseAdminPaymentsQuery() {
  return supabase
    .from('orders')
    .select(ADMIN_PAYMENT_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false });
}

type PaymentsQuery = ReturnType<typeof baseAdminPaymentsQuery>;

export function applyAdminPaymentTabFilter(
  query: PaymentsQuery,
  tab: AdminPaymentTab
): PaymentsQuery {
  switch (tab) {
    case 'completed':
      return query.in('payment_status', ['completed', 'paid']);
    case 'pending':
      return query.eq('payment_status', 'pending');
    case 'failed':
      return query.eq('payment_status', 'failed');
    default:
      return query;
  }
}

export function applyAdminPaymentSearchFilter(query: PaymentsQuery, search: string): PaymentsQuery {
  const q = search.trim();
  if (q.length < 2) return query;
  return query.ilike('order_number', `%${q}%`);
}

export async function fetchAdminPaymentStats(): Promise<AdminPaymentStats> {
  const [totalRes, completedRes, pendingRes, failedRes, paidSumRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('payment_status', ['completed', 'paid']),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'pending'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'failed'),
    supabase
      .from('orders')
      .select('total_amount')
      .in('payment_status', ['completed', 'paid']),
  ]);

  const totalAmount = ((paidSumRes.data as any[]) || []).reduce(
    (acc, row) => acc + (Number(row.total_amount) || 0),
    0
  );

  return {
    totalCount: totalRes.count ?? 0,
    completed: completedRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    failed: failedRes.count ?? 0,
    totalAmount,
  };
}

export async function fetchAdminPaymentsPage(options: {
  page: number;
  pageSize: number;
  tab: AdminPaymentTab;
  search: string;
}): Promise<{ rows: AdminPaymentRow[]; totalCount: number }> {
  const { page, pageSize, tab, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = baseAdminPaymentsQuery();
  query = applyAdminPaymentTabFilter(query, tab);
  query = applyAdminPaymentSearchFilter(query, search);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as AdminPaymentRow[],
    totalCount: count ?? 0,
  };
}
