/**
 * Hooks pour les analytics de progression de cours
 * Tracking détaillé, snapshots, analytics agrégées
 * Date : 4 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface ProgressionSnapshot {
  id: string;
  course_id: string;
  enrollment_id: string;
  user_id: string;
  snapshot_date: string;
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  completed_sections: number;
  total_sections: number;
  total_watch_time_minutes: number;
  average_lesson_watch_time_minutes: number;
  last_activity_at: string;
  days_since_enrollment: number;
  days_active: number;
  average_quiz_score: number | null;
  quizzes_completed: number;
  quizzes_passed: number;
  assignments_submitted: number;
  assignments_passed: number;
  notes_count: number;
  forum_posts_count: number;
  forum_replies_count: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'dropped';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CourseProgressionAnalytics {
  id: string;
  course_id: string;
  analytics_date: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  dropped_enrollments: number;
  new_enrollments: number;
  average_progress: number;
  median_progress: number;
  average_completion_time_days: number | null;
  median_completion_time_days: number | null;
  students_0_25_percent: number;
  students_25_50_percent: number;
  students_50_75_percent: number;
  students_75_100_percent: number;
  students_completed: number;
  average_watch_time_minutes: number;
  total_watch_time_minutes: number;
  average_session_duration_minutes: number | null;
  average_quiz_score: number | null;
  average_assignment_score: number | null;
  pass_rate: number | null;
  average_notes_per_student: number;
  total_forum_posts: number;
  active_students_count: number;
  retention_rate_7d: number | null;
  retention_rate_30d: number | null;
  dropout_rate: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LessonAnalytics {
  id: string;
  course_id: string;
  lesson_id: string;
  analytics_date: string;
  total_views: number;
  unique_students_viewed: number;
  completion_rate: number;
  average_watch_time_minutes: number;
  total_watch_time_minutes: number;
  average_completion_time_minutes: number | null;
  average_rewatches: number;
  notes_count: number;
  exit_points: Array<{ time_seconds: number; count: number }>;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Hook pour récupérer les snapshots de progression d'un étudiant
 */
export const useStudentProgressionSnapshots = (
  enrollmentId: string | undefined,
  days: number = 30
) => {
  return useQuery({
    queryKey: ['progression-snapshots', enrollmentId, days],
    queryFn: async (): Promise<ProgressionSnapshot[]> => {
      if (!enrollmentId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('course_progression_snapshots')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet
          return [];
        }
        throw error;
      }

      return (data || []) as ProgressionSnapshot[];
    },
    enabled: !!enrollmentId,
  });
};

/**
 * Hook pour récupérer les analytics de progression d'un cours
 */
export const useCourseProgressionAnalytics = (courseId: string | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ['course-progression-analytics', courseId, days],
    queryFn: async (): Promise<CourseProgressionAnalytics[]> => {
      if (!courseId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('course_progression_analytics')
        .select('*')
        .eq('course_id', courseId)
        .gte('analytics_date', startDate.toISOString().split('T')[0])
        .order('analytics_date', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }

      return (data || []) as CourseProgressionAnalytics[];
    },
    enabled: !!courseId,
  });
};

/**
 * Hook pour récupérer les analytics d'une leçon
 */
export const useLessonAnalytics = (lessonId: string | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ['lesson-analytics', lessonId, days],
    queryFn: async (): Promise<LessonAnalytics[]> => {
      if (!lessonId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('course_lesson_analytics')
        .select('*')
        .eq('lesson_id', lessonId)
        .gte('analytics_date', startDate.toISOString().split('T')[0])
        .order('analytics_date', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }

      return (data || []) as LessonAnalytics[];
    },
    enabled: !!lessonId,
  });
};

/**
 * Hook pour récupérer les snapshots de progression d'un cours (tous les étudiants)
 */
export const useCourseProgressionSnapshots = (courseId: string | undefined, date?: string) => {
  return useQuery({
    queryKey: ['course-progression-snapshots', courseId, date],
    queryFn: async (): Promise<ProgressionSnapshot[]> => {
      if (!courseId) return [];

      let  query= supabase
        .from('course_progression_snapshots')
        .select('*')
        .eq('course_id', courseId);

      if (date) {
        query = query.eq('snapshot_date', date);
      } else {
        // Dernière date disponible
        query = query.order('snapshot_date', { ascending: false }).limit(1000);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }

      return (data || []) as ProgressionSnapshot[];
    },
    enabled: !!courseId,
  });
};

/**
 * Hook pour créer un snapshot de progression (manuel)
 */
export const useCreateProgressionSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('create_daily_progression_snapshot');

      if (error) {
        if (error.code === '42883') {
          // Function doesn't exist
          return { success: false, message: 'Function not available' };
        }
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['course-progression-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['course-progression-snapshots'] });
    },
  });
};

/**
 * Hook pour calculer les analytics d'un cours
 */
export const useCalculateCourseProgressionAnalytics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, date }: { courseId: string; date?: string }) => {
      const { error } = await supabase.rpc('calculate_course_progression_analytics', {
        p_course_id: courseId,
        p_analytics_date: date || new Date().toISOString().split('T')[0],
      });

      if (error) {
        if (error.code === '42883') {
          return { success: false, message: 'Function not available' };
        }
        throw error;
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['course-progression-analytics', variables.courseId],
      });
    },
  });
};






