/**
 * Hook pour gérer les paramètres de disponibilité du staff
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface StaffAvailabilitySettings {
  id: string;
  store_id: string;
  service_id?: string;
  auto_block_on_time_off: boolean;
  max_bookings_per_day: number;
  booking_density_warning_threshold: number;
  booking_density_critical_threshold: number;
  default_work_hours_start: string;
  default_work_hours_end: string;
  buffer_time_between_bookings: number;
  created_at: string;
  updated_at: string;
}

const defaultSettings: Omit<StaffAvailabilitySettings, 'id' | 'store_id' | 'service_id' | 'created_at' | 'updated_at'> = {
  auto_block_on_time_off: true,
  max_bookings_per_day: 8,
  booking_density_warning_threshold: 70,
  booking_density_critical_threshold: 85,
  default_work_hours_start: '09:00',
  default_work_hours_end: '18:00',
  buffer_time_between_bookings: 15,
};

/**
 * Récupère les paramètres de disponibilité pour un store/service
 */
export const useStaffAvailabilitySettings = (
  storeId: string | undefined,
  serviceId?: string | undefined
) => {
  return useQuery({
    queryKey: ['staff-availability-settings', storeId, serviceId],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      let query = supabase
        .from('staff_availability_settings')
        .select('*')
        .eq('store_id', storeId);

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      } else {
        query = query.is('service_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        // Si pas de données, retourner les valeurs par défaut
        if (error.code === 'PGRST116') {
          return {
            ...defaultSettings,
            store_id: storeId,
            service_id: serviceId,
          } as StaffAvailabilitySettings;
        }
        logger.error('Error fetching staff availability settings', { error, storeId, serviceId });
        throw error;
      }

      // Si pas de données, retourner les valeurs par défaut
      if (!data) {
        return {
          ...defaultSettings,
          store_id: storeId,
          service_id: serviceId,
        } as StaffAvailabilitySettings;
      }

      return data as StaffAvailabilitySettings;
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Sauvegarde ou met à jour les paramètres de disponibilité
 */
export const useUpdateStaffAvailabilitySettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<StaffAvailabilitySettings> & { store_id: string; service_id?: string }) => {
      if (!settings.store_id) {
        throw new Error('Store ID is required');
      }

      // Vérifier si les paramètres existent déjà
      let query = supabase
        .from('staff_availability_settings')
        .select('id')
        .eq('store_id', settings.store_id);

      if (settings.service_id) {
        query = query.eq('service_id', settings.service_id);
      } else {
        query = query.is('service_id', null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Mise à jour
        const { data, error } = await supabase
          .from('staff_availability_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          logger.error('Error updating staff availability settings', { error, settings });
          throw error;
        }

        return data as StaffAvailabilitySettings;
      } else {
        // Création
        const { data, error } = await supabase
          .from('staff_availability_settings')
          .insert({
            ...defaultSettings,
            ...settings,
          })
          .select()
          .single();

        if (error) {
          logger.error('Error creating staff availability settings', { error, settings });
          throw error;
        }

        return data as StaffAvailabilitySettings;
      }
    },
    onSuccess: (data) => {
      // Invalider les queries liées
      queryClient.invalidateQueries({
        queryKey: ['staff-availability-settings', data.store_id, data.service_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['staff-availability-settings', data.store_id],
      });

      toast({
        title: '✅ Paramètres sauvegardés',
        description: 'Les paramètres de disponibilité ont été sauvegardés avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error saving staff availability settings', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder les paramètres',
        variant: 'destructive',
      });
    },
  });
};

