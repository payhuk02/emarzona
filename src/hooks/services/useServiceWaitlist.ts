/**
 * Hooks pour la gestion de la waitlist des services
 * Date: 1 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { sendUnifiedNotification } from '@/lib/notifications/unified-notifications';

export interface ServiceWaitlistEntry {
  id: string;
  service_id: string;
  store_id: string;
  user_id: string | null;
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
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
  };
}

function waitlistBookingUrl(serviceId: string, waitlistId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/service/${serviceId}?waitlist=${waitlistId}`;
}

async function sendWaitlistAvailabilityNotice(entry: {
  id: string;
  service_id: string;
  store_id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  products?: { name?: string } | null;
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getUser();
  const vendorUserId = sessionData.user?.id;
  const serviceName =
    (entry.products && !Array.isArray(entry.products) && entry.products.name) || 'votre service';
  const actionUrl = waitlistBookingUrl(entry.service_id, entry.id);
  const title = 'Un créneau est disponible';
  const message = `Un créneau s’est libéré pour ${serviceName}. Réservez-le avant qu’il ne soit repris.`;

  const recipientUserId = entry.user_id || vendorUserId;
  if (!recipientUserId) {
    throw new Error('Impossible d’envoyer l’e-mail (session vendeur absente).');
  }

  const { data, error } = await supabase.functions.invoke('send-notification-email', {
    body: {
      user_id: recipientUserId,
      type: 'service_waitlist_available',
      title,
      message,
      action_url: actionUrl,
      action_label: 'Réserver maintenant',
      recipient_email: entry.customer_email,
      recipient_name: entry.customer_name,
      store_id: entry.store_id,
      metadata: {
        store_id: entry.store_id,
        waitlist_id: entry.id,
        service_id: entry.service_id,
      },
    },
  });

  if (error) {
    throw error;
  }
  const result = data as { success?: boolean; error?: string } | null;
  if (result?.success === false || result?.error) {
    throw new Error(result.error || 'Échec d’envoi de l’e-mail waitlist');
  }

  if (entry.user_id) {
    await sendUnifiedNotification({
      user_id: entry.user_id,
      type: 'service_booking_confirmed',
      title,
      message,
      action_url: actionUrl,
      action_label: 'Réserver maintenant',
      channels: ['in_app'],
      product_type: 'service',
      product_id: entry.service_id,
      metadata: { store_id: entry.store_id, waitlist_id: entry.id },
    });
  }

  if (entry.customer_phone) {
    const { error: smsError } = await supabase.functions.invoke('send-sms', {
      body: {
        to: entry.customer_phone,
        message: `${title}: ${message} ${actionUrl}`,
      },
    });
    if (smsError) {
      logger.warn('Waitlist SMS failed', { waitlistId: entry.id, error: smsError });
    }
  }
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
        .select(
          `
          *,
          products (
            id,
            name
          )
        `
        )
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
        .select(
          `
          *,
          products (
            id,
            name
          )
        `
        )
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
        .select(
          `
          *,
          products (
            id,
            name,
            image_url
          )
        `
        )
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
      if (!entry.service_id || !entry.store_id) {
        throw new Error('Service et boutique requis.');
      }
      if (!entry.customer_name?.trim() || !entry.customer_email?.trim()) {
        throw new Error('Nom et e-mail requis.');
      }

      const { data, error } = await supabase.rpc('join_service_waitlist', {
        p_service_id: entry.service_id,
        p_store_id: entry.store_id,
        p_customer_name: entry.customer_name.trim(),
        p_customer_email: entry.customer_email.trim(),
        p_customer_phone: entry.customer_phone?.trim() || undefined,
        p_preferred_date: entry.preferred_date || undefined,
        p_preferred_time: entry.preferred_time || undefined,
        p_customer_notes: entry.customer_notes?.trim() || undefined,
      });

      if (error) {
        logger.error('Error adding to waitlist', { error });
        const message = error.message || '';
        if (message.includes('invalid_email')) throw new Error('Adresse e-mail invalide.');
        if (message.includes('invalid_name')) throw new Error('Nom invalide.');
        if (message.includes('service_unavailable')) {
          throw new Error('Ce service n’est plus disponible.');
        }
        if (message.includes('service_not_found') || message.includes('store_mismatch')) {
          throw new Error('Service introuvable.');
        }
        throw error;
      }

      return data as ServiceWaitlistEntry;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['service-waitlist', data.service_id] });
      queryClient.invalidateQueries({ queryKey: ['store-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['user-waitlist'] });
      toast({
        title: "Ajouté à la liste d'attente",
        description: "Vous serez notifié dès qu'un créneau sera disponible.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || "Impossible d'ajouter à la liste d'attente.",
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
      const { data: currentEntry, error: loadError } = await supabase
        .from('service_waitlist')
        .select(
          'id, service_id, store_id, user_id, customer_name, customer_email, customer_phone, notification_count, products(id, name)'
        )
        .eq('id', waitlistId)
        .single();

      if (loadError || !currentEntry) {
        logger.error('Error loading waitlist entry', { waitlistId, error: loadError });
        throw loadError || new Error('Entrée waitlist introuvable');
      }

      await sendWaitlistAvailabilityNotice(currentEntry as ServiceWaitlistEntry);

      const { data, error } = await supabase
        .from('service_waitlist')
        .update({
          status: 'notified',
          notified_at: new Date().toISOString(),
          notification_count: (currentEntry.notification_count || 0) + 1,
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
    onSuccess: data => {
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
        description: "L'entrée waitlist a été convertie en réservation.",
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
      const { error } = await supabase.from('service_waitlist').delete().eq('id', waitlistId);

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
        title: "Retiré de la liste d'attente",
        description: "L'entrée a été retirée de la liste d'attente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || "Impossible de retirer de la liste d'attente.",
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
    mutationFn: async ({
      waitlistId,
      status,
      ...updates
    }: {
      waitlistId: string;
      status: ServiceWaitlistEntry['status'];
      [key: string]: unknown;
    }) => {
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
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['service-waitlist', data.service_id] });
      queryClient.invalidateQueries({ queryKey: ['store-waitlist'] });
      toast({
        title: 'Statut mis à jour',
        description: "Le statut de l'entrée a été mis à jour.",
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
    mutationFn: async ({
      serviceId,
      availableDate,
      availableTime,
    }: {
      serviceId: string;
      availableDate: string;
      availableTime: string;
    }) => {
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
    onSuccess: count => {
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
