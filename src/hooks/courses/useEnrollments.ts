/**
 * useEnrollments — gestion des inscriptions (table course_enrollments)
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { EnrollmentStatus } from '@/components/courses/EnrollmentInfoDisplay';

const ENROLLMENT_FIELDS =
  'id, course_id, product_id, user_id, order_id, status, enrollment_date, completion_date, progress_percentage, completed_lessons, total_lessons, last_accessed_at, last_accessed_lesson_id, total_watch_time_minutes, certificate_earned, certificate_url, certificate_issued_at, created_at, updated_at';

type CourseEnrollmentRow = {
  id: string;
  course_id: string;
  product_id: string;
  user_id: string;
  order_id?: string | null;
  status: string;
  enrollment_date: string;
  completion_date?: string | null;
  progress_percentage?: number | null;
  completed_lessons?: number | null;
  total_lessons?: number | null;
  last_accessed_at?: string | null;
  total_watch_time_minutes?: number | null;
  certificate_earned?: boolean | null;
  certificate_url?: string | null;
  created_at: string;
  updated_at: string;
  course?: { name?: string; total_lessons?: number } | null;
  order?: { total_amount?: number | null; payment_status?: string | null } | null;
};

export interface Enrollment {
  id: string;
  course_id: string;
  course_name?: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  status: EnrollmentStatus;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  time_spent: number;
  enrolled_at: string;
  last_activity_at?: string;
  expiry_date?: string;
  amount_paid: number;
  payment_method?: string;
  has_certificate: boolean;
  average_score?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface EnrollmentCreateData {
  course_id: string;
  product_id: string;
  student_id: string;
  order_id?: string;
  amount_paid?: number;
  payment_method?: string;
  expiry_date?: string;
}

export interface EnrollmentUpdateData {
  status?: EnrollmentStatus;
  progress?: number;
  completed_lessons?: number;
  time_spent?: number;
  last_activity_at?: string;
  has_certificate?: boolean;
  average_score?: number;
}

export interface EnrollmentFilters {
  status?: EnrollmentStatus;
  course_id?: string;
  student_id?: string;
  search?: string;
}

export interface EnrollmentStats {
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  total_revenue: number;
  avg_progress: number;
  avg_completion_time: number;
  by_status: Record<EnrollmentStatus, number>;
}

export interface ProgressEvent {
  enrollment_id: string;
  lesson_id: string;
  lesson_title: string;
  completed_at: string;
  score?: number;
}

function mapEnrollmentRow(row: CourseEnrollmentRow): Enrollment {
  return {
    id: row.id,
    course_id: row.course_id,
    course_name: row.course?.name,
    student_id: row.user_id,
    status: row.status as EnrollmentStatus,
    progress: Number(row.progress_percentage ?? 0),
    completed_lessons: Number(row.completed_lessons ?? 0),
    total_lessons: Number(row.total_lessons ?? row.course?.total_lessons ?? 0),
    time_spent: Number(row.total_watch_time_minutes ?? 0),
    enrolled_at: row.enrollment_date ?? row.created_at,
    last_activity_at: row.last_accessed_at ?? undefined,
    amount_paid: Number(row.order?.total_amount ?? 0),
    has_certificate: Boolean(row.certificate_earned),
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completion_date ?? undefined,
  };
}

function buildEnrollmentStats(rows: Enrollment[]): EnrollmentStats {
  const completed = rows.filter(e => e.status === 'completed' && e.completed_at);
  const avgCompletionTime =
    completed.length > 0
      ? completed.reduce((sum, e) => {
          const enrolled = new Date(e.enrolled_at).getTime();
          const done = new Date(e.completed_at!).getTime();
          return sum + (done - enrolled) / (1000 * 60 * 60 * 24);
        }, 0) / completed.length
      : 0;

  const by_status = {} as Record<EnrollmentStatus, number>;
  for (const enrollment of rows) {
    by_status[enrollment.status] = (by_status[enrollment.status] || 0) + 1;
  }

  return {
    total_enrollments: rows.length,
    active_enrollments: rows.filter(e => e.status === 'active').length,
    completed_enrollments: rows.filter(e => e.status === 'completed').length,
    total_revenue: rows.reduce((sum, e) => sum + e.amount_paid, 0),
    avg_progress: rows.length > 0 ? rows.reduce((sum, e) => sum + e.progress, 0) / rows.length : 0,
    avg_completion_time: Math.round(avgCompletionTime),
    by_status,
  };
}

export const useEnrollments = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EnrollmentFilters>({});

  const {
    data: enrollments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['enrollments', filters],
    queryFn: async () => {
      let query = supabase
        .from('course_enrollments')
        .select(
          `
          ${ENROLLMENT_FIELDS},
          course:courses!inner(name, total_lessons),
          order:orders(total_amount, payment_status)
        `
        )
        .order('enrollment_date', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.course_id) query = query.eq('course_id', filters.course_id);
      if (filters.student_id) query = query.eq('user_id', filters.student_id);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let rows = (data as CourseEnrollmentRow[]).map(mapEnrollmentRow);
      if (filters.search) {
        const term = filters.search.toLowerCase();
        rows = rows.filter(e => e.course_name?.toLowerCase().includes(term));
      }
      return rows;
    },
  });

  const useEnrollmentById = (enrollmentId: string) => {
    return useQuery({
      queryKey: ['enrollment', enrollmentId],
      queryFn: async () => {
        const { data, error: fetchError } = await supabase
          .from('course_enrollments')
          .select(
            `
            ${ENROLLMENT_FIELDS},
            course:courses!inner(name, total_lessons),
            order:orders(total_amount, payment_status)
          `
          )
          .eq('id', enrollmentId)
          .single();

        if (fetchError) throw fetchError;
        return mapEnrollmentRow(data as CourseEnrollmentRow);
      },
      enabled: !!enrollmentId,
    });
  };

  const useEnrollmentsByCourse = (courseId: string) => {
    return useQuery({
      queryKey: ['enrollments-by-course', courseId],
      queryFn: async () => {
        const { data, error: fetchError } = await supabase
          .from('course_enrollments')
          .select(`${ENROLLMENT_FIELDS}, course:courses!inner(name, total_lessons)`)
          .eq('course_id', courseId)
          .order('enrollment_date', { ascending: false });

        if (fetchError) throw fetchError;
        return (data as CourseEnrollmentRow[]).map(mapEnrollmentRow);
      },
      enabled: !!courseId,
    });
  };

  const useEnrollmentsByStudent = (studentId: string) => {
    return useQuery({
      queryKey: ['enrollments-by-student', studentId],
      queryFn: async () => {
        const { data, error: fetchError } = await supabase
          .from('course_enrollments')
          .select(
            `
            ${ENROLLMENT_FIELDS},
            course:courses!inner(name, total_lessons)
          `
          )
          .eq('user_id', studentId)
          .order('enrollment_date', { ascending: false });

        if (fetchError) throw fetchError;
        return (data as CourseEnrollmentRow[]).map(mapEnrollmentRow);
      },
      enabled: !!studentId,
    });
  };

  const { data: stats } = useQuery({
    queryKey: ['enrollment-stats'],
    queryFn: async () => {
      const { data: statsData, error: rpcError } = await supabase.rpc('get_enrollment_stats');

      if (!rpcError && statsData) {
        return statsData as EnrollmentStats;
      }

      logger.warn('get_enrollment_stats unavailable, using client-side calculation', {
        error: rpcError?.message,
      });

      const { data, error: fetchError } = await supabase.from('course_enrollments').select(
        `
          ${ENROLLMENT_FIELDS},
          course:courses(name),
          order:orders(total_amount)
        `
      );

      if (fetchError) throw fetchError;
      return buildEnrollmentStats((data as CourseEnrollmentRow[]).map(mapEnrollmentRow));
    },
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentData: EnrollmentCreateData) => {
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('course_id', enrollmentData.course_id);

      const { data, error: insertError } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: enrollmentData.course_id,
          product_id: enrollmentData.product_id,
          user_id: enrollmentData.student_id,
          order_id: enrollmentData.order_id,
          status: 'active',
          progress_percentage: 0,
          completed_lessons: 0,
          total_lessons: lessons?.length ?? 0,
          total_watch_time_minutes: 0,
          certificate_earned: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return mapEnrollmentRow(data as CourseEnrollmentRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
    },
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: EnrollmentUpdateData }) => {
      const { data, error: updateError } = await supabase
        .from('course_enrollments')
        .update({
          status: updates.status,
          progress_percentage: updates.progress,
          completed_lessons: updates.completed_lessons,
          total_watch_time_minutes: updates.time_spent,
          last_accessed_at: updates.last_activity_at,
          certificate_earned: updates.has_certificate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapEnrollmentRow(data as CourseEnrollmentRow);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EnrollmentStatus }) => {
      const { data, error: updateError } = await supabase
        .from('course_enrollments')
        .update({
          status,
          completion_date: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapEnrollmentRow(data as CourseEnrollmentRow);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
    },
  });

  const recordProgressMutation = useMutation({
    mutationFn: async (progressEvent: ProgressEvent) => {
      const { data: enrollment, error: fetchError } = await supabase
        .from('course_enrollments')
        .select(`${ENROLLMENT_FIELDS}, course:courses!inner(total_lessons)`)
        .eq('id', progressEvent.enrollment_id)
        .single();

      if (fetchError) throw fetchError;

      const row = enrollment as CourseEnrollmentRow;
      const totalLessons = row.total_lessons ?? row.course?.total_lessons ?? 1;
      const newCompletedLessons = Math.min(Number(row.completed_lessons ?? 0) + 1, totalLessons);
      const newProgress = Math.round((newCompletedLessons / totalLessons) * 100);
      const newStatus = newProgress >= 100 ? 'completed' : row.status;

      const { data, error: updateError } = await supabase
        .from('course_enrollments')
        .update({
          completed_lessons: newCompletedLessons,
          progress_percentage: newProgress,
          last_accessed_at: progressEvent.completed_at,
          last_accessed_lesson_id: progressEvent.lesson_id,
          status: newStatus,
          completion_date: newProgress >= 100 ? progressEvent.completed_at : row.completion_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progressEvent.enrollment_id)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapEnrollmentRow(data as CourseEnrollmentRow);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.enrollment_id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
    },
  });

  const generateCertificateMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { data: enrollment, error: fetchError } = await supabase
        .from('course_enrollments')
        .select(ENROLLMENT_FIELDS)
        .eq('id', enrollmentId)
        .single();

      if (fetchError) throw fetchError;

      const progress = Number((enrollment as CourseEnrollmentRow).progress_percentage ?? 0);
      if (progress < 100) {
        throw new Error('Le cours doit être terminé pour générer un certificat');
      }

      const { data, error: updateError } = await supabase
        .from('course_enrollments')
        .update({
          certificate_earned: true,
          certificate_issued_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapEnrollmentRow(data as CourseEnrollmentRow);
    },
    onSuccess: (_, enrollmentId) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] });
    },
  });

  const refundEnrollmentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data: enrollment, error: fetchError } = await supabase
        .from('course_enrollments')
        .select(`${ENROLLMENT_FIELDS}, order_id`)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const row = enrollment as CourseEnrollmentRow;
      if (row.order_id) {
        const { data: transaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('order_id', row.order_id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (transaction?.id) {
          const result = await import('@/lib/payments/refund-payment').then(m =>
            m.refundPayment({
              transactionId: transaction.id,
              reason: reason || 'Course enrollment refund',
            })
          );
          if (!result.success) {
            throw new Error(result.error || 'Échec du remboursement');
          }
        }
      }

      const { data, error: updateError } = await supabase
        .from('course_enrollments')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapEnrollmentRow(data as CourseEnrollmentRow);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-stats'] });
    },
  });

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
    (id: string, status: EnrollmentStatus) => updateStatusMutation.mutateAsync({ id, status }),
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
    enrollments: enrollments || [],
    stats,
    isLoading,
    error,
    filters,
    setFilters,
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
    isCreating: createEnrollmentMutation.isPending,
    isUpdating: updateEnrollmentMutation.isPending,
    isRecordingProgress: recordProgressMutation.isPending,
    isGeneratingCertificate: generateCertificateMutation.isPending,
    isRefunding: refundEnrollmentMutation.isPending,
  };
};

export default useEnrollments;
