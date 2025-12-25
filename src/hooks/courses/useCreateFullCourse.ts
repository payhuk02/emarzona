import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { validateCourseData } from '@/lib/validation/courseSchemas';

// Type pour le résultat de la fonction SQL create_full_course
type CreateFullCourseResult = {
  success: boolean;
  product_id?: string;
  course_id?: string;
  sections_count?: number;
  lessons_count?: number;
  error?: string;
  error_code?: string;
};

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
  isOpen: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_type: 'upload' | 'youtube' | 'vimeo' | 'google-drive' | 'external';
  video_url?: string;
  video_duration_seconds?: number;
  is_preview: boolean;
  order_index: number;
}

interface CreateFullCourseData {
  // Données du produit
  storeId: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  image_url?: string;
  images?: string[];
  price: number;
  currency: string;
  promotional_price?: number;
  pricing_model?: 'one-time' | 'subscription' | 'free' | 'pay-what-you-want';
  create_free_preview?: boolean;
  preview_content_description?: string;
  licensing_type?: 'standard' | 'plr' | 'copyrighted';
  license_terms?: string;

  // Données du cours
  level: string;
  language: string;
  certificate_enabled: boolean;
  certificate_passing_score: number;
  learning_objectives: string[];
  prerequisites: string[];
  target_audience: string[];

  // Curriculum
  sections: Section[];

  // SEO
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;

  // FAQs
  faqs?: Array<{
    id?: string;
    question: string;
    answer: string;
    order?: number;
  }>;

  // Affiliation
  affiliate_enabled?: boolean;
  commission_rate?: number;
  commission_type?: 'percentage' | 'fixed';
  fixed_commission_amount?: number;
  cookie_duration_days?: number;
  max_commission_per_sale?: number;
  min_order_amount?: number;
  allow_self_referral?: boolean;
  require_approval?: boolean;
  affiliate_terms_and_conditions?: string;

  // Tracking & Pixels
  tracking_enabled?: boolean;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  google_tag_manager_id?: string;
  tiktok_pixel_id?: string;
  track_video_events?: boolean;
  track_lesson_completion?: boolean;
  track_quiz_attempts?: boolean;
  track_certificate_downloads?: boolean;
}

/**
 * Hook pour créer un cours complet avec toutes ses dépendances
 * Gère la transaction complète : produit → cours → sections → leçons
 */
export const useCreateFullCourse = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: CreateFullCourseData) => {
      try {
        // Récupérer l'utilisateur connecté
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Utilisateur non connecté');
        }

        // VALIDATION SERVEUR avec Zod
        logger.info('Validating course data with Zod schema', { storeId: data.storeId });
        const validationResult = validateCourseData(data);

        if (!validationResult.success) {
          const errorMessages = validationResult.errors.errors
            .map(err => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
          logger.error('Course data validation failed', { errors: validationResult.errors.errors });
          throw new Error(`Erreur de validation: ${errorMessages}`);
        }

        const validatedData = validationResult.data;
        logger.info('Course data validated successfully', { storeId: validatedData.storeId });

        // Utiliser la fonction SQL avec transaction
        // Convertir les sections en JSONB pour la fonction SQL
        const sectionsJsonb = JSON.parse(
          JSON.stringify(
            validatedData.sections.map(section => ({
              title: section.title,
              description: section.description || null,
              order_index: section.order_index,
              lessons: section.lessons.map(lesson => ({
                title: lesson.title,
                description: lesson.description || null,
                order_index: lesson.order_index,
                video_type: lesson.video_type,
                video_url: lesson.video_url || '',
                video_duration_seconds: lesson.video_duration_seconds || 0,
                is_preview: lesson.is_preview || false,
              })),
            }))
          )
        );

        // Appeler la fonction SQL avec transaction
        // Note: L'ordre des paramètres correspond à la fonction SQL (obligatoires d'abord, optionnels ensuite)
        logger.info('Calling SQL function create_full_course with transaction', {
          storeId: validatedData.storeId,
        });

        // @ts-expect-error - create_full_course n'est pas encore dans les types générés Supabase
        const { data: result, error: rpcError } = await supabase.rpc('create_full_course', {
          // Paramètres obligatoires (dans l'ordre)
          p_store_id: validatedData.storeId,
          p_name: validatedData.name,
          p_slug: validatedData.slug,
          p_short_description: validatedData.short_description,
          p_description: validatedData.description,
          p_category: validatedData.category,
          p_price: validatedData.price,
          p_level: validatedData.level,
          p_sections: sectionsJsonb,

          // Paramètres optionnels (tous avec valeurs par défaut dans SQL)
          p_image_url: validatedData.image_url || null,
          p_images: validatedData.images || [],
          p_currency: validatedData.currency,
          p_promotional_price: validatedData.promotional_price || null,
          p_pricing_model: validatedData.pricing_model || 'one-time',
          p_licensing_type: validatedData.licensing_type || 'standard',
          p_license_terms: validatedData.license_terms || null,
          p_meta_title: validatedData.meta_title || null,
          p_meta_description: validatedData.meta_description || null,
          p_meta_keywords: validatedData.meta_keywords || null,
          p_og_image: validatedData.og_image || null,
          p_faqs: validatedData.faqs || [],
          p_language: validatedData.language,
          p_certificate_enabled: validatedData.certificate_enabled,
          p_certificate_passing_score: validatedData.certificate_passing_score,
          p_learning_objectives: validatedData.learning_objectives || [],
          p_prerequisites: validatedData.prerequisites || [],
          p_target_audience: validatedData.target_audience || [],
          p_affiliate_enabled: validatedData.affiliate_enabled || false,
          p_commission_rate: validatedData.commission_rate || null,
          p_commission_type: validatedData.commission_type || null,
          p_fixed_commission_amount: validatedData.fixed_commission_amount || null,
          p_cookie_duration_days: validatedData.cookie_duration_days || null,
          p_max_commission_per_sale: validatedData.max_commission_per_sale || null,
          p_min_order_amount: validatedData.min_order_amount || null,
          p_allow_self_referral: validatedData.allow_self_referral || null,
          p_require_approval: validatedData.require_approval || null,
          p_affiliate_terms_and_conditions: validatedData.affiliate_terms_and_conditions || null,
          p_tracking_enabled: validatedData.tracking_enabled !== false,
          p_google_analytics_id: validatedData.google_analytics_id || null,
          p_facebook_pixel_id: validatedData.facebook_pixel_id || null,
          p_google_tag_manager_id: validatedData.google_tag_manager_id || null,
          p_tiktok_pixel_id: validatedData.tiktok_pixel_id || null,
        });

        if (rpcError) {
          logger.error('Error calling create_full_course SQL function', { error: rpcError });
          throw new Error(`Erreur lors de la création du cours: ${rpcError.message}`);
        }

        // Typer explicitement le résultat de la fonction RPC (cast via unknown pour éviter les erreurs de type)
        const typedResult = result as unknown as CreateFullCourseResult | null;

        if (!typedResult || !typedResult.success) {
          const errorMsg = typedResult?.error || 'Erreur inconnue lors de la création du cours';
          logger.error('Course creation failed in SQL function', {
            error: errorMsg,
            errorCode: typedResult?.error_code,
          });
          throw new Error(errorMsg);
        }

        if (!typedResult.product_id || !typedResult.course_id) {
          logger.error('Course creation returned invalid data', { result: typedResult });
          throw new Error('Cours créé mais données invalides retournées');
        }

        logger.info('Course created successfully via SQL function', {
          productId: typedResult.product_id,
          courseId: typedResult.course_id,
          sectionsCount: typedResult.sections_count,
          lessonsCount: typedResult.lessons_count,
        });

        // Récupérer le produit et le cours créés pour le retour
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', typedResult.product_id)
          .single();

        if (productError || !product) {
          logger.error('Error fetching created product', { error: productError });
          throw new Error('Cours créé mais erreur lors de la récupération des données');
        }

        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', typedResult.course_id)
          .single();

        if (courseError || !course) {
          logger.error('Error fetching created course', { error: courseError });
          throw new Error('Cours créé mais erreur lors de la récupération des données');
        }

        // ÉTAPE 7 : Créer le cours preview gratuit si demandé (en dehors de la transaction principale)
        if (validatedData.create_free_preview && validatedData.pricing_model !== 'free') {
          try {
            logger.info('Creating free preview course', { paidProductId: product.id });

            const { data: previewCourseId, error: previewError } = await supabase.rpc(
              'create_free_preview_course',
              {
                p_paid_product_id: product.id,
                p_preview_content_description:
                  validatedData.preview_content_description || undefined,
              }
            );

            if (previewError) {
              logger.error('Error creating free preview course', {
                error: previewError,
                paidProductId: product.id,
              });
              logger.warn('Paid course created but free preview failed', {
                paidProductId: product.id,
              });
            } else {
              logger.info('Free preview course created successfully', {
                previewCourseId,
                paidProductId: product.id,
              });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Exception creating free preview course', {
              error: errorMessage,
              paidProductId: product.id,
            });
            // Ne pas faire échouer la création du cours principal
          }
        }

        return {
          product,
          course,
          sectionsCount: typedResult.sections_count || 0,
          lessonsCount: typedResult.lessons_count || 0,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Global error creating course', {
          error: errorMessage,
          storeId: data.storeId,
        });
        throw error;
      }
    },
    onSuccess: result => {
      toast({
        title: '🎉 Cours créé avec succès !',
        description: `Votre cours "${result.product.name}" a été publié avec ${result.sectionsCount} sections et ${result.lessonsCount} leçons.`,
        duration: 5000,
      });

      // Rediriger vers la page des produits
      setTimeout(() => {
        navigate('/dashboard/products');
      }, 1500);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Final error creating course', { error: errorMessage });
      toast({
        title: '❌ Erreur lors de la création du cours',
        description: errorMessage || 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
        duration: 7000,
      });
    },
  });
};
