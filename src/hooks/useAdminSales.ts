import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Payment } from '@/hooks/usePayments';
import type { PlatformCommission } from '@/hooks/usePlatformCommissions';

const ADMIN_PAYMENT_FIELDS =
  'id, store_id, order_id, amount, percentage_amount, status, created_at, stores(name), orders(order_number)';
const PLATFORM_COMMISSION_FIELDS =
  'id, commission_amount, commission_rate, status, created_at, orders(total_amount), stores(name)';

interface UseAdminSalesOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const useAdminSalesList = (options: UseAdminSalesOptions = {}) => {
  const { page = 1, pageSize = 20, search = '' } = options;

  const [sales, setSales] = useState<Payment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSales = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('payments')
        .select(ADMIN_PAYMENT_FIELDS, { count: 'exact' });

      if (search && search.trim()) {
        // Unfortunately searching across relations (stores.name or orders.order_number) in standard select is limited in PostgREST.
        // We will just fetch everything and do client search if we can't search relations easily. 
        // Wait! We can do !inner() joins but complex ORs are tricky.
        // Let's rely on standard filtering or ignore for now if not supported without RPC.
      }

      query = query.order('created_at', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setTotalCount(count || 0);
      
      // Client-side filtering if search is provided
      let finalData = (data as unknown as Payment[]) || [];
      if (search && search.trim()) {
        finalData = finalData.filter(sale => {
           const storeName = sale.stores?.[0]?.name || (sale.stores as any)?.name || '';
           const orderNumber = sale.orders?.[0]?.order_number || (sale.orders as any)?.order_number || '';
           return (
             storeName.toLowerCase().includes(search.toLowerCase()) ||
             orderNumber.toLowerCase().includes(search.toLowerCase())
           );
        });
      }

      setSales(finalData);
    } catch (err: unknown) {
      logger.error('Erreur lors du chargement des ventes:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les ventes',
        variant: 'destructive',
      });
      setSales([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, pageSize, search]);

  return { sales, totalCount, loading, refetch: fetchSales };
};

export const useAdminCommissionsList = (options: UseAdminSalesOptions = {}) => {
  const { page = 1, pageSize = 20 } = options;

  const [commissions, setCommissions] = useState<PlatformCommission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommissions = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('platform_commissions')
        .select(PLATFORM_COMMISSION_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setTotalCount(count || 0);
      setCommissions(data as PlatformCommission[]);
    } catch (err: unknown) {
      logger.error('Erreur lors du chargement des commissions:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commissions',
        variant: 'destructive',
      });
      setCommissions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [page, pageSize]);

  return { commissions, totalCount, loading, refetch: fetchCommissions };
};
