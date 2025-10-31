/**
 * Create Physical Product Wizard - Professional & Optimized V2
 * Date: 2025-01-01
 * 
 * Wizard professionnel en 8 étapes pour produits physiques
 * Version optimisée avec design professionnel, responsive et fonctionnalités avancées
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  Info,
  Palette,
  Warehouse,
  Truck,
  Users,
  Search,
  Eye,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  CheckCircle2,
  Check,
  CreditCard,
  Sparkles,
  Loader2,
  Keyboard,
} from 'lucide-react';
import { PhysicalBasicInfoForm } from './PhysicalBasicInfoForm';
import { PhysicalVariantsBuilder } from './PhysicalVariantsBuilder';
import { PhysicalInventoryConfig } from './PhysicalInventoryConfig';
import { PhysicalShippingConfig } from './PhysicalShippingConfig';
import { PhysicalAffiliateSettings } from './PhysicalAffiliateSettings';
import { PhysicalSEOAndFAQs } from './PhysicalSEOAndFAQs';
import { PhysicalPreview } from './PhysicalPreview';
import { PaymentOptionsForm } from '../shared/PaymentOptionsForm';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import type { PhysicalProductFormData } from '@/types/physical-product';

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
    component: PhysicalBasicInfoForm,
  },
  {
    id: 2,
    title: 'Variantes & Options',
    description: 'Couleurs, tailles, options',
    icon: Palette,
    component: PhysicalVariantsBuilder,
  },
  {
    id: 3,
    title: 'Inventaire',
    description: 'Stock, SKU, tracking',
    icon: Warehouse,
    component: PhysicalInventoryConfig,
  },
  {
    id: 4,
    title: 'Expédition',
    description: 'Poids, dimensions, frais',
    icon: Truck,
    component: PhysicalShippingConfig,
  },
  {
    id: 5,
    title: 'Affiliation',
    description: 'Commission, affiliés (optionnel)',
    icon: Users,
    component: PhysicalAffiliateSettings,
  },
  {
    id: 6,
    title: 'SEO & FAQs',
    description: 'Référencement, questions',
    icon: Search,
    component: PhysicalSEOAndFAQs,
  },
  {
    id: 7,
    title: 'Options de Paiement',
    description: 'Complet, partiel, escrow',
    icon: CreditCard,
    component: PaymentOptionsForm,
  },
  {
    id: 8,
    title: 'Aperçu & Validation',
    description: 'Vérifier et publier',
    icon: Eye,
    component: PhysicalPreview,
  },
];

interface CreatePhysicalProductWizardProps {
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export const CreatePhysicalProductWizard = ({
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: CreatePhysicalProductWizardProps = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);
  const [currentStep, setCurrentStep] = useState(1);
  
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
  
  const [formData, setFormData] = useState<Partial<any>>({
    // Basic Info (Step 1)
    name: '',
    description: '',
    price: 0,
    compare_at_price: null,
    cost_per_item: null,
    images: [],
    category_id: null,
    tags: [],
    
    // Variants (Step 2)
    has_variants: false,
    variants: [],
    options: [],
    
    // Inventory (Step 3)
    track_inventory: true,
    continue_selling_when_out_of_stock: false,
    inventory_policy: 'deny',
    quantity: 0,
    sku: '',
    barcode: '',
    
    // Shipping (Step 4)
    requires_shipping: true,
    weight: null,
    weight_unit: 'kg',
    dimensions: {
      length: null,
      width: null,
      height: null,
      unit: 'cm',
    },
    shipping_class: null,
    free_shipping: false,
    
    // Affiliation (Step 5)
    affiliate: {
      enabled: false,
      commission_rate: 10,
      commission_type: 'percentage',
      fixed_commission_amount: 0,
      cookie_duration_days: 30,
      min_order_amount: 0,
      allow_self_referral: false,
      require_approval: false,
      terms_and_conditions: '',
    },
    
    // SEO & FAQs (Step 6)
    seo: {
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
    },
    faqs: [],
    
    // Payment Options (Step 7)
    payment: {
      payment_type: 'full', // 'full' | 'percentage' | 'delivery_secured'
      percentage_rate: 30, // Pour paiement partiel (10-90%)
    },
    
    // Meta
    is_active: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Update form data with auto-save
   */
  const handleUpdateFormData = useCallback((data: any) => {
    setFormData(prev => {
      const newData = { ...prev, ...data };
      
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
      localStorage.setItem('physical-product-draft', JSON.stringify(dataToSave));
      logger.info('Brouillon produit physique auto-sauvegardé', { step: currentStep });
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData, currentStep]);

  /**
   * Load draft from localStorage
   */
  useEffect(() => {
    const savedDraft = localStorage.getItem('physical-product-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        logger.info('Brouillon produit physique chargé depuis localStorage');
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
      
      logger.info('Template appliqué au produit physique', { templateName: template.name });
      
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
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.name?.trim()) errors.push(t('products.errors.nameRequired', 'Le nom est requis'));
        if (!formData.description?.trim()) errors.push(t('products.errors.descriptionRequired', 'La description est requise'));
        if (!formData.price || formData.price <= 0) errors.push(t('products.errors.priceRequired', 'Le prix doit être supérieur à 0'));
        if (!formData.images || formData.images.length === 0) errors.push(t('products.errors.imageRequired', 'Au moins une image est requise'));
        break;

      case 2:
        if (formData.has_variants) {
          if (!formData.options || formData.options.length === 0) {
            errors.push(t('products.errors.variantsOptionsRequired', 'Au moins une option est requise pour les variantes'));
          }
          if (!formData.variants || formData.variants.length === 0) {
            errors.push(t('products.errors.variantsRequired', 'Au moins une variante est requise'));
          }
        }
        break;

      case 3:
        if (formData.track_inventory) {
          if (!formData.sku?.trim()) errors.push(t('products.errors.skuRequired', 'Le SKU est requis'));
          if (formData.quantity === undefined || formData.quantity < 0) {
            errors.push(t('products.errors.quantityRequired', 'La quantité en stock est requise'));
          }
        }
        break;

      case 4:
        if (formData.requires_shipping) {
          if (!formData.weight || formData.weight <= 0) {
            errors.push(t('products.errors.weightRequired', 'Le poids est requis pour les produits avec expédition'));
          }
        }
        break;

      case 5:
      case 6:
      case 7:
        // Optional steps
        break;
    }

    setValidationErrors(prev => ({ ...prev, [step]: errors }));
    const isValid = errors.length === 0;
    
    if (!isValid) {
      logger.warn('Validation échouée', { step, errors });
    }
    
    return isValid;
  }, [formData, t]);

  /**
   * Navigation handlers
   */
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      logger.info('Navigation vers étape suivante', { from: currentStep, to: nextStepNum });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast({
        title: t('products.errors.validationTitle', 'Erreurs de validation'),
        description: t('products.errors.validationDesc', 'Veuillez corriger les erreurs avant de continuer'),
        variant: 'destructive',
      });
    }
  }, [currentStep, validateStep, toast, t]);

  const handlePrevious = useCallback(() => {
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
   * Helper function to save physical product
   */
  const savePhysicalProduct = useCallback(async (isDraft: boolean) => {
    if (!store) {
      throw new Error(t('products.errors.noStore', 'Aucune boutique trouvée'));
    }

    // 1. Generate slug from name
    const slug = formData.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product';

    // 2. Create base product avec SEO
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        store_id: store.id,
        name: formData.name,
        slug,
        description: formData.description,
        price: formData.price || 0,
        currency: 'XOF',
        product_type: 'physical',
        category_id: formData.category_id,
        image_url: formData.images?.[0] || null,
        images: formData.images || [],
        // SEO fields
        meta_title: formData.seo?.meta_title,
        meta_description: formData.seo?.meta_description,
        meta_keywords: formData.seo?.meta_keywords,
        og_title: formData.seo?.og_title,
        og_description: formData.seo?.og_description,
        og_image: formData.seo?.og_image,
        // FAQs
        faqs: formData.faqs || [],
        // Payment Options
        payment_options: formData.payment || {
          payment_type: 'full',
          percentage_rate: 30,
        },
        is_draft: isDraft,
        is_active: !isDraft,
      })
      .select()
      .single();

    if (productError) throw productError;

    // 3. Create physical_product
    const { error: physicalError } = await supabase
      .from('physical_products')
      .insert({
        product_id: product.id,
        sku: formData.sku,
        barcode: formData.barcode,
        weight: formData.weight,
        weight_unit: formData.weight_unit || 'kg',
        length: formData.dimensions?.length,
        width: formData.dimensions?.width,
        height: formData.dimensions?.height,
        dimension_unit: formData.dimensions?.unit || 'cm',
        requires_shipping: formData.requires_shipping !== false,
        is_fragile: formData.is_fragile || false,
        is_perishable: formData.is_perishable || false,
        customs_value: formData.customs_value,
        country_of_origin: formData.country_of_origin || 'CI',
      });

    if (physicalError) throw physicalError;

    // 4. Create variants if any
    if (formData.variants && formData.variants.length > 0) {
      const variantsData = formData.variants.map((variant: any) => ({
        physical_product_id: product.id,
        variant_name: variant.variant_name,
        sku: variant.sku,
        price_adjustment: variant.price_adjustment || 0,
        weight_adjustment: variant.weight_adjustment || 0,
        image_url: variant.image_url,
        is_available: variant.is_available !== false,
      }));

      const { error: variantsError } = await supabase
        .from('physical_product_variants')
        .insert(variantsData);

      if (variantsError) throw variantsError;
    }

    // 5. Create inventory
    const { error: inventoryError } = await supabase
      .from('physical_product_inventory')
      .insert({
        physical_product_id: product.id,
        location_name: formData.inventory_location || 'Default',
        quantity_available: formData.quantity || 0,
        quantity_reserved: 0,
        low_stock_threshold: formData.low_stock_threshold || 5,
        track_inventory: formData.track_inventory !== false,
      });

    if (inventoryError) throw inventoryError;

    // 6. Create affiliate settings if enabled
    if (formData.affiliate && formData.affiliate.enabled) {
      const { error: affiliateError } = await supabase
        .from('product_affiliate_settings')
        .insert({
          product_id: product.id,
          store_id: store.id,
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
        console.error('Affiliate settings error:', affiliateError);
      }
    }

    // Clear draft from localStorage on success
    localStorage.removeItem('physical-product-draft');

    return product;
  }, [formData, store, t]);

  /**
   * Save as draft
   */
  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      const product = await savePhysicalProduct(true);
      
      logger.info('Brouillon produit physique sauvegardé', { productId: product.id });
      
      toast({
        title: t('products.draftSaved', '✅ Brouillon sauvegardé'),
        description: t('products.draftSavedDesc', 'Produit "{{name}}" enregistré. Vous pouvez continuer plus tard.', { name: product.name }),
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/products');
      }
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du brouillon', error);
      toast({
        title: t('products.errors.saveError', '❌ Erreur de sauvegarde'),
        description: error instanceof Error ? error.message : t('products.errors.saveErrorDesc', 'Impossible de sauvegarder le brouillon'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [savePhysicalProduct, toast, onSuccess, navigate, t]);

  /**
   * Publish product
   */
  const handlePublish = useCallback(async () => {
    // Validate required steps (1-4 are required, 5-7 are optional)
    let allValid = true;
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) {
        allValid = false;
      }
    }

    if (!allValid) {
      toast({
        title: t('products.errors.validationAllTitle', '⚠️ Erreurs de validation'),
        description: t('products.errors.validationAllDesc', 'Veuillez corriger toutes les erreurs avant de publier'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const product = await savePhysicalProduct(false);
      
      logger.info('Produit physique publié', { productId: product.id, productName: product.name });
      
      toast({
        title: t('products.published', '🎉 Produit publié !'),
        description: t('products.publishedDesc', '"{{name}}" est maintenant en ligne{{affiliate}}', { 
          name: product.name,
          affiliate: formData.affiliate?.enabled ? ' avec programme d\'affiliation activé' : ''
        }),
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/products');
      }
    } catch (error) {
      logger.error('Erreur lors de la publication', error);
      toast({
        title: t('products.errors.publishError', '❌ Erreur de publication'),
        description: error instanceof Error ? error.message : t('products.errors.publishErrorDesc', 'Impossible de publier le produit'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [validateStep, savePhysicalProduct, formData.affiliate?.enabled, toast, onSuccess, navigate, t]);

  /**
   * Get props for current step component
   */
  const getStepProps = useCallback(() => {
    const baseProps = {
      data: formData,
      onUpdate: handleUpdateFormData,
    };

    switch (currentStep) {
      case 5: // Affiliation
        return {
          productPrice: formData.price || 0,
          productName: formData.name || t('products.product', 'Produit'),
          data: formData.affiliate || {},
          onUpdate: (affiliateData: any) => handleUpdateFormData({ affiliate: affiliateData }),
        };
      
      case 6: // SEO & FAQs
        return {
          data: {
            seo: formData.seo || {},
            faqs: formData.faqs || [],
          },
          productName: formData.name || '',
          productDescription: formData.description || '',
          productPrice: formData.price || 0,
          onUpdate: handleUpdateFormData,
        };
      
      case 7: // Payment Options
        return {
          productPrice: formData.price || 0,
          productType: 'physical' as const,
          data: formData.payment || {},
          onUpdate: (paymentData: any) => handleUpdateFormData({ payment: paymentData }),
        };
      
      default:
        return baseProps;
    }
  }, [currentStep, formData, handleUpdateFormData, t]);

  const CurrentStep = STEPS[currentStep - 1];
  const CurrentStepComponent = CurrentStep.component;

  /**
   * Calculate progress
   */
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  /**
   * Logging on mount
   */
  useEffect(() => {
    logger.info('Wizard Produit Physique ouvert', { step: currentStep, storeId: store?.id });
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
              <span className="hidden sm:inline">{t('products.backToType', 'Retour au choix du type')}</span>
              <span className="sm:hidden">{t('common.back', 'Retour')}</span>
            </Button>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20 animate-in zoom-in duration-500">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 dark:text-green-400" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                  {t('products.createPhysical.title', 'Nouveau Produit Physique')}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('products.createPhysical.subtitle', 'Créez un produit physique professionnel en 8 étapes')}
                </p>
              </div>
            </div>
            
            {/* Template Button - Badge "Nouveau" supprimé */}
            {currentStep === 1 && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateSelector(true);
                  logger.info('Ouverture sélecteur de template pour produit physique');
                }}
                className="gap-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                size="sm"
                aria-label={t('products.useTemplate', 'Utiliser un template')}
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="hidden sm:inline">{t('products.useTemplate', 'Utiliser un template')}</span>
                <span className="sm:hidden">{t('products.template', 'Template')}</span>
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium">
                {t('products.step', 'Étape')} {currentStep} {t('products.of', 'sur')} {STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                {isAutoSaving && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">{t('products.autoSaving', 'Auto-sauvegarde...')}</span>
                  </div>
                )}
                <span className="text-muted-foreground">{Math.round(progress)}% {t('products.completed', 'complété')}</span>
              </div>
            </div>
            <Progress 
              value={progress} 
              className="h-1.5 sm:h-2 bg-muted"
            />
          </div>
        </div>

        {/* Steps Indicator - Responsive */}
        <Card 
          ref={stepsRef}
          className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const hasErrors = validationErrors[step.id]?.length > 0;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${t('products.step', 'Étape')} ${step.id}: ${step.title}`}
                    className={cn(
                      "relative p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-300 text-left",
                      "hover:shadow-md hover:scale-[1.02] touch-manipulation",
                      isActive && 'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-lg scale-[1.02] ring-2 ring-green-500/20',
                      isCompleted && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                      !isActive && !isCompleted && !hasErrors && 'border-border hover:border-green-500/50 bg-card/50',
                      hasErrors && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                      "animate-in fade-in slide-in-from-bottom-4"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <Icon className={cn(
                        "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-colors",
                        isActive ? 'text-green-600 dark:text-green-400' : 
                        isCompleted ? 'text-green-600 dark:text-green-400' : 
                        hasErrors ? 'text-red-600 dark:text-red-400' :
                        'text-muted-foreground'
                      )} />
                      {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 ml-auto" aria-hidden="true" />}
                      {hasErrors && !isCompleted && <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0 ml-auto" aria-hidden="true" />}
                    </div>
                    <div className={cn(
                      "text-[10px] sm:text-xs font-medium truncate",
                      isActive && "text-green-600 dark:text-green-400 font-semibold",
                      hasErrors && !isActive && "text-red-600 dark:text-red-400",
                      !isActive && !hasErrors && "text-muted-foreground"
                    )}>
                      {step.title}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate hidden sm:block mt-0.5">
                      {step.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Validation Errors */}
        {validationErrors[currentStep]?.length > 0 && (
          <Alert variant="destructive" className="mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
                {validationErrors[currentStep].map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Step */}
        <Card 
          ref={contentRef}
          className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl">
              {React.createElement(CurrentStep.icon, { className: 'h-4 w-4 sm:h-5 sm:w-5' })}
              {CurrentStep.title}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm flex items-center gap-2">
              {CurrentStep.description}
              {currentStep >= 5 && currentStep <= 7 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  {t('products.optional', 'Optionnel')}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <CurrentStepComponent {...getStepProps()} />
          </CardContent>
        </Card>

        {/* Navigation Buttons - Responsive */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none"
                    size="sm"
                    aria-label={t('products.previous', 'Étape précédente')}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">{t('products.previous', 'Précédent')}</span>
                    <span className="sm:hidden">{t('products.prev', 'Préc.')}</span>
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('products.saveDraft', 'Sauvegarder comme brouillon')}
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('products.saveDraft', 'Sauvegarder brouillon')}</span>
                  <span className="sm:hidden">{t('products.draft', 'Brouillon')}</span>
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘S
                  </Badge>
                </Button>

                {currentStep < STEPS.length ? (
                  <Button 
                    onClick={handleNext} 
                    disabled={isSaving}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    size="sm"
                    aria-label={t('products.next', 'Étape suivante')}
                  >
                    <span className="hidden sm:inline">{t('products.next', 'Suivant')}</span>
                    <span className="sm:hidden">{t('products.nextShort', 'Suiv.')}</span>
                    <ChevronRight className="h-4 w-4 ml-1.5 sm:ml-2" />
                    <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                      ⌘→
                    </Badge>
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePublish} 
                    disabled={isSaving}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    size="sm"
                    aria-label={t('products.publish', 'Publier le produit')}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                        <span className="hidden sm:inline">{t('products.publishing', 'Publication...')}</span>
                        <span className="sm:hidden">{t('products.publishingShort', 'Pub...')}</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">{t('products.publish', 'Publier le produit')}</span>
                        <span className="sm:hidden">{t('products.publishShort', 'Publier')}</span>
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
            <span className="text-muted-foreground">{t('products.shortcuts.save', 'Brouillon')}</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘→</Badge>
            <span className="text-muted-foreground">{t('products.shortcuts.next', 'Suivant')}</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘←</Badge>
            <span className="text-muted-foreground">{t('products.shortcuts.prev', 'Précédent')}</span>
          </div>
        </div>
      </div>
      
      {/* Template Selector Dialog */}
      <TemplateSelector
        productType="physical"
        open={showTemplateSelector}
        onClose={() => {
          setShowTemplateSelector(false);
          logger.info('Fermeture sélecteur de template pour produit physique');
        }}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};
