/**
 * Live Sessions Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les sessions en direct (webinaires)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface LiveSession {
  id: string;
  course_id: string;
  cohort_id?: string;
  title: string;
  description?: string;
  session_type: 'webinar' | 'workshop' | 'qna' | 'office_hours' | 'review';
  platform: 'zoom' | 'google_meet' | 'teams' | 'native' | 'custom';
  meeting_url?: string;
  meeting_id?: string;
  meeting_password?: string;
  streaming_url?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  duration_minutes?: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled' | 'postponed';
  max_participants?: number;
  is_public: boolean;
  recording_enabled: boolean;
  recording_url?: string;
  recording_available_until?: string;
  allow_questions: boolean;
  allow_chat: boolean;
  allow_screen_share: boolean;
  require_registration: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  registered_count?: number;
}

export interface SessionRegistration {
  id: string;
  session_id: string;
  enrollment_id: string;
  user_id: string;
  status: 'registered' | 'attended' | 'absent' | 'cancelled';
  reminder_sent_24h: boolean;
  reminder_sent_1h: boolean;
  joined_at?: string;
  left_at?: string;
  attendance_duration_minutes: number;
  feedback_rating?: number;
  feedback_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionQuestion {
  id: string;
  session_id: string;
  user_id: string;
  question: string;
  is_answered: boolean;
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  upvotes_count: number;
  created_at: string;
}

export interface CreateLiveSessionData {
  course_id: string;
  cohort_id?: string;
  title: string;
  description?: string;
  session_type: LiveSession['session_type'];
  platform: LiveSession['platform'];
  meeting_url?: string;
  meeting_id?: string;
  meeting_password?: string;
  streaming_url?: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes?: number;
  max_participants?: number;
  is_public?: boolean;
  recording_enabled?: boolean;
  allow_questions?: boolean;
  allow_chat?: boolean;
  allow_screen_share?: boolean;
  require_registration?: boolean;
  metadata?: Record<string, any>;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useCourseLiveSessions - Récupère toutes les sessions d'un cours
 */
export const useCourseLiveSessions = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-live-sessions', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID manquant');

      const { data, error } = await supabase
        .from('course_live_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('scheduled_start', { ascending: true });

      if (error) {
        logger.error('Error fetching live sessions', { error, courseId });
        throw error;
      }

      return (data || []) as LiveSession[];
    },
    enabled: !!courseId,
  });
};

/**
 * useUpcomingSessions - Récupère les sessions à venir
 */
export const useUpcomingSessions = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['upcoming-sessions', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID manquant');

      const { data, error } = await supabase.rpc('get_upcoming_sessions', {
        p_course_id: courseId,
      });

      if (error) {
        logger.error('Error fetching upcoming sessions', { error, courseId });
        throw error;
      }

      return (data || []) as LiveSession[];
    },
    enabled: !!courseId,
  });
};

/**
 * useSessionRegistrations - Récupère les inscriptions d'une session
 */
export const useSessionRegistrations = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['session-registrations', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID manquant');

      const { data, error } = await supabase
        .from('course_live_session_registrations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching session registrations', { error, sessionId });
        throw error;
      }

      return (data || []) as SessionRegistration[];
    },
    enabled: !!sessionId,
  });
};

/**
 * useSessionQuestions - Récupère les questions d'une session
 */
export const useSessionQuestions = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['session-questions', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID manquant');

      const { data, error } = await supabase
        .from('course_live_session_questions')
        .select('*')
        .eq('session_id', sessionId)
        .order('upvotes_count', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching session questions', { error, sessionId });
        throw error;
      }

      return (data || []) as SessionQuestion[];
    },
    enabled: !!sessionId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateLiveSession - Créer une session (instructeur)
 */
export const useCreateLiveSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sessionData: CreateLiveSessionData) => {
      const { data, error } = await supabase
        .from('course_live_sessions')
        .insert({
          ...sessionData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating live session', { error, sessionData });
        throw error;
      }

      return data as LiveSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-live-sessions', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
      toast({
        title: '✅ Session créée',
        description: 'La session en direct a été créée avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateLiveSession', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la session',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useRegisterForSession - S'inscrire à une session (étudiant)
 */
export const useRegisterForSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      sessionId,
      enrollmentId,
      userId,
    }: {
      sessionId: string;
      enrollmentId: string;
      userId: string;
    }) => {
      const { data, error } = await supabase.rpc('register_for_session', {
        p_session_id: sessionId,
        p_enrollment_id: enrollmentId,
        p_user_id: userId,
      });

      if (error) {
        logger.error('Error registering for session', { error, sessionId });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-registrations', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
      toast({
        title: '✅ Inscription réussie',
        description: 'Vous êtes inscrit à la session',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useRegisterForSession', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de s\'inscrire',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateSessionStatus - Mettre à jour le statut d'une session
 */
export const useUpdateSessionStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      sessionId,
      status,
      actualStart,
      actualEnd,
    }: {
      sessionId: string;
      status: LiveSession['status'];
      actualStart?: string;
      actualEnd?: string;
    }) => {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (actualStart) updates.actual_start = actualStart;
      if (actualEnd) updates.actual_end = actualEnd;

      const { data, error } = await supabase
        .from('course_live_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating session status', { error, sessionId });
        throw error;
      }

      return data as LiveSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-live-sessions', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut de la session a été mis à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateSessionStatus', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });
};

