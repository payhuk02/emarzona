import { supabase } from '@/integrations/supabase/client';

export const STORE_COMMERCE_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_STORE_COMMERCE_PAGE_SIZE = 25;

export type StoreCommerceCustomerTab = 'all' | 'active' | 'new';
export type StoreCommerceOrderTab = 'all' | 'paid' | 'pending' | 'failed';
export type StoreCommerceTransactionTab = 'all' | 'completed' | 'pending' | 'failed';

export type StoreCommerceOverview = {
  storeName: string;
  storeSlug: string | null;
  totalCustomers: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  totalRevenue: number;
  availableBalance: number;
  totalWithdrawn: number;
  platformCommission: number;
  currency: string;
};

export type StoreCommerceCustomerRow = {
  id: string;
  name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  total_orders: number | null;
  total_spent: number | null;
  created_at: string;
  updated_at: string;
};

export type StoreCommerceOrderRow = {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  total_amount: number;
  currency: string | null;
  paid_at: string | null;
  created_at: string;
  customer_email: string | null;
  customers: {
    email: string | null;
    full_name: string | null;
    name: string | null;
    phone: string | null;
  } | null;
};

export type StoreCommerceTransactionRow = {
  id: string;
  order_id: string | null;
  amount: number | null;
  currency: string;
  status: string;
  payment_provider: string;
  payment_id: string | null;
  customer_email: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  order: {
    order_number: string | null;
    payment_status: string | null;
    paid_at: string | null;
    total_amount: number | null;
  } | null;
};

const CUSTOMER_FIELDS = `
  id,
  name,
  full_name,
  email,
  phone,
  total_orders,
  total_spent,
  created_at,
  updated_at
`;

const ORDER_FIELDS = `
  id,
  order_number,
  status,
  payment_status,
  total_amount,
  currency,
  paid_at,
  created_at,
  customer_email,
  customers:fk_orders_customer(email, full_name, name, phone)
`;

const TRANSACTION_FIELDS = `
  id,
  order_id,
  amount,
  currency,
  status,
  payment_provider,
  payment_id,
  customer_email,
  created_at,
  updated_at,
  completed_at,
  order:orders!transactions_order_id_fkey(
    order_number,
    payment_status,
    paid_at,
    total_amount
  )
`;

export async function fetchStoreCommerceOverview(storeId: string): Promise<StoreCommerceOverview> {
  const [
    storeRes,
    customersRes,
    ordersTotalRes,
    paidRes,
    pendingRes,
    failedRes,
    paidSumRes,
    earningsRes,
  ] = await Promise.all([
    supabase.from('stores').select('name, slug').eq('id', storeId).maybeSingle(),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .in('payment_status', ['completed', 'paid']),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('payment_status', 'pending'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('payment_status', 'failed'),
    supabase
      .from('orders')
      .select('total_amount')
      .eq('store_id', storeId)
      .in('payment_status', ['completed', 'paid']),
    supabase.from('store_earnings').select('*').eq('store_id', storeId).maybeSingle(),
  ]);

  if (storeRes.error) throw storeRes.error;

  const totalRevenue = ((paidSumRes.data as { total_amount: number }[]) || []).reduce(
    (acc, row) => acc + (Number(row.total_amount) || 0),
    0
  );

  const earnings = earningsRes.data;

  return {
    storeName: storeRes.data?.name ?? 'Boutique',
    storeSlug: storeRes.data?.slug ?? null,
    totalCustomers: customersRes.count ?? 0,
    totalOrders: ordersTotalRes.count ?? 0,
    paidOrders: paidRes.count ?? 0,
    pendingOrders: pendingRes.count ?? 0,
    failedOrders: failedRes.count ?? 0,
    totalRevenue,
    availableBalance: Number(earnings?.available_balance ?? 0),
    totalWithdrawn: Number(earnings?.total_withdrawn ?? 0),
    platformCommission: Number(earnings?.total_platform_commission ?? 0),
    currency: 'XOF',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCustomerTabFilter(query: any, tab: StoreCommerceCustomerTab) {
  if (tab === 'active') {
    return query.gt('total_orders', 0);
  }
  if (tab === 'new') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return query.gte('created_at', thirtyDaysAgo.toISOString());
  }
  return query;
}

export async function fetchStoreCommerceCustomersPage(options: {
  storeId: string;
  page: number;
  pageSize: number;
  tab: StoreCommerceCustomerTab;
  search: string;
}): Promise<{ rows: StoreCommerceCustomerRow[]; totalCount: number }> {
  const { storeId, page, pageSize, tab, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('customers')
    .select(CUSTOMER_FIELDS, { count: 'exact' })
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  query = applyCustomerTabFilter(query, tab);

  const q = search.trim();
  if (q.length >= 2) {
    query = query.or(
      `name.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as StoreCommerceCustomerRow[],
    totalCount: count ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyOrderTabFilter(query: any, tab: StoreCommerceOrderTab) {
  switch (tab) {
    case 'paid':
      return query.in('payment_status', ['completed', 'paid']);
    case 'pending':
      return query.eq('payment_status', 'pending');
    case 'failed':
      return query.eq('payment_status', 'failed');
    default:
      return query;
  }
}

export async function fetchStoreCommerceOrdersPage(options: {
  storeId: string;
  page: number;
  pageSize: number;
  tab: StoreCommerceOrderTab;
  search: string;
}): Promise<{ rows: StoreCommerceOrderRow[]; totalCount: number }> {
  const { storeId, page, pageSize, tab, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('orders')
    .select(ORDER_FIELDS, { count: 'exact' })
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  query = applyOrderTabFilter(query, tab);

  const q = search.trim();
  if (q.length >= 2) {
    query = query.or(`order_number.ilike.%${q}%,customer_email.ilike.%${q}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as StoreCommerceOrderRow[],
    totalCount: count ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTransactionTabFilter(query: any, tab: StoreCommerceTransactionTab) {
  switch (tab) {
    case 'completed':
      return query.eq('status', 'completed');
    case 'pending':
      return query.in('status', ['pending', 'processing']);
    case 'failed':
      return query.eq('status', 'failed');
    default:
      return query;
  }
}

export async function fetchStoreCommerceTransactionsPage(options: {
  storeId: string;
  page: number;
  pageSize: number;
  tab: StoreCommerceTransactionTab;
  search: string;
}): Promise<{ rows: StoreCommerceTransactionRow[]; totalCount: number }> {
  const { storeId, page, pageSize, tab, search } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('transactions')
    .select(TRANSACTION_FIELDS, { count: 'exact' })
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  query = applyTransactionTabFilter(query, tab);

  const q = search.trim();
  if (q.length >= 2) {
    const uuidLike = /^[0-9a-f-]{8,}$/i.test(q);
    const filters = [`payment_id.ilike.%${q}%`, `customer_email.ilike.%${q}%`];
    if (uuidLike) filters.push(`id.eq.${q}`);
    query = query.or(filters.join(','));
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as StoreCommerceTransactionRow[],
    totalCount: count ?? 0,
  };
}

export async function refreshStoreEarnings(storeId: string): Promise<void> {
  const { error } = await supabase.rpc('update_store_earnings', { p_store_id: storeId });
  if (error) throw error;
}
