/**
 * Assignments Hooks for Courses
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les assignments/devoirs : création, soumission, notation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface CourseAssignment {
  id: string;
  course_id: string;
  section_id?: string;
  title: string;
  description?: string;
  instructions?: string;
  assignment_type: 'file_upload' | 'text' | 'url' | 'code' | 'mixed';
  max_file_size: number;
  allowed_file_types: string[];
  max_files: number;
  points_possible: number;
  grading_type: 'points' | 'percentage' | 'letter' | 'pass_fail';
  due_date?: string;
  allow_late_submission: boolean;
  late_penalty_percentage: number;
  is_required: boolean;
  is_visible: boolean;
  order_index: number;
  rubric: Array<{
    criterion: string;
    points: number;
    description?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  enrollment_id: string;
  course_id: string;
  user_id: string;
  submission_text?: string;
  submission_files: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  submission_url?: string;
  submission_code?: string;
  status: 'draft' | 'submitted' | 'graded' | 'returned' | 'resubmitted';
  submitted_at?: string;
  graded_at?: string;
  returned_at?: string;
  grade?: number;
  grade_percentage?: number;
  grade_letter?: string;
  is_passed?: boolean;
  feedback?: string;
  feedback_files: Array<{
    url: string;
    name: string;
  }>;
  rubric_scores: Record<string, number>;
  needs_revision: boolean;
  revision_notes?: string;
  is_late: boolean;
  late_hours: number;
  penalty_applied: number;
  version: number;
  previous_submission_id?: string;
  created_at: string;
  updated_at: string;
  assignment?: CourseAssignment;
}

export interface AssignmentGrading {
  id: string;
  submission_id: string;
  graded_by: string;
  grade: number;
  grade_percentage?: number;
  grade_letter?: string;
  is_passed?: boolean;
  feedback?: string;
  feedback_files: Array<{
    url: string;
    name: string;
  }>;
  rubric_scores: Record<string, number>;
  private_notes?: string;
  graded_at: string;
  created_at: string;
}

export interface CreateAssignmentData {
  course_id: string;
  section_id?: string;
  title: string;
  description?: string;
  instructions?: string;
  assignment_type: CourseAssignment['assignment_type'];
  max_file_size?: number;
  allowed_file_types?: string[];
  max_files?: number;
  points_possible?: number;
  grading_type?: CourseAssignment['grading_type'];
  due_date?: string;
  allow_late_submission?: boolean;
  late_penalty_percentage?: number;
  is_required?: boolean;
  is_visible?: boolean;
  order_index?: number;
  rubric?: CourseAssignment['rubric'];
}

export interface SubmitAssignmentData {
  assignment_id: string;
  enrollment_id: string;
  submission_text?: string;
  submission_files?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  submission_url?: string;
  submission_code?: string;
}

export interface GradeAssignmentData {
  submission_id: string;
  grade: number;
  feedback?: string;
  feedback_files?: Array<{
    url: string;
    name: string;
  }>;
  rubric_scores?: Record<string, number>;
  private_notes?: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useCourseAssignments - Récupère tous les assignments d'un cours
 */
export const useCourseAssignments = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID manquant');

      const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_visible', true)
        .order('order_index', { ascending: true });

      if (error) {
        logger.error('Error fetching assignments', { error, courseId });
        throw error;
      }

      return (data || []) as CourseAssignment[];
    },
    enabled: !!courseId,
  });
};

/**
 * useAssignment - Récupère un assignment spécifique
 */
export const useAssignment = (assignmentId: string | undefined) => {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error('Assignment ID manquant');

      const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (error) {
        logger.error('Error fetching assignment', { error, assignmentId });
        throw error;
      }

      return data as CourseAssignment;
    },
    enabled: !!assignmentId,
  });
};

/**
 * useAssignmentSubmissions - Récupère les soumissions d'un assignment
 */
export const useAssignmentSubmissions = (assignmentId: string | undefined) => {
  return useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error('Assignment ID manquant');

      const { data, error } = await supabase
        .from('course_assignment_submissions')
        .select(`
          *,
          assignment:course_assignments(*)
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) {
        logger.error('Error fetching submissions', { error, assignmentId });
        throw error;
      }

      return (data || []) as AssignmentSubmission[];
    },
    enabled: !!assignmentId,
  });
};

/**
 * useStudentAssignmentSubmission - Récupère la soumission d'un étudiant pour un assignment
 */
export const useStudentAssignmentSubmission = (
  assignmentId: string | undefined,
  enrollmentId: string | undefined
) => {
  return useQuery({
    queryKey: ['student-assignment-submission', assignmentId, enrollmentId],
    queryFn: async () => {
      if (!assignmentId || !enrollmentId) throw new Error('IDs manquants');

      const { data, error } = await supabase
        .from('course_assignment_submissions')
        .select(`
          *,
          assignment:course_assignments(*)
        `)
        .eq('assignment_id', assignmentId)
        .eq('enrollment_id', enrollmentId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching student submission', { error, assignmentId, enrollmentId });
        throw error;
      }

      return data as AssignmentSubmission | null;
    },
    enabled: !!assignmentId && !!enrollmentId,
  });
};

/**
 * useStudentAssignments - Récupère tous les assignments d'un étudiant pour un cours
 */
export const useStudentAssignments = (
  courseId: string | undefined,
  enrollmentId: string | undefined
) => {
  return useQuery({
    queryKey: ['student-assignments', courseId, enrollmentId],
    queryFn: async () => {
      if (!courseId || !enrollmentId) throw new Error('IDs manquants');

      // Récupérer assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_visible', true)
        .order('order_index', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Récupérer soumissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('course_assignment_submissions')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .in('assignment_id', (assignments || []).map(a => a.id));

      if (submissionsError) throw submissionsError;

      // Combiner données
      const assignmentsWithSubmissions = (assignments || []).map(assignment => {
        const submission = (submissions || []).find(
          s => s.assignment_id === assignment.id
        );
        return {
          ...assignment,
          submission: submission || null,
        };
      });

      return assignmentsWithSubmissions;
    },
    enabled: !!courseId && !!enrollmentId,
  });
};

/**
 * useAssignmentGradingHistory - Récupère l'historique de notation
 */
export const useAssignmentGradingHistory = (submissionId: string | undefined) => {
  return useQuery({
    queryKey: ['assignment-grading-history', submissionId],
    queryFn: async () => {
      if (!submissionId) throw new Error('Submission ID manquant');

      const { data, error } = await supabase
        .from('course_assignment_grading')
        .select('*')
        .eq('submission_id', submissionId)
        .order('graded_at', { ascending: false });

      if (error) {
        logger.error('Error fetching grading history', { error, submissionId });
        throw error;
      }

      return (data || []) as AssignmentGrading[];
    },
    enabled: !!submissionId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateAssignment - Créer un assignment (instructeur)
 */
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignmentData: CreateAssignmentData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('course_assignments')
        .insert({
          ...assignmentData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating assignment', { error, assignmentData });
        throw error;
      }

      return data as CourseAssignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments', data.course_id] });
      toast({
        title: '✅ Assignment créé',
        description: 'Le devoir a été créé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateAssignment', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer l\'assignment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useSubmitAssignment - Soumettre un assignment (étudiant)
 */
export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      enrollmentId,
      userId,
      submissionData,
    }: {
      assignmentId: string;
      enrollmentId: string;
      userId: string;
      submissionData: SubmitAssignmentData;
    }) => {
      const { data, error } = await supabase.rpc('submit_assignment', {
        p_assignment_id: assignmentId,
        p_enrollment_id: enrollmentId,
        p_user_id: userId,
        p_submission_text: submissionData.submission_text || null,
        p_submission_files: submissionData.submission_files || [],
        p_submission_url: submissionData.submission_url || null,
        p_submission_code: submissionData.submission_code || null,
      });

      if (error) {
        logger.error('Error submitting assignment', { error, assignmentId });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', variables.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-assignment-submission', variables.assignmentId, variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['student-points', variables.enrollmentId] });
      
      toast({
        title: '✅ Assignment soumis',
        description: 'Votre devoir a été soumis avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useSubmitAssignment', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de soumettre l\'assignment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useGradeAssignment - Noter un assignment (instructeur)
 */
export const useGradeAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      submissionId,
      gradedBy,
      gradingData,
    }: {
      submissionId: string;
      gradedBy: string;
      gradingData: GradeAssignmentData;
    }) => {
      const { data, error } = await supabase.rpc('grade_assignment', {
        p_submission_id: submissionId,
        p_graded_by: gradedBy,
        p_grade: gradingData.grade,
        p_feedback: gradingData.feedback || null,
        p_feedback_files: gradingData.feedback_files || [],
        p_rubric_scores: gradingData.rubric_scores || {},
        p_private_notes: gradingData.private_notes || null,
      });

      if (error) {
        logger.error('Error grading assignment', { error, submissionId });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-grading-history', variables.submissionId] });
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      
      toast({
        title: '✅ Assignment noté',
        description: 'La notation a été enregistrée avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useGradeAssignment', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de noter l\'assignment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateAssignment - Mettre à jour un assignment (instructeur)
 */
export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      updates,
    }: {
      assignmentId: string;
      updates: Partial<CreateAssignmentData>;
    }) => {
      const { data, error } = await supabase
        .from('course_assignments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating assignment', { error, assignmentId });
        throw error;
      }

      return data as CourseAssignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignment', data.id] });
      queryClient.invalidateQueries({ queryKey: ['course-assignments', data.course_id] });
      toast({
        title: '✅ Assignment mis à jour',
        description: 'Le devoir a été mis à jour avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateAssignment', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour l\'assignment',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useDeleteAssignment - Supprimer un assignment (instructeur)
 */
export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      // Récupérer course_id avant suppression
      const { data: assignment } = await supabase
        .from('course_assignments')
        .select('course_id')
        .eq('id', assignmentId)
        .single();

      const { error } = await supabase
        .from('course_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        logger.error('Error deleting assignment', { error, assignmentId });
        throw error;
      }

      return assignment?.course_id;
    },
    onSuccess: (courseId) => {
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['course-assignments', courseId] });
      }
      toast({
        title: '✅ Assignment supprimé',
        description: 'Le devoir a été supprimé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useDeleteAssignment', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer l\'assignment',
        variant: 'destructive',
      });
    },
  });
};

