/**
 * Advanced Calendar Hook
 * Date: 27 Janvier 2025
 * 
 * Hook pour gérer le calendrier avancé avec vues multiples et multi-staff
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

// =====================================================
// TYPES
// =====================================================

export interface CalendarBooking {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  staffId?: string;
  staffName?: string;
  participants?: number;
  price?: number;
  notes?: string;
  meetingUrl?: string;
  resourceId?: string; // Pour timeline view
}

export interface CalendarStaff {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  color?: string; // Couleur pour timeline
}

export interface CalendarFilters {
  dateRange?: { start: Date; end: Date };
  staffIds?: string[];
  serviceIds?: string[];
  statuses?: string[];
  viewType?: 'month' | 'week' | 'day' | 'timeline';
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useCalendarBookings - Récupère les réservations pour le calendrier
 */
export const useCalendarBookings = (
  storeId?: string,
  filters?: CalendarFilters
) => {
  return useQuery({
    queryKey: ['calendar-bookings', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      // Récupérer d'abord les produits du store
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId)
        .eq('product_type', 'service');

      const productIds = products?.map(p => p.id) || [];

      if (productIds.length === 0) {
        return [];
      }

      // Récupérer les réservations
      let query = supabase
        .from('service_bookings')
        .select(`
          *,
          product:products!product_id (
            id,
            name,
            image_url
          )
        `)
        .in('product_id', productIds);

      // Appliquer filtres
      if (filters?.dateRange) {
        query = query
          .gte('scheduled_date', format(filters.dateRange.start, 'yyyy-MM-dd'))
          .lte('scheduled_date', format(filters.dateRange.end, 'yyyy-MM-dd'));
      }

      if (filters?.staffIds && filters.staffIds.length > 0) {
        query = query.in('staff_member_id', filters.staffIds);
      }

      if (filters?.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching calendar bookings', { error, storeId });
        throw error;
      }

      // Récupérer le staff séparément
      const staffIds = [...new Set((data || []).map((b) => b.staff_member_id).filter(Boolean))];
      
      const { data: staffMembers } = staffIds.length > 0
        ? await supabase
            .from('service_staff_members')
            .select('id, name, email, avatar_url')
            .in('id', staffIds)
        : { data: [] };

      // Transformer en format calendrier
      const bookings: CalendarBooking[] = (data || []).map((booking) => {
        const scheduledDate = new Date(booking.scheduled_date);
        const startTime = booking.scheduled_start_time?.split(':') || ['9', '0'];
        const endTime = booking.scheduled_end_time?.split(':') || ['10', '0'];

        const start = new Date(scheduledDate);
        start.setHours(parseInt(startTime[0]), parseInt(startTime[1]), 0, 0);

        const end = new Date(scheduledDate);
        end.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0, 0);

        const staff = staffMembers?.find((s) => s.id === booking.staff_member_id);

        return {
          id: booking.id,
          title: `${(booking.product as { name?: string })?.name || 'Service'}`,
          start,
          end,
          status: booking.status || 'pending',
          serviceId: booking.product_id,
          serviceName: (booking.product as { name?: string })?.name || 'Service',
          customerId: booking.user_id,
          customerName: 'Client', // À améliorer avec RPC pour récupérer depuis auth.users
          customerEmail: '',
          customerPhone: undefined,
          staffId: booking.staff_member_id,
          staffName: staff?.name,
          participants: booking.participants_count || 1,
          price: booking.amount_paid,
          notes: booking.customer_notes,
          meetingUrl: booking.meeting_url,
          resourceId: booking.staff_member_id, // Pour timeline view
        };
      });

      return bookings;
    },
    enabled: !!storeId,
  });
};

/**
 * useCalendarStaff - Récupère le staff pour le calendrier
 */
export const useCalendarStaff = (storeId?: string, serviceId?: string) => {
  return useQuery({
    queryKey: ['calendar-staff', storeId, serviceId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('service_staff_members')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (serviceId) {
        query = query.eq('service_product_id', serviceId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching calendar staff', { error, storeId });
        throw error;
      }

      // Assigner des couleurs par défaut
      const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#84cc16', // lime
      ];

      const staff: CalendarStaff[] = (data || []).map((member, index) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        avatarUrl: member.avatar_url,
        color: colors[index % colors.length],
      }));

      return staff;
    },
    enabled: !!storeId,
  });
};

/**
 * useCalendarAvailability - Récupère les disponibilités
 */
export const useCalendarAvailability = (
  serviceId?: string,
  dateRange?: { start: Date; end: Date }
) => {
  return useQuery({
    queryKey: ['calendar-availability', serviceId, dateRange],
    queryFn: async () => {
      if (!serviceId) throw new Error('Service ID manquant');

      const { data, error } = await supabase
        .from('service_availability_slots')
        .select('*')
        .eq('service_product_id', serviceId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        logger.error('Error fetching availability', { error, serviceId });
        throw error;
      }

      return data || [];
    },
    enabled: !!serviceId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useUpdateBookingTime - Mettre à jour l'heure d'une réservation (drag & drop)
 */
export const useUpdateBookingTime = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      bookingId,
      newStart,
      newEnd,
    }: {
      bookingId: string;
      newStart: Date;
      newEnd: Date;
    }) => {
      const { data, error } = await supabase
        .from('service_bookings')
        .update({
          scheduled_date: format(newStart, 'yyyy-MM-dd'),
          scheduled_start_time: format(newStart, 'HH:mm:ss'),
          scheduled_end_time: format(newEnd, 'HH:mm:ss'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating booking time', { error, bookingId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: '✅ Réservation mise à jour',
        description: 'L\'heure de la réservation a été modifiée',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateBookingTime', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour la réservation',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateBookingStaff - Changer le staff assigné (drag & drop sur timeline)
 */
export const useUpdateBookingStaff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      bookingId,
      staffId,
    }: {
      bookingId: string;
      staffId?: string;
    }) => {
      const { data, error } = await supabase
        .from('service_bookings')
        .update({
          staff_member_id: staffId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating booking staff', { error, bookingId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: '✅ Staff mis à jour',
        description: 'Le staff assigné a été modifié',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateBookingStaff', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le staff',
        variant: 'destructive',
      });
    },
  });
};

