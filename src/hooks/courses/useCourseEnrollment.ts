import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CourseEnrollment } from '@/types/courses';

/**
 * Hook pour récupérer l'inscription d'un utilisateur à un cours
 * @param courseId - ID du cours
 * @param userId - ID de l'utilisateur (optionnel, utilise l'utilisateur connecté par défaut)
 */
export const useCourseEnrollment = (courseId: string | undefined, userId?: string) => {
  return useQuery({
    queryKey: ['course-enrollment', courseId, userId],
    queryFn: async () => {
      if (!courseId) return null;

      // Récupérer l'utilisateur connecté si userId n'est pas fourni
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(
            *,
            product:products(*)
          )
        `)
        .eq('course_id', courseId)
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas d'inscription trouvée
          return null;
        }
        throw error;
      }

      return data as CourseEnrollment;
    },
    enabled: !!courseId,
  });
};

/**
 * Hook pour récupérer tous les cours auxquels un utilisateur est inscrit
 * @param userId - ID de l'utilisateur (optionnel)
 */
export const useMyEnrollments = (userId?: string) => {
  return useQuery({
    queryKey: ['my-enrollments', userId],
    queryFn: async () => {
      // Récupérer l'utilisateur connecté si userId n'est pas fourni
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(
            *,
            product:products(*)
          )
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CourseEnrollment[];
    },
  });
};

/**
 * Hook pour créer une inscription à un cours
 */
export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      courseId, 
      productId, 
      orderId 
    }: { 
      courseId: string; 
      productId: string; 
      orderId?: string;
    }) => {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Vérifier si l'utilisateur est déjà inscrit
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        throw new Error('Vous êtes déjà inscrit à ce cours');
      }

      // Récupérer le nombre total de leçons du cours
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      // Créer l'inscription
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: courseId,
          product_id: productId,
          user_id: user.id,
          order_id: orderId,
          status: 'active',
          total_lessons: lessons?.length || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CourseEnrollment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollment', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      toast({
        title: 'Inscription réussie ! 🎉',
        description: 'Vous êtes maintenant inscrit à ce cours.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'inscription',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour une inscription
 */
export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      enrollmentId, 
      updates 
    }: { 
      enrollmentId: string; 
      updates: Partial<CourseEnrollment>;
    }) => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .update(updates)
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data as CourseEnrollment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollment', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
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
 * Hook pour vérifier si un utilisateur est inscrit à un cours
 * @param courseId - ID du cours
 */
export const useIsEnrolled = (courseId: string | undefined) => {
  const { data: enrollment, isLoading } = useCourseEnrollment(courseId);
  
  return {
    isEnrolled: !!enrollment && enrollment.status === 'active',
    enrollment,
    isLoading,
  };
};

/**
 * Hook pour récupérer les inscriptions d'un cours (pour l'instructeur)
 * @param courseId - ID du cours
 */
export const useCourseEnrollments = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-enrollments', courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          user:auth.users(
            id,
            email
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CourseEnrollment[];
    },
    enabled: !!courseId,
  });
};

