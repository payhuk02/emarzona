/**
 * Course Notes Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les notes personnelles avec timestamps
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface CourseNote {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  course_id: string;
  user_id: string;
  content: string;
  timestamp_seconds: number;
  note_type: 'text' | 'bookmark' | 'highlight' | 'question';
  tags: string[];
  is_private: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseBookmark {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  course_id: string;
  user_id: string;
  timestamp_seconds: number;
  title?: string;
  description?: string;
  created_at: string;
}

export interface CreateNoteData {
  enrollment_id: string;
  lesson_id: string;
  course_id: string;
  content: string;
  timestamp_seconds?: number;
  note_type?: CourseNote['note_type'];
  tags?: string[];
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useLessonNotes - Récupère toutes les notes d'une leçon
 */
export const useLessonNotes = (
  enrollmentId: string | undefined,
  lessonId: string | undefined
) => {
  return useQuery({
    queryKey: ['lesson-notes', enrollmentId, lessonId],
    queryFn: async () => {
      if (!enrollmentId || !lessonId) {
        throw new Error('IDs manquants');
      }

      const { data, error } = await supabase.rpc('get_lesson_notes', {
        p_enrollment_id: enrollmentId,
        p_lesson_id: lessonId,
      });

      if (error) {
        logger.error('Error fetching lesson notes', { error, enrollmentId, lessonId });
        throw error;
      }

      return (data || []) as CourseNote[];
    },
    enabled: !!enrollmentId && !!lessonId,
  });
};

/**
 * useCourseNotes - Récupère toutes les notes d'un cours
 */
export const useCourseNotes = (
  enrollmentId: string | undefined,
  courseId: string | undefined
) => {
  return useQuery({
    queryKey: ['course-notes', enrollmentId, courseId],
    queryFn: async () => {
      if (!enrollmentId || !courseId) {
        throw new Error('IDs manquants');
      }

      const { data, error } = await supabase
        .from('course_notes')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching course notes', { error, enrollmentId, courseId });
        throw error;
      }

      return (data || []) as CourseNote[];
    },
    enabled: !!enrollmentId && !!courseId,
  });
};

/**
 * useLessonBookmarks - Récupère les marque-pages d'une leçon
 */
export const useLessonBookmarks = (
  enrollmentId: string | undefined,
  lessonId: string | undefined
) => {
  return useQuery({
    queryKey: ['lesson-bookmarks', enrollmentId, lessonId],
    queryFn: async () => {
      if (!enrollmentId || !lessonId) {
        throw new Error('IDs manquants');
      }

      const { data, error } = await supabase
        .from('course_note_bookmarks')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .eq('lesson_id', lessonId)
        .order('timestamp_seconds', { ascending: true });

      if (error) {
        logger.error('Error fetching bookmarks', { error, enrollmentId, lessonId });
        throw error;
      }

      return (data || []) as CourseBookmark[];
    },
    enabled: !!enrollmentId && !!lessonId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useAddNote - Ajouter une note avec timestamp
 */
export const useAddNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      noteData,
    }: {
      userId: string;
      noteData: CreateNoteData;
    }) => {
      const { data, error } = await supabase.rpc('add_lesson_note', {
        p_enrollment_id: noteData.enrollment_id,
        p_lesson_id: noteData.lesson_id,
        p_course_id: noteData.course_id,
        p_user_id: userId,
        p_content: noteData.content,
        p_timestamp_seconds: noteData.timestamp_seconds || 0,
        p_note_type: noteData.note_type || 'text',
        p_tags: noteData.tags || [],
      });

      if (error) {
        logger.error('Error adding note', { error, noteData });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['lesson-notes', variables.noteData.enrollment_id, variables.noteData.lesson_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['course-notes', variables.noteData.enrollment_id, variables.noteData.course_id],
      });

      toast({
        title: '✅ Note ajoutée',
        description: 'Votre note a été enregistrée',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useAddNote', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ajouter la note',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateNote - Mettre à jour une note
 */
export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      noteId,
      updates,
    }: {
      noteId: string;
      updates: Partial<Pick<CourseNote, 'content' | 'tags' | 'note_type'>>;
    }) => {
      const { data, error } = await supabase
        .from('course_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating note', { error, noteId });
        throw error;
      }

      return data as CourseNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes'] });
      queryClient.invalidateQueries({ queryKey: ['course-notes'] });

      toast({
        title: '✅ Note mise à jour',
        description: 'Votre note a été modifiée',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateNote', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour la note',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useDeleteNote - Supprimer une note
 */
export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('course_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        logger.error('Error deleting note', { error, noteId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes'] });
      queryClient.invalidateQueries({ queryKey: ['course-notes'] });

      toast({
        title: '✅ Note supprimée',
        description: 'Votre note a été supprimée',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useDeleteNote', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer la note',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useAddBookmark - Ajouter un marque-page
 */
export const useAddBookmark = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      lessonId,
      courseId,
      userId,
      timestampSeconds,
      title,
      description,
    }: {
      enrollmentId: string;
      lessonId: string;
      courseId: string;
      userId: string;
      timestampSeconds: number;
      title?: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('course_note_bookmarks')
        .upsert({
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          course_id: courseId,
          user_id: userId,
          timestamp_seconds: timestampSeconds,
          title,
          description,
        }, {
          onConflict: 'enrollment_id,lesson_id,timestamp_seconds',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding bookmark', { error });
        throw error;
      }

      return data as CourseBookmark;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['lesson-bookmarks', variables.enrollmentId, variables.lessonId],
      });

      toast({
        title: '✅ Marque-page ajouté',
        description: 'Votre marque-page a été enregistré',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useAddBookmark', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ajouter le marque-page',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useDeleteBookmark - Supprimer un marque-page
 */
export const useDeleteBookmark = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookmarkId: string) => {
      const { error } = await supabase
        .from('course_note_bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) {
        logger.error('Error deleting bookmark', { error, bookmarkId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-bookmarks'] });

      toast({
        title: '✅ Marque-page supprimé',
        description: 'Votre marque-page a été supprimé',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useDeleteBookmark', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer le marque-page',
        variant: 'destructive',
      });
    },
  });
};

