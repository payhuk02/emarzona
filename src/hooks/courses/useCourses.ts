import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Course, CourseFormData } from '@/types/courses';

/**
 * Hook pour récupérer tous les cours
 * @param storeId - ID de la boutique (optionnel, pour filtrer)
 */
export const useCourses = (storeId?: string) => {
  return useQuery({
    queryKey: ['courses', storeId],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select(`
          *,
          product:products(
            id,
            name,
            slug,
            description,
            short_description,
            price,
            promotional_price,
            currency,
            image_url,
            is_active,
            is_draft,
            store_id
          )
        `)
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('product.store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Course[];
    },
  });
};

/**
 * Hook pour récupérer un cours par ID
 * @param courseId - ID du cours
 */
export const useCourse = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          product:products(*),
          sections:course_sections(
            *,
            lessons:course_lessons(
              *,
              order by order_index
            ),
            order by order_index
          )
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });
};

/**
 * Hook pour récupérer un cours par slug de produit
 * @param slug - Slug du produit
 */
export const useCourseBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['course-by-slug', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          product:products(*),
          sections:course_sections(
            *,
            lessons:course_lessons(
              *,
              order by order_index
            ),
            order by order_index
          )
        `)
        .eq('product.slug', slug)
        .single();

      if (error) throw error;
      return data as Course;
    },
    enabled: !!slug,
  });
};

/**
 * Hook pour créer un cours
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseData: CourseFormData) => {
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Succès',
        description: 'Le cours a été créé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création du cours.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour un cours
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ courseId, updates }: { courseId: string; updates: Partial<CourseFormData> }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Succès',
        description: 'Le cours a été mis à jour.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer un cours
 */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Succès',
        description: 'Le cours a été supprimé.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer les statistiques d'un cours
 * @param courseId - ID du cours
 */
export const useCourseStats = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-stats', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      // Récupérer le cours avec les enrollments
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          enrollments:course_enrollments(*)
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Calculer les statistiques
      const enrollments = course.enrollments || [];
      const activeStudents = enrollments.filter((e: any) => e.status === 'active').length;
      const completedStudents = enrollments.filter((e: any) => e.status === 'completed').length;
      const averageProgress = enrollments.length > 0
        ? enrollments.reduce((sum: number, e: any) => sum + (e.progress_percentage || 0), 0) / enrollments.length
        : 0;

      return {
        total_students: enrollments.length,
        active_students: activeStudents,
        completed_students: completedStudents,
        average_progress: Math.round(averageProgress),
        completion_rate: enrollments.length > 0 
          ? Math.round((completedStudents / enrollments.length) * 100)
          : 0,
      };
    },
    enabled: !!courseId,
  });
};

