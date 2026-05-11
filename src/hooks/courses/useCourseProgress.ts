import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LessonProgress } from '@/types/courses';
import { logger } from '@/lib/logger';

const LESSON_PROGRESS_FIELDS = 'id, enrollment_id, lesson_id, user_id, is_completed, completed_at, last_position_seconds, watch_time_seconds, times_watched, personal_notes, created_at, updated_at';

/**
 * Hook pour récupérer la progression d'une leçon
 * @param enrollmentId - ID de l'inscription
 * @param lessonId - ID de la leçon
 */
export const useLessonProgress = (enrollmentId: string | undefined, lessonId: string | undefined) => {
  return useQuery({
    queryKey: ['lesson-progress', enrollmentId, lessonId],
    queryFn: async () => {
      if (!enrollmentId || !lessonId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('course_lesson_progress')
        .select(LESSON_PROGRESS_FIELDS)
        .eq('enrollment_id', enrollmentId)
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de progression trouvée
          return null;
        }
        throw error;
      }

      return data as LessonProgress;
    },
    enabled: !!enrollmentId && !!lessonId,
  });
};

/**
 * Hook pour récupérer toutes les progressions d'un enrollment
 * @param enrollmentId - ID de l'inscription
 */
export const useAllLessonProgress = (enrollmentId: string | undefined) => {
  return useQuery({
    queryKey: ['all-lesson-progress', enrollmentId],
    queryFn: async () => {
      if (!enrollmentId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('course_lesson_progress')
        .select(LESSON_PROGRESS_FIELDS)
        .eq('enrollment_id', enrollmentId)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as LessonProgress[];
    },
    enabled: !!enrollmentId,
  });
};

/**
 * Hook pour mettre à jour la position vidéo d'une leçon
 */
export const useUpdateVideoPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      lessonId,
      position,
      watchTime,
    }: {
      enrollmentId: string;
      lessonId: string;
      position: number;
      watchTime: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Essayer de mettre à jour ou créer
      const { data: existing } = await supabase
        .from('course_lesson_progress')
        .select('id, watch_time_seconds, times_watched')
        .eq('enrollment_id', enrollmentId)
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Mise à jour
        const { data, error } = await supabase
          .from('course_lesson_progress')
          .update({
            last_position_seconds: position,
            watch_time_seconds: existing.watch_time_seconds + watchTime,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Création
        const { data, error } = await supabase
          .from('course_lesson_progress')
          .insert({
            enrollment_id: enrollmentId,
            lesson_id: lessonId,
            user_id: user.id,
            last_position_seconds: position,
            watch_time_seconds: watchTime,
            times_watched: 1,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['lesson-progress', variables.enrollmentId, variables.lessonId] 
      });
    },
  });
};

/**
 * Hook pour marquer une leçon comme complétée
 * Attribue automatiquement des points (10 points par défaut)
 */
export const useMarkLessonComplete = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      lessonId,
      points = 10, // Points par défaut pour une leçon complétée
    }: {
      enrollmentId: string;
      lessonId: string;
      points?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Utiliser la fonction SQL pour marquer comme complétée
      const { data, error } = await supabase.rpc('mark_lesson_complete', {
        p_enrollment_id: enrollmentId,
        p_lesson_id: lessonId,
        p_user_id: user.id,
      });

      if (error) throw error;

      // Attribuer des points automatiquement
      try {
        await supabase.rpc('award_points', {
          p_enrollment_id: enrollmentId,
          p_user_id: user.id,
          p_points: points,
          p_source_type: 'lesson_completed',
          p_source_id: lessonId,
          p_source_description: 'Leçon complétée',
        });
      } catch (pointsError) {
        // Ne pas bloquer si l'attribution de points échoue
        logger.error('Error awarding points for lesson', { error: pointsError, enrollmentId, lessonId });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['lesson-progress', variables.enrollmentId, variables.lessonId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['all-lesson-progress', variables.enrollmentId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['course-enrollment', variables.enrollmentId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['student-points', variables.enrollmentId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['course-leaderboard'] 
      });
      
      toast({
        title: 'Leçon complétée ! 🎉',
        description: `+${variables.points || 10} points gagnés !`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour ajouter une note à une leçon
 */
export const useAddLessonNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      lessonId,
      note,
    }: {
      enrollmentId: string;
      lessonId: string;
      note: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Récupérer ou créer le progress
      const { data: existing } = await supabase
        .from('course_lesson_progress')
        .select('id, personal_notes')
        .eq('enrollment_id', enrollmentId)
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Mise à jour
        const { data, error } = await supabase
          .from('course_lesson_progress')
          .update({
            personal_notes: note,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Création
        const { data, error } = await supabase
          .from('course_lesson_progress')
          .insert({
            enrollment_id: enrollmentId,
            lesson_id: lessonId,
            user_id: user.id,
            personal_notes: note,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['lesson-progress', variables.enrollmentId, variables.lessonId] 
      });
      
      toast({
        title: 'Note enregistrée',
        description: 'Votre note a été sauvegardée.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour calculer le pourcentage de progression d'un cours
 * @param enrollmentId - ID de l'inscription
 */
export const useCourseProgressPercentage = (enrollmentId: string | undefined) => {
  const { data: allProgress } = useAllLessonProgress(enrollmentId);

  if (!allProgress || allProgress.length === 0) {
    return {
      percentage: 0,
      completedLessons: 0,
      totalLessons: 0,
    };
  }

  const completedLessons = allProgress.filter(p => p.is_completed).length;
  const totalLessons = allProgress.length;
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    percentage,
    completedLessons,
    totalLessons,
  };
};







