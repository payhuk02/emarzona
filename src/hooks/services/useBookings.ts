/**
 * useBookings Hook
 * 
 * CRUD and availability management for service bookings
 * Date: 29 Octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Booking interface
 */
export interface Booking {
  id: string;
  service_id: string;
  customer_id: string;
  scheduled_date: Date | string;
  duration: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled' | 'refunded';
  customer_notes?: string;
  internal_notes?: string;
  amount_paid?: number;
  payment_method?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Availability slot
 */
export interface AvailabilitySlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  bookingId?: string;
}

/**
 * Fetch all bookings for a service
 */
export const useServiceBookings = (serviceId: string) => {
  return useQuery({
    queryKey: ['bookings', 'service', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('service_id', serviceId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!serviceId,
  });
};

/**
 * Fetch all bookings for a customer
 */
export const useCustomerBookings = (customerId: string) => {
  return useQuery({
    queryKey: ['bookings', 'customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, service:services(*)')
        .eq('customer_id', customerId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
};

/**
 * Fetch single booking
 */
export const useBooking = (bookingId: string) => {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, service:services(*), customer:customers(*)')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });
};

/**
 * Create a new booking
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newBooking: Partial<Booking>) => {
      // Check availability first
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('*')
        .eq('service_id', newBooking.service_id)
        .eq('scheduled_date', newBooking.scheduled_date)
        .neq('status', 'cancelled');

      if (conflicts && conflicts.length > 0) {
        throw new Error('Ce créneau n\'est plus disponible');
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'service', data.service_id] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'customer', data.customer_id] });
    },
  });
};

/**
 * Update a booking
 */
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Booking>;
    }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking', data.id] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'service', data.service_id] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'customer', data.customer_id] });
    },
  });
};

/**
 * Cancel a booking
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason?: string;
    }) => {
      const { data, error} = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          internal_notes: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking', data.id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

/**
 * Check availability for a specific date range
 */
export const useCheckAvailability = () => {
  return useMutation({
    mutationFn: async ({
      serviceId,
      startDate,
      endDate,
      duration,
    }: {
      serviceId: string;
      startDate: Date | string;
      endDate: Date | string;
      duration: number; // in minutes
    }) => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('service_id', serviceId)
        .gte('scheduled_date', new Date(startDate).toISOString())
        .lte('scheduled_date', new Date(endDate).toISOString())
        .neq('status', 'cancelled');

      if (error) throw error;

      // Generate all possible slots (every 30 minutes)
      const slots: AvailabilitySlot[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + 30)) {
        const slotStart = new Date(time);
        const slotEnd = new Date(time.getTime() + duration * 60000);

        // Check if this slot conflicts with any booking
        const hasConflict = bookings?.some((booking) => {
          const bookingStart = new Date(booking.scheduled_date);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        slots.push({
          start: slotStart,
          end: slotEnd,
          isAvailable: !hasConflict,
          bookingId: hasConflict
            ? bookings?.find((b) => {
                const bookingStart = new Date(b.scheduled_date);
                return slotStart >= bookingStart;
              })?.id
            : undefined,
        });
      }

      return slots;
    },
  });
};

export default useServiceBookings;

