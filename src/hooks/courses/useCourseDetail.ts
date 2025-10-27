/**
 * Hook pour récupérer les détails complets d'un cours
 * Date : 27 octobre 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCourseDetail = (slug: string) => {
  return useQuery({
    queryKey: ['course-detail', slug],
    queryFn: async () => {
      // 1. Récupérer le produit par slug
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('product_type', 'course')
        .eq('is_active', true)
        .single();

      if (productError) {
        throw new Error(`Cours non trouvé: ${productError.message}`);
      }

      // 2. Récupérer les détails du cours
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('product_id', product.id)
        .single();

      if (courseError) {
        throw new Error(`Détails du cours non trouvés: ${courseError.message}`);
      }

      // 3. Récupérer les sections
      const { data: sections, error: sectionsError } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true });

      if (sectionsError) {
        throw new Error(`Erreur sections: ${sectionsError.message}`);
      }

      // 4. Récupérer toutes les leçons
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true });

      if (lessonsError) {
        throw new Error(`Erreur leçons: ${lessonsError.message}`);
      }

      // 5. Organiser les leçons par section
      const sectionsWithLessons = sections.map(section => ({
        ...section,
        lessons: lessons.filter(lesson => lesson.section_id === section.id)
      }));

      // 6. Récupérer le store (pour afficher l'instructeur)
      const { data: store } = await supabase
        .from('stores')
        .select('id, name, slug, logo_url')
        .eq('id', product.store_id)
        .single();

      // 7. Vérifier si l'utilisateur est inscrit et récupérer la progression
      let isEnrolled = false;
      let lastViewedLesson = null;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id, status')
          .eq('course_id', course.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        isEnrolled = !!enrollment;

        // 8. Si inscrit, récupérer la dernière leçon visualisée
        if (enrollment) {
          const { data: progressData } = await supabase
            .from('course_lesson_progress')
            .select('lesson_id, updated_at, is_completed')
            .eq('enrollment_id', enrollment.id)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (progressData) {
            // Trouver la leçon correspondante
            for (const section of sectionsWithLessons) {
              const lesson = section.lessons.find((l: any) => l.id === progressData.lesson_id);
              if (lesson) {
                lastViewedLesson = lesson;
                break;
              }
            }
          }
        }
      }

      return {
        product,
        course,
        sections: sectionsWithLessons,
        store,
        isEnrolled,
        lastViewedLesson,
      };
    },
    enabled: !!slug,
  });
};

