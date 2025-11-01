import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

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
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    if (!storeId) {
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error: queryError, count } = await supabase
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

      if (queryError) {
        // Ne pas afficher de toast si c'est juste que la table n'existe pas encore
        if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
          logger.warn('Table orders n\'existe pas encore', {
            code: queryError.code,
            message: queryError.message,
          });
          setOrders([]);
          setTotalCount(0);
          return;
        }
        throw queryError;
      }
      
      setOrders(data || []);
      setTotalCount(count || 0);
      setError(null);
    } catch (err: any) {
      logger.error('Erreur lors de la récupération des commandes', {
        error: err.message,
        code: err.code,
        filters: { storeId, status, paymentStatus },
      });
      setError(err);
      // Afficher un toast uniquement pour les erreurs critiques
      if (err.message && !err.message.includes('does not exist')) {
        toast({
          title: "Erreur",
          description: err.message || "Impossible de charger les commandes",
          variant: "destructive",
        });
      }
      // Toujours retourner un tableau vide en cas d'erreur pour éviter de casser l'UI
      setOrders([]);
      setTotalCount(0);
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
    error,
    refetch: fetchOrders 
  };
};
