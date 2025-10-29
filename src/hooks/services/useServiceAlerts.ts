/**
 * useServiceAlerts Hook
 * 
 * Capacity alerts, booking notifications, and staff alerts
 * Date: 29 Octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Alert types
 */
export type AlertType = 
  | 'low_capacity'      // Capacité faible
  | 'fully_booked'      // Complet
  | 'new_booking'       // Nouvelle réservation
  | 'cancellation'      // Annulation
  | 'upcoming'          // Rendez-vous imminent
  | 'missed'            // No-show
  | 'staff_assigned';   // Staff assigné

/**
 * Alert priority
 */
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Service alert interface
 */
export interface ServiceAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  service_id?: string;
  booking_id?: string;
  staff_id?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: Date | string;
  expires_at?: Date | string;
}

/**
 * Alert settings
 */
export interface AlertSettings {
  id: string;
  user_id: string;
  enable_email: boolean;
  enable_push: boolean;
  enable_sms: boolean;
  low_capacity_threshold: number; // percentage
  upcoming_hours: number; // hours before booking
  alert_types: AlertType[];
}

/**
 * Fetch all alerts for a user
 */
export const useServiceAlerts = (userId: string) => {
  return useQuery({
    queryKey: ['service-alerts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ServiceAlert[];
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Fetch unread alerts count
 */
export const useUnreadAlertsCount = (userId: string) => {
  return useQuery({
    queryKey: ['service-alerts-unread', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('service_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

/**
 * Mark alert as read
 */
export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('service_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data as ServiceAlert;
    },
    onSuccess: (data) => {
      // Invalider les queries pour forcer un refresh
      queryClient.invalidateQueries({ queryKey: ['service-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['service-alerts-unread'] });
    },
  });
};

/**
 * Mark all alerts as read
 */
export const useMarkAllAlertsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('service_alerts')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['service-alerts-unread'] });
    },
  });
};

/**
 * Delete an alert
 */
export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('service_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      return { id: alertId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['service-alerts-unread'] });
    },
  });
};

/**
 * Clear old alerts (older than 30 days)
 */
export const useClearOldAlerts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('service_alerts')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-alerts'] });
    },
  });
};

/**
 * Fetch alert settings
 */
export const useAlertSettings = (userId: string) => {
  return useQuery({
    queryKey: ['alert-settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no settings exist, return defaults
        if (error.code === 'PGRST116') {
          return {
            user_id: userId,
            enable_email: true,
            enable_push: true,
            enable_sms: false,
            low_capacity_threshold: 20,
            upcoming_hours: 2,
            alert_types: ['low_capacity', 'new_booking', 'upcoming', 'cancellation'],
          } as AlertSettings;
        }
        throw error;
      }

      return data as AlertSettings;
    },
    enabled: !!userId,
  });
};

/**
 * Update alert settings
 */
export const useUpdateAlertSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<AlertSettings> & { user_id: string }) => {
      const { data, error } = await supabase
        .from('alert_settings')
        .upsert(settings)
        .select()
        .single();

      if (error) throw error;
      return data as AlertSettings;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alert-settings', data.user_id] });
    },
  });
};

/**
 * Create a custom alert
 */
export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: Partial<ServiceAlert> & { user_id: string }) => {
      const { data, error } = await supabase
        .from('service_alerts')
        .insert([alert])
        .select()
        .single();

      if (error) throw error;
      return data as ServiceAlert;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-alerts', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['service-alerts-unread', data.user_id] });
    },
  });
};

/**
 * Check and create low capacity alerts for all services
 */
export const useCheckLowCapacity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, storeId, threshold = 20 }: { userId: string; storeId: string; threshold?: number }) => {
      // Fetch all services with their booking counts
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, total_slots')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      const alerts: Partial<ServiceAlert>[] = [];

      for (const service of services || []) {
        // Count bookings for this service
        const { count, error: countError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', service.id)
          .neq('status', 'cancelled');

        if (countError) continue;

        const totalSlots = service.total_slots || 0;
        const bookedSlots = count || 0;
        const availableSlots = totalSlots - bookedSlots;
        const capacityPercentage = totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 100;

        if (capacityPercentage <= threshold && capacityPercentage > 0) {
          alerts.push({
            user_id: userId,
            type: 'low_capacity',
            priority: capacityPercentage <= 10 ? 'critical' : 'high',
            title: 'Capacité faible',
            message: `Le service "${service.name}" n'a plus que ${availableSlots} créneaux disponibles (${Math.round(capacityPercentage)}%)`,
            service_id: service.id,
            is_read: false,
            metadata: {
              availableSlots,
              totalSlots,
              capacityPercentage,
            },
          });
        } else if (availableSlots === 0) {
          alerts.push({
            user_id: userId,
            type: 'fully_booked',
            priority: 'medium',
            title: 'Complet',
            message: `Le service "${service.name}" est complet. Aucun créneau disponible.`,
            service_id: service.id,
            is_read: false,
            metadata: {
              totalSlots,
            },
          });
        }
      }

      // Insert all alerts
      if (alerts.length > 0) {
        const { data, error } = await supabase
          .from('service_alerts')
          .insert(alerts)
          .select();

        if (error) throw error;
        return data as ServiceAlert[];
      }

      return [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['service-alerts-unread'] });
    },
  });
};

/**
 * Check upcoming bookings and create alerts
 */
export const useCheckUpcomingBookings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, hours = 2 }: { userId: string; hours?: number }) => {
      const now = new Date();
      const future = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, service:services(name), customer:customers(name)')
        .gte('scheduled_date', now.toISOString())
        .lte('scheduled_date', future.toISOString())
        .eq('status', 'confirmed');

      if (error) throw error;

      const alerts: Partial<ServiceAlert>[] = (bookings || []).map((booking) => ({
        user_id: userId,
        type: 'upcoming',
        priority: 'medium',
        title: 'Rendez-vous imminent',
        message: `Rendez-vous avec ${booking.customer?.name} pour "${booking.service?.name}" dans moins de ${hours}h`,
        service_id: booking.service_id,
        booking_id: booking.id,
        is_read: false,
        metadata: {
          scheduledDate: booking.scheduled_date,
          customerName: booking.customer?.name,
          serviceName: booking.service?.name,
        },
      }));

      if (alerts.length > 0) {
        const { data, error: insertError } = await supabase
          .from('service_alerts')
          .insert(alerts)
          .select();

        if (insertError) throw insertError;
        return data as ServiceAlert[];
      }

      return [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['service-alerts-unread'] });
    },
  });
};

export default useServiceAlerts;

