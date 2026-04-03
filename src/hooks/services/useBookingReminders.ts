/**
 * Hooks pour la gestion des rappels automatiques de réservations
 * Date: 1 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface BookingReminder {
  id: string;
  booking_id: string;
  service_id: string;
  store_id: string;
  user_id: string;
  reminder_type: 'email' | 'sms' | 'push' | 'in_app';
  reminder_scheduled_at: string;
  reminder_sent_at?: string;
  reminder_sent: boolean;
  reminder_subject?: string;
  reminder_message: string;
  reminder_template?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  delivery_status?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReminderTemplate {
  id: string;
  store_id: string;
  template_name: string;
  template_type: 'email' | 'sms' | 'push' | 'in_app';
  reminder_timing_hours: number;
  subject_template?: string;
  message_template: string;
  is_active: boolean;
  is_default: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Récupérer les rappels d'une réservation
 */
export function useBookingReminders(bookingId: string) {
  return useQuery({
    queryKey: ['booking-reminders', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_booking_reminders')
        .select('*')
        .eq('booking_id', bookingId)
        .order('reminder_scheduled_at', { ascending: true });

      if (error) {
        logger.error('Error fetching booking reminders', { error });
        throw error;
      }

      return data as BookingReminder[];
    },
    enabled: !!bookingId,
  });
}

/**
 * Récupérer les templates de rappels d'un store
 */
export function useReminderTemplates(storeId: string) {
  return useQuery({
    queryKey: ['reminder-templates', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_reminder_templates')
        .select('*')
        .eq('store_id', storeId)
        .order('reminder_timing_hours', { ascending: true });

      if (error) {
        logger.error('Error fetching reminder templates', { error });
        throw error;
      }

      return data as ReminderTemplate[];
    },
    enabled: !!storeId,
  });
}

/**
 * Récupérer les rappels en attente (pour traitement)
 */
export function usePendingReminders(limit: number = 100) {
  return useQuery({
    queryKey: ['pending-reminders', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_reminders', {
        p_limit: limit,
      });

      if (error) {
        logger.error('Error fetching pending reminders', { error });
        throw error;
      }

      return data;
    },
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });
}

/**
 * Créer un template de rappel
 */
export function useCreateReminderTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: Partial<ReminderTemplate>) => {
      const { data, error } = await supabase
        .from('service_reminder_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        logger.error('Error creating reminder template', { error });
        throw error;
      }

      return data as ReminderTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminder-templates', data.store_id] });
      toast({
        title: 'Template créé',
        description: 'Le template de rappel a été créé avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le template.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour un template de rappel
 */
export function useUpdateReminderTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReminderTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_reminder_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating reminder template', { error });
        throw error;
      }

      return data as ReminderTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminder-templates', data.store_id] });
      toast({
        title: 'Template mis à jour',
        description: 'Le template de rappel a été mis à jour avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le template.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Supprimer un template de rappel
 */
export function useDeleteReminderTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ templateId, storeId }: { templateId: string; storeId: string }) => {
      const { error } = await supabase
        .from('service_reminder_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        logger.error('Error deleting reminder template', { error });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reminder-templates', variables.storeId] });
      toast({
        title: 'Template supprimé',
        description: 'Le template de rappel a été supprimé avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le template.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Marquer un rappel comme envoyé
 */
export function useMarkReminderSent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      reminderId,
      deliveryStatus,
      errorMessage,
    }: {
      reminderId: string;
      deliveryStatus?: string;
      errorMessage?: string;
    }) => {
      const { data, error } = await supabase.rpc('mark_reminder_sent', {
        p_reminder_id: reminderId,
        p_delivery_status: deliveryStatus || 'delivered',
        p_error_message: errorMessage || null,
      });

      if (error) {
        logger.error('Error marking reminder as sent', { error });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reminders'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de marquer le rappel comme envoyé.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Créer manuellement des rappels pour une réservation
 */
export function useCreateBookingReminders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase.rpc('create_booking_reminders', {
        p_booking_id: bookingId,
      });

      if (error) {
        logger.error('Error creating booking reminders', { error });
        throw error;
      }

      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['booking-reminders'] });
      toast({
        title: 'Rappels créés',
        description: `${count} rappel(s) ont été créés pour cette réservation.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer les rappels.',
        variant: 'destructive',
      });
    },
  });
}







