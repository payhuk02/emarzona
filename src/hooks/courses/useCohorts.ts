/**
 * Course Cohorts Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les cohorts (groupes d'étudiants)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface CourseCohort {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  cohort_type: 'enrollment_date' | 'manual' | 'assignment' | 'skill_level' | 'custom';
  max_students?: number;
  is_active: boolean;
  is_private: boolean;
  start_date?: string;
  end_date?: string;
  enrollment_date_range_start?: string;
  enrollment_date_range_end?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface CohortMember {
  id: string;
  cohort_id: string;
  enrollment_id: string;
  user_id: string;
  role: 'student' | 'mentor' | 'leader' | 'moderator';
  status: 'active' | 'inactive' | 'removed';
  joined_at: string;
  left_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface CohortDiscussion {
  id: string;
  cohort_id: string;
  course_id: string;
  user_id: string;
  title: string;
  content: string;
  discussion_type: 'general' | 'assignment' | 'project' | 'question' | 'announcement';
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  replies_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface CohortInvitation {
  id: string;
  cohort_id: string;
  invited_by: string;
  email?: string;
  user_id?: string;
  invitation_token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at?: string;
  accepted_at?: string;
  created_at: string;
}

export interface CreateCohortData {
  course_id: string;
  name: string;
  description?: string;
  cohort_type: CourseCohort['cohort_type'];
  max_students?: number;
  is_private?: boolean;
  start_date?: string;
  end_date?: string;
  enrollment_date_range_start?: string;
  enrollment_date_range_end?: string;
  metadata?: Record<string, any>;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useCourseCohorts - Récupère tous les cohorts d'un cours
 */
export const useCourseCohorts = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-cohorts', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID manquant');

      const { data, error } = await supabase
        .from('course_cohorts')
        .select(`
          *,
          member_count:course_cohort_members(count)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching cohorts', { error, courseId });
        throw error;
      }

      return (data || []).map((cohort: any) => ({
        ...cohort,
        member_count: cohort.member_count?.[0]?.count || 0,
      })) as CourseCohort[];
    },
    enabled: !!courseId,
  });
};

/**
 * useCohort - Récupère un cohort spécifique
 */
export const useCohort = (cohortId: string | undefined) => {
  return useQuery({
    queryKey: ['cohort', cohortId],
    queryFn: async () => {
      if (!cohortId) throw new Error('Cohort ID manquant');

      const { data, error } = await supabase
        .from('course_cohorts')
        .select('*')
        .eq('id', cohortId)
        .single();

      if (error) {
        logger.error('Error fetching cohort', { error, cohortId });
        throw error;
      }

      return data as CourseCohort;
    },
    enabled: !!cohortId,
  });
};

/**
 * useCohortMembers - Récupère les membres d'un cohort
 */
export const useCohortMembers = (cohortId: string | undefined) => {
  return useQuery({
    queryKey: ['cohort-members', cohortId],
    queryFn: async () => {
      if (!cohortId) throw new Error('Cohort ID manquant');

      const { data, error } = await supabase
        .from('course_cohort_members')
        .select(`
          *,
          user:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('cohort_id', cohortId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (error) {
        logger.error('Error fetching cohort members', { error, cohortId });
        throw error;
      }

      return (data || []) as CohortMember[];
    },
    enabled: !!cohortId,
  });
};

/**
 * useStudentCohorts - Récupère les cohorts d'un étudiant pour un cours
 */
export const useStudentCohorts = (
  courseId: string | undefined,
  userId: string | undefined
) => {
  return useQuery({
    queryKey: ['student-cohorts', courseId, userId],
    queryFn: async () => {
      if (!courseId || !userId) throw new Error('IDs manquants');

      const { data, error } = await supabase.rpc('get_student_cohorts', {
        p_course_id: courseId,
        p_user_id: userId,
      });

      if (error) {
        logger.error('Error fetching student cohorts', { error, courseId, userId });
        throw error;
      }

      return (data || []) as Array<{
        cohort_id: string;
        cohort_name: string;
        cohort_type: string;
        role: string;
        member_count: number;
      }>;
    },
    enabled: !!courseId && !!userId,
  });
};

/**
 * useCohortDiscussions - Récupère les discussions d'un cohort
 */
export const useCohortDiscussions = (cohortId: string | undefined) => {
  return useQuery({
    queryKey: ['cohort-discussions', cohortId],
    queryFn: async () => {
      if (!cohortId) throw new Error('Cohort ID manquant');

      const { data, error } = await supabase
        .from('course_cohort_discussions')
        .select('*')
        .eq('cohort_id', cohortId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching cohort discussions', { error, cohortId });
        throw error;
      }

      return (data || []) as CohortDiscussion[];
    },
    enabled: !!cohortId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateCohort - Créer un cohort (instructeur)
 */
export const useCreateCohort = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cohortData: CreateCohortData) => {
      const { data, error } = await supabase
        .from('course_cohorts')
        .insert({
          ...cohortData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating cohort', { error, cohortData });
        throw error;
      }

      return data as CourseCohort;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-cohorts', data.course_id] });
      toast({
        title: '✅ Cohort créé',
        description: 'Le groupe a été créé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateCohort', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le cohort',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useAddCohortMember - Ajouter un membre au cohort
 */
export const useAddCohortMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      cohortId,
      enrollmentId,
      userId,
      role = 'student' as CohortMember['role'],
    }: {
      cohortId: string;
      enrollmentId: string;
      userId: string;
      role?: CohortMember['role'];
    }) => {
      const { data, error } = await supabase
        .from('course_cohort_members')
        .insert({
          cohort_id: cohortId,
          enrollment_id: enrollmentId,
          user_id: userId,
          role,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding cohort member', { error, cohortId });
        throw error;
      }

      return data as CohortMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohort-members', variables.cohortId] });
      queryClient.invalidateQueries({ queryKey: ['course-cohorts'] });
      toast({
        title: '✅ Membre ajouté',
        description: 'Le membre a été ajouté au groupe',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useAddCohortMember', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ajouter le membre',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useRemoveCohortMember - Retirer un membre du cohort
 */
export const useRemoveCohortMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('course_cohort_members')
        .update({
          status: 'removed',
          left_at: new Date().toISOString(),
        })
        .eq('id', memberId);

      if (error) {
        logger.error('Error removing cohort member', { error, memberId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] });
      queryClient.invalidateQueries({ queryKey: ['course-cohorts'] });
      toast({
        title: '✅ Membre retiré',
        description: 'Le membre a été retiré du groupe',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useRemoveCohortMember', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de retirer le membre',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useAutoAssignCohorts - Assignation automatique aux cohorts
 */
export const useAutoAssignCohorts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('auto_assign_cohort_by_enrollment_date');

      if (error) {
        logger.error('Error auto-assigning cohorts', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort-members'] });
      toast({
        title: '✅ Assignation automatique',
        description: 'Les étudiants ont été assignés aux cohorts',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useAutoAssignCohorts', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'assigner automatiquement',
        variant: 'destructive',
      });
    },
  });
};

