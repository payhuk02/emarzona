/**
 * Hook pour gérer les préférences de style utilisateur
 * Sauvegarde et récupération des profils de style personnalisés
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import type { StyleProfile } from '@/components/personalization/StyleQuiz';

interface StylePreferences {
  id: string;
  user_id: string;
  profile: StyleProfile;
  quiz_completed_at: string;
  recommendations_viewed: number;
  last_updated: string;
}

export function useStylePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer les préférences de style actuelles
  const {
    data: preferences,
    isLoading,
    error
  } = useQuery({
    queryKey: ['style-preferences', user?.id],
    queryFn: async (): Promise<StylePreferences | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_style_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Error fetching style preferences', { error, userId: user.id });
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sauvegarder les préférences de style
  const saveMutation = useMutation({
    mutationFn: async (profile: StyleProfile): Promise<StylePreferences> => {
      if (!user?.id) {
        throw new Error('User must be authenticated');
      }

      const now = new Date().toISOString();
      const preferencesData = {
        user_id: user.id,
        profile,
        quiz_completed_at: now,
        last_updated: now,
        recommendations_viewed: 0
      };

      // Upsert les préférences
      const { data, error } = await supabase
        .from('user_style_preferences')
        .upsert(preferencesData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving style preferences', { error, userId: user.id, profile });
        throw error;
      }

      logger.info('Style preferences saved successfully', { userId: user.id });
      return data;
    },
    onSuccess: () => {
      // Invalider et refetch les préférences
      queryClient.invalidateQueries({ queryKey: ['style-preferences', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['product-recommendations'] });
    },
    onError: (error) => {
      logger.error('Failed to save style preferences', { error, userId: user?.id });
    }
  });

  // Mettre à jour le compteur de recommandations vues
  const updateRecommendationsViewed = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id || !preferences?.id) return;

      const { error } = await supabase
        .from('user_style_preferences')
        .update({
          recommendations_viewed: (preferences.recommendations_viewed || 0) + 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', preferences.id);

      if (error) {
        logger.error('Error updating recommendations viewed count', { error, userId: user.id });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-preferences', user?.id] });
    }
  });

  // Supprimer les préférences (reset)
  const deleteMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('user_style_preferences')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error deleting style preferences', { error, userId: user.id });
        throw error;
      }

      logger.info('Style preferences deleted', { userId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-preferences', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['product-recommendations'] });
    }
  });

  return {
    preferences,
    isLoading,
    error,
    saveStylePreferences: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    updateRecommendationsViewed: updateRecommendationsViewed.mutateAsync,
    deleteStylePreferences: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    hasCompletedQuiz: !!preferences?.quiz_completed_at,
    profile: preferences?.profile || null,
    recommendationsViewedCount: preferences?.recommendations_viewed || 0
  };
}