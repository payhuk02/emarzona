/**
 * Service Products Hooks
 * Date: 28 octobre 2025
 * 
 * React Query hooks for managing service products
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ServiceProduct {
  id: string;
  product_id: string;
  service_type: 'appointment' | 'class' | 'event' | 'consultation' | 'other';
  duration_minutes: number;
  location_type: 'on_site' | 'online' | 'customer_location' | 'flexible';
  location_address?: string;
  meeting_url?: string;
  timezone: string;
  requires_staff: boolean;
  max_participants: number;
  pricing_type: 'fixed' | 'hourly' | 'per_participant';
  deposit_required: boolean;
  deposit_amount?: number;
  deposit_type?: 'fixed' | 'percentage';
  allow_booking_cancellation: boolean;
  cancellation_deadline_hours: number;
  require_approval: boolean;
  buffer_time_before: number;
  buffer_time_after: number;
  max_bookings_per_day?: number;
  advance_booking_days: number;
  total_bookings: number;
  total_completed_bookings: number;
  total_cancelled_bookings: number;
  total_revenue: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
  product?: any;
}

/**
 * Get all service products for a store
 */
export const useServiceProducts = (storeId?: string) => {
  return useQuery({
    queryKey: ['service-products', storeId],
    queryFn: async () => {
      let query = supabase
        .from('service_products')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('product.store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ServiceProduct[];
    },
    enabled: !!storeId,
  });
};

/**
 * Get a single service product
 */
export const useServiceProduct = (productId?: string) => {
  return useQuery({
    queryKey: ['service-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_products')
        .select(`
          *,
          product:products(*),
          availability_slots:service_availability_slots(*),
          staff:service_staff_members(*),
          resources:service_resources(*)
        `)
        .eq('product_id', productId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
};

/**
 * Create a new service product
 */
export const useCreateServiceProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ServiceProduct>) => {
      const { data: result, error } = await supabase
        .from('service_products')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-products'] });
    },
  });
};

/**
 * Update a service product
 */
export const useUpdateServiceProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceProduct> }) => {
      const { data: result, error } = await supabase
        .from('service_products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-products'] });
      queryClient.invalidateQueries({ queryKey: ['service-product', variables.id] });
    },
  });
};

/**
 * Delete a service product
 */
export const useDeleteServiceProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-products'] });
    },
  });
};

/**
 * Get service stats
 */
export const useServiceStats = (serviceProductId: string) => {
  return useQuery({
    queryKey: ['service-stats', serviceProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_products')
        .select('total_bookings, total_completed_bookings, total_cancelled_bookings, total_revenue, average_rating')
        .eq('id', serviceProductId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!serviceProductId,
  });
};

/**
 * Get popular services
 */
export const usePopularServices = (storeId: string, limit = 5) => {
  return useQuery({
    queryKey: ['popular-services', storeId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_products')
        .select(`
          *,
          product:products(*)
        `)
        .eq('product.store_id', storeId)
        .order('total_bookings', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ServiceProduct[];
    },
    enabled: !!storeId,
  });
};

/**
 * Get top rated services
 */
export const useTopRatedServices = (storeId: string, limit = 5) => {
  return useQuery({
    queryKey: ['top-rated-services', storeId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_products')
        .select(`
          *,
          product:products(*)
        `)
        .eq('product.store_id', storeId)
        .gte('average_rating', 4.0)
        .order('average_rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ServiceProduct[];
    },
    enabled: !!storeId,
  });
};

