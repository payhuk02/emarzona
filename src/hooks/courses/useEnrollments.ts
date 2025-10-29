/**
 * useEnrollments - Hook pour la gestion des inscriptions
 * 
 * Fournit toutes les opérations pour les inscriptions aux cours :
 * - Listing et filtrage
 * - Création et mise à jour
 * - Gestion du statut
 * - Suivi de la progression
 * - Gestion de l'accès
 * 
 * @author Payhuk Team
 * @date 29 Octobre 2025
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EnrollmentStatus } from '@/components/courses/EnrollmentInfoDisplay';

/**
 * Interface pour une inscription
 */
export interface Enrollment {
  id: string;
  course_id: string;
  course_name?: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  status: EnrollmentStatus;
  progress: number; // 0-100
  completed_lessons: number;
  total_lessons: number;
  time_spent: number; // minutes
  enrolled_at: string;
  last_activity_at?: string;
  expiry_date?: string;
  amount_paid: number;
  payment_method?: string;
  has_certificate: boolean;
  average_score?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Données pour créer une inscription
 */
export interface EnrollmentCreateData {
  course_id: string;
  student_id: string;
  amount_paid: number;
  payment_method?: string;
  expiry_date?: string;
}

/**
 * Données pour mettre à jour une inscription
 */
export interface EnrollmentUpdateData {
  status?: EnrollmentStatus;
  progress?: number;
  completed_lessons?: number;
  time_spent?: number;
  last_activity_at?: string;
  has_certificate?: boolean;
  average_score?: number;
}

/**
 * Filtres pour les inscriptions
 */
export interface EnrollmentFilters {
  status?: EnrollmentStatus;
  course_id?: string;
  student_id?: string;
  search?: string;
}

/**
 * Statistiques des inscriptions
 */
export interface EnrollmentStats {
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  total_revenue: number;
  avg_progress: number;
  avg_completion_time: number; // jours
  by_status: Record<EnrollmentStatus, number>;
}

/**
 * Événement de progression
 */
export interface ProgressEvent {
  enrollment_id: string;
  lesson_id: string;
  lesson_title: string;
  completed_at: string;
  score?: number;
}

/**
 * Hook useEnrollments
 */
export const useEnrollments = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EnrollmentFilters>({});

  /**
   * Récupérer toutes les inscriptions avec filtres
   */
  const { data: enrollments, isLoading, error, refetch } = useQuery({
    queryKey: ['enrollments', filters],
    queryFn: async () => {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(name),
          students:auth.users!inner(email, raw_user_meta_data)
        `)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.course_id) {
        query = query.eq('course_id', filters.course_id);
      }
      if (filters.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters.search) {
        query = query.or(`course_name.ilike.%${filters.search}%,student_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Enrollment[];
    },
  });

  /**
   * Récupérer une inscription par ID
   */
  const useEnrollmentById = (enrollmentId: string) => {
    return useQuery({
      queryKey: ['enrollment', enrollmentId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            courses!inner(name, total_lessons),
            students:auth.users!inner(email, raw_user_meta_data)
          `)
          .eq('id', enrollmentId)
          .single();

        if (error) throw error;
        return data as Enrollment;
      },
      enabled: !!enrollmentId,
    });
  };

  /**
   * Récupérer les inscriptions d'un cours
   */
  const useEnrollmentsByCourse = (courseId: string) => {
    return useQuery({
      queryKey: ['enrollments-by-course', courseId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('enrollments')
          .select('*')
          .eq('course_id', courseId)
          .order('enrolled_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Enrollment[];
      },
      enabled: !!courseId,
    });
  };

  /**
   * Récupérer les inscriptions d'un étudiant
   */
  const useEnrollmentsByStudent = (studentId: string) => {
    return useQuery({
      queryKey: ['enrollments-by-student', studentId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            courses!inner(name, instructor_name, thumbnail_url)
          `)
          .eq('student_id', studentId)
          .order('enrolled_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Enrollment[];
      },
      enabled: !!studentId,
    });
  };

  /**
   * Récupérer les statistiques
   */
  const { data: stats } = useQuery({
    queryKey: ['enrollment-stats'],
    queryFn: async () => {
      const { data: allEnrollments, error } = await supabase
        .from('enrollments')
        .select('*');

      if (error) throw error;

      const enrollments = (allEnrollments || []) as Enrollment[];

      // Calculer les statistiques
      const stats: EnrollmentStats = {
        total_enrollments: enrollments.length,
        active_enrollments: enrollments.filter(e => e.status === 'active').length,
        completed_enrollments: enrollments.filter(e => e.status === 'completed').length,
        total_revenue: enrollments.reduce((sum, e) => sum + e.amount_paid, 0),
        avg_progress:
          enrollments.length > 0
            ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
            : 0,
        avg_completion_time: 0, // TODO: Calculer depuis created_at et completed_at
        by_status: {} as Record<EnrollmentStatus, number>,
      };

      // Par statut
      enrollments.forEach(enrollment => {
        stats.by_status[enrollment.status] = (stats.by_status[enrollment.status] || 0) + 1;
      });

      return stats;
    },
  });

  /**
   * Créer une inscription
   */
  const createEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentData: EnrollmentCreateData) => {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          ...enrollmentData,
          status: 'pending',
          progress: 0,
          completed_lessons: 0,
          time_spent: 0,
          has_certificate: false,
          enrolled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Enrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
    },
  });

  /**
   * Mettre à jour une inscription
   */
  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: EnrollmentUpdateData }) => {
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Enrollment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
    },
  });

  /**
   * Mettre à jour le statut d'une inscription
   */
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EnrollmentStatus }) => {
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Enrollment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
    },
  });

  /**
   * Enregistrer la progression d'une leçon
   */
  const recordProgressMutation = useMutation({
    mutationFn: async (progressEvent: ProgressEvent) => {
      // Récupérer l'inscription actuelle
      const { data: enrollment, error: fetchError } = await supabase
        .from('enrollments')
        .select('*, courses!inner(total_lessons)')
        .eq('id', progressEvent.enrollment_id)
        .single();

      if (fetchError) throw fetchError;

      const newCompletedLessons = enrollment.completed_lessons + 1;
      const totalLessons = enrollment.courses.total_lessons;
      const newProgress = Math.round((newCompletedLessons / totalLessons) * 100);

      // Mettre à jour la progression
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          completed_lessons: newCompletedLessons,
          progress: newProgress,
          last_activity_at: new Date().toISOString(),
          status: newProgress === 100 ? 'completed' : enrollment.status,
        })
        .eq('id', progressEvent.enrollment_id)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'événement de progression
      await supabase.from('enrollment_events').insert({
        enrollment_id: progressEvent.enrollment_id,
        type: 'lesson_completed',
        metadata: {
          lesson_id: progressEvent.lesson_id,
          lesson_title: progressEvent.lesson_title,
          score: progressEvent.score,
          progress_percentage: newProgress,
        },
      });

      return data as Enrollment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.enrollment_id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-events'] });
    },
  });

  /**
   * Générer un certificat
   */
  const generateCertificateMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      // Vérifier que le cours est terminé
      const { data: enrollment, error: fetchError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', enrollmentId)
        .single();

      if (fetchError) throw fetchError;

      if (enrollment.progress < 100) {
        throw new Error('Le cours doit être terminé pour générer un certificat');
      }

      // Mettre à jour l'inscription
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          has_certificate: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'événement
      await supabase.from('enrollment_events').insert({
        enrollment_id: enrollmentId,
        type: 'certificate_issued',
        metadata: {
          certificate_id: `CERT-${enrollmentId}`,
        },
      });

      return data as Enrollment;
    },
    onSuccess: (_, enrollmentId) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-events'] });
    },
  });

  /**
   * Rembourser une inscription
   */
  const refundEnrollmentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Enregistrer l'événement
      await supabase.from('enrollment_events').insert({
        enrollment_id: id,
        type: 'refund_issued',
        metadata: {
          refund_reason: reason,
          amount: data.amount_paid,
          currency: 'EUR',
        },
      });

      return data as Enrollment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-events'] });
    },
  });

  // Méthodes helpers
  const createEnrollment = useCallback(
    (data: EnrollmentCreateData) => createEnrollmentMutation.mutateAsync(data),
    [createEnrollmentMutation]
  );

  const updateEnrollment = useCallback(
    (id: string, updates: EnrollmentUpdateData) =>
      updateEnrollmentMutation.mutateAsync({ id, updates }),
    [updateEnrollmentMutation]
  );

  const updateStatus = useCallback(
    (id: string, status: EnrollmentStatus) =>
      updateStatusMutation.mutateAsync({ id, status }),
    [updateStatusMutation]
  );

  const recordProgress = useCallback(
    (progressEvent: ProgressEvent) => recordProgressMutation.mutateAsync(progressEvent),
    [recordProgressMutation]
  );

  const generateCertificate = useCallback(
    (id: string) => generateCertificateMutation.mutateAsync(id),
    [generateCertificateMutation]
  );

  const refundEnrollment = useCallback(
    (id: string, reason?: string) => refundEnrollmentMutation.mutateAsync({ id, reason }),
    [refundEnrollmentMutation]
  );

  return {
    // Data
    enrollments: enrollments || [],
    stats,
    isLoading,
    error,

    // Filters
    filters,
    setFilters,

    // Actions
    createEnrollment,
    updateEnrollment,
    updateStatus,
    recordProgress,
    generateCertificate,
    refundEnrollment,
    refetch,
    useEnrollmentById,
    useEnrollmentsByCourse,
    useEnrollmentsByStudent,

    // Mutation states
    isCreating: createEnrollmentMutation.isPending,
    isUpdating: updateEnrollmentMutation.isPending,
    isRecordingProgress: recordProgressMutation.isPending,
    isGeneratingCertificate: generateCertificateMutation.isPending,
    isRefunding: refundEnrollmentMutation.isPending,
  };
};

export default useEnrollments;

