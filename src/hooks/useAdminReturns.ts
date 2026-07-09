import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface UseAdminReturnsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  storeId?: string; // Optional, if we want to filter by store
}

export const useAdminReturnsList = (options: UseAdminReturnsOptions = {}) => {
  const { page = 1, pageSize = 20, search = '', status = 'all', storeId } = options;

  const [returns, setReturns] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReturns = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('product_returns')
        .select(`
          *,
          orders (
            order_number,
            customer_id
          ),
          products (
            id,
            name,
            image_url
          )
        `, { count: 'exact' });

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      
      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      query = query.order('created_at', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setTotalCount(count || 0);

      // Client side filtering for search
      let finalData = data || [];
      if (search && search.trim()) {
        const queryText = search.toLowerCase();
        finalData = finalData.filter((r: any) => {
          return r.return_number?.toLowerCase().includes(queryText) ||
            r.products?.name?.toLowerCase().includes(queryText);
        });
      }

      setReturns(finalData);
    } catch (err: unknown) {
      logger.error('Erreur lors du chargement des retours:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les retours',
        variant: 'destructive',
      });
      setReturns([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, pageSize, search, status, storeId]);

  return { returns, totalCount, loading, refetch: fetchReturns };
};
