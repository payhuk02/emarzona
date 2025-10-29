/**
 * useServices Hook
 * 
 * CRUD operations for services with Supabase and React Query
 * Date: 29 Octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Service } from '@/components/service/ServicesList';

/**
 * Fetch all services for a store
 */
export const useServices = (storeId: string) => {
  return useQuery({
    queryKey: ['services', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!storeId,
  });
};

/**
 * Fetch single service by ID
 */
export const useService = (serviceId: string) => {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return data as Service;
    },
    enabled: !!serviceId,
  });
};

/**
 * Create a new service
 */
export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newService: Partial<Service> & { store_id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .insert([newService])
        .select()
        .single();

      if (error) throw error;
      return data as Service;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services', data.store_id] });
    },
  });
};

/**
 * Update a service
 */
export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      storeId,
    }: {
      id: string;
      updates: Partial<Service>;
      storeId: string;
    }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Service;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['service', variables.id] });
    },
  });
};

/**
 * Delete a service
 */
export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storeId }: { id: string; storeId: string }) => {
      const { error } = await supabase.from('services').delete().eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services', variables.storeId] });
    },
  });
};

/**
 * Bulk update services
 */
export const useBulkUpdateServices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      updates,
      storeId,
    }: {
      updates: { id: string; changes: Partial<Service> }[];
      storeId: string;
    }) => {
      const promises = updates.map(({ id, changes }) =>
        supabase.from('services').update(changes).eq('id', id).select()
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) throw errors[0].error;

      return results.map((r) => r.data![0]) as Service[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services', variables.storeId] });
    },
  });
};

export default useServices;

