/**
 * LOT 2 Disk I/O: enrichissement customers/orders en batch (.in)
 * au lieu de 1+N SELECT par transaction/payment.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const TRANSACTION_FIELDS =
  'id, store_id, order_id, customer_id, amount, currency, status, customer_email, customer_name, customer_phone, metadata, geniuspay_payment_method, geniuspay_transaction_id, error_message, created_at, updated_at';
const PAYMENT_FIELDS =
  'id, store_id, order_id, customer_id, payment_method, amount, currency, status, transaction_id, notes, created_at, updated_at';

/** Cap list page — avoids unbounded scans on large stores. */
const PAYMENTS_PAGE_CAP = 300;

type ShippingAddress = {
  full_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  state?: string;
} | null;

type CustomerRow = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
};

export interface Payment {
  id: string;
  store_id: string;
  order_id: string | null;
  customer_id: string | null;
  payment_method: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
  orders?: {
    order_number: string;
  } | null;
  transaction?: {
    customer_email: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    metadata: Record<string, unknown> | null;
    shipping_address?: {
      full_name?: string;
      email?: string;
      phone?: string;
      address_line1?: string;
      address_line2?: string;
      city?: string;
      postal_code?: string;
      country?: string;
      state?: string;
    } | null;
  } | null;
}

function parseShippingAddress(metadata: unknown): ShippingAddress {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return ((metadata as Record<string, unknown>).shipping_address as ShippingAddress) || null;
  }
  return null;
}

function customerFromRow(
  row: CustomerRow | undefined,
  fallback: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    shipping?: ShippingAddress;
  }
): Payment['customers'] {
  if (row) {
    return {
      name: row.name || row.full_name || fallback.name || 'N/A',
      email: row.email ?? fallback.email ?? null,
      phone: row.phone ?? fallback.phone ?? null,
      address: row.address || null,
      city: row.city || fallback.shipping?.city || null,
      postal_code: row.postal_code || fallback.shipping?.postal_code || null,
      country: row.country || fallback.shipping?.country || null,
    };
  }
  return {
    name: fallback.name || 'N/A',
    email: fallback.email ?? null,
    phone: fallback.phone ?? null,
    address: fallback.shipping?.address_line1 || null,
    city: fallback.shipping?.city || null,
    postal_code: fallback.shipping?.postal_code || null,
    country: fallback.shipping?.country || null,
  };
}

async function fetchCustomersByIds(
  storeId: string,
  customerIds: string[]
): Promise<Map<string, CustomerRow>> {
  const map = new Map<string, CustomerRow>();
  if (customerIds.length === 0) return map;

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, email, full_name, phone, address, city, country, postal_code')
    .eq('store_id', storeId)
    .in('id', customerIds);

  if (error) {
    logger.warn('Batch customer fetch failed', { error, storeId, count: customerIds.length });
    return map;
  }

  for (const row of data || []) {
    map.set(row.id, row as CustomerRow);
  }
  return map;
}

async function fetchOrdersByIds(
  storeId: string,
  orderIds: string[]
): Promise<Map<string, OrderRow>> {
  const map = new Map<string, OrderRow>();
  if (orderIds.length === 0) return map;

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('store_id', storeId)
    .in('id', orderIds);

  if (error) {
    logger.warn('Batch order fetch failed', { error, storeId, count: orderIds.length });
    return map;
  }

  for (const row of data || []) {
    map.set(row.id, row as OrderRow);
  }
  return map;
}

export const usePayments = (
  storeId?: string,
  searchTerm?: string,
  statusFilter?: string,
  methodFilter?: string
) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayments = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      let transactionsQuery = supabase
        .from('transactions')
        .select(TRANSACTION_FIELDS)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(PAYMENTS_PAGE_CAP);

      if (statusFilter) {
        transactionsQuery = transactionsQuery.eq('status', statusFilter);
      }

      let paymentsQuery = supabase
        .from('payments')
        .select(PAYMENT_FIELDS)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(PAYMENTS_PAGE_CAP);

      if (searchTerm) {
        paymentsQuery = paymentsQuery.or(
          `transaction_id.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
        );
      }

      if (statusFilter) {
        paymentsQuery = paymentsQuery.eq('status', statusFilter);
      }

      if (methodFilter) {
        paymentsQuery = paymentsQuery.eq('payment_method', methodFilter);
      }

      const [
        { data: transactions, error: transactionsError },
        { data: paymentsData, error: paymentsError },
      ] = await Promise.all([transactionsQuery, paymentsQuery]);

      if (transactionsError) {
        logger.error('Error fetching transactions:', transactionsError);
      }
      if (paymentsError) {
        logger.error('Error fetching payments:', paymentsError);
      }

      const txRows = (transactions || []).filter(t => Boolean(t.store_id));
      const paymentRows = (paymentsData || []).filter(p => Boolean(p.store_id));

      const customerIds = [
        ...new Set(
          [...txRows, ...paymentRows]
            .map(r => r.customer_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        ),
      ];
      const orderIds = [
        ...new Set(
          [...txRows, ...paymentRows]
            .map(r => r.order_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        ),
      ];

      const [customerMap, orderMap] = await Promise.all([
        fetchCustomersByIds(storeId, customerIds),
        fetchOrdersByIds(storeId, orderIds),
      ]);

      const transactionsAsPayments: Payment[] = txRows.map(transaction => {
        const shippingAddress = parseShippingAddress(transaction.metadata);
        const customer = customerFromRow(
          transaction.customer_id ? customerMap.get(transaction.customer_id) : undefined,
          {
            name: transaction.customer_name,
            email: transaction.customer_email,
            phone: transaction.customer_phone,
            shipping: shippingAddress,
          }
        );

        const order = transaction.order_id ? orderMap.get(transaction.order_id) : undefined;

        return {
          id: transaction.id,
          store_id: transaction.store_id as string,
          order_id: transaction.order_id,
          customer_id: transaction.customer_id,
          payment_method:
            (transaction as { geniuspay_payment_method?: string | null })
              .geniuspay_payment_method || 'geniuspay',
          amount: Number(transaction.amount || 0),
          currency: transaction.currency || 'XOF',
          status: transaction.status || 'pending',
          transaction_id:
            (transaction as { geniuspay_transaction_id?: string | null })
              .geniuspay_transaction_id || transaction.id,
          notes: transaction.error_message || null,
          created_at: transaction.created_at || new Date().toISOString(),
          updated_at: transaction.updated_at || new Date().toISOString(),
          customers: customer,
          orders: order ? { order_number: order.order_number } : null,
          transaction: {
            customer_email: transaction.customer_email,
            customer_name: transaction.customer_name,
            customer_phone: transaction.customer_phone,
            metadata: transaction.metadata as Record<string, unknown> | null,
            shipping_address: shippingAddress,
          },
        };
      });

      const paymentsEnriched: Payment[] = [];
      for (const payment of paymentRows) {
        const existingTransaction = transactionsAsPayments.find(
          p => p.order_id === payment.order_id && p.transaction_id === payment.transaction_id
        );
        if (existingTransaction) continue;

        const customer = payment.customer_id
          ? customerFromRow(customerMap.get(payment.customer_id), {})
          : null;
        const order = payment.order_id ? orderMap.get(payment.order_id) : undefined;

        paymentsEnriched.push({
          id: payment.id,
          store_id: payment.store_id,
          order_id: payment.order_id,
          customer_id: payment.customer_id,
          payment_method: payment.payment_method,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          transaction_id: payment.transaction_id,
          notes: payment.notes,
          created_at: payment.created_at,
          updated_at: payment.updated_at,
          customers: customer,
          orders: order ? { order_number: order.order_number } : null,
          transaction: null,
        });
      }

      let allPayments = [...transactionsAsPayments, ...paymentsEnriched];

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        allPayments = allPayments.filter(payment => {
          return (
            payment.transaction_id?.toLowerCase().includes(searchLower) ||
            payment.customers?.name?.toLowerCase().includes(searchLower) ||
            payment.customers?.email?.toLowerCase().includes(searchLower) ||
            payment.customers?.phone?.toLowerCase().includes(searchLower) ||
            payment.orders?.order_number?.toLowerCase().includes(searchLower) ||
            payment.payment_method?.toLowerCase().includes(searchLower) ||
            payment.notes?.toLowerCase().includes(searchLower)
          );
        });
      }

      allPayments.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPayments(allPayments);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [storeId, searchTerm, statusFilter, methodFilter]);

  return { payments, loading, refetch: fetchPayments };
};
