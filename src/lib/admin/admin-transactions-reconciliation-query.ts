import { supabase } from '@/integrations/supabase/client';

export const ADMIN_TRANSACTION_FIELDS = `
  id,
  order_id,
  amount,
  currency,
  status,
  payment_provider,
  payment_id,
  geniuspay_transaction_id,
  created_at,
  updated_at,
  order:orders!transactions_order_id_fkey(
    order_number,
    customer_email
  )
`;

export const ADMIN_TRANSACTION_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_ADMIN_TRANSACTION_PAGE_SIZE = 25;

export type AdminTransactionTab = 'pending' | 'old' | 'failed' | 'all';

export type AdminTransactionRow = {
  id: string;
  order_id: string | null;
  amount: number | null;
  currency: string;
  status: string;
  payment_provider: string;
  payment_id: string | null;
  geniuspay_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  order: { order_number: string | null; customer_email: string | null } | null;
};

export type AdminTransactionStats = {
  totalCount: number;
  totalAmount: number;
  processingCount: number;
  oldPendingCount: number;
};

function baseAdminTransactionsQuery() {
  return supabase
    .from('transactions')
    .select(ADMIN_TRANSACTION_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false });
}

type TransactionsQuery = ReturnType<typeof baseAdminTransactionsQuery>;

function pendingThresholdIso(): string {
  const thresholdDate = new Date();
  thresholdDate.setHours(thresholdDate.getHours() - 24);
  return thresholdDate.toISOString();
}

export function applyAdminTransactionTabFilter(
  query: TransactionsQuery,
  tab: AdminTransactionTab
): TransactionsQuery {
  switch (tab) {
    case 'pending':
      return query.in('status', ['processing', 'pending']);
    case 'failed':
      return query.eq('status', 'failed');
    case 'old':
      return query.in('status', ['processing', 'pending']).lt('created_at', pendingThresholdIso());
    default:
      return query;
  }
}

export function applyAdminTransactionSearchFilter(
  query: TransactionsQuery,
  search: string
): TransactionsQuery {
  const q = search.trim();
  if (q.length < 2) return query;
  return query.or(
    `id.ilike.%${q}%,order_id.ilike.%${q}%,payment_id.ilike.%${q}%,geniuspay_transaction_id.ilike.%${q}%,orders.order_number.ilike.%${q}%,orders.customer_email.ilike.%${q}%`
  );
}

function mapTransactionRow(row: Record<string, unknown>): AdminTransactionRow {
  const order = row.order as Record<string, unknown> | null | undefined;
  return {
    id: String(row.id),
    order_id: row.order_id ? String(row.order_id) : null,
    amount:
      typeof row.amount === 'number' ? row.amount : row.amount == null ? null : Number(row.amount),
    currency: String(row.currency ?? 'XOF'),
    status: String(row.status ?? 'pending'),
    payment_provider: String(row.payment_provider ?? 'moneyfusion'),
    payment_id: row.payment_id ? String(row.payment_id) : null,
    geniuspay_transaction_id: row.geniuspay_transaction_id
      ? String(row.geniuspay_transaction_id)
      : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    order: order
      ? {
          order_number: order.order_number ? String(order.order_number) : null,
          customer_email: order.customer_email ? String(order.customer_email) : null,
        }
      : null,
  };
}

export async function fetchAdminTransactionStats(): Promise<AdminTransactionStats> {
  const threshold = pendingThresholdIso();

  const [totalRes, processingRes, oldRes, amountRes] = await Promise.all([
    supabase.from('transactions').select('id', { count: 'exact', head: true }),
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing'),
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['processing', 'pending'])
      .lt('created_at', threshold),
    // Prefer named aggregate alias — bare amount.sum() 400s on some PostgREST configs
    supabase.from('transactions').select('total:amount.sum()').limit(1).maybeSingle(),
  ]);

  const totalAmountRaw = (amountRes.data as { total?: number | null } | null)?.total;

  return {
    totalCount: totalRes.count ?? 0,
    processingCount: processingRes.count ?? 0,
    oldPendingCount: oldRes.count ?? 0,
    totalAmount: Number(totalAmountRaw ?? 0),
  };
}

export async function fetchAdminTransactionsPage(options: {
  page: number;
  pageSize: number;
  tab: AdminTransactionTab;
  search: string;
}): Promise<{ rows: AdminTransactionRow[]; totalCount: number }> {
  const { page, pageSize, tab, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = baseAdminTransactionsQuery();
  query = applyAdminTransactionTabFilter(query, tab);
  query = applyAdminTransactionSearchFilter(query, search);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  return {
    rows: rows.map(mapTransactionRow),
    totalCount: count ?? 0,
  };
}
