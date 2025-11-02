/**
 * Create Course Wizard - Professional & Optimized
 * Date: 2025-01-01
 * 
 * Wizard 7 étapes pour créer un cours en ligne professionnel
 * Version optimisée avec design professionnel, responsive et fonctionnalités avancées
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Loader2, 
  Sparkles,
  GraduationCap,
  ArrowLeft,
  Keyboard,
  Info,
} from "lucide-react";
import { CourseBasicInfoForm } from "./CourseBasicInfoForm";
import { CourseCurriculumBuilder } from "./CourseCurriculumBuilder";
import { CourseAdvancedConfig } from "./CourseAdvancedConfig";
import { CourseSEOForm, CourseSEOData } from "./CourseSEOForm";
import { CourseFAQForm, FAQ } from "./CourseFAQForm";
import { CourseAffiliateSettings, CourseAffiliateData } from "./CourseAffiliateSettings";
import { CoursePixelsConfig, CoursePixelsData } from "./CoursePixelsConfig";
import { useToast } from "@/hooks/use-toast";
import { useCreateFullCourse } from "@/hooks/courses/useCreateFullCourse";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/hooks/useStore";
import { logger } from "@/lib/logger";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

// Template system
import { TemplateSelector } from "@/components/templates/TemplateSelector";
import { useTemplateApplier } from "@/hooks/useTemplateApplier";
import type { ProductTemplate } from "@/types/templates";

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: any[];
  isOpen: boolean;
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
    description: 'Programme d\'affiliation',
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

interface CreateCourseWizardProps {
  storeId?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export const CreateCourseWizard = ({ 
  storeId: propsStoreId,
  onSuccess,
  onBack,
}: CreateCourseWizardProps = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { store, loading: storeLoading } = useStore();
  const createFullCourse = useCreateFullCourse();
  
  const [currentStep, setCurrentStep] = useState(1);
  
  // Template system
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const { applyTemplate } = useTemplateApplier();

  // Auto-save
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use props or fallback to hook store
  const storeId = propsStoreId || store?.id;

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const stepsRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();
  
  const [formData, setFormData] = useState({
    // Informations de base
    title: '',
    slug: '',
    short_description: '',
    description: '',
    level: '',
    language: 'fr',
    category: '',
    // Configuration
    price: 0,
    currency: 'XOF',
    promotional_price: undefined,
    licensing_type: 'standard',
    license_terms: '',
    certificate_enabled: true,
    certificate_passing_score: 80,
    learning_objectives: [],
    prerequisites: [],
    target_audience: [],
  });
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

  /**
   * Update form data with auto-save
   */
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-save after 2 seconds of inactivity
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(newData);
      }, 2000);
      
      return newData;
    });
    
    // Effacer l'erreur si le champ est modifié
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Auto-save draft
   */
  const handleAutoSave = useCallback(async (data?: any) => {
    const dataToSave = data || formData;
    
    // Ne pas auto-save si pas de titre
    if (!dataToSave.title || dataToSave.title.trim() === '') {
      return;
    }

    setIsAutoSaving(true);
    try {
      // Sauvegarder dans localStorage pour l'instant
      localStorage.setItem('course-draft', JSON.stringify({
        formData: dataToSave,
        sections,
        seoData,
        faqs,
        affiliateData,
        pixelsData,
      }));
      logger.info('Brouillon cours auto-sauvegardé', { step: currentStep });
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData, sections, seoData, faqs, affiliateData, pixelsData, currentStep]);

  /**
   * Load draft from localStorage
   */
  useEffect(() => {
    const savedDraft = localStorage.getItem('course-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.formData || formData);
        setSections(draft.sections || []);
        setSeoData(draft.seoData || seoData);
        setFaqs(draft.faqs || []);
        setAffiliateData(draft.affiliateData || affiliateData);
        setPixelsData(draft.pixelsData || pixelsData);
        logger.info('Brouillon cours chargé depuis localStorage');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  /**
   * Handle template selection
   */
  const handleTemplateSelect = useCallback((template: ProductTemplate) => {
    try {
      const updatedData = applyTemplate(template, formData, {
        mergeMode: 'smart', // Ne remplace que les champs vides
      });
      
      setFormData(updatedData);
      setShowTemplateSelector(false);
      
      logger.info('Template appliqué au cours', { templateName: template.name });
      
      toast({
        title: '✨ Template appliqué !',
        description: `Le template "${template.name}" a été appliqué avec succès. Personnalisez maintenant votre cours.`,
      });
      
      // Optionnel : passer à l'étape 1 si on n'y est pas déjà
      if (currentStep !== 1) {
        setCurrentStep(1);
      }
    } catch (error: any) {
      logger.error('Erreur lors de l\'application du template', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'appliquer le template',
        variant: 'destructive',
      });
    }
  }, [formData, currentStep, applyTemplate, toast]);

  /**
   * Validate current step
   */
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title) newErrors.title = t('courses.errors.titleRequired', 'Le titre est requis');
      if (!formData.slug) newErrors.slug = t('courses.errors.slugRequired', 'Le slug est requis');
      if (!formData.short_description) newErrors.short_description = t('courses.errors.shortDescRequired', 'La description courte est requise');
      if (!formData.description) newErrors.description = t('courses.errors.descRequired', 'La description est requise');
      if (!formData.level) newErrors.level = t('courses.errors.levelRequired', 'Le niveau est requis');
      if (!formData.language) newErrors.language = t('courses.errors.languageRequired', 'La langue est requise');
      if (!formData.category) newErrors.category = t('courses.errors.categoryRequired', 'La catégorie est requise');
    }

    if (step === 2) {
      if (sections.length === 0) {
        toast({
          title: t('courses.errors.emptyCurriculum', 'Curriculum vide'),
          description: t('courses.errors.emptyCurriculumDesc', 'Ajoutez au moins une section avec une leçon'),
          variant: 'destructive',
        });
        logger.warn('Validation échouée - Curriculum vide');
        return false;
      }
      const hasLessons = sections.some(s => s.lessons.length > 0);
      if (!hasLessons) {
        toast({
          title: t('courses.errors.noLessons', 'Aucune leçon'),
          description: t('courses.errors.noLessonsDesc', 'Ajoutez au moins une leçon dans une section'),
          variant: 'destructive',
        });
        logger.warn('Validation échouée - Aucune leçon');
        return false;
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    if (!isValid) {
      logger.warn('Validation échouée', { step, errors: newErrors });
    }
    
    return isValid;
  }, [formData, sections, toast, t]);

  /**
   * Navigation handlers
   */
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        const nextStepNum = currentStep + 1;
        setCurrentStep(nextStepNum);
        logger.info('Navigation vers étape suivante', { from: currentStep, to: nextStepNum });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      const prevStepNum = currentStep - 1;
      setCurrentStep(prevStepNum);
      logger.info('Navigation vers étape précédente', { from: currentStep, to: prevStepNum });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleStepClick = useCallback((stepId: number) => {
    // Permettre de revenir en arrière, mais valider avant d'avancer
    if (stepId < currentStep || validateStep(currentStep)) {
      setCurrentStep(stepId);
      logger.info('Navigation directe vers étape', { to: stepId });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, validateStep]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ne pas intercepter si on est dans un input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + S pour sauvegarder brouillon
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }

      // Flèches pour navigation
      if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        nextStep();
      }
      if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, prevStep]);

  /**
   * Save draft handler
   */
  const handleSaveDraft = useCallback(async () => {
    await handleAutoSave();
    toast({
      title: t('courses.draftSaved', 'Brouillon sauvegardé'),
      description: t('courses.draftSavedDesc', 'Votre cours a été sauvegardé en tant que brouillon'),
    });
    logger.info('Brouillon cours sauvegardé manuellement');
  }, [handleAutoSave, toast, t]);

  /**
   * Publish handler
   */
  const handlePublish = useCallback(async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Vérifier que le store existe
    if (!storeId) {
      toast({
        title: t('courses.errors.noStore', 'Erreur'),
        description: t('courses.errors.noStoreDesc', 'Vous devez avoir une boutique pour créer un cours'),
        variant: 'destructive',
      });
      logger.error('Tentative de création de cours sans store');
      return;
    }

    // Préparer les données pour la création
    const courseData = {
      storeId: storeId,
      name: formData.title,
      slug: formData.slug,
      short_description: formData.short_description,
      description: formData.description,
      category: formData.category,
      price: formData.price,
      currency: formData.currency,
      promotional_price: formData.promotional_price,
      licensing_type: formData.licensing_type || 'standard',
      license_terms: formData.license_terms || undefined,
      level: formData.level,
      language: formData.language,
      certificate_enabled: formData.certificate_enabled,
      certificate_passing_score: formData.certificate_passing_score,
      learning_objectives: formData.learning_objectives,
      prerequisites: formData.prerequisites,
      target_audience: formData.target_audience,
      sections: sections,
      // SEO
      meta_title: seoData.meta_title,
      meta_description: seoData.meta_description,
      meta_keywords: seoData.meta_keywords,
      og_title: seoData.og_title,
      og_description: seoData.og_description,
      og_image: seoData.og_image,
      // FAQs
      faqs: faqs,
      // Affiliation
      affiliate_enabled: affiliateData.affiliate_enabled,
      commission_rate: affiliateData.commission_rate,
      commission_type: affiliateData.commission_type,
      fixed_commission_amount: affiliateData.fixed_commission_amount,
      cookie_duration_days: affiliateData.cookie_duration_days,
      max_commission_per_sale: affiliateData.max_commission_per_sale,
      min_order_amount: affiliateData.min_order_amount,
      allow_self_referral: affiliateData.allow_self_referral,
      require_approval: affiliateData.require_approval,
      affiliate_terms_and_conditions: affiliateData.terms_and_conditions,
      // Tracking & Pixels
      tracking_enabled: pixelsData.tracking_enabled,
      google_analytics_id: pixelsData.google_analytics_id,
      facebook_pixel_id: pixelsData.facebook_pixel_id,
      google_tag_manager_id: pixelsData.google_tag_manager_id,
      tiktok_pixel_id: pixelsData.tiktok_pixel_id,
      track_video_events: pixelsData.track_video_events,
      track_lesson_completion: pixelsData.track_lesson_completion,
      track_quiz_attempts: pixelsData.track_quiz_attempts,
      track_certificate_downloads: pixelsData.track_certificate_downloads,
    };

    logger.info('Publication du cours', { courseName: formData.title });
    createFullCourse.mutate(courseData);
  }, [currentStep, validateStep, storeId, formData, sections, seoData, faqs, affiliateData, pixelsData, toast, t, createFullCourse]);

  /**
   * Handle successful course creation
   */
  useEffect(() => {
    if (createFullCourse.isSuccess && createFullCourse.data) {
      logger.info('Cours publié avec succès', { courseId: createFullCourse.data.id });
      
      // Clear draft from localStorage on success
      localStorage.removeItem('course-draft');
      
      toast({
        title: '🎉 Cours publié !',
        description: `"${formData.title}" est maintenant en ligne`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/courses');
      }
    }
  }, [createFullCourse.isSuccess, createFullCourse.data, formData.title, toast, onSuccess, navigate]);

  /**
   * Handle course creation error
   */
  useEffect(() => {
    if (createFullCourse.isError) {
      logger.error('Erreur lors de la publication du cours', createFullCourse.error);
      toast({
        title: '❌ Erreur',
        description: createFullCourse.error?.message || t('courses.errors.publishFailed', 'Une erreur est survenue lors de la publication'),
        variant: 'destructive',
      });
    }
  }, [createFullCourse.isError, createFullCourse.error, toast, t]);

  /**
   * Calculate progress
   */
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  /**
   * Render step content
   */
  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <CourseBasicInfoForm
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <CourseCurriculumBuilder
            sections={sections}
            onSectionsChange={setSections}
          />
        );
      case 3:
        return (
          <CourseAdvancedConfig
            formData={formData}
            onChange={handleFieldChange}
          />
        );
      case 4:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <CourseSEOForm
                data={seoData}
                onChange={setSeoData}
                courseTitle={formData.title}
                courseDescription={formData.short_description}
              />
            </div>
            <div>
              <CourseFAQForm
                data={faqs}
                onChange={setFaqs}
              />
            </div>
          </div>
        );
      case 5:
        return (
          <CourseAffiliateSettings
            data={affiliateData}
            onChange={setAffiliateData}
            coursePrice={formData.price}
          />
        );
      case 6:
        return (
          <CoursePixelsConfig
            data={pixelsData}
            onChange={setPixelsData}
          />
        );
      case 7:
        return (
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                  {t('courses.review.title', 'Révision finale')}
                </h3>
                
                <div className="space-y-4 sm:space-y-6">
                  {/* Informations de base */}
                  <div>
                    <h4 className="font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Badge variant="secondary">1</Badge>
                      {t('courses.review.basicInfo', 'Informations de base')}
                    </h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm bg-muted p-3 sm:p-4 rounded-lg">
                      <dt className="text-muted-foreground">{t('courses.review.title', 'Titre')}:</dt>
                      <dd className="font-medium">{formData.title || '-'}</dd>
                      <dt className="text-muted-foreground">Slug:</dt>
                      <dd className="font-mono text-[10px] sm:text-xs bg-background px-2 py-1 rounded break-all">/courses/{formData.slug || '-'}</dd>
                      <dt className="text-muted-foreground">{t('courses.review.level', 'Niveau')}:</dt>
                      <dd className="font-medium capitalize">{formData.level || '-'}</dd>
                      <dt className="text-muted-foreground">{t('courses.review.language', 'Langue')}:</dt>
                      <dd className="font-medium">{formData.language || '-'}</dd>
                      <dt className="text-muted-foreground">{t('courses.review.category', 'Catégorie')}:</dt>
                      <dd className="font-medium">{formData.category || '-'}</dd>
                    </dl>
                  </div>

                  {/* Curriculum */}
                  <div>
                    <h4 className="font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Badge variant="secondary">2</Badge>
                      {t('courses.review.curriculum', 'Curriculum')}
                    </h4>
                    <div className="bg-muted p-3 sm:p-4 rounded-lg space-y-2 sm:space-y-3">
                      <div className="flex flex-wrap gap-4 sm:gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl font-bold">{sections.length}</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {t('courses.review.sections', 'section')}{sections.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl font-bold">
                            {sections.reduce((total, s) => total + s.lessons.length, 0)}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {t('courses.review.lessons', 'leçon')}{sections.reduce((total, s) => total + s.lessons.length, 0) > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {sections.map((section, idx) => (
                        <div key={section.id} className="text-xs sm:text-sm">
                          <span className="font-medium">{t('courses.review.section', 'Section')} {idx + 1}:</span> {section.title}
                          <span className="text-muted-foreground ml-2">
                            ({section.lessons.length} {t('courses.review.lesson', 'leçon')}{section.lessons.length > 1 ? 's' : ''})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuration */}
                  <div>
                    <h4 className="font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Badge variant="secondary">3</Badge>
                      {t('courses.review.config', 'Configuration')}
                    </h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm bg-muted p-3 sm:p-4 rounded-lg">
                      <dt className="text-muted-foreground">{t('courses.review.price', 'Prix')}:</dt>
                      <dd className="font-bold text-sm sm:text-lg">
                        {formData.promotional_price && formData.promotional_price < formData.price ? (
                          <>
                            <span className="text-orange-600">{formData.promotional_price} {formData.currency}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground line-through ml-2">
                              {formData.price} {formData.currency}
                            </span>
                          </>
                        ) : (
                          <span>{formData.price} {formData.currency}</span>
                        )}
                      </dd>
                      <dt className="text-muted-foreground">{t('courses.review.certificate', 'Certificat')}:</dt>
                      <dd className="font-medium">
                        {formData.certificate_enabled ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            {t('courses.review.enabled', 'Activé')} ({formData.certificate_passing_score}% {t('courses.review.required', 'requis')})
                          </Badge>
                        ) : (
                          <Badge variant="outline">{t('courses.review.disabled', 'Désactivé')}</Badge>
                        )}
                      </dd>
                      <dt className="text-muted-foreground">{t('courses.review.objectives', 'Objectifs')}:</dt>
                      <dd className="font-medium">{formData.learning_objectives.length} {t('courses.review.objective', 'objectif')}{formData.learning_objectives.length > 1 ? 's' : ''}</dd>
                      <dt className="text-muted-foreground">{t('courses.review.prerequisites', 'Prérequis')}:</dt>
                      <dd className="font-medium">{formData.prerequisites.length} {t('courses.review.prerequisite', 'prérequis')}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avertissement avant publication */}
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-200">
                  <strong>{t('courses.review.important', 'Important')} :</strong> {t('courses.review.publishWarning', 'En publiant ce cours, il sera visible par tous les étudiants. Assurez-vous que toutes les informations sont correctes avant de continuer.')}
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  }, [currentStep, formData, sections, seoData, faqs, handleFieldChange, errors, setAffiliateData, setPixelsData, setSeoData, setFaqs, t]);

  /**
   * Logging on mount
   */
  useEffect(() => {
    logger.info('Wizard Création Cours ouvert', { step: currentStep, storeId });
  }, []);

  /**
   * Cleanup auto-save on unmount
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="container max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Header */}
        <div 
          ref={headerRef}
          className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-3 sm:mb-4 text-xs sm:text-sm"
              size="sm"
              aria-label={t('common.back', 'Retour')}
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">{t('common.back', 'Retour')}</span>
              <span className="sm:hidden">{t('common.backShort', 'Retour')}</span>
            </Button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/5 backdrop-blur-sm border border-orange-500/20 animate-in zoom-in duration-500">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 dark:text-orange-400" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                  {t('courses.create.title', 'Créer un Nouveau Cours')}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('courses.create.subtitle', 'Créez un cours en ligne professionnel en 7 étapes')}
                </p>
              </div>
            </div>
            
            {/* Template Button - Badge "Nouveau" supprimé */}
            {currentStep === 1 && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateSelector(true);
                  logger.info('Ouverture sélecteur de template pour cours');
                }}
                className="gap-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                size="sm"
                aria-label={t('courses.useTemplate', 'Utiliser un template')}
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="hidden sm:inline">{t('courses.useTemplate', 'Utiliser un template')}</span>
                <span className="sm:hidden">{t('courses.template', 'Template')}</span>
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium">
                {t('courses.step', 'Étape')} {currentStep} {t('courses.of', 'sur')} {STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                {isAutoSaving && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">{t('courses.autoSaving', 'Auto-sauvegarde...')}</span>
                  </div>
                )}
                <span className="text-muted-foreground">{Math.round(progress)}% {t('courses.completed', 'complété')}</span>
              </div>
            </div>
            <Progress 
              value={progress} 
              className="h-1.5 sm:h-2 bg-muted"
            />
          </div>
        </div>

        {/* Steps Navigator - Responsive */}
        <Card 
          ref={stepsRef}
          className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const StepIcon = step.icon || Info;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${t('courses.step', 'Étape')} ${step.id}: ${step.name}`}
                    className={cn(
                      "relative p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 text-left",
                      "hover:shadow-md hover:scale-[1.02] touch-manipulation",
                      isActive && 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-lg scale-[1.02] ring-2 ring-orange-500/20',
                      isCompleted && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                      !isActive && !isCompleted && 'border-border hover:border-orange-500/50 bg-card/50',
                      "animate-in fade-in slide-in-from-bottom-4"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div
                        className={cn(
                          "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300",
                          isActive && 'bg-orange-500 text-white shadow-lg scale-110',
                          isCompleted && 'bg-green-500 text-white',
                          !isActive && !isCompleted && 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                        ) : (
                          <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs sm:text-sm font-medium truncate mb-0.5",
                          isActive && "text-orange-600 dark:text-orange-400 font-semibold",
                          !isActive && !isCompleted && "text-muted-foreground"
                        )}>
                          {step.name}
                        </p>
                        <p className={cn(
                          "text-[10px] sm:text-xs truncate hidden sm:block",
                          isActive ? "text-orange-600/80 dark:text-orange-400/80" : "text-muted-foreground"
                        )}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card 
          ref={contentRef}
          className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-4 lg:px-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons - Responsive */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('courses.saveDraft', 'Sauvegarder comme brouillon')}
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('courses.saveDraft', 'Sauvegarder brouillon')}</span>
                  <span className="sm:hidden">{t('courses.draft', 'Brouillon')}</span>
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘S
                  </Badge>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('courses.previous', 'Étape précédente')}
                >
                  <ChevronLeft className="h-4 w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('courses.previous', 'Précédent')}</span>
                  <span className="sm:hidden">{t('courses.prev', 'Préc.')}</span>
                </Button>

                {currentStep < STEPS.length ? (
                  <Button 
                    onClick={nextStep} 
                    className="flex-1 sm:flex-none bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    size="sm"
                    aria-label={t('courses.next', 'Étape suivante')}
                  >
                    <span className="hidden sm:inline">{t('courses.next', 'Suivant')}</span>
                    <span className="sm:hidden">{t('courses.nextShort', 'Suiv.')}</span>
                    <ChevronRight className="h-4 w-4 ml-1.5 sm:ml-2" />
                    <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                      ⌘→
                    </Badge>
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePublish} 
                    className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    disabled={createFullCourse.isPending}
                    size="sm"
                    aria-label={t('courses.publish', 'Publier le cours')}
                  >
                    {createFullCourse.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                        <span className="hidden sm:inline">{t('courses.publishing', 'Publication en cours...')}</span>
                        <span className="sm:hidden">{t('courses.publishingShort', 'Pub...')}</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">{t('courses.publish', 'Publier le cours')}</span>
                        <span className="sm:hidden">{t('courses.publishShort', 'Publier')}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts Help */}
        <div className="hidden lg:flex items-center justify-center gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" aria-hidden="true" />
            <span>{t('common.shortcuts', 'Raccourcis')}:</span>
            <Badge variant="outline" className="text-[10px] font-mono">⌘S</Badge>
            <span className="text-muted-foreground">{t('courses.shortcuts.save', 'Brouillon')}</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘→</Badge>
            <span className="text-muted-foreground">{t('courses.shortcuts.next', 'Suivant')}</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘←</Badge>
            <span className="text-muted-foreground">{t('courses.shortcuts.prev', 'Précédent')}</span>
          </div>
        </div>
      </div>
      
      {/* Template Selector Dialog */}
      <TemplateSelector
        productType="course"
        open={showTemplateSelector}
        onClose={() => {
          setShowTemplateSelector(false);
          logger.info('Fermeture sélecteur de template pour cours');
        }}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};
