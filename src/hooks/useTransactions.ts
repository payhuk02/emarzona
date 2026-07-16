import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVisibilityAwarePolling } from '@/hooks/useVisibilityAwarePolling';
import { logger } from '@/lib/logger';

const TRANSACTION_FIELDS =
  'id, store_id, customer_id, product_id, order_id, payment_id, geniuspay_transaction_id, geniuspay_checkout_url, geniuspay_payment_method, amount, currency, status, customer_email, customer_name, customer_phone, metadata, geniuspay_response, created_at, updated_at, completed_at, failed_at, error_message, retry_count';

export interface Transaction {
  id: string;
  store_id: string;
  customer_id: string | null;
  product_id: string | null;
  order_id: string | null;
  payment_id: string | null;
  geniuspay_transaction_id: string | null;
  geniuspay_checkout_url: string | null;
  geniuspay_payment_method: string | null;
  amount: number;
  currency: string;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  metadata: Record<string, unknown> | null;
  geniuspay_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  retry_count: number;
}

export const useTransactions = (storeId?: string, status?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('transactions')
        .select(TRANSACTION_FIELDS)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (_error: unknown) {
      const msg =
        _error instanceof Error ? _error.message : 'Impossible de charger les transactions';
      logger.error('Error fetching transactions:', _error);
      toast({
        title: 'Erreur',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, status, toast]);

  const createTransaction = async (
    transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'retry_count'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .limit(1);

      if (error) throw error;

      await fetchTransactions();
      return data && data.length > 0 ? data[0] : null;
    } catch (_error: unknown) {
      const msg = _error instanceof Error ? _error.message : 'Erreur';
      toast({
        title: 'Erreur',
        description: msg,
        variant: 'destructive',
      });
      throw _error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .limit(1);

      if (error) throw error;

      await fetchTransactions();
      return data && data.length > 0 ? data[0] : null;
    } catch (_error: unknown) {
      const msg = _error instanceof Error ? _error.message : 'Erreur';
      toast({
        title: 'Erreur',
        description: msg,
        variant: 'destructive',
      });
      throw _error;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useVisibilityAwarePolling(fetchTransactions, 90_000, true);

  return {
    transactions,
    loading,
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction,
  };
};
