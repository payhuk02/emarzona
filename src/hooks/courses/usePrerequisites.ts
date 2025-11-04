/**
 * Course Prerequisites Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les prérequis avancés avec validation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface CoursePrerequisite {
  id: string;
  course_id: string;
  prerequisite_type: 'course' | 'quiz' | 'assignment' | 'skill_level' | 'custom';
  required_course_id?: string;
  required_quiz_id?: string;
  required_assignment_id?: string;
  required_skill_level?: string;
  custom_requirement?: string;
  require_completion: boolean;
  require_passing_score: boolean;
  minimum_score?: number;
  minimum_progress_percentage: number;
  is_required: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  required_course?: {
    id: string;
    product_id: string;
    product?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface PrerequisiteValidation {
  id: string;
  prerequisite_id: string;
  enrollment_id: string;
  user_id: string;
  is_validated: boolean;
  validation_type: 'automatic' | 'manual' | 'waived';
  validated_at?: string;
  validated_by?: string;
  validation_details: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
  prerequisite?: CoursePrerequisite;
}

export interface CreatePrerequisiteData {
  course_id: string;
  prerequisite_type: CoursePrerequisite['prerequisite_type'];
  required_course_id?: string;
  required_quiz_id?: string;
  required_assignment_id?: string;
  required_skill_level?: string;
  custom_requirement?: string;
  require_completion?: boolean;
  require_passing_score?: boolean;
  minimum_score?: number;
  minimum_progress_percentage?: number;
  is_required?: boolean;
  order_index?: number;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useCoursePrerequisites - Récupère les prérequis d'un cours
 */
export const useCoursePrerequisites = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-prerequisites', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID manquant');

      const { data, error } = await supabase
        .from('course_prerequisites')
        .select(`
          *,
          required_course:courses!required_course_id (
            id,
            product_id,
            product:products (
              id,
              name,
              slug
            )
          )
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) {
        logger.error('Error fetching prerequisites', { error, courseId });
        throw error;
      }

      return (data || []) as CoursePrerequisite[];
    },
    enabled: !!courseId,
  });
};

/**
 * usePrerequisiteValidations - Récupère les validations d'un étudiant
 */
export const usePrerequisiteValidations = (
  courseId: string | undefined,
  enrollmentId: string | undefined
) => {
  return useQuery({
    queryKey: ['prerequisite-validations', courseId, enrollmentId],
    queryFn: async () => {
      if (!courseId || !enrollmentId) throw new Error('IDs manquants');

      // D'abord récupérer les IDs des prérequis
      const { data: prerequisites } = await supabase
        .from('course_prerequisites')
        .select('id')
        .eq('course_id', courseId);

      const prerequisiteIds = (prerequisites || []).map(p => p.id);

      if (prerequisiteIds.length === 0) {
        return [];
      }

      // Puis récupérer les validations
      const { data, error } = await supabase
        .from('course_prerequisite_validations')
        .select(`
          *,
          prerequisite:course_prerequisites (*)
        `)
        .eq('enrollment_id', enrollmentId)
        .in('prerequisite_id', prerequisiteIds);

      if (error) {
        logger.error('Error fetching validations', { error, courseId, enrollmentId });
        throw error;
      }

      return (data || []) as PrerequisiteValidation[];
    },
    enabled: !!courseId && !!enrollmentId,
  });
};

/**
 * useCheckCourseAccess - Vérifie si un utilisateur a accès à un cours
 */
export const useCheckCourseAccess = (
  courseId: string | undefined,
  userId: string | undefined
) => {
  return useQuery({
    queryKey: ['course-access', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) throw new Error('IDs manquants');

      const { data, error } = await supabase.rpc('check_course_access', {
        p_course_id: courseId,
        p_user_id: userId,
      });

      if (error) {
        logger.error('Error checking course access', { error, courseId, userId });
        throw error;
      }

      return data as boolean;
    },
    enabled: !!courseId && !!userId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useValidatePrerequisite - Valider un prérequis
 */
export const useValidatePrerequisite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      prerequisiteId,
      enrollmentId,
      userId,
    }: {
      prerequisiteId: string;
      enrollmentId: string;
      userId: string;
    }) => {
      const { data, error } = await supabase.rpc('validate_course_prerequisite', {
        p_prerequisite_id: prerequisiteId,
        p_enrollment_id: enrollmentId,
        p_user_id: userId,
      });

      if (error) {
        logger.error('Error validating prerequisite', { error, prerequisiteId });
        throw error;
      }

      return data as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prerequisite-validations'] });
      queryClient.invalidateQueries({ queryKey: ['course-access'] });
    },
    onError: (error: any) => {
      logger.error('Error in useValidatePrerequisite', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de valider le prérequis',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreatePrerequisite - Créer un prérequis (instructeur)
 */
export const useCreatePrerequisite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (prerequisiteData: CreatePrerequisiteData) => {
      const { data, error } = await supabase
        .from('course_prerequisites')
        .insert({
          ...prerequisiteData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating prerequisite', { error, prerequisiteData });
        throw error;
      }

      return data as CoursePrerequisite;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-prerequisites', data.course_id] });
      toast({
        title: '✅ Prérequis créé',
        description: 'Le prérequis a été ajouté avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreatePrerequisite', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le prérequis',
        variant: 'destructive',
      });
    },
  });
};

