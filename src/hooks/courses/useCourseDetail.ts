/**
 * Hook pour récupérer les détails complets d'un cours
 * Date : 27 octobre 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const PRODUCT_FIELDS =
  'id, store_id, slug, name, description, short_description, product_type, is_active, free_product_id, paid_product_id, image_url, price, promotional_price, currency, category, faqs, licensing_type, license_terms, created_at, updated_at';
const COURSE_FIELDS =
  'id, product_id, level, language, certificate_enabled, learning_objectives, prerequisites, target_audience, total_lessons, total_duration_minutes, total_enrollments, average_rating, created_at, updated_at';
const COURSE_SECTION_FIELDS =
  'id, course_id, title, description, order_index, created_at, updated_at';
const COURSE_LESSON_FIELDS =
  'id, course_id, section_id, title, description, video_type, video_url, video_duration_seconds, order_index, is_preview, created_at, updated_at';

export const useCourseDetail = (slug: string) => {
  return useQuery({
    queryKey: ['course-detail', slug],
    queryFn: async () => {
      // 1. Récupérer le produit par slug avec relations preview/paid
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('slug', slug)
        .eq('product_type', 'course')
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        throw new Error(`Cours non trouvé: ${productError?.message || 'introuvable'}`);
      }

      // Récupérer les produits preview/paid si ils existent
      let freeProduct = null;
      let paidProduct = null;

      if (product.free_product_id) {
        const { data: freeData } = await supabase
          .from('products')
          .select(PRODUCT_FIELDS)
          .eq('id', product.free_product_id)
          .maybeSingle();
        freeProduct = freeData;
      }

      if (product.paid_product_id) {
        const { data: paidData } = await supabase
          .from('products')
          .select(PRODUCT_FIELDS)
          .eq('id', product.paid_product_id)
          .maybeSingle();
        paidProduct = paidData;
      }

      // 2. Récupérer les détails du cours
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(COURSE_FIELDS)
        .eq('product_id', product.id)
        .single();

      if (courseError || !course) {
        throw new Error(`Cours non trouvé: ${courseError?.message || 'détails manquants'}`);
      }

      // 3–6. Parallelize sections / lessons / store / enrollment to avoid serial timeouts.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [sectionsResult, lessonsResult, storeResult, enrollmentResult] = await Promise.all([
        supabase
          .from('course_sections')
          .select(COURSE_SECTION_FIELDS)
          .eq('course_id', course.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('course_lessons')
          .select(COURSE_LESSON_FIELDS)
          .eq('course_id', course.id)
          .order('order_index', { ascending: true }),
        supabase
          .from('stores_public')
          .select('id, name, slug, logo_url')
          .eq('id', product.store_id)
          .maybeSingle(),
        user
          ? supabase
              .from('course_enrollments')
              .select('id, status')
              .eq('course_id', course.id)
              .eq('user_id', user.id)
              .eq('status', 'active')
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      // Soft-fail curriculum: unpaid buyers may hit lesson RLS; page must still render h1 + CTA
      if (sectionsResult.error) {
        logger.warn('course sections query failed', {
          error: sectionsResult.error.message,
          courseId: course.id,
        });
      }
      if (lessonsResult.error) {
        logger.warn('course lessons query failed', {
          error: lessonsResult.error.message,
          courseId: course.id,
        });
      }
      if (enrollmentResult.error) {
        logger.warn('course enrollment query failed', {
          error: enrollmentResult.error.message,
          courseId: course.id,
        });
      }

      const sections = sectionsResult.data ?? [];
      const lessons = lessonsResult.data ?? [];
      const store = storeResult.data ?? null;

      const sectionsWithLessons = sections.map(section => ({
        ...section,
        lessons: lessons.filter(lesson => lesson.section_id === section.id),
      }));

      let isEnrolled = false;
      let enrollment = null;
      let lastViewedLesson = null;

      const enrollmentData = enrollmentResult.data;
      if (enrollmentData && user) {
        isEnrolled = true;
        enrollment = enrollmentData;

        const { data: progressData } = await supabase
          .from('course_lesson_progress')
          .select('lesson_id, updated_at, is_completed')
          .eq('enrollment_id', enrollmentData.id)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (progressData) {
          for (const section of sectionsWithLessons) {
            const lesson = section.lessons.find(
              (l: { id: string }) => l.id === progressData.lesson_id
            );
            if (lesson) {
              lastViewedLesson = lesson;
              break;
            }
          }
        }
      }

      return {
        product: {
          ...product,
          free_product: freeProduct,
          paid_product: paidProduct,
        },
        course,
        sections: sectionsWithLessons,
        store,
        isEnrolled,
        enrollment,
        lastViewedLesson,
      };
    },
    enabled: !!slug,
    retry: 1,
    staleTime: 30_000,
  });
};
