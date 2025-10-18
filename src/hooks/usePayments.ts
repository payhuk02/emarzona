import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  } | null;
  orders?: {
    order_number: string;
  } | null;
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
      let query = supabase
        .from("payments")
        .select(`
          *,
          customers (name, email),
          orders (order_number)
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `transaction_id.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
        );
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (methodFilter) {
        query = query.eq("payment_method", methodFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
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
