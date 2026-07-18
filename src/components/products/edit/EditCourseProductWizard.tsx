/**
 * Edit Course Product Wizard
 * Date: 2025-01-26
 *
 * Wizard professionnel pour l'édition complète de cours en ligne
 * Permet de modifier toutes les étapes comme dans le wizard de création
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  GraduationCap,
  ArrowLeft,
  Info,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { CourseBasicInfoForm } from '@/components/courses/create/CourseBasicInfoForm';
import { CourseCurriculumBuilder } from '@/components/courses/create/CourseCurriculumBuilder';
import { CourseAdvancedConfig } from '@/components/courses/create/CourseAdvancedConfig';
import { CourseSEOForm, CourseSEOData } from '@/components/courses/create/CourseSEOForm';
import { CourseFAQForm, FAQ } from '@/components/courses/create/CourseFAQForm';
import {
  CourseAffiliateSettings,
  CourseAffiliateData,
} from '@/components/courses/create/CourseAffiliateSettings';
import {
  CoursePixelsConfig,
  CoursePixelsData,
} from '@/components/courses/create/CoursePixelsConfig';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  validateCourseWizardPublishSteps,
  validateCourseWizardStep,
} from '@/lib/course-wizard-step-validation';
import { updateFullCourseTx } from '@/lib/products/product-update-rpc';
import { logger } from '@/lib/logger';
import { useCatalogCacheInvalidation } from '@/hooks/useCatalogCacheInvalidation';
import { useQuery } from '@tanstack/react-query';
import type { CourseSection, CourseLesson, CourseFormData } from '@/types/course-form';

const PRODUCT_FIELDS =
  'id, store_id, name, slug, description, short_description, category, category_id, image_url, images, price, currency, promotional_price, pricing_model, free_product_id, licensing_type, license_terms, meta_title, meta_description, og_image, faqs';
const COURSE_FIELDS =
  'id, product_id, level, language, certificate_enabled, certificate_passing_score, learning_objectives, prerequisites, target_audience';
const PRODUCT_AFFILIATE_FIELDS =
  'id, product_id, affiliate_enabled, commission_rate, commission_type, fixed_commission_amount, cookie_duration_days, max_commission_per_sale, min_order_amount, allow_self_referral, require_approval, terms_and_conditions';
const COURSE_SECTION_FIELDS = 'id, course_id, title, description, order_index';
const COURSE_LESSON_FIELDS =
  'id, section_id, course_id, title, description, video_url, video_duration_seconds, order_index, is_preview, downloadable_resources, notes, transcript, video_type';
const COURSE_TRACKING_FIELDS =
  'id, course_id, tracking_enabled, google_analytics_id, facebook_pixel_id, google_tag_manager_id, tiktok_pixel_id, track_video_events, track_lesson_completion, track_quiz_attempts, track_certificate_downloads';

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: CourseLesson[];
  isOpen?: boolean;
}

const STEPS = [
  {
    id: 1,
    name: 'Informations de base',
    description: 'Titre, description, niveau',
    icon: Info,
  },
  {
    id: 2,
    name: 'Curriculum',
    description: 'Sections et leçons',
    icon: GraduationCap,
  },
  {
    id: 3,
    name: 'Configuration',
    description: 'Prix et paramètres',
    icon: Info,
  },
  {
    id: 4,
    name: 'SEO & FAQs',
    description: 'Référencement et questions',
    icon: Info,
  },
  {
    id: 5,
    name: 'Affiliation',
    description: "Programme d'affiliation",
    icon: Info,
  },
  {
    id: 6,
    name: 'Tracking',
    description: 'Pixels & Analytics',
    icon: Info,
  },
  {
    id: 7,
    name: 'Révision',
    description: 'Vérifier et publier',
    icon: Check,
  },
];

interface EditCourseProductWizardProps {
  productId: string;
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

/**
 * Convert course product from DB to form data
 * ✅ SÉCURITÉ: Inclut validation de propriété
 */
const convertToFormData = async (
  productId: string,
  userId?: string
): Promise<{
  formData: Partial<CourseFormData>;
  sections: Section[];
  seoData: CourseSEOData;
  faqs: FAQ[];
  affiliateData: CourseAffiliateData;
  pixelsData: CoursePixelsData;
}> => {
  // ✅ SÉCURITÉ: Vérifier propriété du produit avant chargement
  if (userId) {
    const { data: ownershipCheck, error: ownershipError } = await supabase
      .from('products')
      .select(
        `
        id,
        stores!inner(user_id)
      `
      )
      .eq('id', productId)
      .eq('stores.user_id', userId)
      .single();

    if (ownershipError || !ownershipCheck) {
      throw new Error('Accès non autorisé à ce produit');
    }
  }

  // Produit principal
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('id', productId)
    .single();

  if (productError) throw productError;
  if (!product) throw new Error('Produit non trouvé');

  // 🚀 PERFORMANCE: Charger course + affiliation, puis curriculum via course_id
  const [{ data: course, error: courseError }, { data: affiliateSettings }] = await Promise.all([
    // Données de la course
    supabase.from('courses').select(COURSE_FIELDS).eq('product_id', productId).maybeSingle(),

    // Paramètres d'affiliation
    supabase
      .from('product_affiliate_settings')
      .select(PRODUCT_AFFILIATE_FIELDS)
      .eq('product_id', productId)
      .maybeSingle(),
  ]);

  if (courseError && courseError.code !== 'PGRST116') throw courseError;

  let sectionsData: Record<string, unknown>[] = [];
  let lessonsData: Record<string, unknown>[] = [];

  if (course?.id) {
    const [sectionsResult, lessonsResult] = await Promise.all([
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
    ]);

    if (sectionsResult.error) throw sectionsResult.error;
    if (lessonsResult.error) throw lessonsResult.error;

    sectionsData = (sectionsResult.data || []) as Record<string, unknown>[];
    lessonsData = (lessonsResult.data || []) as Record<string, unknown>[];
  }

  // Organize lessons by section
  const sections: Section[] = (sectionsData || []).map((section: Record<string, unknown>) => ({
    id: section.id as string,
    title: (section.title as string) || '',
    description: (section.description as string) || undefined,
    order_index: (section.order_index as number) || 0,
    lessons: (lessonsData || [])
      .filter((lesson: Record<string, unknown>) => lesson.section_id === section.id)
      .map((lesson: Record<string, unknown>) => ({
        id: lesson.id,
        title: lesson.title || '',
        description: lesson.description || undefined,
        content: lesson.notes || lesson.transcript || undefined,
        video_url: lesson.video_url || undefined,
        video_duration: lesson.video_duration_seconds || undefined,
        order_index: lesson.order_index || 0,
        is_preview: lesson.is_preview || false,
        resources: lesson.downloadable_resources || [],
      })) as CourseLesson[],
    isOpen: false,
  }));

  // Affiliate settings déjà chargés via jointure

  // Load pixels/tracking settings (course_id = courses.id, not products.id)
  let pixelsSettings: Record<string, unknown> | null = null;
  if (course?.id) {
    const { data } = await supabase
      .from('course_tracking_settings')
      .select(COURSE_TRACKING_FIELDS)
      .eq('course_id', course.id)
      .limit(1)
      .maybeSingle();
    pixelsSettings = data;
  }

  return {
    formData: {
      title: product.name || '',
      slug: product.slug || '',
      short_description: product.short_description || '',
      description: product.description || '',
      level: course?.level || '',
      language: course?.language || 'fr',
      category: product.category || '',
      image_url: product.image_url || '',
      images: product.images || [],
      price: product.price || 0,
      currency: product.currency || 'XOF',
      promotional_price: product.promotional_price || undefined,
      pricing_model:
        (product.pricing_model as 'one-time' | 'subscription' | 'lifetime') || 'one-time',
      create_free_preview: !!product.free_product_id,
      preview_content_description: '',
      licensing_type: (product.licensing_type as 'standard' | 'plr' | 'copyrighted') || 'standard',
      license_terms: product.license_terms || '',
      certificate_enabled: course?.certificate_enabled ?? true,
      certificate_passing_score: course?.certificate_passing_score || 80,
      learning_objectives: course?.learning_objectives || [],
      prerequisites: course?.prerequisites || [],
      target_audience: course?.target_audience || [],
      store_id: product.store_id,
    },
    sections,
    seoData: {
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: product.og_image || '',
    },
    faqs: product.faqs || [],
    affiliateData: affiliateSettings
      ? {
          affiliate_enabled: affiliateSettings.affiliate_enabled || false,
          commission_rate: affiliateSettings.commission_rate || 20,
          commission_type:
            (affiliateSettings.commission_type as 'percentage' | 'fixed') || 'percentage',
          fixed_commission_amount: affiliateSettings.fixed_commission_amount || 0,
          cookie_duration_days: affiliateSettings.cookie_duration_days || 30,
          max_commission_per_sale: affiliateSettings.max_commission_per_sale || undefined,
          min_order_amount: affiliateSettings.min_order_amount || 0,
          allow_self_referral: affiliateSettings.allow_self_referral || false,
          require_approval: affiliateSettings.require_approval || false,
          terms_and_conditions: affiliateSettings.terms_and_conditions || '',
        }
      : {
          affiliate_enabled: false,
          commission_rate: 20,
          commission_type: 'percentage',
          fixed_commission_amount: 0,
          cookie_duration_days: 30,
          max_commission_per_sale: undefined,
          min_order_amount: 0,
          allow_self_referral: false,
          require_approval: false,
          terms_and_conditions: '',
        },
    pixelsData: pixelsSettings
      ? {
          tracking_enabled: (pixelsSettings.tracking_enabled as boolean | null) ?? true,
          google_analytics_id: (pixelsSettings.google_analytics_id as string | null) || '',
          facebook_pixel_id: (pixelsSettings.facebook_pixel_id as string | null) || '',
          google_tag_manager_id: (pixelsSettings.google_tag_manager_id as string | null) || '',
          tiktok_pixel_id: (pixelsSettings.tiktok_pixel_id as string | null) || '',
          track_video_events: (pixelsSettings.track_video_events as boolean | null) ?? true,
          track_lesson_completion:
            (pixelsSettings.track_lesson_completion as boolean | null) ?? true,
          track_quiz_attempts: (pixelsSettings.track_quiz_attempts as boolean | null) ?? true,
          track_certificate_downloads:
            (pixelsSettings.track_certificate_downloads as boolean | null) ?? true,
        }
      : {
          tracking_enabled: true,
          google_analytics_id: '',
          facebook_pixel_id: '',
          google_tag_manager_id: '',
          tiktok_pixel_id: '',
          track_video_events: true,
          track_lesson_completion: true,
          track_quiz_attempts: true,
          track_certificate_downloads: true,
        },
  };
};

export const EditCourseProductWizard = ({
  productId,
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: EditCourseProductWizardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);
  const storeId = propsStoreId || store?.id;
  const invalidateCatalog = useCatalogCacheInvalidation();

  // Load existing course with security validation and cache optimisé
  const {
    data: courseData,
    isLoading: loadingCourse,
    error: courseError,
  } = useQuery({
    queryKey: ['course-product-edit', productId, user?.id],
    queryFn: () => convertToFormData(productId, user?.id),
    enabled: !!productId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - données fraîches
    gcTime: 10 * 60 * 1000, // 10 minutes - cache conservé
    retry: (failureCount, error) => {
      // Ne pas retry si c'est une erreur d'autorisation
      if (error?.message?.includes('non autorisé')) return false;
      return failureCount < 3;
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<CourseFormData>>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [seoData, setSeoData] = useState<CourseSEOData>({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
  });
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [affiliateData, setAffiliateData] = useState<CourseAffiliateData>({
    affiliate_enabled: false,
    commission_rate: 20,
    commission_type: 'percentage',
    fixed_commission_amount: 0,
    cookie_duration_days: 30,
    max_commission_per_sale: undefined,
    min_order_amount: 0,
    allow_self_referral: false,
    require_approval: false,
    terms_and_conditions: '',
  });
  const [pixelsData, setPixelsData] = useState<CoursePixelsData>({
    tracking_enabled: true,
    google_analytics_id: '',
    facebook_pixel_id: '',
    google_tag_manager_id: '',
    tiktok_pixel_id: '',
    track_video_events: true,
    track_lesson_completion: true,
    track_quiz_attempts: true,
    track_certificate_downloads: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when course is loaded
  useEffect(() => {
    if (courseData) {
      setFormData(courseData.formData);
      setSections(courseData.sections);
      setSeoData(courseData.seoData);
      setFaqs(courseData.faqs);
      setAffiliateData(courseData.affiliateData);
      setPixelsData(courseData.pixelsData);
    }
  }, [courseData]);

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Validate current step
   */
  const validateStep = useCallback(
    async (step: number): Promise<{ valid: boolean; errors: string[] }> => {
      const result = validateCourseWizardStep(step, formData, sections);

      if (step === 1) {
        setErrors(result.fieldErrors);
      }

      if (!result.valid && result.toastTitle) {
        return { valid: false, errors: result.errors };
      }

      return { valid: result.valid, errors: result.errors };
    },
    [formData, sections]
  );

  /**
   * Save course
   */
  const saveCourse = useCallback(async () => {
    if (!store || !productId) {
      throw new Error('Store ou Product ID manquant');
    }

    setIsSaving(true);
    try {
      // ✅ SÉCURITÉ: Vérifier propriété du produit avant modification
      if (user) {
        const { data: ownershipCheck, error: ownershipError } = await supabase
          .from('products')
          .select(
            `
            id,
            stores!inner(user_id)
          `
          )
          .eq('id', productId)
          .eq('stores.user_id', user.id)
          .single();

        if (ownershipError || !ownershipCheck) {
          throw new Error("Vous n'avez pas les permissions pour modifier ce produit");
        }
      }
      // Generate slug if not provided
      let slug =
        formData.slug?.trim() ||
        formData.title
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ||
        'course';

      // Check slug uniqueness (excluding current product)
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id)
          .eq('slug', slug)
          .neq('id', productId)
          .limit(1);

        if (!existing || existing.length === 0) {
          break;
        }

        attempts++;
        const baseSlug =
          formData.slug?.trim() ||
          formData.title
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') ||
          'course';
        slug = `${baseSlug}-${attempts}`;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Impossible de générer un slug unique');
      }

      const sectionsPayload = sections.map(section => ({
        title: section.title,
        description: section.description || null,
        order_index: section.order_index,
        lessons: section.lessons.map((lesson, index) => ({
          title: lesson.title,
          description: lesson.description || null,
          order_index: lesson.order_index ?? index,
          video_type: (lesson as { video_type?: string }).video_type || 'upload',
          video_url: lesson.video_url || '',
          video_duration_seconds: lesson.video_duration || 0,
          content: lesson.content || null,
          is_preview: lesson.is_preview || false,
          is_required: true,
        })),
      }));

      await updateFullCourseTx({
        storeId: store.id,
        productId,
        product: {
          name: formData.title,
          slug,
          description: formData.description,
          short_description: formData.short_description,
          price: formData.price || 0,
          promotional_price: formData.promotional_price,
          currency: formData.currency || 'XOF',
          category: formData.category || null,
          image_url: formData.image_url || '',
          images: formData.images || [],
          meta_title: seoData.meta_title,
          meta_description: seoData.meta_description,
          meta_keywords: seoData.meta_keywords,
          og_image: seoData.og_image,
          faqs: faqs || [],
          pricing_model: formData.pricing_model || 'one-time',
          licensing_type: formData.licensing_type || 'standard',
          license_terms: formData.license_terms || null,
        },
        course: {
          level: formData.level || '',
          language: formData.language || 'fr',
          certificate_enabled: formData.certificate_enabled ?? true,
          certificate_passing_score: formData.certificate_passing_score || 80,
          learning_objectives: formData.learning_objectives || [],
          prerequisites: formData.prerequisites || [],
          target_audience: formData.target_audience || [],
        },
        sections: sectionsPayload,
        affiliate: {
          affiliate_enabled: affiliateData.affiliate_enabled,
          commission_rate: affiliateData.commission_rate,
          commission_type: affiliateData.commission_type,
          fixed_commission_amount: affiliateData.fixed_commission_amount,
          cookie_duration_days: affiliateData.cookie_duration_days,
          max_commission_per_sale: affiliateData.max_commission_per_sale,
          min_order_amount: affiliateData.min_order_amount,
          allow_self_referral: affiliateData.allow_self_referral,
          require_approval: affiliateData.require_approval,
          terms_and_conditions: affiliateData.terms_and_conditions,
        },
        tracking: {
          tracking_enabled: pixelsData.tracking_enabled,
          google_analytics_id: pixelsData.google_analytics_id || null,
          facebook_pixel_id: pixelsData.facebook_pixel_id || null,
          google_tag_manager_id: pixelsData.google_tag_manager_id || null,
          tiktok_pixel_id: pixelsData.tiktok_pixel_id || null,
          track_video_events: pixelsData.track_video_events,
          track_lesson_completion: pixelsData.track_lesson_completion,
          track_quiz_attempts: pixelsData.track_quiz_attempts,
          track_certificate_downloads: pixelsData.track_certificate_downloads,
        },
      });

      toast({
        title: '✅ Cours mis à jour',
        description: 'Le cours a été modifié avec succès',
      });

      invalidateCatalog();
      onSuccess?.();
    } catch (error) {
      logger.error('Error updating course product', { error, productId });
      toast({
        title: '❌ Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de mettre à jour le cours',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [
    formData,
    sections,
    seoData,
    faqs,
    affiliateData,
    pixelsData,
    productId,
    store,
    onSuccess,
    toast,
    invalidateCatalog,
  ]);

  const handleNext = useCallback(async () => {
    const result = await validateStep(currentStep);
    if (result.valid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const errorMessages =
        result.errors.length > 0
          ? result.errors.join(', ')
          : 'Veuillez corriger les erreurs avant de continuer';
      toast({
        title: 'Erreurs de validation',
        description: errorMessages,
        variant: 'destructive',
      });
    }
  }, [currentStep, validateStep, toast]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSave = useCallback(async () => {
    const publishValidation = validateCourseWizardPublishSteps(formData, sections);
    if (!publishValidation.valid) {
      if (publishValidation.failedStep) {
        setCurrentStep(publishValidation.failedStep);
      }
      setErrors(publishValidation.fieldErrors);
      const errorMessages =
        publishValidation.errors.length > 0
          ? publishValidation.errors.join(', ')
          : 'Veuillez corriger les erreurs avant de sauvegarder';
      toast({
        title: publishValidation.toastTitle ?? 'Erreurs de validation',
        description: publishValidation.toastDescription ?? errorMessages,
        variant: 'destructive',
      });
      return;
    }

    await saveCourse();
  }, [formData, sections, saveCourse, toast]);

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <CourseBasicInfoForm formData={formData} onChange={handleFieldChange} errors={errors} />
        );
      case 2:
        return <CourseCurriculumBuilder sections={sections} onSectionsChange={setSections} />;
      case 3:
        return <CourseAdvancedConfig formData={formData} onChange={handleFieldChange} />;
      case 4:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <CourseSEOForm
                data={seoData}
                onChange={setSeoData}
                courseTitle={formData.title || ''}
                courseDescription={formData.short_description || ''}
              />
            </div>
            <div>
              <CourseFAQForm data={faqs} onChange={setFaqs} />
            </div>
          </div>
        );
      case 5:
        return (
          <CourseAffiliateSettings
            data={affiliateData}
            onChange={setAffiliateData}
            coursePrice={formData.price || 0}
          />
        );
      case 6:
        return <CoursePixelsConfig data={pixelsData} onChange={setPixelsData} />;
      case 7:
        return (
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Résumé du cours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Informations de base</h3>
                  <p>
                    <strong>Titre:</strong> {formData.title}
                  </p>
                  <p>
                    <strong>Prix:</strong> {formData.price} {formData.currency}
                  </p>
                  <p>
                    <strong>Niveau:</strong> {formData.level}
                  </p>
                  <p>
                    <strong>Catégorie:</strong> {formData.category || '-'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Tracking</h3>
                  <p>
                    <strong>Pixels actifs:</strong> {pixelsData.tracking_enabled ? 'Oui' : 'Non'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Curriculum</h3>
                  <p>
                    <strong>Sections:</strong> {sections.length}
                  </p>
                  <p>
                    <strong>Leçons:</strong>{' '}
                    {sections.reduce((acc, s) => acc + s.lessons.length, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  }, [
    currentStep,
    formData,
    sections,
    seoData,
    faqs,
    affiliateData,
    pixelsData,
    errors,
    handleFieldChange,
  ]);

  const CurrentStep = STEPS[currentStep - 1];
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  if (storeLoading || loadingCourse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement du cours. Veuillez réessayer.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sm:py-6 lg:py-8 overflow-x-hidden w-full">
      <div className="w-full max-w-5xl mx-auto sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-3 sm:mb-4 min-h-[44px] touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back', 'Retour')}
            </Button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            {React.createElement(CurrentStep.icon, {
              className: 'h-5 w-5 sm:h-6 sm:w-6 text-primary',
            })}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Modifier le cours</h1>
          </div>

          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Étape {currentStep} sur {STEPS.length} ({Math.round(progress)}%)
          </p>
        </div>

        {/* Current Step */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(CurrentStep.icon, { className: 'h-5 w-5' })}
              {CurrentStep.name}
            </CardTitle>
            <CardDescription>{CurrentStep.description}</CardDescription>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="min-h-[44px] touch-manipulation"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-h-[44px] touch-manipulation"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>

                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext} className="min-h-[44px] touch-manipulation">
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="min-h-[44px] touch-manipulation"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
