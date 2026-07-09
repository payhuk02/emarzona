import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface StoreProfile {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  created_at: string;
  owner_name?: string;
  products_count?: number;
}

interface UseAdminStoresOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const useAdminStores = (options: UseAdminStoresOptions = {}) => {
  const { page = 1, pageSize = 20, search = '' } = options;

  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStores = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('stores')
        .select('id,name,slug,user_id,created_at', { count: 'exact' });

      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      query = query.order('created_at', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: storesData, error: storesError, count } = await query;

      if (storesError) throw storesError;

      setTotalCount(count || 0);

      if (!storesData || storesData.length === 0) {
        setStores([]);
        return;
      }

      const userIds = [...new Set(storesData.map(s => s.user_id))];
      const storeIds = storesData.map(s => s.id);

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = new Map<string, string>();
      profilesData?.forEach(p => {
        if (p.user_id && p.display_name) profileMap.set(p.user_id, p.display_name);
      });

      // Fetch product counts using RPC if available, or just fetch all products for these stores
      // Since we don't have RPC for this specifically, we'll fetch products grouping them manually
      // We only select 'id, store_id' to minimize data
      const { data: productsData } = await supabase
        .from('products')
        .select('id, store_id')
        .in('store_id', storeIds);

      const productCountMap = new Map<string, number>();
      productsData?.forEach(p => {
        if (p.store_id) {
          productCountMap.set(p.store_id, (productCountMap.get(p.store_id) || 0) + 1);
        }
      });

      const fullStores = storesData.map(store => ({
        ...store,
        owner_name: profileMap.get(store.user_id) || 'Inconnu',
        products_count: productCountMap.get(store.id) || 0,
      }));

      setStores(fullStores);
    } catch (err: unknown) {
      logger.error('Erreur lors du chargement des boutiques:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les boutiques',
        variant: 'destructive',
      });
      setStores([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [page, pageSize, search]);

  return { stores, totalCount, loading, refetch: fetchStores };
};
