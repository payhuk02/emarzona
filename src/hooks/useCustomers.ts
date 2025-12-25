import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

/**
 * Hook pour récupérer les clients avec pagination serveur
 */
export const useCustomers = (
  storeId?: string,
  options?: {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    sortBy?: 'name' | 'created_at' | 'total_orders' | 'total_spent';
    sortOrder?: 'asc' | 'desc';
  }
) => {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['customers', storeId, page, pageSize, options?.searchQuery, options?.sortBy, options?.sortOrder],
    queryFn: async (): Promise<{ data: Customer[]; count: number }> => {
      if (!storeId) {
        return { data: [], count: 0 };
      }

      try {
        let query = supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .eq('store_id', storeId);

        // Apply search query filter
        if (options?.searchQuery) {
          query = query.or(`name.ilike.%${options.searchQuery}%,email.ilike.%${options.searchQuery}%,phone.ilike.%${options.searchQuery}%`);
        }

        // Apply sorting
        const sortBy = options?.sortBy || 'created_at';
        const sortOrder = options?.sortOrder || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Apply pagination
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
          logger.error('Error fetching customers', { error, storeId, page, pageSize });
          throw error;
        }

        return { data: (data as Customer[]) || [], count: count || 0 };
      } catch (error: any) {
        logger.error('Error in useCustomers', { error, storeId });
        throw error;
      }
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook legacy pour compatibilité - retourne juste les données
 * @deprecated Utiliser useCustomers avec pagination
 */
export const useCustomersLegacy = (storeId?: string) => {
  const { data, isLoading, refetch } = useCustomers(storeId, { page: 1, pageSize: 1000 });
  const queryClient = useQueryClient();

  return {
    customers: data?.data || [],
    loading: isLoading,
    refetch: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
    },
    setCustomers: (customers: Customer[]) => {
      // Pour compatibilité avec realtime updates
      queryClient.setQueryData(['customers', storeId, 1, 1000], { data: customers, count: customers.length });
    },
  };
};
