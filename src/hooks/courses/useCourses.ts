/**
 * useCourses - Hook pour la gestion des cours
 * 
 * Fournit toutes les opérations CRUD pour les cours :
 * - Listing et filtrage
 * - Création et mise à jour
 * - Suppression
 * - Publication/Dépublication
 * - Statistiques
 * 
 * @author Payhuk Team
 * @date 29 Octobre 2025
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CourseStatus } from '@/components/courses/CourseStatusIndicator';
import { CourseCategory } from '@/components/courses/CoursesList';

/**
 * Interface pour un cours
 */
export interface Course {
  id: string;
  name: string;
  description: string;
  instructor_id: string;
  instructor_name?: string;
  status: CourseStatus;
  category: CourseCategory;
  price: number;
  currency: string;
  max_students: number;
  enrolled_students: number;
  completion_rate: number;
  revenue: number;
  duration: number; // heures
  total_lessons: number;
  thumbnail_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Données pour créer/mettre à jour un cours
 */
export interface CourseFormData {
  name: string;
  description?: string;
  category: CourseCategory;
  price: number;
  currency?: string;
  max_students: number;
  duration?: number;
  total_lessons?: number;
  thumbnail_url?: string;
  status?: CourseStatus;
  is_active?: boolean;
}

/**
 * Filtres pour la liste des cours
 */
export interface CourseFilters {
  status?: CourseStatus;
  category?: CourseCategory;
  is_active?: boolean;
  search?: string;
}

/**
 * Statistiques des cours
 */
export interface CourseStats {
  total_courses: number;
  active_courses: number;
  total_students: number;
  total_revenue: number;
  avg_completion_rate: number;
  by_status: Record<CourseStatus, number>;
  by_category: Record<CourseCategory, number>;
}

/**
 * Hook useCourses
 */
export const useCourses = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CourseFilters>({});

  /**
   * Récupérer tous les cours avec filtres
   */
  const { data: courses, isLoading, error, refetch } = useQuery({
    queryKey: ['courses', filters],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Course[];
    },
  });

  /**
   * Récupérer un cours par ID
   */
  const useCourseById = (courseId: string) => {
    return useQuery({
      queryKey: ['course', courseId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error) throw error;
        return data as Course;
      },
      enabled: !!courseId,
    });
  };

  /**
   * Récupérer les statistiques
   */
  const { data: stats } = useQuery({
    queryKey: ['course-stats'],
    queryFn: async () => {
      const { data: allCourses, error } = await supabase
        .from('courses')
        .select('*');

      if (error) throw error;

      const courses = allCourses as Course[];

      // Calculer les statistiques
      const stats: CourseStats = {
        total_courses: courses.length,
        active_courses: courses.filter(c => c.is_active).length,
        total_students: courses.reduce((sum, c) => sum + c.enrolled_students, 0),
        total_revenue: courses.reduce((sum, c) => sum + c.revenue, 0),
        avg_completion_rate:
          courses.length > 0
            ? courses.reduce((sum, c) => sum + c.completion_rate, 0) / courses.length
            : 0,
        by_status: {} as Record<CourseStatus, number>,
        by_category: {} as Record<CourseCategory, number>,
      };

      // Par statut
      courses.forEach(course => {
        stats.by_status[course.status] = (stats.by_status[course.status] || 0) + 1;
      });

      // Par catégorie
      courses.forEach(course => {
        stats.by_category[course.category] = (stats.by_category[course.category] || 0) + 1;
      });

      return stats;
    },
  });

  /**
   * Créer un cours
   */
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: CourseFormData) => {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseData,
          status: courseData.status || 'draft',
          currency: courseData.currency || 'EUR',
          is_active: courseData.is_active ?? true,
          enrolled_students: 0,
          completion_rate: 0,
          revenue: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-stats'] });
    },
  });

  /**
   * Mettre à jour un cours
   */
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CourseFormData> }) => {
      const { data, error } = await supabase
        .from('courses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['course-stats'] });
    },
  });

  /**
   * Supprimer un cours
   */
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      return courseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-stats'] });
    },
  });

  /**
   * Publier un cours
   */
  const publishCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase
        .from('courses')
        .update({
          status: 'published',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-stats'] });
    },
  });

  /**
   * Dépublier un cours
   */
  const unpublishCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase
        .from('courses')
        .update({
          status: 'draft',
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-stats'] });
    },
  });

  /**
   * Archiver un cours
   */
  const archiveCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase
        .from('courses')
        .update({
          status: 'archived',
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-stats'] });
    },
  });

  /**
   * Dupliquer un cours
   */
  const duplicateCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      // Récupérer le cours original
      const { data: original, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (fetchError) throw fetchError;

      // Créer une copie
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...original,
          id: undefined,
          name: `${original.name} (Copie)`,
          status: 'draft',
          is_active: false,
          enrolled_students: 0,
          completion_rate: 0,
          revenue: 0,
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-stats'] });
    },
  });

  // Méthodes helpers
  const createCourse = useCallback(
    (data: CourseFormData) => createCourseMutation.mutateAsync(data),
    [createCourseMutation]
  );

  const updateCourse = useCallback(
    (id: string, updates: Partial<CourseFormData>) =>
      updateCourseMutation.mutateAsync({ id, updates }),
    [updateCourseMutation]
  );

  const deleteCourse = useCallback(
    (id: string) => deleteCourseMutation.mutateAsync(id),
    [deleteCourseMutation]
  );

  const publishCourse = useCallback(
    (id: string) => publishCourseMutation.mutateAsync(id),
    [publishCourseMutation]
  );

  const unpublishCourse = useCallback(
    (id: string) => unpublishCourseMutation.mutateAsync(id),
    [unpublishCourseMutation]
  );

  const archiveCourse = useCallback(
    (id: string) => archiveCourseMutation.mutateAsync(id),
    [archiveCourseMutation]
  );

  const duplicateCourse = useCallback(
    (id: string) => duplicateCourseMutation.mutateAsync(id),
    [duplicateCourseMutation]
  );

  return {
    // Data
    courses: courses || [],
    stats,
    isLoading,
    error,

    // Filters
    filters,
    setFilters,

    // Actions
    createCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
    unpublishCourse,
    archiveCourse,
    duplicateCourse,
    refetch,
    useCourseById,

    // Mutation states
    isCreating: createCourseMutation.isPending,
    isUpdating: updateCourseMutation.isPending,
    isDeleting: deleteCourseMutation.isPending,
    isPublishing: publishCourseMutation.isPending,
    isUnpublishing: unpublishCourseMutation.isPending,
    isArchiving: archiveCourseMutation.isPending,
    isDuplicating: duplicateCourseMutation.isPending,
  };
};

export default useCourses;
