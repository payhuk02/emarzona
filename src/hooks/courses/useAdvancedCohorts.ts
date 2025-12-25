/**
 * Hooks pour la gestion avancée des cohorts de cours
 * Date: 1 Février 2025
 * 
 * Système de cohorts avancé avec analytics et progression
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface CourseCohort {
  id: string;
  course_id: string;
  store_id: string;
  cohort_name: string;
  cohort_slug: string;
  cohort_description?: string;
  cohort_number?: number;
  start_date: string;
  end_date?: string;
  enrollment_start_date?: string;
  enrollment_end_date?: string;
  max_students?: number;
  current_students: number;
  waitlist_enabled: boolean;
  waitlist_capacity: number;
  status: 'draft' | 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
  is_public: boolean;
  allow_late_enrollment: boolean;
  auto_start: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

export interface CohortEnrollment {
  id: string;
  cohort_id: string;
  student_id: string;
  order_id?: string;
  enrollment_status: 'pending' | 'confirmed' | 'active' | 'completed' | 'dropped' | 'cancelled';
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  dropped_at?: string;
  progress_percentage: number;
  last_accessed_at?: string;
  final_grade?: number;
  certificate_issued: boolean;
  certificate_issued_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface CohortAnalytics {
  id: string;
  cohort_id: string;
  analytics_date: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  dropped_enrollments: number;
  average_progress: number;
  median_progress: number;
  students_completed: number;
  students_in_progress: number;
  students_not_started: number;
  average_time_spent_minutes: number;
  total_lessons_completed: number;
  total_assignments_submitted: number;
  total_quizzes_completed: number;
  average_grade?: number;
  median_grade?: number;
  pass_rate?: number;
  retention_rate?: number;
  dropout_rate?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CohortProgressSnapshot {
  id: string;
  cohort_id: string;
  enrollment_id: string;
  snapshot_date: string;
  progress_percentage: number;
  lessons_completed: number;
  assignments_submitted: number;
  quizzes_completed: number;
  time_spent_minutes: number;
  last_accessed_at?: string;
  current_grade?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Récupérer tous les cohorts d'un cours
 */
export function useCourseCohorts(courseId: string) {
  return useQuery({
    queryKey: ['course-cohorts', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_cohorts')
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('course_id', courseId)
        .order('cohort_number', { ascending: true });

      if (error) {
        logger.error('Error fetching course cohorts', { error });
        throw error;
      }

      return data as CourseCohort[];
    },
    enabled: !!courseId,
  });
}

/**
 * Récupérer tous les cohorts d'un store
 */
export function useStoreCohorts(storeId: string) {
  return useQuery({
    queryKey: ['store-cohorts', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_cohorts')
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('store_id', storeId)
        .order('start_date', { ascending: false });

      if (error) {
        logger.error('Error fetching store cohorts', { error });
        throw error;
      }

      return data as CourseCohort[];
    },
    enabled: !!storeId,
  });
}

/**
 * Récupérer un cohort spécifique
 */
export function useCohort(cohortId: string) {
  return useQuery({
    queryKey: ['cohort', cohortId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_cohorts')
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('id', cohortId)
        .single();

      if (error) {
        logger.error('Error fetching cohort', { error });
        throw error;
      }

      return data as CourseCohort;
    },
    enabled: !!cohortId,
  });
}

/**
 * Récupérer les inscriptions d'un cohort
 */
export function useCohortEnrollments(cohortId: string) {
  return useQuery({
    queryKey: ['cohort-enrollments', cohortId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cohort_enrollments')
        .select(`
          *,
          student:student_id (
            id,
            email,
            user_metadata
          )
        `)
        .eq('cohort_id', cohortId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        logger.error('Error fetching cohort enrollments', { error });
        throw error;
      }

      return data as CohortEnrollment[];
    },
    enabled: !!cohortId,
  });
}

/**
 * Récupérer les analytics d'un cohort
 */
export function useCohortAnalytics(cohortId: string) {
  return useQuery({
    queryKey: ['cohort-analytics', cohortId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cohort_analytics')
        .select('*')
        .eq('cohort_id', cohortId)
        .order('analytics_date', { ascending: false })
        .limit(30);

      if (error) {
        logger.error('Error fetching cohort analytics', { error });
        throw error;
      }

      return data as CohortAnalytics[];
    },
    enabled: !!cohortId,
  });
}

/**
 * Calculer les analytics d'un cohort
 */
export function useCalculateCohortAnalytics() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ cohortId, date }: { cohortId: string; date?: string }) => {
      const { data, error } = await supabase.rpc('calculate_cohort_analytics', {
        p_cohort_id: cohortId,
        p_date: date || new Date().toISOString().split('T')[0],
      });

      if (error) {
        logger.error('Error calculating cohort analytics', { error });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohort-analytics', variables.cohortId] });
      toast({
        title: 'Analytics calculés',
        description: 'Les analytics du cohort ont été calculés avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de calculer les analytics.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Créer un nouveau cohort
 */
export function useCreateCohort() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cohortData: Partial<CourseCohort>) => {
      // Générer le slug si non fourni
      let slug = cohortData.cohort_slug;
      if (!slug && cohortData.cohort_name) {
        slug = cohortData.cohort_name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      const { data, error } = await supabase
        .from('course_cohorts')
        .insert({
          ...cohortData,
          cohort_slug: slug,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating cohort', { error });
        throw error;
      }

      return data as CourseCohort;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['store-cohorts'] });
      toast({
        title: 'Cohort créé',
        description: 'Le cohort a été créé avec succès.',
      });
      logger.info('Cohort created', { cohortId: data.id });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le cohort.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour un cohort
 */
export function useUpdateCohort() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseCohort> & { id: string }) => {
      const { data, error } = await supabase
        .from('course_cohorts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating cohort', { error });
        throw error;
      }

      return data as CourseCohort;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohort', data.id] });
      queryClient.invalidateQueries({ queryKey: ['course-cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['store-cohorts'] });
      toast({
        title: 'Cohort mis à jour',
        description: 'Le cohort a été mis à jour avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le cohort.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Supprimer un cohort
 */
export function useDeleteCohort() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cohortId: string) => {
      const { error } = await supabase
        .from('course_cohorts')
        .delete()
        .eq('id', cohortId);

      if (error) {
        logger.error('Error deleting cohort', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['store-cohorts'] });
      toast({
        title: 'Cohort supprimé',
        description: 'Le cohort a été supprimé avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le cohort.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Créer une inscription à un cohort
 */
export function useEnrollInCohort() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ cohortId, studentId, orderId }: { cohortId: string; studentId: string; orderId?: string }) => {
      const { data, error } = await supabase
        .from('cohort_enrollments')
        .insert({
          cohort_id: cohortId,
          student_id: studentId,
          order_id: orderId,
          enrollment_status: 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error enrolling in cohort', { error });
        throw error;
      }

      return data as CohortEnrollment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohort-enrollments', variables.cohortId] });
      queryClient.invalidateQueries({ queryKey: ['cohort', variables.cohortId] });
      toast({
        title: 'Inscription créée',
        description: 'Votre inscription au cohort a été créée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'inscription.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour le statut d'une inscription
 */
export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      status,
      ...updates
    }: {
      enrollmentId: string;
      status: CohortEnrollment['enrollment_status'];
      started_at?: string;
      completed_at?: string;
      dropped_at?: string;
    }) => {
      const updateData: any = { enrollment_status: status };
      
      if (status === 'active' && !updates.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      if (status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
      if (status === 'dropped' && !updates.dropped_at) {
        updateData.dropped_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('cohort_enrollments')
        .update({ ...updateData, ...updates })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating enrollment status', { error });
        throw error;
      }

      return data as CohortEnrollment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohort-enrollments', data.cohort_id] });
      queryClient.invalidateQueries({ queryKey: ['cohort', data.cohort_id] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de l\'inscription a été mis à jour.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le statut.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Récupérer les snapshots de progression d'un cohort
 */
export function useCohortProgressSnapshots(cohortId: string, enrollmentId?: string) {
  return useQuery({
    queryKey: ['cohort-snapshots', cohortId, enrollmentId],
    queryFn: async () => {
      let query = supabase
        .from('cohort_progress_snapshots')
        .select('*')
        .eq('cohort_id', cohortId);

      if (enrollmentId) {
        query = query.eq('enrollment_id', enrollmentId);
      }

      const { data, error } = await query.order('snapshot_date', { ascending: false });

      if (error) {
        logger.error('Error fetching progress snapshots', { error });
        throw error;
      }

      return data as CohortProgressSnapshot[];
    },
    enabled: !!cohortId,
  });
}

