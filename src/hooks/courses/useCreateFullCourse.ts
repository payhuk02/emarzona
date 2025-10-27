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
            price: data.price,
            currency: data.currency,
            promotional_price: data.promotional_price || null,
            is_active: true,
            is_draft: false,
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

        console.log('🎉 COURS CRÉÉ AVEC SUCCÈS !');
        console.log(`📊 Résumé: ${data.sections.length} sections, ${totalCreatedLessons} leçons`);

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

