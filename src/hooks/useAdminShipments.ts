import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface UseAdminShipmentsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export const useAdminShipmentsList = (options: UseAdminShipmentsOptions = {}) => {
  const { page = 1, pageSize = 20, search = '', status = 'all' } = options;

  const [shipments, setShipments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchShipments = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('shipments')
        .select(`
          *,
          order:orders(
            order_number,
            customers:fk_orders_customer(full_name, name, email)
          ),
          store:stores(name)
        `, { count: 'exact' });

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      
      // Basic text search could be added via RPC, but for relations it is hard. 
      // We will rely on simple pagination here and client side filter after fetching more rows if needed, 
      // but standard approach is pagination on the primary table.

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
        finalData = finalData.filter((shipment: any) => {
          return shipment.tracking_number?.toLowerCase().includes(queryText) ||
            shipment.order?.order_number?.toLowerCase().includes(queryText) ||
            shipment.store?.name?.toLowerCase().includes(queryText);
        });
      }

      setShipments(finalData);
    } catch (err: unknown) {
      logger.error('Erreur lors du chargement des expéditions:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les expéditions',
        variant: 'destructive',
      });
      setShipments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [page, pageSize, search, status]);

  return { shipments, totalCount, loading, refetch: fetchShipments };
};
