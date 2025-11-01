/**
 * Create Digital Product Wizard V2 - Professional & Optimized
 * Date: 2025-01-01
 * 
 * Wizard 6 étapes avec SEO & FAQs intégrés
 * Version optimisée avec design professionnel, responsive et fonctionnalités avancées
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Info,
  FileText,
  Shield,
  Users,
  Search,
  Eye,
  Download,
  Sparkles,
  Save,
  Keyboard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/lib/store-utils';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

// Step components
import { DigitalBasicInfoForm } from './DigitalBasicInfoForm';
import { DigitalFilesUploader } from './DigitalFilesUploader';
import { DigitalLicenseConfig } from './DigitalLicenseConfig';
import { DigitalAffiliateSettings } from './DigitalAffiliateSettings';
import { DigitalPreview } from './DigitalPreview';

// Shared components
import { ProductSEOForm } from '../shared/ProductSEOForm';
import { ProductFAQForm } from '../shared/ProductFAQForm';

// Template system
import { TemplateSelector } from '@/components/templates/TemplateSelector';
import { useTemplateApplier } from '@/hooks/useTemplateApplier';
import type { ProductTemplate } from '@/types/templates';

const STEPS = [
  {
    id: 1,
    title: 'Informations de base',
    description: 'Nom, description, prix, images',
    icon: Info,
  },
  {
    id: 2,
    title: 'Fichiers',
    description: 'Upload et gestion',
    icon: FileText,
  },
  {
    id: 3,
    title: 'Configuration',
    description: 'Licensing et téléchargements',
    icon: Shield,
  },
  {
    id: 4,
    title: 'Affiliation',
    description: 'Programme d\'affiliation (optionnel)',
    icon: Users,
  },
  {
    id: 5,
    title: 'SEO & FAQs',
    description: 'Référencement et questions',
    icon: Search,
  },
  {
    id: 6,
    title: 'Prévisualisation',
    description: 'Vérifier et publier',
    icon: Eye,
  },
];

interface CreateDigitalProductWizard_v2Props {
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export const CreateDigitalProductWizard = ({
  storeId: propsStoreId,
  storeSlug: propsStoreSlug,
  onSuccess,
  onBack,
}: CreateDigitalProductWizard_v2Props = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Template system
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const { applyTemplate } = useTemplateApplier();

  // Auto-save
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const stepsRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();

  // Use props or fallback to hook store
  const storeId = propsStoreId || store?.id;
  const storeSlug = propsStoreSlug || store?.slug;

  const [formData, setFormData] = useState<any>({
    // Basic info
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category: 'ebook',
    digital_type: 'ebook', // Type de produit digital
    image_url: '',
    price: 0,
    promotional_price: null,
    currency: 'XOF',
    
    // Files
    main_file_url: '',
    main_file_version: '1.0',
    downloadable_files: [],
    
    // License Config
    license_type: 'single',
    license_duration_days: null, // NULL = lifetime
    max_activations: 1,
    allow_license_transfer: false,
    auto_generate_keys: true,
    
    // Download Settings
    download_limit: 5,
    download_expiry_days: 30,
    require_registration: true,
    watermark_enabled: false,
    watermark_text: '',
    
    // Version
    version: '1.0',
    
    // Affiliate
    affiliate: {
      enabled: false,
      commission_rate: 20,
      commission_type: 'percentage',
      fixed_commission_amount: 0,
      cookie_duration_days: 30,
      min_order_amount: 0,
      allow_self_referral: false,
      require_approval: false,
      terms_and_conditions: '',
    },
    
    // SEO
    seo: {
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
    },
    
    // FAQs
    faqs: [],
    
    // Metadata
    product_type: 'digital',
    is_active: true,
  });

  /**
   * Update form data with auto-save
   */
  const updateFormData = useCallback((updates: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev, ...updates };
      
      // Auto-save after 2 seconds of inactivity
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(newData);
      }, 2000);
      
      return newData;
    });
  }, []);

  /**
   * Auto-save draft
   */
  const handleAutoSave = useCallback(async (data?: any) => {
    const dataToSave = data || formData;
    
    // Ne pas auto-save si pas de nom
    if (!dataToSave.name || dataToSave.name.trim() === '') {
      return;
    }

    setIsAutoSaving(true);
    try {
      // Sauvegarder dans localStorage pour l'instant
      // TODO: Implémenter sauvegarde en base de données
      localStorage.setItem('digital-product-draft', JSON.stringify(dataToSave));
      logger.info('Brouillon auto-sauvegardé', { step: currentStep });
    } catch (error) {
      logger.error('Auto-save error', {
        error: error instanceof Error ? error.message : String(error),
        step: currentStep,
      });
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData, currentStep]);

  /**
   * Load draft from localStorage
   */
  useEffect(() => {
    const savedDraft = localStorage.getItem('digital-product-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        logger.info('Brouillon chargé depuis localStorage');
      } catch (error) {
        logger.error('Error loading draft', {
          error: error instanceof Error ? error.message : String(error),
        });
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
      
      logger.info('Template appliqué', { templateName: template.name });
      
      toast({
        title: '✨ Template appliqué !',
        description: `Le template "${template.name}" a été appliqué avec succès. Personnalisez maintenant votre produit.`,
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
    switch (step) {
      case 1:
        if (!formData.name || !formData.price) {
          toast({
            title: t('wizard.errors.title', 'Erreur'),
            description: t('wizard.errors.requiredFields', 'Veuillez remplir tous les champs obligatoires'),
            variant: 'destructive',
          });
          logger.warn('Validation échouée - Étape 1', { hasName: !!formData.name, hasPrice: !!formData.price });
          return false;
        }
        return true;
      case 2:
        if (!formData.main_file_url && (!formData.downloadable_files || formData.downloadable_files.length === 0)) {
          toast({
            title: t('wizard.errors.title', 'Erreur'),
            description: t('wizard.errors.noFiles', 'Veuillez uploader au moins un fichier principal'),
            variant: 'destructive',
          });
          logger.warn('Validation échouée - Étape 2', { hasFiles: !!(formData.main_file_url || formData.downloadable_files?.length) });
          return false;
        }
        return true;
      case 3:
      case 4:
      case 5:
      case 6:
        return true;
      default:
        return true;
    }
  }, [formData, toast, t]);

  /**
   * Navigation handlers
   */
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      const nextStep = Math.min(currentStep + 1, STEPS.length);
      setCurrentStep(nextStep);
      logger.info('Navigation vers étape suivante', { from: currentStep, to: nextStep });
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);
    logger.info('Navigation vers étape précédente', { from: currentStep, to: prevStep });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        handleNext();
      }
      if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious]);

  /**
   * Save product to database
   */
  const saveProduct = useCallback(async (isDraft: boolean) => {
    try {
      if (!storeId) {
        throw new Error('Store ID manquant');
      }

      const slug = formData.slug || generateSlug(formData.name);

      // 1. Create base product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          store_id: storeId,
          name: formData.name,
          slug,
          description: formData.description,
          short_description: formData.short_description,
          category: formData.category,
          product_type: 'digital',
          price: formData.price,
          promotional_price: formData.promotional_price,
          currency: formData.currency,
          image_url: formData.image_url,
          is_active: !isDraft,
          is_draft: isDraft,
          // SEO fields
          meta_title: formData.seo?.meta_title || formData.name,
          meta_description: formData.seo?.meta_description || formData.short_description,
          meta_keywords: formData.seo?.meta_keywords,
          og_title: formData.seo?.og_title,
          og_description: formData.seo?.og_description,
          og_image: formData.seo?.og_image,
          // FAQs
          faqs: formData.faqs || [],
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Calculate file info
      const totalSizeMB = formData.downloadable_files?.reduce((sum: number, file: any) => {
        return sum + (file.size / (1024 * 1024));
      }, 0) || 0;

      const mainFile = formData.downloadable_files?.[0];
      const mainFileFormat = mainFile?.type?.split('/')[1] || 
                             mainFile?.name?.split('.').pop() || 'unknown';

      // 3. Create digital_product
      const { data: digitalProduct, error: digitalError} = await supabase
        .from('digital_products')
        .insert({
          product_id: product.id,
          digital_type: formData.digital_type || 'other',
          license_type: formData.license_type || 'single',
          license_duration_days: formData.license_duration_days || null, // NULL = lifetime
          max_activations: formData.max_activations || 
                          (formData.license_type === 'unlimited' ? -1 : 
                           formData.license_type === 'multi' ? 5 : 1),
          allow_license_transfer: formData.allow_license_transfer || false,
          auto_generate_keys: formData.auto_generate_keys !== false,
          main_file_url: formData.main_file_url || (mainFile?.url || ''),
          main_file_size_mb: mainFile ? (mainFile.size / (1024 * 1024)) : 0,
          main_file_format: mainFileFormat,
          main_file_version: formData.main_file_version || '1.0',
          total_files: formData.downloadable_files?.length || 1,
          total_size_mb: totalSizeMB,
          download_limit: formData.download_limit || 5,
          download_expiry_days: formData.download_expiry_days || 30,
          require_registration: formData.require_registration !== false,
          watermark_enabled: formData.watermark_enabled || false,
          watermark_text: formData.watermark_text || '',
          version: formData.version || '1.0',
          total_downloads: 0,
          unique_downloaders: 0,
        })
        .select()
        .single();

      if (digitalError) throw digitalError;

      // 4. Create digital_product_files
      if (formData.downloadable_files && formData.downloadable_files.length > 0) {
        const filesData = formData.downloadable_files.map((file: any, index: number) => ({
          digital_product_id: digitalProduct.id,
          name: file.name,
          file_url: file.url,
          file_type: file.type,
          file_size_mb: file.size / (1024 * 1024),
          order_index: index,
          is_main: index === 0,
          is_preview: index === 0,
          requires_purchase: true,
          version: '1.0',
        }));

        const { error: filesError } = await supabase
          .from('digital_product_files')
          .insert(filesData);

        if (filesError) throw filesError;
      }

      // 5. Create affiliate settings if enabled
      if (formData.affiliate?.enabled) {
        const { error: affiliateError } = await supabase
          .from('product_affiliate_settings')
          .insert({
            product_id: product.id,
            store_id: storeId,
            affiliate_enabled: formData.affiliate.enabled,
            commission_rate: formData.affiliate.commission_rate,
            commission_type: formData.affiliate.commission_type,
            fixed_commission_amount: formData.affiliate.fixed_commission_amount,
            cookie_duration_days: formData.affiliate.cookie_duration_days,
            max_commission_per_sale: formData.affiliate.max_commission_per_sale,
            min_order_amount: formData.affiliate.min_order_amount,
            allow_self_referral: formData.affiliate.allow_self_referral,
            require_approval: formData.affiliate.require_approval,
            terms_and_conditions: formData.affiliate.terms_and_conditions,
          });

        if (affiliateError) {
          logger.error('Affiliate settings error', {
            error: affiliateError.message,
            code: affiliateError.code,
            productId: createdProduct?.id,
          });
        }
      }

      // Clear draft from localStorage on success
      localStorage.removeItem('digital-product-draft');

      return product;
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du produit', error);
      throw error;
    }
  }, [formData, storeId]);

  /**
   * Handle submit (publish)
   */
  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      const product = await saveProduct(false);

      logger.info('Produit digital publié', { productId: product.id, productName: product.name });

      toast({
        title: '🎉 Produit publié !',
        description: `"${product.name}" est maintenant en ligne${formData.affiliate?.enabled ? ' avec programme d\'affiliation activé' : ''}`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/${storeSlug}/products/${product.slug}`);
      }
    } catch (error: any) {
      logger.error('Erreur lors de la publication', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la publication',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, validateStep, saveProduct, formData.affiliate?.enabled, toast, onSuccess, navigate, storeSlug]);

  /**
   * Handle save draft
   */
  const handleSaveDraft = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const product = await saveProduct(true);

      logger.info('Brouillon sauvegardé', { productId: product.id });

      toast({
        title: '✅ Brouillon sauvegardé',
        description: `Produit "${product.name}" enregistré. Vous pouvez continuer plus tard.`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/digital-products');
      }
    } catch (error: any) {
      logger.error('Erreur lors de la sauvegarde du brouillon', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder le brouillon',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [saveProduct, toast, onSuccess, navigate]);

  /**
   * Render step content
   */
  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <DigitalBasicInfoForm
            formData={formData}
            updateFormData={updateFormData}
            storeSlug={storeSlug || ''}
          />
        );
      case 2:
        return (
          <DigitalFilesUploader
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <DigitalLicenseConfig
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 4:
        return (
          <DigitalAffiliateSettings
            productPrice={formData.price || 0}
            productName={formData.name || 'Produit'}
            data={formData.affiliate}
            onUpdate={(affiliateData) => updateFormData({ affiliate: affiliateData })}
          />
        );
      case 5:
        return (
          <div className="space-y-4 sm:space-y-6">
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
              <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                {t('wizard.seo.faq.description', 'Optimisez votre référencement et ajoutez des réponses aux questions fréquentes')}
              </AlertDescription>
            </Alert>

            <ProductSEOForm
              productData={{
                name: formData.name,
                description: formData.description,
                image_url: formData.image_url,
                ...formData.seo,
              }}
              onUpdate={(seoData) => updateFormData({ seo: seoData })}
            />

            <ProductFAQForm
              faqs={formData.faqs || []}
              productType="digital"
              onUpdate={(faqs) => updateFormData({ faqs })}
            />
          </div>
        );
      case 6:
        return (
          <DigitalPreview
            formData={formData}
          />
        );
      default:
        return null;
    }
  }, [currentStep, formData, updateFormData, storeSlug, t]);

  /**
   * Calculate progress
   */
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  /**
   * Logging on mount
   */
  useEffect(() => {
    logger.info('Wizard Produit Digital ouvert', { step: currentStep, storeId });
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
              aria-label={t('wizard.back', 'Retour au choix du type')}
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">{t('wizard.back', 'Retour au choix du type')}</span>
              <span className="sm:hidden">{t('wizard.backShort', 'Retour')}</span>
            </Button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm border border-blue-500/20 animate-in zoom-in duration-500">
                <Download className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                  {t('wizard.title', 'Nouveau Produit Digital')}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('wizard.subtitle', 'Créez un produit digital professionnel en 6 étapes')}
                </p>
              </div>
            </div>
            
            {/* Template Button - Badge "Nouveau" supprimé */}
            {currentStep === 1 && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateSelector(true);
                  logger.info('Ouverture sélecteur de template');
                }}
                className="gap-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                size="sm"
                aria-label={t('wizard.useTemplate', 'Utiliser un template')}
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="hidden sm:inline">{t('wizard.useTemplate', 'Utiliser un template')}</span>
                <span className="sm:hidden">{t('wizard.template', 'Template')}</span>
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium">
                {t('wizard.step', 'Étape')} {currentStep} {t('wizard.of', 'sur')} {STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                {isAutoSaving && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">{t('wizard.autoSaving', 'Auto-sauvegarde...')}</span>
                  </div>
                )}
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
            </div>
            <Progress 
              value={progress} 
              className="h-1.5 sm:h-2 bg-muted"
            />
          </div>
        </div>

        {/* Steps Navigator - Responsive */}
        <div 
          ref={stepsRef}
          className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
          role="tablist"
          aria-label={t('wizard.steps', 'Étapes du formulaire')}
        >
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isAccessible = step.id <= currentStep || currentStep > step.id;

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                disabled={!isAccessible}
                role="tab"
                aria-selected={isActive}
                aria-label={`${t('wizard.step', 'Étape')} ${step.id}: ${step.title}`}
                className={cn(
                  "p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 text-left",
                  "hover:shadow-md hover:scale-[1.02]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  isActive && 'border-primary bg-primary/5 shadow-lg scale-[1.02] ring-2 ring-primary/20',
                  isCompleted && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                  !isActive && !isCompleted && isAccessible && 'border-border hover:border-primary/50 bg-card/50',
                  !isAccessible && 'border-border/30 bg-muted/30'
                )}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Icon className={cn(
                    "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-colors",
                    isCompleted ? 'text-green-600 dark:text-green-400' : 
                    isActive ? 'text-primary' : 
                    'text-muted-foreground'
                  )} />
                  {isCompleted && <Check className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />}
                </div>
                <div className={cn(
                  "text-[10px] sm:text-xs font-medium truncate",
                  isActive && "text-primary font-semibold",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="hidden lg:block text-[9px] text-muted-foreground mt-0.5 truncate">
                    {step.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>

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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
                size="sm"
                aria-label={t('wizard.previous', 'Étape précédente')}
              >
                <ChevronLeft className="h-4 w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{t('wizard.previous', 'Précédent')}</span>
                <span className="sm:hidden">{t('wizard.prev', 'Préc.')}</span>
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {currentStep < STEPS.length && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('wizard.saveDraft', 'Sauvegarder comme brouillon')}
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('wizard.saveDraft', 'Sauvegarder brouillon')}</span>
                  <span className="sm:hidden">{t('wizard.draft', 'Brouillon')}</span>
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘S
                  </Badge>
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('wizard.next', 'Étape suivante')}
                >
                  <span className="hidden sm:inline">{t('wizard.next', 'Suivant')}</span>
                  <span className="sm:hidden">{t('wizard.nextShort', 'Suiv.')}</span>
                  <ChevronRight className="h-4 w-4 ml-1.5 sm:ml-2" />
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘→
                  </Badge>
                </Button>
              </>
            )}

            {currentStep === STEPS.length && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('wizard.saveDraft', 'Sauvegarder comme brouillon')}
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('wizard.saveDraft', 'Sauvegarder brouillon')}</span>
                  <span className="sm:hidden">{t('wizard.draft', 'Brouillon')}</span>
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘S
                  </Badge>
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  size="sm"
                  aria-label={t('wizard.publish', 'Publier le produit')}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">{t('wizard.publishing', 'Publication...')}</span>
                      <span className="sm:hidden">{t('wizard.publishingShort', 'Pub...')}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">{t('wizard.publish', 'Publier le produit')}</span>
                      <span className="sm:hidden">{t('wizard.publishShort', 'Publier')}</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="hidden lg:flex items-center justify-center gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" aria-hidden="true" />
            <span>{t('wizard.shortcuts', 'Raccourcis')}:</span>
            <Badge variant="outline" className="text-[10px] font-mono">⌘S</Badge>
            <span className="text-muted-foreground">{t('wizard.shortcuts.save', 'Brouillon')}</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘→</Badge>
            <span className="text-muted-foreground">{t('wizard.shortcuts.next', 'Suivant')}</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘←</Badge>
            <span className="text-muted-foreground">{t('wizard.shortcuts.prev', 'Précédent')}</span>
          </div>
        </div>
      </div>
      
      {/* Template Selector Dialog */}
      <TemplateSelector
        productType="digital"
        open={showTemplateSelector}
        onClose={() => {
          setShowTemplateSelector(false);
          logger.info('Fermeture sélecteur de template');
        }}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};
