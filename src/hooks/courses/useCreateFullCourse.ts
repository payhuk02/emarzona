import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  video_type: 'upload' | 'youtube' | 'vimeo';
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
  faqs?: any[];
  
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Utilisateur non connecté');
        }

        // ÉTAPE 1 : Créer le produit
        console.log('📦 Création du produit...');
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            store_id: data.storeId,
            name: data.name,
            slug: data.slug,
            short_description: data.short_description,
            description: data.description,
            category: data.category,
            product_type: 'course',
            price: data.pricing_model === 'free' ? 0 : data.price,
            currency: data.currency,
            promotional_price: data.promotional_price || null,
            pricing_model: data.pricing_model || 'one-time',
            licensing_type: data.licensing_type || 'standard',
            license_terms: data.license_terms || null,
            is_active: true,
            is_draft: false,
            // SEO
            meta_title: data.meta_title || null,
            meta_description: data.meta_description || null,
            meta_keywords: data.meta_keywords || null,
            og_image: data.og_image || null,
            // FAQs
            faqs: data.faqs || null,
          })
          .select()
          .single();

        if (productError) {
          console.error('❌ Erreur création produit:', productError);
          throw new Error(`Erreur lors de la création du produit: ${productError.message}`);
        }

        console.log('✅ Produit créé:', product.id);

        // ÉTAPE 2 : Créer le cours
        console.log('🎓 Création du cours...');
        
        // Calculer les statistiques
        const totalLessons = data.sections.reduce((total, section) => total + section.lessons.length, 0);
        const totalDuration = data.sections.reduce((total, section) => {
          return total + section.lessons.reduce((sum, lesson) => sum + (lesson.video_duration_seconds || 0), 0);
        }, 0);

        const { data: course, error: courseError } = await supabase
          .from('courses')
          .insert({
            product_id: product.id,
            level: data.level,
            language: data.language,
            total_duration_minutes: Math.round(totalDuration / 60),
            total_lessons: totalLessons,
            learning_objectives: data.learning_objectives,
            prerequisites: data.prerequisites,
            target_audience: data.target_audience,
            certificate_enabled: data.certificate_enabled,
            certificate_passing_score: data.certificate_passing_score,
          })
          .select()
          .single();

        if (courseError) {
          console.error('❌ Erreur création cours:', courseError);
          // Rollback : supprimer le produit
          await supabase.from('products').delete().eq('id', product.id);
          throw new Error(`Erreur lors de la création du cours: ${courseError.message}`);
        }

        console.log('✅ Cours créé:', course.id);

        // ÉTAPE 3 : Créer les sections
        console.log('📚 Création des sections...');
        const createdSections: any[] = [];

        for (const section of data.sections) {
          const { data: createdSection, error: sectionError } = await supabase
            .from('course_sections')
            .insert({
              course_id: course.id,
              title: section.title,
              description: section.description || null,
              order_index: section.order_index,
            })
            .select()
            .single();

          if (sectionError) {
            console.error('❌ Erreur création section:', sectionError);
            // Rollback : supprimer le cours et le produit
            await supabase.from('courses').delete().eq('id', course.id);
            await supabase.from('products').delete().eq('id', product.id);
            throw new Error(`Erreur lors de la création de la section: ${sectionError.message}`);
          }

          createdSections.push({ ...createdSection, originalSection: section });
          console.log(`✅ Section créée: ${createdSection.id} - ${section.title}`);
        }

        // ÉTAPE 4 : Créer les leçons
        console.log('📹 Création des leçons...');
        let totalCreatedLessons = 0;

        for (const sectionData of createdSections) {
          const section = sectionData.originalSection;
          
          for (const lesson of section.lessons) {
            const { error: lessonError } = await supabase
              .from('course_lessons')
              .insert({
                section_id: sectionData.id,
                course_id: course.id,
                title: lesson.title,
                description: lesson.description || null,
                order_index: lesson.order_index,
                video_type: lesson.video_type || 'upload',
                video_url: lesson.video_url || '',
                video_duration_seconds: lesson.video_duration_seconds || 0,
                is_preview: lesson.is_preview || false,
                is_required: true,
              });

            if (lessonError) {
              console.error('❌ Erreur création leçon:', lessonError);
              // Rollback : supprimer tout
              await supabase.from('courses').delete().eq('id', course.id);
              await supabase.from('products').delete().eq('id', product.id);
              throw new Error(`Erreur lors de la création de la leçon: ${lessonError.message}`);
            }

            totalCreatedLessons++;
            console.log(`✅ Leçon créée: ${lesson.title}`);
          }
        }

        // ÉTAPE 5 : Créer les settings d'affiliation (si activé)
        if (data.affiliate_enabled) {
          console.log('💰 Création des settings d\'affiliation...');
          const { error: affiliateError } = await supabase
            .from('product_affiliate_settings')
            .insert({
              product_id: product.id,
              store_id: data.storeId,
              affiliate_enabled: true,
              commission_rate: data.commission_rate || 20,
              commission_type: data.commission_type || 'percentage',
              fixed_commission_amount: data.fixed_commission_amount || 0,
              cookie_duration_days: data.cookie_duration_days || 30,
              max_commission_per_sale: data.max_commission_per_sale || null,
              min_order_amount: data.min_order_amount || 0,
              allow_self_referral: data.allow_self_referral || false,
              require_approval: data.require_approval || false,
              terms_and_conditions: data.affiliate_terms_and_conditions || '',
            });

          if (affiliateError) {
            console.error('❌ Erreur création settings affiliation:', affiliateError);
            // Ne pas faire de rollback complet car le cours est déjà créé
            // Juste logger l'erreur et continuer
            console.warn('⚠️ Le cours a été créé mais sans configuration d\'affiliation');
          } else {
            console.log('✅ Settings d\'affiliation créés');
          }
        }

        // ÉTAPE 6 : Configurer le tracking et les pixels
        console.log('📊 Configuration du tracking...');
        const { error: analyticsError } = await supabase
          .from('product_analytics')
          .upsert({
            product_id: product.id,
            store_id: data.storeId,
            tracking_enabled: data.tracking_enabled !== false, // true par défaut
            google_analytics_id: data.google_analytics_id || null,
            facebook_pixel_id: data.facebook_pixel_id || null,
            google_tag_manager_id: data.google_tag_manager_id || null,
            tiktok_pixel_id: data.tiktok_pixel_id || null,
          });

        if (analyticsError) {
          console.error('❌ Erreur configuration analytics:', analyticsError);
          console.warn('⚠️ Le cours a été créé mais sans configuration analytics');
        } else {
          console.log('✅ Tracking configuré avec succès');
        }

        console.log('🎉 COURS CRÉÉ AVEC SUCCÈS !');
        console.log(`📊 Résumé: ${data.sections.length} sections, ${totalCreatedLessons} leçons`);

        // ÉTAPE 7 : Créer le cours preview gratuit si demandé
        if (data.create_free_preview && data.pricing_model !== 'free') {
          try {
            console.log('🎁 Création du cours preview gratuit...');
            
            const { data: previewCourseId, error: previewError } = await supabase
              .rpc('create_free_preview_course', {
                p_paid_product_id: product.id,
                p_preview_content_description: data.preview_content_description || null,
              });

            if (previewError) {
              console.error('❌ Erreur création cours preview:', previewError);
              console.warn('⚠️ Le cours payant a été créé mais le preview gratuit a échoué');
            } else {
              console.log('✅ Cours preview gratuit créé:', previewCourseId);
            }
          } catch (error: any) {
            console.error('💥 Exception création cours preview:', error);
            // Ne pas faire échouer la création du cours principal
          }
        }

        return {
          product,
          course,
          sectionsCount: data.sections.length,
          lessonsCount: totalCreatedLessons,
        };
      } catch (error: any) {
        console.error('💥 Erreur globale:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
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
    onError: (error: any) => {
      console.error('❌ Erreur finale:', error);
      toast({
        title: '❌ Erreur lors de la création du cours',
        description: error.message || 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
        duration: 7000,
      });
    },
  });
};

