/**
 * Gamification Hooks for Courses
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer la gamification : points, badges, achievements, leaderboard, streaks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface StudentPoints {
  id: string;
  enrollment_id: string;
  course_id: string;
  user_id: string;
  total_points: number;
  points_earned_today: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  total_lessons_completed: number;
  total_quizzes_passed: number;
  total_quizzes_perfect_score: number;
  total_discussions_participated: number;
  total_assignments_submitted: number;
  current_level: number;
  experience_points: number;
  created_at: string;
  updated_at: string;
}

export interface CourseBadge {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  icon_url?: string;
  badge_type: 'lesson_completion' | 'quiz_perfect' | 'streak' | 'engagement' | 'custom';
  points_required: number;
  criteria: Record<string, unknown>;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentBadge {
  id: string;
  badge_id: string;
  enrollment_id: string;
  course_id: string;
  user_id: string;
  earned_at: string;
  notification_sent: boolean;
  badge?: CourseBadge;
}

export interface CourseAchievement {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  icon_url?: string;
  achievement_type: 'completion' | 'perfect_score' | 'speed' | 'engagement' | 'streak' | 'custom';
  criteria: Record<string, unknown>;
  reward_points: number;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentAchievement {
  id: string;
  achievement_id: string;
  enrollment_id: string;
  course_id: string;
  user_id: string;
  earned_at: string;
  notification_sent: boolean;
  achievement?: CourseAchievement;
}

export interface PointsHistory {
  id: string;
  enrollment_id: string;
  user_id: string;
  points_earned: number;
  points_before: number;
  points_after: number;
  source_type: 'lesson_completed' | 'quiz_passed' | 'quiz_perfect' | 'discussion' | 'assignment' | 'streak' | 'achievement' | 'badge' | 'manual';
  source_id?: string;
  source_description?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  total_points: number;
  current_streak_days: number;
  total_lessons_completed: number;
  rank: number;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useStudentPoints - Récupère les points d'un étudiant
 */
export const useStudentPoints = (enrollmentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-points', enrollmentId],
    queryFn: async () => {
      if (!enrollmentId) throw new Error('Enrollment ID manquant');

      const { data, error } = await supabase
        .from('course_student_points')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .single();

      if (error) {
        logger.error('Error fetching student points', { error, enrollmentId });
        throw error;
      }

      return data as StudentPoints;
    },
    enabled: !!enrollmentId,
  });
};

/**
 * useStudentBadges - Récupère les badges d'un étudiant
 */
export const useStudentBadges = (enrollmentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-badges', enrollmentId],
    queryFn: async () => {
      if (!enrollmentId) throw new Error('Enrollment ID manquant');

      const { data, error } = await supabase
        .from('course_student_badges')
        .select(`
          *,
          badge:course_badges(*)
        `)
        .eq('enrollment_id', enrollmentId)
        .order('earned_at', { ascending: false });

      if (error) {
        logger.error('Error fetching student badges', { error, enrollmentId });
        throw error;
      }

      return (data || []) as StudentBadge[];
    },
    enabled: !!enrollmentId,
  });
};

/**
 * useStudentAchievements - Récupère les achievements d'un étudiant
 */
export const useStudentAchievements = (enrollmentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-achievements', enrollmentId],
    queryFn: async () => {
      if (!enrollmentId) throw new Error('Enrollment ID manquant');

      const { data, error } = await supabase
        .from('course_student_achievements')
        .select(`
          *,
          achievement:course_achievements(*)
        `)
        .eq('enrollment_id', enrollmentId)
        .order('earned_at', { ascending: false });

      if (error) {
        logger.error('Error fetching student achievements', { error, enrollmentId });
        throw error;
      }

      return (data || []) as StudentAchievement[];
    },
    enabled: !!enrollmentId,
  });
};

/**
 * useCourseBadges - Récupère tous les badges disponibles d'un cours
 */
export const useCourseBadges = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-badges', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID manquant');

      const { data, error } = await supabase
        .from('course_badges')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Error fetching course badges', { error, courseId });
        throw error;
      }

      return (data || []) as CourseBadge[];
    },
    enabled: !!courseId,
  });
};

/**
 * useCourseAchievements - Récupère tous les achievements disponibles d'un cours
 */
export const useCourseAchievements = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-achievements', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID manquant');

      const { data, error } = await supabase
        .from('course_achievements')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Error fetching course achievements', { error, courseId });
        throw error;
      }

      return (data || []) as CourseAchievement[];
    },
    enabled: !!courseId,
  });
};

/**
 * usePointsHistory - Récupère l'historique des points
 */
export const usePointsHistory = (enrollmentId: string | undefined, limit: number = 20) => {
  return useQuery({
    queryKey: ['points-history', enrollmentId, limit],
    queryFn: async () => {
      if (!enrollmentId) throw new Error('Enrollment ID manquant');

      const { data, error } = await supabase
        .from('course_points_history')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching points history', { error, enrollmentId });
        throw error;
      }

      return (data || []) as PointsHistory[];
    },
    enabled: !!enrollmentId,
  });
};

/**
 * useCourseLeaderboard - Récupère le leaderboard d'un cours
 */
export const useCourseLeaderboard = (courseId: string | undefined, limit: number = 10) => {
  return useQuery({
    queryKey: ['course-leaderboard', courseId, limit],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID manquant');

      const { data, error } = await supabase
        .from('course_student_points')
        .select(`
          user_id,
          total_points,
          current_streak_days,
          total_lessons_completed,
          user:auth.users!course_student_points_user_id_fkey (
            id,
            raw_user_meta_data
          )
        `)
        .eq('course_id', courseId)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching leaderboard', { error, courseId });
        throw error;
      }

      // Transform data
      type UserWithMetadata = {
        raw_user_meta_data?: {
          full_name?: string;
          avatar_url?: string;
        };
      };
      const leaderboard: LeaderboardEntry[] = (data || []).map((entry, index) => {
        const user = entry.user as UserWithMetadata | null;
        return {
          user_id: entry.user_id,
          user_name: user?.raw_user_meta_data?.full_name || 'Utilisateur',
          user_avatar: user?.raw_user_meta_data?.avatar_url,
          total_points: entry.total_points,
          current_streak_days: entry.current_streak_days,
          total_lessons_completed: entry.total_lessons_completed,
          rank: index + 1,
        };
      });

      return leaderboard;
    },
    enabled: !!courseId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useAwardPoints - Attribuer des points à un étudiant
 */
export const useAwardPoints = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      userId,
      points,
      sourceType,
      sourceId,
      sourceDescription,
    }: {
      enrollmentId: string;
      userId: string;
      points: number;
      sourceType: PointsHistory['source_type'];
      sourceId?: string;
      sourceDescription?: string;
    }) => {
      const { data, error } = await supabase.rpc('award_points', {
        p_enrollment_id: enrollmentId,
        p_user_id: userId,
        p_points: points,
        p_source_type: sourceType,
        p_source_id: sourceId || null,
        p_source_description: sourceDescription || null,
      });

      if (error) {
        logger.error('Error awarding points', { error, enrollmentId, points });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-points', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['points-history', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-badges', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-achievements', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['course-leaderboard'] });

      toast({
        title: '+ ' + variables.points + ' points ! 🎉',
        description: variables.sourceDescription || 'Points gagnés',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Impossible d\'attribuer les points';
      logger.error('Error in useAwardPoints', { error });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

/**
 * useMarkLessonCompleteWithPoints - Marquer une leçon comme complétée et attribuer des points
 */
export const useMarkLessonCompleteWithPoints = () => {
  const queryClient = useQueryClient();
  const markLessonComplete = useMutation({
    mutationFn: async ({
      enrollmentId,
      lessonId,
      userId,
      points = 10, // Points par défaut pour une leçon complétée
    }: {
      enrollmentId: string;
      lessonId: string;
      userId: string;
      points?: number;
    }) => {
      // D'abord marquer la leçon comme complétée
      const { data: lessonComplete, error: lessonError } = await supabase.rpc('mark_lesson_complete', {
        p_enrollment_id: enrollmentId,
        p_lesson_id: lessonId,
        p_user_id: userId,
      });

      if (lessonError) throw lessonError;

      // Ensuite attribuer des points
      const { data: pointsData, error: pointsError } = await supabase.rpc('award_points', {
        p_enrollment_id: enrollmentId,
        p_user_id: userId,
        p_points: points,
        p_source_type: 'lesson_completed',
        p_source_id: lessonId,
        p_source_description: 'Leçon complétée',
      });

      if (pointsError) {
        logger.error('Error awarding points for lesson', { error: pointsError });
        // Ne pas bloquer si les points échouent
      }

      return { lessonComplete, pointsData };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-points', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['course-leaderboard'] });
    },
  });

  return markLessonComplete;
};

/**
 * useCreateBadge - Créer un badge (instructeur)
 */
export const useCreateBadge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (badgeData: Partial<CourseBadge>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('course_badges')
        .insert({
          ...badgeData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating badge', { error, badgeData });
        throw error;
      }

      return data as CourseBadge;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-badges', data.course_id] });
      toast({
        title: '✅ Badge créé',
        description: 'Le badge a été créé avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de créer le badge';
      logger.error('Error in useCreateBadge', { error });
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreateAchievement - Créer un achievement (instructeur)
 */
export const useCreateAchievement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (achievementData: Partial<CourseAchievement>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('course_achievements')
        .insert({
          ...achievementData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating achievement', { error, achievementData });
        throw error;
      }

      return data as CourseAchievement;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-achievements', data.course_id] });
      toast({
        title: '✅ Achievement créé',
        description: 'L\'achievement a été créé avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de créer l\'achievement';
      logger.error('Error in useCreateAchievement', { error });
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

