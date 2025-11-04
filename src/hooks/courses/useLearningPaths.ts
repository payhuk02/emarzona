/**
 * Learning Paths Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les parcours d'apprentissage (Learning Paths)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

// =====================================================
// TYPES
// =====================================================

export interface LearningPath {
  id: string;
  store_id: string;
  created_by: string;
  title: string;
  description?: string;
  short_description?: string;
  image_url?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  estimated_duration_hours?: number;
  estimated_duration_days?: number;
  is_active: boolean;
  is_featured: boolean;
  is_free: boolean;
  price: number;
  currency: string;
  learning_objectives: string[];
  target_audience: string[];
  total_courses: number;
  total_students: number;
  completion_rate: number;
  average_rating: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  courses?: PathCourse[];
}

export interface PathCourse {
  id: string;
  learning_path_id: string;
  course_id: string;
  order_index: number;
  is_required: boolean;
  unlock_after_completion: boolean;
  estimated_duration_hours?: number;
  created_at: string;
  course?: {
    id: string;
    product_id: string;
    level: string;
    total_lessons: number;
    total_duration_minutes: number;
    product?: {
      id: string;
      name: string;
      slug: string;
      price: number;
      image_url?: string;
    };
  };
}

export interface PathEnrollment {
  id: string;
  learning_path_id: string;
  user_id: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  current_course_index: number;
  completed_courses_count: number;
  total_courses_count: number;
  progress_percentage: number;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
  learning_path?: LearningPath;
}

export interface CreateLearningPathData {
  store_id: string;
  title: string;
  description?: string;
  short_description?: string;
  image_url?: string;
  level?: LearningPath['level'];
  estimated_duration_hours?: number;
  estimated_duration_days?: number;
  is_free?: boolean;
  price?: number;
  currency?: string;
  learning_objectives?: string[];
  target_audience?: string[];
  display_order?: number;
}

export interface AddCourseToPathData {
  learning_path_id: string;
  course_id: string;
  order_index: number;
  is_required?: boolean;
  unlock_after_completion?: boolean;
  estimated_duration_hours?: number;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useLearningPaths - Récupère tous les learning paths d'un store
 */
export const useLearningPaths = (storeId?: string) => {
  return useQuery({
    queryKey: ['learning-paths', storeId],
    queryFn: async () => {
      let query = supabase
        .from('learning_paths')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching learning paths', { error, storeId });
        throw error;
      }

      return (data || []) as LearningPath[];
    },
  });
};

/**
 * useLearningPath - Récupère un learning path spécifique avec ses cours
 */
export const useLearningPath = (pathId: string | undefined) => {
  return useQuery({
    queryKey: ['learning-path', pathId],
    queryFn: async () => {
      if (!pathId) throw new Error('Path ID manquant');

      // Récupérer le path
      const { data: path, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', pathId)
        .single();

      if (pathError) {
        logger.error('Error fetching learning path', { error: pathError, pathId });
        throw pathError;
      }

      // Récupérer les cours du path
      const { data: pathCourses, error: coursesError } = await supabase
        .from('learning_path_courses')
        .select(`
          *,
          course:courses (
            id,
            product_id,
            level,
            total_lessons,
            total_duration_minutes,
            product:products (
              id,
              name,
              slug,
              price,
              image_url
            )
          )
        `)
        .eq('learning_path_id', pathId)
        .order('order_index', { ascending: true });

      if (coursesError) {
        logger.error('Error fetching path courses', { error: coursesError, pathId });
        throw coursesError;
      }

      return {
        ...path,
        courses: (pathCourses || []) as PathCourse[],
      } as LearningPath;
    },
    enabled: !!pathId,
  });
};

/**
 * useStudentLearningPaths - Récupère les learning paths d'un étudiant
 */
export const useStudentLearningPaths = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['student-learning-paths', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID manquant');

      const { data, error } = await supabase
        .from('learning_path_enrollments')
        .select(`
          *,
          learning_path:learning_paths (*)
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        logger.error('Error fetching student learning paths', { error, userId });
        throw error;
      }

      return (data || []) as PathEnrollment[];
    },
    enabled: !!userId,
  });
};

/**
 * usePathEnrollment - Récupère l'enrollment d'un étudiant pour un path
 */
export const usePathEnrollment = (
  pathId: string | undefined,
  userId: string | undefined
) => {
  return useQuery({
    queryKey: ['path-enrollment', pathId, userId],
    queryFn: async () => {
      if (!pathId || !userId) throw new Error('IDs manquants');

      const { data, error } = await supabase
        .from('learning_path_enrollments')
        .select('*')
        .eq('learning_path_id', pathId)
        .eq('user_id', userId)
        .single();

      if (error) {
        // Si pas d'enrollment, retourner null au lieu d'erreur
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Error fetching path enrollment', { error, pathId, userId });
        throw error;
      }

      return data as PathEnrollment;
    },
    enabled: !!pathId && !!userId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateLearningPath - Créer un learning path
 */
export const useCreateLearningPath = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pathData: CreateLearningPathData) => {
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('learning_paths')
        .insert({
          ...pathData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating learning path', { error, pathData });
        throw error;
      }

      return data as LearningPath;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['learning-paths', data.store_id] });
      toast({
        title: '✅ Parcours créé',
        description: 'Le parcours d\'apprentissage a été créé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateLearningPath', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le parcours',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useAddCourseToPath - Ajouter un cours à un path
 */
export const useAddCourseToPath = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseData: AddCourseToPathData) => {
      const { data, error } = await supabase
        .from('learning_path_courses')
        .insert({
          ...courseData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding course to path', { error, courseData });
        throw error;
      }

      // Mettre à jour total_courses
      await supabase.rpc('update_path_stats', {
        p_path_id: courseData.learning_path_id,
      });

      return data as PathCourse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['learning-path', data.learning_path_id] });
      toast({
        title: '✅ Cours ajouté',
        description: 'Le cours a été ajouté au parcours',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useAddCourseToPath', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ajouter le cours',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useEnrollInPath - S'inscrire à un learning path
 */
export const useEnrollInPath = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      pathId,
      userId,
      totalCourses,
    }: {
      pathId: string;
      userId: string;
      totalCourses: number;
    }) => {
      const { data, error } = await supabase
        .from('learning_path_enrollments')
        .insert({
          learning_path_id: pathId,
          user_id: userId,
          status: 'active',
          current_course_index: 0,
          completed_courses_count: 0,
          total_courses_count: totalCourses,
          progress_percentage: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error enrolling in path', { error, pathId });
        throw error;
      }

      return data as PathEnrollment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['path-enrollment', variables.pathId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['student-learning-paths', variables.userId] });
      toast({
        title: '✅ Inscription réussie',
        description: 'Vous êtes inscrit au parcours',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useEnrollInPath', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de s\'inscrire',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdatePathProgress - Mettre à jour la progression d'un path
 */
export const useUpdatePathProgress = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      courseId,
    }: {
      enrollmentId: string;
      courseId: string;
    }) => {
      const { data, error } = await supabase.rpc('update_path_progress', {
        p_path_enrollment_id: enrollmentId,
        p_course_id: courseId,
      });

      if (error) {
        logger.error('Error updating path progress', { error, enrollmentId });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['path-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['student-learning-paths'] });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdatePathProgress', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour la progression',
        variant: 'destructive',
      });
    },
  });
};

