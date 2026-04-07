/**
 * Advanced Payments Service
 * Extracted from useAdvancedPayments hook for better separation of concerns
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type {
  AdvancedPayment,
  PaymentType,
  PaymentStatus,
  PaymentFilters,
  PaymentStats,
} from '@/types/advanced-features';

// ---- Transaction normalization ----

interface RawTransaction {
  id: string;
  store_id: string;
  order_id?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  moneroo_payment_method?: string | null;
  amount: number | null;
  currency?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  moneroo_transaction_id?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

function resolvePaymentType(metadata: Record<string, unknown> | null | undefined): PaymentType {
  if (metadata && typeof metadata === 'object' && (metadata as Record<string, unknown>).payment_type) {
    return (metadata as Record<string, unknown>).payment_type as PaymentType;
  }
  return 'full';
}

function resolvePaymentStatus(rawStatus: string | null | undefined): PaymentStatus {
  const s = rawStatus?.toLowerCase();
  if (s === 'completed' || s === 'success') return 'completed';
  if (s === 'failed' || s === 'error') return 'failed';
  return 'pending';
}

async function fetchCustomerData(customerId: string, storeId: string, fallbackName?: string | null, fallbackEmail?: string | null) {
  try {
    const { data } = await supabase
      .from('customers')
      .select('name, email, full_name')
      .eq('id', customerId)
      .eq('store_id', storeId)
      .single();
    if (data) {
      return {
        name: data.name || data.full_name || fallbackName || 'N/A',
        email: data.email || fallbackEmail || undefined,
      };
    }
  } catch (err) {
    logger.warn('Error fetching customer for transaction', { customerId, error: err });
  }
  return null;
}

async function fetchOrderNumber(orderId: string, storeId: string, transactionId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', orderId)
      .eq('store_id', storeId)
      .single();

    if (error) {
      const code = error.code;
      const msg = error.message || '';
      const isNonCritical = ['42P01', 'PGRST116', '400', '42501', '403'].includes(code) ||
        msg.includes('does not exist') || msg.includes('Bad Request') ||
        msg.includes('permission denied') || msg.includes('RLS');
      if (!isNonCritical) {
        logger.warn('Error fetching order for transaction', { transactionId, orderId, error });
      }
      return null;
    }
    return data ? { order_number: data.order_number } : null;
  } catch {
    return null;
  }
}

export async function normalizeTransaction(transaction: RawTransaction, storeId: string): Promise<AdvancedPayment> {
  const paymentType = resolvePaymentType(transaction.metadata);
  const status = resolvePaymentStatus(transaction.status);

  let customerData = transaction.customer_id
    ? await fetchCustomerData(transaction.customer_id, storeId, transaction.customer_name, transaction.customer_email)
    : null;

  if (!customerData) {
    customerData = {
      name: transaction.customer_name || 'N/A',
      email: transaction.customer_email || undefined,
    };
  }

  const orderData = transaction.order_id
    ? await fetchOrderNumber(transaction.order_id, storeId, transaction.id)
    : null;

  return {
    id: transaction.id,
    store_id: transaction.store_id,
    order_id: transaction.order_id || undefined,
    customer_id: transaction.customer_id || undefined,
    payment_method: transaction.moneroo_payment_method || 'moneroo',
    amount: Number(transaction.amount || 0),
    currency: transaction.currency || 'XOF',
    status,
    payment_type: paymentType,
    transaction_id: transaction.moneroo_transaction_id || transaction.id,
    notes: transaction.error_message || undefined,
    customers: customerData,
    orders: orderData || undefined,
    created_at: transaction.created_at,
    updated_at: transaction.updated_at,
  };
}

// ---- Fetch & merge payments + transactions ----

const STATUS_MAP: Record<PaymentStatus, string[]> = {
  pending: ['pending', 'processing'],
  completed: ['completed', 'success'],
  failed: ['failed', 'error'],
  refunded: ['refunded'],
  held: ['held'],
  released: ['released'],
  disputed: ['disputed'],
};

export async function fetchAndMergePayments(
  storeId: string,
  filters?: PaymentFilters,
  page = 1,
  pageSize = 50
): Promise<{ payments: AdvancedPayment[]; totalCount: number }> {
  // 1. Build payments query
  let paymentsQuery = supabase
    .from('payments')
    .select(`*, customers (name, email), orders (order_number)`)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (filters?.status) paymentsQuery = paymentsQuery.eq('status', filters.status);
  if (filters?.payment_type) paymentsQuery = paymentsQuery.eq('payment_type', filters.payment_type);
  if (filters?.payment_method) paymentsQuery = paymentsQuery.eq('payment_method', filters.payment_method);
  if (filters?.is_held !== undefined) paymentsQuery = paymentsQuery.eq('is_held', filters.is_held);
  if (filters?.date_from) paymentsQuery = paymentsQuery.gte('created_at', filters.date_from);
  if (filters?.date_to) paymentsQuery = paymentsQuery.lte('created_at', filters.date_to);
  if (filters?.search) {
    paymentsQuery = paymentsQuery.or(`transaction_id.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  }

  // 2. Build transactions query
  let transactionsQuery = supabase
    .from('transactions')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    const statuses = STATUS_MAP[filters.status] || [filters.status];
    transactionsQuery = transactionsQuery.in('status', statuses);
  }
  if (filters?.date_from) transactionsQuery = transactionsQuery.gte('created_at', filters.date_from);
  if (filters?.date_to) transactionsQuery = transactionsQuery.lte('created_at', filters.date_to);
  if (filters?.search) {
    transactionsQuery = transactionsQuery.or(
      `moneroo_transaction_id.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,error_message.ilike.%${filters.search}%`
    );
  }

  const [{ data: paymentsData, error: pErr }, { data: transactionsData, error: tErr }] =
    await Promise.all([paymentsQuery, transactionsQuery]);

  if (pErr) logger.error('Error fetching payments:', pErr);
  if (tErr) logger.error('Error fetching transactions:', tErr);

  // 3. Normalize transactions
  const normalizedTransactions = await Promise.all(
    (transactionsData || []).map(t => normalizeTransaction(t, storeId))
  );

  // 4. Merge, deduplicate by order_id
  const allPayments: AdvancedPayment[] = [];
  const processedOrderIds = new Set<string>();

  (paymentsData || []).forEach(payment => {
    const normalized: AdvancedPayment = {
      ...payment,
      order_id: payment.order_id || undefined,
      customer_id: payment.customer_id || undefined,
      transaction_id: payment.transaction_id || undefined,
      notes: payment.notes || undefined,
      status: payment.status as PaymentStatus,
      payment_type: (payment.payment_type as PaymentType) || 'full',
      percentage_amount: payment.percentage_amount ?? undefined,
      percentage_rate: payment.percentage_rate ?? undefined,
      remaining_amount: payment.remaining_amount ?? undefined,
      is_held: payment.is_held ?? undefined,
    } as AdvancedPayment;
    allPayments.push(normalized);
    if (normalized.order_id) processedOrderIds.add(normalized.order_id);
  });

  normalizedTransactions.forEach(t => {
    if (!t.order_id || !processedOrderIds.has(t.order_id)) {
      allPayments.push(t);
      if (t.order_id) processedOrderIds.add(t.order_id);
    }
  });

  allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalCount = allPayments.length;
  const from = (page - 1) * pageSize;
  return { payments: allPayments.slice(from, from + pageSize), totalCount };
}

// ---- Fetch stats ----

function extractCount(result: PromiseSettledResult<{ count: number | null }>): number {
  return result.status === 'fulfilled' && result.value.count !== null ? result.value.count : 0;
}

function extractAmounts(result: PromiseSettledResult<{ data: Array<{ amount: number | null }> | null }>): number[] {
  if (result.status !== 'fulfilled' || !result.value.data) return [];
  return result.value.data
    .map(r => r.amount)
    .filter((a): a is number => a !== null && a !== undefined);
}

export async function fetchPaymentStats(storeId: string): Promise<PaymentStats> {
  const results = await Promise.allSettled([
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'completed'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'pending'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'failed'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_held', true),
    supabase.from('payments').select('amount').eq('store_id', storeId).eq('status', 'completed'),
    supabase.from('payments').select('amount').eq('store_id', storeId).eq('is_held', true),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('payment_type', 'percentage'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('payment_type', 'delivery_secured'),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('store_id', storeId).in('status', ['completed', 'success']),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('store_id', storeId).in('status', ['pending', 'processing']),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('store_id', storeId).in('status', ['failed', 'error']),
    supabase.from('transactions').select('amount').eq('store_id', storeId).in('status', ['completed', 'success']),
  ]);

  const [pTotal, pCompleted, pPending, pFailed, pHeld, pAmounts, pHeldAmounts, pPercentage, pSecured,
    tTotal, tCompleted, tPending, tFailed, tAmounts] = results;

  const totalPayments = extractCount(pTotal as any) + extractCount(tTotal as any);
  const completedPayments = extractCount(pCompleted as any) + extractCount(tCompleted as any);
  const pendingPayments = extractCount(pPending as any) + extractCount(tPending as any);
  const failedPayments = extractCount(pFailed as any) + extractCount(tFailed as any);
  const heldPayments = extractCount(pHeld as any);

  const allAmounts = [...extractAmounts(pAmounts as any), ...extractAmounts(tAmounts as any)];
  const totalRevenue = allAmounts.reduce((sum, a) => sum + parseFloat(a.toString()), 0);
  const averagePayment = allAmounts.length > 0 ? totalRevenue / allAmounts.length : 0;
  const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

  const heldAmounts = extractAmounts(pHeldAmounts as any);
  const heldRevenue = heldAmounts.reduce((sum, a) => sum + parseFloat(a.toString()), 0);

  return {
    total_payments: totalPayments,
    completed_payments: completedPayments,
    pending_payments: pendingPayments,
    failed_payments: failedPayments,
    held_payments: heldPayments,
    total_revenue: totalRevenue,
    held_revenue: heldRevenue,
    average_payment: averagePayment,
    success_rate: successRate,
    percentage_payments: extractCount(pPercentage as any),
    secured_payments: extractCount(pSecured as any),
  };
}
