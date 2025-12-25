/**
 * Service Availability Hooks
 * Date: 28 octobre 2025
 * 
 * React Query hooks for managing service availability and staff
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AvailabilitySlot {
  id: string;
  service_product_id: string;
  day_of_week: number; // 0-6
  start_time: string;
  end_time: string;
  staff_member_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  service_product_id: string;
  store_id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  total_bookings: number;
  total_completed_bookings: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get availability slots for a service
 */
export const useAvailabilitySlots = (serviceProductId?: string) => {
  return useQuery({
    queryKey: ['availability-slots', serviceProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_availability_slots')
        .select(`
          *,
          staff:service_staff_members(*)
        `)
        .eq('service_product_id', serviceProductId!)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as AvailabilitySlot[];
    },
    enabled: !!serviceProductId,
  });
};

/**
 * Get slots for a specific day
 */
export const useSlotsByDay = (serviceProductId: string, dayOfWeek: number) => {
  return useQuery({
    queryKey: ['slots-by-day', serviceProductId, dayOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_availability_slots')
        .select('*')
        .eq('service_product_id', serviceProductId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as AvailabilitySlot[];
    },
    enabled: !!serviceProductId && dayOfWeek !== undefined,
  });
};

/**
 * Create an availability slot
 */
export const useCreateAvailabilitySlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<AvailabilitySlot>) => {
      const { data: result, error } = await supabase
        .from('service_availability_slots')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-slots'] });
    },
  });
};

/**
 * Update an availability slot
 */
export const useUpdateAvailabilitySlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AvailabilitySlot> }) => {
      const { data: result, error } = await supabase
        .from('service_availability_slots')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-slots'] });
    },
  });
};

/**
 * Delete an availability slot
 */
export const useDeleteAvailabilitySlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_availability_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-slots'] });
    },
  });
};

/**
 * Get staff members for a service
 */
export const useStaffMembers = (serviceProductId?: string) => {
  return useQuery({
    queryKey: ['staff-members', serviceProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_staff_members')
        .select('*')
        .eq('service_product_id', serviceProductId!)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as StaffMember[];
    },
    enabled: !!serviceProductId,
  });
};

/**
 * Create a staff member
 */
export const useCreateStaffMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<StaffMember>) => {
      const { data: result, error } = await supabase
        .from('service_staff_members')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
    },
  });
};

/**
 * Update a staff member
 */
export const useUpdateStaffMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffMember> }) => {
      const { data: result, error } = await supabase
        .from('service_staff_members')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
    },
  });
};

/**
 * Delete a staff member
 */
export const useDeleteStaffMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_staff_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
    },
  });
};

/**
 * Check if a time slot is available
 */
export const useCheckSlotAvailability = (
  serviceProductId: string,
  date: string,
  time: string
) => {
  return useQuery({
    queryKey: ['slot-availability', serviceProductId, date, time],
    queryFn: async () => {
      // Get day of week from date
      const dayOfWeek = new Date(date).getDay();

      // Check if there's an availability slot for this day/time
      const { data: slots, error: slotsError } = await supabase
        .from('service_availability_slots')
        .select('*')
        .eq('service_product_id', serviceProductId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (slotsError) throw slotsError;

      const matchingSlot = slots?.find((slot) => {
        return time >= slot.start_time && time < slot.end_time;
      });

      if (!matchingSlot) {
        return { available: false, reason: 'No availability for this time' };
      }

      // Check existing bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('service_bookings')
        .select('participants_count')
        .eq('product_id', serviceProductId)
        .eq('booking_date', date)
        .eq('booking_time', time)
        .in('status', ['pending', 'confirmed']);

      if (bookingsError) throw bookingsError;

      const totalParticipants = bookings?.reduce(
        (sum, b) => sum + (b.participants_count || 1),
        0
      ) || 0;

      // Get max participants from service
      const { data: service, error: serviceError } = await supabase
        .from('service_products')
        .select('max_participants')
        .eq('id', serviceProductId)
        .single();

      if (serviceError) throw serviceError;

      const available = totalParticipants < (service?.max_participants || 1);

      return {
        available,
        reason: available ? null : 'Slot is fully booked',
        availableSpots: (service?.max_participants || 1) - totalParticipants,
      };
    },
    enabled: !!serviceProductId && !!date && !!time,
  });
};

/**
 * Get available time slots for a date
 */
export const useAvailableTimeSlots = (serviceProductId: string, date: string) => {
  return useQuery({
    queryKey: ['available-time-slots', serviceProductId, date],
    queryFn: async () => {
      const dayOfWeek = new Date(date).getDay();

      // Get availability slots for this day
      const { data: slots, error: slotsError } = await supabase
        .from('service_availability_slots')
        .select('*')
        .eq('service_product_id', serviceProductId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (slotsError) throw slotsError;
      if (!slots || slots.length === 0) return [];

      // Get service info
      const { data: service, error: serviceError } = await supabase
        .from('service_products')
        .select('duration_minutes, max_participants')
        .eq('id', serviceProductId)
        .single();

      if (serviceError) throw serviceError;

      // Get existing bookings for this date
      const { data: bookings, error: bookingsError } = await supabase
        .from('service_bookings')
        .select('booking_time, participants_count')
        .eq('product_id', serviceProductId)
        .eq('booking_date', date)
        .in('status', ['pending', 'confirmed']);

      if (bookingsError) throw bookingsError;

      // Type pour les créneaux horaires disponibles
      interface AvailableTimeSlot {
        time: string;
        availableSpots: number;
        maxParticipants: number;
      }

      // Generate time slots
      const duration = service?.duration_minutes || 60;
      const maxParticipants = service?.max_participants || 1;
      const availableSlots: AvailableTimeSlot[] = [];

      slots.forEach((slot) => {
        let currentTime = slot.start_time;
        const endTime = slot.end_time;

        while (currentTime < endTime) {
          // Count participants for this time
          const participantsAtThisTime = bookings
            ?.filter((b) => b.booking_time === currentTime)
            .reduce((sum, b) => sum + (b.participants_count || 1), 0) || 0;

          const availableSpots = maxParticipants - participantsAtThisTime;

          if (availableSpots > 0) {
            availableSlots.push({
              time: currentTime,
              availableSpots,
              maxParticipants,
            });
          }

          // Increment time by duration
          const [hours, minutes] = currentTime.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes + duration;
          const newHours = Math.floor(totalMinutes / 60);
          const newMinutes = totalMinutes % 60;
          currentTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`;
        }
      });

      return availableSlots;
    },
    enabled: !!serviceProductId && !!date,
  });
};

