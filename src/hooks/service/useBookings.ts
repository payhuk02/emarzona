/**
 * Service Bookings Hooks
 * Date: 28 octobre 2025
 * 
 * React Query hooks for managing service bookings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceBooking {
  id: string;
  product_id: string;
  customer_id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  total_price: number;
  staff_member_id?: string;
  participants_count: number;
  deposit_paid: number;
  cancellation_reason?: string;
  meeting_url?: string;
  customer_notes?: string;
  internal_notes?: string;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all bookings for a service
 */
export const useServiceBookings = (productId?: string) => {
  return useQuery({
    queryKey: ['service-bookings', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          product:products(*),
          customer:customers(*),
          staff:service_staff_members(*)
        `)
        .eq('product_id', productId!)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;
      return data as ServiceBooking[];
    },
    enabled: !!productId,
  });
};

/**
 * Get bookings for a specific date
 */
export const useBookingsByDate = (productId: string, date: string) => {
  return useQuery({
    queryKey: ['service-bookings-date', productId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          customer:customers(*),
          staff:service_staff_members(*)
        `)
        .eq('product_id', productId)
        .eq('booking_date', date)
        .in('status', ['pending', 'confirmed'])
        .order('booking_time', { ascending: true });

      if (error) throw error;
      return data as ServiceBooking[];
    },
    enabled: !!productId && !!date,
  });
};

/**
 * Get user's bookings
 */
export const useMyBookings = () => {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          product:products(*),
          service:service_products(*),
          staff:service_staff_members(*)
        `)
        .eq('customer.email', user.email)
        .order('booking_date', { ascending: true });

      if (error) throw error;
      return data as ServiceBooking[];
    },
  });
};

/**
 * Create a new booking
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ServiceBooking>) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
};

/**
 * Update a booking
 */
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceBooking> }) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
};

/**
 * Cancel a booking
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
};

/**
 * Confirm a booking
 */
export const useConfirmBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .update({ status: 'confirmed' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
    },
  });
};

/**
 * Complete a booking
 */
export const useCompleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .update({ status: 'completed' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['service-stats'] });
    },
  });
};

/**
 * Mark as no-show
 */
export const useMarkNoShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('service_bookings')
        .update({ status: 'no_show' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
    },
  });
};

/**
 * Get upcoming bookings
 */
export const useUpcomingBookings = (productId?: string) => {
  return useQuery({
    queryKey: ['upcoming-bookings', productId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('service_bookings')
        .select(`
          *,
          product:products(*),
          customer:customers(*),
          staff:service_staff_members(*)
        `)
        .gte('booking_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(10);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ServiceBooking[];
    },
  });
};

/**
 * Get booking statistics
 */
export const useBookingStats = (productId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['booking-stats', productId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('service_bookings')
        .select('status, total_price')
        .eq('product_id', productId);

      if (startDate) {
        query = query.gte('booking_date', startDate);
      }
      if (endDate) {
        query = query.lte('booking_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(b => b.status === 'pending').length,
        confirmed: data.filter(b => b.status === 'confirmed').length,
        completed: data.filter(b => b.status === 'completed').length,
        cancelled: data.filter(b => b.status === 'cancelled').length,
        noShow: data.filter(b => b.status === 'no_show').length,
        revenue: data
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.total_price || 0), 0),
      };

      return stats;
    },
    enabled: !!productId,
  });
};

