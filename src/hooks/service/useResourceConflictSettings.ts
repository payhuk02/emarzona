/**
 * Hook pour gérer les paramètres de détection de conflits de ressources
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ResourceConflictSettings {
  id: string;
  store_id: string;
  auto_detect_conflicts: boolean;
  detect_interval_minutes: number;
  prevent_double_booking: boolean;
  check_resource_availability: boolean;
  check_capacity: boolean;
  check_time_slots: boolean;
  notify_on_conflict: boolean;
  auto_resolve_conflicts: boolean;
  conflict_resolution_method: 'manual' | 'auto' | 'suggest';
  created_at: string;
  updated_at: string;
}

const defaultSettings: Omit<ResourceConflictSettings, 'id' | 'store_id' | 'created_at' | 'updated_at'> = {
  auto_detect_conflicts: true,
  detect_interval_minutes: 30,
  prevent_double_booking: true,
  check_resource_availability: true,
  check_capacity: true,
  check_time_slots: true,
  notify_on_conflict: true,
  auto_resolve_conflicts: false,
  conflict_resolution_method: 'manual',
};

/**
 * Récupère les paramètres de détection de conflits pour un store
 */
export const useResourceConflictSettings = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ['resource-conflict-settings', storeId],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const { data, error } = await supabase
        .from('resource_conflict_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        // Si pas de données, retourner les valeurs par défaut
        if (error.code === 'PGRST116') {
          return {
            ...defaultSettings,
            store_id: storeId,
          } as ResourceConflictSettings;
        }
        logger.error('Error fetching resource conflict settings', { error, storeId });
        throw error;
      }

      // Si pas de données, retourner les valeurs par défaut
      if (!data) {
        return {
          ...defaultSettings,
          store_id: storeId,
        } as ResourceConflictSettings;
      }

      return data as ResourceConflictSettings;
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Sauvegarde ou met à jour les paramètres de détection de conflits
 */
export const useUpdateResourceConflictSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<ResourceConflictSettings> & { store_id: string }) => {
      if (!settings.store_id) {
        throw new Error('Store ID is required');
      }

      // Vérifier si les paramètres existent déjà
      const { data: existing } = await supabase
        .from('resource_conflict_settings')
        .select('id')
        .eq('store_id', settings.store_id)
        .maybeSingle();

      if (existing) {
        // Mise à jour
        const { data, error } = await supabase
          .from('resource_conflict_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          logger.error('Error updating resource conflict settings', { error, settings });
          throw error;
        }

        return data as ResourceConflictSettings;
      } else {
        // Création
        const { data, error } = await supabase
          .from('resource_conflict_settings')
          .insert({
            ...defaultSettings,
            ...settings,
          })
          .select()
          .single();

        if (error) {
          logger.error('Error creating resource conflict settings', { error, settings });
          throw error;
        }

        return data as ResourceConflictSettings;
      }
    },
    onSuccess: (data) => {
      // Invalider les queries liées
      queryClient.invalidateQueries({
        queryKey: ['resource-conflict-settings', data.store_id],
      });

      toast({
        title: '✅ Paramètres sauvegardés',
        description: 'Les paramètres de détection de conflits ont été sauvegardés avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error saving resource conflict settings', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder les paramètres',
        variant: 'destructive',
      });
    },
  });
};

