/**
 * Hook useRecurringBookings - Gestion des réservations récurrentes
 * Date: 26 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface RecurringBookingPattern {
  id: string;
  product_id: string;
  user_id: string;
  staff_member_id?: string;
  recurrence_type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval_days?: number;
  days_of_week?: number[];
  day_of_month?: number;
  week_of_month?: number;
  occurrence_limit?: number;
  date_limit?: string;
  start_time: string;
  duration_minutes: number;
  timezone: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  title?: string;
  notes?: string;
  customer_notes?: string;
  total_occurrences: number;
  created_occurrences: number;
  skipped_occurrences: number;
  created_at: string;
  updated_at: string;
}

const RECURRING_BOOKINGS_QUERY_KEY = ['recurring-bookings'];

/**
 * Récupérer tous les patterns de récurrence d'un utilisateur
 */
export function useRecurringBookingPatterns(userId?: string) {
  return useQuery({
    queryKey: [...RECURRING_BOOKINGS_QUERY_KEY, 'patterns', userId],
    queryFn: async (): Promise<RecurringBookingPattern[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('recurring_booking_patterns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching recurring patterns:', error);
        throw error;
      }

      return (data as RecurringBookingPattern[]) || [];
    },
    enabled: !!userId,
  });
}

/**
 * Récupérer un pattern spécifique
 */
export function useRecurringBookingPattern(patternId: string) {
  return useQuery({
    queryKey: [...RECURRING_BOOKINGS_QUERY_KEY, 'pattern', patternId],
    queryFn: async (): Promise<RecurringBookingPattern | null> => {
      const { data, error } = await supabase
        .from('recurring_booking_patterns')
        .select('*')
        .eq('id', patternId)
        .single();

      if (error) {
        logger.error('Error fetching recurring pattern:', error);
        throw error;
      }

      return data as RecurringBookingPattern;
    },
    enabled: !!patternId,
  });
}

/**
 * Créer un pattern de récurrence
 */
export function useCreateRecurringBooking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patternData: {
      product_id: string;
      user_id: string;
      staff_member_id?: string;
      recurrence_type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
      start_date: string;
      end_date?: string | null;
      date_limit?: string | null;
      start_time: string;
      duration_minutes: number;
      timezone: string;
      interval_days?: number;
      days_of_week?: number[];
      day_of_month?: number;
      occurrence_limit?: number | null;
      title?: string;
      notes?: string;
      customer_notes?: string;
    }): Promise<RecurringBookingPattern> => {
      const { data, error } = await supabase
        .from('recurring_booking_patterns')
        .insert({
          product_id: patternData.product_id,
          user_id: patternData.user_id,
          staff_member_id: patternData.staff_member_id,
          recurrence_type: patternData.recurrence_type,
          start_date: patternData.start_date,
          end_date: patternData.end_date,
          date_limit: patternData.date_limit,
          start_time: patternData.start_time,
          duration_minutes: patternData.duration_minutes,
          timezone: patternData.timezone,
          interval_days: patternData.interval_days,
          days_of_week: patternData.days_of_week,
          day_of_month: patternData.day_of_month,
          occurrence_limit: patternData.occurrence_limit,
          title: patternData.title,
          notes: patternData.notes,
          customer_notes: patternData.customer_notes,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating recurring pattern:', error);
        throw error;
      }

      // Générer les premières réservations
      const { error: generateError } = await supabase.rpc('generate_recurring_bookings', {
        p_pattern_id: data.id,
        p_generate_count: 10, // Générer les 10 premières occurrences
      });

      if (generateError) {
        logger.error('Error generating bookings:', generateError);
        // Ne pas échouer, juste logger l'erreur
      }

      return data as RecurringBookingPattern;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RECURRING_BOOKINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      toast({
        title: '✅ Série créée',
        description: 'La série de réservations récurrentes a été créée avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error creating recurring booking:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la série',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour un pattern
 */
export function useUpdateRecurringBookingPattern() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patternId,
      updates,
    }: {
      patternId: string;
      updates: Partial<RecurringBookingPattern>;
    }): Promise<RecurringBookingPattern> => {
      const { data, error } = await supabase
        .from('recurring_booking_patterns')
        .update(updates)
        .eq('id', patternId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating recurring pattern:', error);
        throw error;
      }

      return data as RecurringBookingPattern;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_BOOKINGS_QUERY_KEY });
      toast({
        title: '✅ Série mise à jour',
        description: 'La série a été mise à jour avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating recurring pattern:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour la série',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Pause/Reprendre un pattern
 */
export function useToggleRecurringBookingPattern() {
  return useUpdateRecurringBookingPattern();
}

/**
 * Annuler toutes les réservations futures d'un pattern
 */
export function useCancelFutureRecurringBookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patternId,
      cancelFromDate,
    }: {
      patternId: string;
      cancelFromDate?: string;
    }): Promise<number> => {
      const { data, error } = await supabase.rpc('cancel_future_recurring_bookings', {
        p_pattern_id: patternId,
        p_cancel_from_date: cancelFromDate || new Date().toISOString().split('T')[0],
      });

      if (error) {
        logger.error('Error cancelling future bookings:', error);
        throw error;
      }

      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: RECURRING_BOOKINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      toast({
        title: '✅ Réservations annulées',
        description: `${count} réservation(s) future(s) ont été annulée(s)`,
      });
    },
    onError: (error: any) => {
      logger.error('Error cancelling future bookings:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'annuler les réservations',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Replanifier toutes les réservations futures d'un pattern
 */
export function useRescheduleRecurringBookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patternId,
      newStartDate,
      rescheduleFromDate,
    }: {
      patternId: string;
      newStartDate: string;
      rescheduleFromDate?: string;
    }): Promise<number> => {
      const { data, error } = await supabase.rpc('reschedule_recurring_bookings', {
        p_pattern_id: patternId,
        p_new_start_date: newStartDate,
        p_reschedule_from_date: rescheduleFromDate || new Date().toISOString().split('T')[0],
      });

      if (error) {
        logger.error('Error rescheduling bookings:', error);
        throw error;
      }

      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: RECURRING_BOOKINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      toast({
        title: '✅ Réservations replanifiées',
        description: `${count} réservation(s) ont été replanifiée(s)`,
      });
    },
    onError: (error: any) => {
      logger.error('Error rescheduling bookings:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de replanifier les réservations',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Générer plus d'occurrences pour un pattern
 */
export function useGenerateMoreOccurrences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patternId,
      count,
    }: {
      patternId: string;
      count?: number;
    }): Promise<number> => {
      const { data, error } = await supabase.rpc('generate_recurring_bookings', {
        p_pattern_id: patternId,
        p_generate_count: count || 10,
      });

      if (error) {
        logger.error('Error generating more occurrences:', error);
        throw error;
      }

      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: RECURRING_BOOKINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      toast({
        title: '✅ Occurrences générées',
        description: `${count} nouvelle(s) réservation(s) ont été créée(s)`,
      });
    },
    onError: (error: any) => {
      logger.error('Error generating occurrences:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de générer les occurrences',
        variant: 'destructive',
      });
    },
  });
}

