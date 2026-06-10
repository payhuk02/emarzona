import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { CourseEnrollment } from '@/types/courses';
import { notifyCourseEnrollment } from '@/lib/notifications/helpers';
import { enrollUserInCourse } from '@/lib/courses/enroll-user';

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(
          `
          *,
          course:courses(
            *,
            product:products(*)
          )
        `
        )
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(
          `
          *,
          course:courses(
            *,
            product:products(*)
          )
        `
        )
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
      orderId,
      courseName,
      courseSlug,
    }: {
      courseId: string;
      productId: string;
      orderId?: string;
      courseName?: string;
      courseSlug?: string;
    }) => {
      // Récupérer l'utilisateur connecté
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

      const enrollmentId = await enrollUserInCourse({
        courseId,
        orderId: orderId ?? null,
        userId: user.id,
      });

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('id', enrollmentId)
        .single();

      if (error) throw error;

      // Créer notification d'enrollment
      if (courseName && courseSlug) {
        await notifyCourseEnrollment(user.id, courseName, courseSlug);
      }

      // Déclencher webhook course.enrolled (asynchrone, ne bloque pas)
      import('@/lib/webhooks').then(({ triggerCourseEnrolledWebhook }) => {
        // Récupérer le store_id depuis le produit
        supabase
          .from('products')
          .select('store_id')
          .eq('id', productId)
          .single()
          .then(({ data: product }) => {
            triggerCourseEnrolledWebhook(
              data.id,
              {
                course_id: courseId,
                user_id: user.id,
                progress_percentage: 0,
                status: 'active',
                enrolled_at: data.enrollment_date || data.created_at,
              },
              product?.store_id
            ).catch(err => {
              logger.error('Error in analytics tracking for course enrollment', {
                error: err,
                enrollmentId: data.id,
              });
            });
          })
          .catch(err => {
            logger.error('Error in notification for course enrollment', {
              error: err,
              courseId,
              userId: user.id,
            });
          });
      });

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
    onError: (error: unknown) => {
      toast({
        title: "Erreur d'inscription",
        description: error instanceof Error ? error.message : 'Erreur inconnue',
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
      updates,
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
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollment', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
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
        .select(
          `
          *,
          user:auth.users(
            id,
            email
          )
        `
        )
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CourseEnrollment[];
    },
    enabled: !!courseId,
  });
};
