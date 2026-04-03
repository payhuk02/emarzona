/**
 * Hooks pour la gestion des intégrations calendriers externes pour services
 * Date: 1 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface CalendarIntegration {
  id: string;
  store_id: string;
  service_id?: string;
  calendar_type: 'google_calendar' | 'outlook' | 'ical' | 'other';
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  calendar_id: string;
  calendar_name?: string;
  calendar_email?: string;
  sync_direction: 'one_way_import' | 'one_way_export' | 'bidirectional';
  auto_sync: boolean;
  sync_interval_minutes: number;
  create_events_for_bookings: boolean;
  create_events_for_availability: boolean;
  event_title_template?: string;
  event_description_template?: string;
  is_active: boolean;
  last_sync_at?: string;
  last_sync_status?: 'success' | 'error' | 'partial';
  last_sync_error?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
  };
}

export interface CalendarEvent {
  id: string;
  integration_id: string;
  booking_id?: string;
  service_id?: string;
  external_event_id: string;
  external_calendar_id: string;
  event_title: string;
  event_description?: string;
  event_start_time: string;
  event_end_time: string;
  event_location?: string;
  event_timezone: string;
  attendees?: Array<{ email: string; name?: string; status?: string }>;
  organizer_email?: string;
  organizer_name?: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'error' | 'conflict';
  sync_direction: 'import' | 'export' | 'bidirectional';
  last_synced_at?: string;
  sync_error?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  integration_id: string;
  sync_type: 'full' | 'incremental' | 'manual';
  sync_direction: 'import' | 'export' | 'bidirectional';
  status: 'success' | 'error' | 'partial';
  events_created: number;
  events_updated: number;
  events_deleted: number;
  events_failed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Récupérer toutes les intégrations calendriers d'un store
 */
export function useCalendarIntegrations(storeId: string) {
  return useQuery({
    queryKey: ['calendar-integrations', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_calendar_integrations')
        .select(`
          *,
          products (
            id,
            name
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CalendarIntegration[];
    },
    enabled: !!storeId,
  });
}

/**
 * Récupérer une intégration spécifique
 */
export function useCalendarIntegration(integrationId: string) {
  return useQuery({
    queryKey: ['calendar-integration', integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_calendar_integrations')
        .select(`
          *,
          products (
            id,
            name
          )
        `)
        .eq('id', integrationId)
        .single();

      if (error) throw error;
      return data as CalendarIntegration;
    },
    enabled: !!integrationId,
  });
}

/**
 * Créer une nouvelle intégration calendrier
 */
export function useCreateCalendarIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integration: Partial<CalendarIntegration>) => {
      const { data, error } = await supabase
        .from('service_calendar_integrations')
        .insert(integration)
        .select()
        .single();

      if (error) throw error;
      return data as CalendarIntegration;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      toast({
        title: 'Intégration créée',
        description: 'L\'intégration calendrier a été créée avec succès.',
      });
      logger.info('Calendar integration created', { integrationId: data.id });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'intégration.',
        variant: 'destructive',
      });
      logger.error('Error creating calendar integration', { error });
    },
  });
}

/**
 * Mettre à jour une intégration calendrier
 */
export function useUpdateCalendarIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarIntegration> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_calendar_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CalendarIntegration;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-integration', data.id] });
      toast({
        title: 'Intégration mise à jour',
        description: 'L\'intégration calendrier a été mise à jour avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour l\'intégration.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Supprimer une intégration calendrier
 */
export function useDeleteCalendarIntegration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('service_calendar_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      toast({
        title: 'Intégration supprimée',
        description: 'L\'intégration calendrier a été supprimée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'intégration.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Synchroniser manuellement un calendrier
 */
export function useSyncCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ integrationId, syncType = 'manual' }: { integrationId: string; syncType?: 'full' | 'incremental' | 'manual' }) => {
      const { data, error } = await supabase.rpc('sync_calendar_events', {
        p_integration_id: integrationId,
        p_sync_type: syncType,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-logs'] });
      toast({
        title: 'Synchronisation démarrée',
        description: 'La synchronisation du calendrier est en cours.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message || 'Impossible de synchroniser le calendrier.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Récupérer les événements d'une intégration
 */
export function useCalendarEvents(integrationId: string) {
  return useQuery({
    queryKey: ['calendar-events', integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_calendar_events')
        .select('*')
        .eq('integration_id', integrationId)
        .order('event_start_time', { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!integrationId,
  });
}

/**
 * Récupérer les logs de synchronisation
 */
export function useSyncLogs(integrationId: string) {
  return useQuery({
    queryKey: ['calendar-sync-logs', integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_calendar_sync_logs')
        .select('*')
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SyncLog[];
    },
    enabled: !!integrationId,
  });
}

/**
 * Détecter les conflits de calendrier
 */
export function useDetectCalendarConflicts() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ serviceId, startTime, endTime, excludeBookingId }: {
      serviceId: string;
      startTime: string;
      endTime: string;
      excludeBookingId?: string;
    }) => {
      const { data, error } = await supabase.rpc('detect_calendar_conflicts', {
        p_service_id: serviceId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_exclude_booking_id: excludeBookingId,
      });

      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de détecter les conflits.',
        variant: 'destructive',
      });
    },
  });
}







