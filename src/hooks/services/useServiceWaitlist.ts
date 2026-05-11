/**
 * Hooks pour la gestion de la waitlist des services
 * Date: 1 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ServiceWaitlistEntry {
  id: string;
  service_id: string;
  store_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: 'waiting' | 'notified' | 'converted' | 'expired' | 'cancelled';
  priority: 'normal' | 'high' | 'urgent';
  position: number;
  preferred_date?: string;
  preferred_time?: string;
  preferred_staff_id?: string;
  customer_notes?: string;
  admin_notes?: string;
  notified_at?: string;
  notification_count: number;
  last_notification_sent_at?: string;
  converted_to_booking_id?: string;
  converted_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
  };
}

/**
 * Récupérer la waitlist d'un service
 */
export function useServiceWaitlist(serviceId: string) {
  return useQuery({
    queryKey: ['service-waitlist', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_waitlist')
        .select(`
          *,
          products (
            id,
            name
          )
        `)
        .eq('service_id', serviceId)
        .order('position', { ascending: true });

      if (error) {
        logger.error('Error fetching service waitlist', { error });
        throw error;
      }

      return data as ServiceWaitlistEntry[];
    },
    enabled: !!serviceId,
  });
}

/**
 * Récupérer la waitlist d'un store
 */
export function useStoreWaitlist(storeId: string) {
  return useQuery({
    queryKey: ['store-waitlist', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_waitlist')
        .select(`
          *,
          products (
            id,
            name
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching store waitlist', { error });
        throw error;
      }

      return data as ServiceWaitlistEntry[];
    },
    enabled: !!storeId,
  });
}

/**
 * Récupérer les entrées waitlist d'un utilisateur
 */
export function useUserWaitlist(userId: string) {
  return useQuery({
    queryKey: ['user-waitlist', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_waitlist')
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user waitlist', { error });
        throw error;
      }

      return data as ServiceWaitlistEntry[];
    },
    enabled: !!userId,
  });
}

/**
 * Ajouter une entrée à la waitlist
 */
export function useAddToWaitlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: Partial<ServiceWaitlistEntry>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('service_waitlist')
        .insert({
          ...entry,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding to waitlist', { error });
        throw error;
      }

      return data as ServiceWaitlistEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-waitlist', data.service_id] });
      queryClient.invalidateQueries({ queryKey: ['store-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['user-waitlist'] });
      toast({
        title: 'Ajouté à la liste d\'attente',
        description: 'Vous serez notifié dès qu\'un créneau sera disponible.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter à la liste d\'attente.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Notifier un client de la waitlist
 */
export function useNotifyWaitlistEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (waitlistId: string) => {
      // Récupérer l'entrée actuelle pour incrémenter notification_count
      const { data: currentEntry } = await supabase
        .from('service_waitlist')
        .select('notification_count')
        .eq('id', waitlistId)
        .single();

      const { data, error } = await supabase
        .from('service_waitlist')
        .update({
          status: 'notified',
          notified_at: new Date().toISOString(),
          notification_count: (currentEntry?.notification_count || 0) + 1,
          last_notification_sent_at: new Date().toISOString(),
        })
        .eq('id', waitlistId)
        .select()
        .single();

      if (error) {
        logger.error('Error notifying waitlist entry', { error });
        throw error;
      }

      return data as ServiceWaitlistEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-waitlist', data.service_id] });
      queryClient.invalidateQueries({ queryKey: ['store-waitlist'] });
      toast({
        title: 'Client notifié',
        description: 'Le client a été notifié de la disponibilité.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de notifier le client.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Convertir une entrée waitlist en réservation
 */
export function useConvertWaitlistToBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ waitlistId, bookingId }: { waitlistId: string; bookingId: string }) => {
      const { data, error } = await supabase.rpc('convert_waitlist_to_booking', {
        p_waitlist_id: waitlistId,
        p_booking_id: bookingId,
      });

      if (error) {
        logger.error('Error converting waitlist to booking', { error });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['store-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['service-bookings'] });
      toast({
        title: 'Converti en réservation',
        description: 'L\'entrée waitlist a été convertie en réservation.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de convertir en réservation.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Supprimer une entrée de la waitlist
 */
export function useRemoveFromWaitlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (waitlistId: string) => {
      const { error } = await supabase
        .from('service_waitlist')
        .delete()
        .eq('id', waitlistId);

      if (error) {
        logger.error('Error removing from waitlist', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['store-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['user-waitlist'] });
      toast({
        title: 'Retiré de la liste d\'attente',
        description: 'L\'entrée a été retirée de la liste d\'attente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de retirer de la liste d\'attente.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour le statut d'une entrée waitlist
 */
export function useUpdateWaitlistStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ waitlistId, status, ...updates }: { waitlistId: string; status: ServiceWaitlistEntry['status']; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('service_waitlist')
        .update({ status, ...updates })
        .eq('id', waitlistId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating waitlist status', { error });
        throw error;
      }

      return data as ServiceWaitlistEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-waitlist', data.service_id] });
      queryClient.invalidateQueries({ queryKey: ['store-waitlist'] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de l\'entrée a été mis à jour.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le statut.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Notifier automatiquement les clients en waitlist
 */
export function useNotifyWaitlistCustomers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ serviceId, availableDate, availableTime }: { serviceId: string; availableDate: string; availableTime: string }) => {
      const { data, error } = await supabase.rpc('notify_waitlist_customers', {
        p_service_id: serviceId,
        p_available_slot_date: availableDate,
        p_available_slot_time: availableTime,
      });

      if (error) {
        logger.error('Error notifying waitlist customers', { error });
        throw error;
      }

      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['service-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['store-waitlist'] });
      toast({
        title: 'Clients notifiés',
        description: `${count} client(s) ont été notifiés de la disponibilité.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de notifier les clients.',
        variant: 'destructive',
      });
    },
  });
}







