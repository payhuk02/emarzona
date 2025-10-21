import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';

export interface Transaction {
  id: string;
  store_id: string;
  customer_id: string | null;
  product_id: string | null;
  order_id: string | null;
  payment_id: string | null;
  moneroo_transaction_id: string | null;
  moneroo_checkout_url: string | null;
  moneroo_payment_method: string | null;
  amount: number;
  currency: string;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  metadata: any;
  moneroo_response: any;
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
        .from("transactions")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      logger.error("Error fetching transactions:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, status, toast]);

  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'retry_count'>) => {
    try {
      const { data, error} = await supabase
        .from("transactions")
        .insert([transactionData])
        .select()
        .limit(1);

      if (error) throw error;
      
      await fetchTransactions();
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .limit(1);

      if (error) throw error;
      
      await fetchTransactions();
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: storeId ? `store_id=eq.${storeId}` : undefined,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  return { 
    transactions, 
    loading, 
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction
  };
};
