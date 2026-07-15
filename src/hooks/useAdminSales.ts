import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Payment } from '@/hooks/usePayments';
import type { PlatformCommission } from '@/hooks/usePlatformCommissions';

const ADMIN_PAYMENT_FIELDS =
  'id, store_id, order_id, amount, commission_amount:percentage_amount, status, created_at, stores!payments_store_id_fkey(name), orders!payments_order_id_fkey(order_number)';
const PLATFORM_COMMISSION_FIELDS =
  'id, commission_amount, commission_rate, status, created_at, orders!platform_commissions_order_id_fkey(total_amount), stores!platform_commissions_store_id_fkey(name)';

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

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('payments')
        .select(ADMIN_PAYMENT_FIELDS, { count: 'exact' });

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
           // @ts-expect-error - Supabase types might not perfectly map the joined relation array vs object
           const storeName = sale.stores?.[0]?.name || sale.stores?.name || '';
           // @ts-expect-error - same here
           const orderNumber = sale.orders?.[0]?.order_number || sale.orders?.order_number || '';
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
  }, [page, pageSize, search, toast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return { sales, totalCount, loading, refetch: fetchSales };
};

export const useAdminCommissionsList = (options: UseAdminSalesOptions = {}) => {
  const { page = 1, pageSize = 20 } = options;

  const [commissions, setCommissions] = useState<PlatformCommission[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommissions = useCallback(async () => {
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
  }, [page, pageSize, toast]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  return { commissions, totalCount, loading, refetch: fetchCommissions };
};
