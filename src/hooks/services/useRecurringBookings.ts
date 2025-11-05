/**
 * useRecurringBookings Hook
 * Date: 27 Janvier 2025
 * 
 * Gestion des réservations récurrentes avec Supabase et React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface RecurringBookingSeries {
  id: string;
  parent_booking_id: string;
  store_id: string;
  service_product_id: string;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval: number;
  recurrence_end_date?: string;
  recurrence_count?: number;
  recurrence_days_of_week?: number[];
  recurrence_day_of_month?: number;
  recurrence_exceptions?: string[];
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringBookingConfig {
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  recurrence_count?: number;
  recurrence_days_of_week?: number[];
  recurrence_day_of_month?: number;
  recurrence_exceptions?: string[];
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useRecurringSeries - Récupère toutes les séries récurrentes d'un store
 */
export const useRecurringSeries = (storeId?: string) => {
  return useQuery({
    queryKey: ['recurring-series', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('recurring_bookings_series')
        .select(`
          *,
          parent_booking:service_bookings!parent_booking_id (
            id,
            scheduled_date,
            scheduled_start_time,
            scheduled_end_time,
            status
          ),
          service:service_products!service_product_id (
            id,
            product:products!product_id (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching recurring series', { error, storeId });
        throw error;
      }

      return data as RecurringBookingSeries[];
    },
    enabled: !!storeId,
  });
};

/**
 * useRecurringSeriesById - Récupère une série récurrente par ID
 */
export const useRecurringSeriesById = (seriesId?: string) => {
  return useQuery({
    queryKey: ['recurring-series', seriesId],
    queryFn: async () => {
      if (!seriesId) throw new Error('Series ID manquant');

      const { data, error } = await supabase
        .from('recurring_bookings_series')
        .select(`
          *,
          parent_booking:service_bookings!parent_booking_id (*),
          service:service_products!service_product_id (
            id,
            product:products!product_id (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('id', seriesId)
        .single();

      if (error) {
        logger.error('Error fetching recurring series by ID', { error, seriesId });
        throw error;
      }

      return data as RecurringBookingSeries;
    },
    enabled: !!seriesId,
  });
};

/**
 * useRecurringBookingsBySeries - Récupère toutes les réservations d'une série
 */
export const useRecurringBookingsBySeries = (seriesId?: string) => {
  return useQuery({
    queryKey: ['recurring-bookings', 'series', seriesId],
    queryFn: async () => {
      if (!seriesId) throw new Error('Series ID manquant');

      // Récupérer la série pour obtenir le parent_booking_id
      const { data: series } = await supabase
        .from('recurring_bookings_series')
        .select('parent_booking_id')
        .eq('id', seriesId)
        .single();

      if (!series) throw new Error('Series not found');

      // Récupérer toutes les réservations de la série
      const { data, error } = await supabase
        .from('service_bookings')
        .select('*')
        .or(`id.eq.${series.parent_booking_id},parent_booking_id.eq.${series.parent_booking_id}`)
        .order('scheduled_date', { ascending: true });

      if (error) {
        logger.error('Error fetching recurring bookings by series', { error, seriesId });
        throw error;
      }

      return data;
    },
    enabled: !!seriesId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateRecurringBooking - Créer une série de réservations récurrentes
 */
export const useCreateRecurringBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      parentBookingId,
      config,
      storeId,
    }: {
      parentBookingId: string;
      config: RecurringBookingConfig;
      storeId: string;
    }) => {
      // Récupérer la réservation parente
      const { data: parentBooking } = await supabase
        .from('service_bookings')
        .select('*, product_id')
        .eq('id', parentBookingId)
        .single();

      if (!parentBooking) {
        throw new Error('Parent booking not found');
      }

      // Récupérer le service_product_id
      const { data: serviceProduct } = await supabase
        .from('service_products')
        .select('id')
        .eq('product_id', parentBooking.product_id)
        .single();

      if (!serviceProduct) {
        throw new Error('Service product not found');
      }

      // Mettre à jour la réservation parente avec les infos de récurrence
      const { error: updateError } = await supabase
        .from('service_bookings')
        .update({
          is_recurring: true,
          recurrence_pattern: config.recurrence_pattern,
          recurrence_interval: config.recurrence_interval || 1,
          recurrence_end_date: config.recurrence_end_date,
          recurrence_count: config.recurrence_count,
          recurrence_days_of_week: config.recurrence_days_of_week,
          recurrence_day_of_month: config.recurrence_day_of_month,
          recurrence_exceptions: config.recurrence_exceptions || [],
        })
        .eq('id', parentBookingId);

      if (updateError) {
        logger.error('Error updating parent booking', { error: updateError });
        throw updateError;
      }

      // Créer la série récurrente
      const { data: series, error: seriesError } = await supabase
        .from('recurring_bookings_series')
        .insert({
          parent_booking_id: parentBookingId,
          store_id: storeId,
          service_product_id: serviceProduct.id,
          recurrence_pattern: config.recurrence_pattern,
          recurrence_interval: config.recurrence_interval || 1,
          recurrence_end_date: config.recurrence_end_date,
          recurrence_count: config.recurrence_count,
          recurrence_days_of_week: config.recurrence_days_of_week,
          recurrence_day_of_month: config.recurrence_day_of_month,
          recurrence_exceptions: config.recurrence_exceptions || [],
          total_bookings: 1,
        })
        .select()
        .single();

      if (seriesError) {
        logger.error('Error creating recurring series', { error: seriesError });
        throw seriesError;
      }

      // Générer les réservations récurrentes via RPC
      const { data: generatedCount, error: generateError } = await supabase.rpc(
        'generate_recurring_bookings',
        {
          p_parent_booking_id: parentBookingId,
          p_recurrence_pattern: config.recurrence_pattern,
          p_recurrence_interval: config.recurrence_interval || 1,
          p_recurrence_end_date: config.recurrence_end_date || null,
          p_recurrence_count: config.recurrence_count || null,
          p_recurrence_days_of_week: config.recurrence_days_of_week || null,
          p_recurrence_day_of_month: config.recurrence_day_of_month || null,
        }
      );

      if (generateError) {
        logger.error('Error generating recurring bookings', { error: generateError });
        throw generateError;
      }

      return { series, generatedCount };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: '✅ Série récurrente créée',
        description: `${data.generatedCount} réservation(s) générée(s) avec succès`,
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateRecurringBooking', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la série récurrente',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCancelRecurringSeries - Annuler une série récurrente complète
 */
export const useCancelRecurringSeries = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (seriesId: string) => {
      const { data, error } = await supabase.rpc('cancel_recurring_series', {
        p_series_id: seriesId,
      });

      if (error) {
        logger.error('Error cancelling recurring series', { error, seriesId });
        throw error;
      }

      return data;
    },
    onSuccess: (data, seriesId) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: '✅ Série annulée',
        description: `${data} réservation(s) annulée(s)`,
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCancelRecurringSeries', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'annuler la série',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateRecurringSeries - Mettre à jour une série récurrente
 */
export const useUpdateRecurringSeries = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      seriesId,
      updates,
    }: {
      seriesId: string;
      updates: Partial<RecurringBookingConfig>;
    }) => {
      const { data, error } = await supabase
        .from('recurring_bookings_series')
        .update(updates)
        .eq('id', seriesId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating recurring series', { error, seriesId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-series'] });
      toast({
        title: '✅ Série mise à jour',
        description: 'La série récurrente a été modifiée',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useUpdateRecurringSeries', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour la série',
        variant: 'destructive',
      });
    },
  });
};

