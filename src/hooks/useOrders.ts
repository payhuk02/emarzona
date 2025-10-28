import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Order {
  id: string;
  store_id: string;
  customer_id: string | null;
  order_number: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Advanced payment fields
  payment_type?: 'full' | 'percentage' | 'delivery_secured' | null;
  percentage_paid?: number | null;
  remaining_amount?: number | null;
  delivery_status?: string | null;
  customers?: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export type SortColumn = 'order_number' | 'created_at' | 'total_amount' | 'status' | 'payment_status';
export type SortDirection = 'asc' | 'desc';

interface UseOrdersOptions {
  page?: number;
  pageSize?: number;
  sortBy?: SortColumn;
  sortDirection?: SortDirection;
}

export const useOrders = (storeId?: string, options: UseOrdersOptions = {}) => {
  const { page = 0, pageSize = 25, sortBy = 'created_at', sortDirection = 'desc' } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `, { count: 'exact' })
        .eq('store_id', storeId)
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(from, to);

      if (error) throw error;
      setOrders(data || []);
      setTotalCount(count || 0);
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
    fetchOrders();
  }, [storeId, page, pageSize, sortBy, sortDirection]);

  return { 
    orders, 
    loading, 
    totalCount,
    refetch: fetchOrders 
  };
};
