/**
 * Edit Service Product Wizard
 * Date: 2025-01-26
 *
 * Wizard professionnel pour l'édition complète de services
 * Permet de modifier toutes les étapes comme dans le wizard de création
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
  Calendar,
  Info,
  Clock,
  Users,
  DollarSign,
  Share2,
  Search,
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { ServiceBasicInfoForm } from '../create/service/ServiceBasicInfoForm';
import { ServiceDurationAvailabilityForm } from '../create/service/ServiceDurationAvailabilityForm';
import { ServiceStaffResourcesForm } from '../create/service/ServiceStaffResourcesForm';
import { ServicePricingOptionsForm } from '../create/service/ServicePricingOptionsForm';
import { ServiceAffiliateSettings } from '../create/service/ServiceAffiliateSettings';
import { ServiceSEOAndFAQs } from '../create/service/ServiceSEOAndFAQs';
import { ServicePreview } from '../create/service/ServicePreview';
import { PaymentOptionsForm } from '../create/shared/PaymentOptionsForm';
import { ProductStatisticsDisplaySettings } from '../create/shared/ProductStatisticsDisplaySettings';
import { ProductWhatsAppContactConfig } from '@/components/products/shared/ProductWhatsAppContactConfig';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useWizardServerValidation } from '@/hooks/useWizardServerValidation';
import { supabase } from '@/integrations/supabase/client';
import { updateServiceProductTx } from '@/lib/products/product-update-rpc';
import { persistProductWhatsApp } from '@/lib/products/persist-product-whatsapp';
import { persistServiceCategoryAttributes } from '@/lib/service/persist-service-category-attributes';
import { toPersistedPricingType } from '@/lib/service/service-pricing';
import { loadServiceProductFormData } from '@/lib/service/load-service-product-form';
import { resolveServiceProductCategoryPayload } from '@/lib/services/service-categories';
import { useServiceCategoryTree } from '@/hooks/useServiceCategories';
import {
  validateServiceWizardPublishSteps,
  validateServiceWizardStep,
} from '@/lib/service-wizard-step-validation';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { ServiceProductFormData } from '@/types/service-product';
import { useCatalogCacheInvalidation } from '@/hooks/useCatalogCacheInvalidation';
import { useQuery } from '@tanstack/react-query';

const STEPS = [
  {
    id: 1,
    title: 'Informations de base',
    description: 'Nom, description, type de service',
    icon: Info,
    component: ServiceBasicInfoForm,
  },
  {
    id: 2,
    title: 'Durée & Disponibilité',
    description: 'Horaires, créneaux, localisation',
    icon: Clock,
    component: ServiceDurationAvailabilityForm,
  },
  {
    id: 3,
    title: 'Personnel & Ressources',
    description: 'Staff, capacité, équipement',
    icon: Users,
    component: ServiceStaffResourcesForm,
  },
  {
    id: 4,
    title: 'Tarification & Options',
    description: 'Prix, acompte, réservations',
    icon: DollarSign,
    component: ServicePricingOptionsForm,
  },
  {
    id: 5,
    title: 'Affiliation',
    description: 'Commission, affiliés (optionnel)',
    icon: Share2,
    component: ServiceAffiliateSettings,
  },
  {
    id: 6,
    title: 'SEO & FAQs',
    description: 'Référencement, questions',
    icon: Search,
    component: ServiceSEOAndFAQs,
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
    component: ServicePreview,
  },
];

interface EditServiceProductWizardProps {
  productId: string;
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

const convertToFormData = loadServiceProductFormData;

export const EditServiceProductWizard = ({
  productId,
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: EditServiceProductWizardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);
  const storeId = propsStoreId || store?.id;
  const { tree: categoryTree } = useServiceCategoryTree();
  const invalidateCatalog = useCatalogCacheInvalidation();

  // Load existing product with security validation and cache optimisé
  const {
    data: formDataInitial,
    isLoading: loadingProduct,
    error: productError,
  } = useQuery({
    queryKey: ['service-product-edit', productId, user?.id],
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
  const [formData, setFormData] = useState<Partial<ServiceProductFormData>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  // Initialize form data when product is loaded
  useEffect(() => {
    if (formDataInitial) {
      setFormData(formDataInitial);
    }
  }, [formDataInitial]);

  // Server validation hook
  const {
    validateSlug,
    validateService: validateServiceServer,
    clearServerErrors,
  } = useWizardServerValidation({
    storeId: storeId || undefined,
    productId,
  });

  const handleUpdateFormData = useCallback(
    (updates: Partial<ServiceProductFormData> & Record<string, unknown>) => {
      setFormData(prev => {
        const newData = { ...prev, ...updates };

        // Handle nested objects
        if (updates.affiliate) {
          newData.affiliate = {
            ...prev.affiliate,
            ...updates.affiliate,
          } as ServiceProductFormData['affiliate'];
        }

        if (updates.seo) {
          newData.seo = {
            ...prev.seo,
            ...updates.seo,
          } as ServiceProductFormData['seo'];
        }

        if (updates.booking_options) {
          newData.booking_options = {
            ...prev.booking_options,
            ...updates.booking_options,
          } as ServiceProductFormData['booking_options'];
        }

        if (updates.payment) {
          newData.payment = {
            ...prev.payment,
            ...updates.payment,
          } as ServiceProductFormData['payment'];
        }

        return newData;
      });
    },
    []
  );

  /**
   * Validate current step
   */
  const validateStep = useCallback(
    async (step: number): Promise<{ valid: boolean; errors: string[] }> => {
      const errors: string[] = [];
      clearServerErrors();

      switch (step) {
        case 1: {
          const clientResult = validateServiceWizardStep(1, formData, { categoryTree });
          if (!clientResult.valid) {
            setValidationErrors(prev => ({ ...prev, [step]: clientResult.errors }));
            return { valid: false, errors: clientResult.errors };
          }

          // Server validation
          if (storeId && formData.name) {
            // Générer le slug si nécessaire pour la validation
            const slugForValidation =
              formData.slug?.trim() ||
              formData.name
                ?.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '') ||
              '';

            const serverResult = await validateServiceServer({
              name: formData.name || '',
              slug: slugForValidation,
              price: formData.price || 0,
            });

            if (!serverResult.valid) {
              // Ajouter les erreurs du serveur si disponibles
              // serverResult.errors est un tableau d'objets {field, message}
              if (
                serverResult.errors &&
                Array.isArray(serverResult.errors) &&
                serverResult.errors.length > 0
              ) {
                serverResult.errors.forEach(errorObj => {
                  if (errorObj && errorObj.message && typeof errorObj.message === 'string') {
                    errors.push(errorObj.message);
                  }
                });
              }
              // Si aucune erreur spécifique mais un message général, l'utiliser
              if (errors.length === 0 && serverResult.message) {
                errors.push(serverResult.message);
              }
              // Si toujours aucune erreur, utiliser un message par défaut
              if (errors.length === 0) {
                errors.push('Erreur de validation serveur. Veuillez vérifier vos données.');
              }
              logger.warn('[EditServiceProductWizard] Validation échouée', {
                step,
                errors,
                serverResult,
                formData: { name: formData.name, slug: slugForValidation, price: formData.price },
              });
              setValidationErrors(prev => ({ ...prev, [step]: errors }));
              return { valid: false, errors };
            }
          }

          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
          });
          return { valid: true, errors: [] };
        }

        case 2: {
          const clientResult = validateServiceWizardStep(2, formData, { categoryTree });
          if (!clientResult.valid) {
            setValidationErrors(prev => ({ ...prev, [step]: clientResult.errors }));
            return { valid: false, errors: clientResult.errors };
          }

          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
          });
          return { valid: true, errors: [] };
        }

        case 3:
        case 4: {
          const clientResult = validateServiceWizardStep(step, formData, { categoryTree });
          if (!clientResult.valid) {
            setValidationErrors(prev => ({ ...prev, [step]: clientResult.errors }));
            return { valid: false, errors: clientResult.errors };
          }

          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
          });
          return { valid: true, errors: [] };
        }

        default:
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
          });
          return { valid: true, errors: [] };
      }
    },
    [formData, storeId, validateServiceServer, clearServerErrors, categoryTree]
  );

  /**
   * Save product
   */
  const saveProduct = useCallback(async () => {
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
        formData.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ||
        'service';

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
          formData.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') ||
          'service';
        slug = `${baseSlug}-${attempts}`;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Impossible de générer un slug unique');
      }

      const productPayload: Record<string, unknown> = {
        name: formData.name,
        slug,
        description: formData.description,
        short_description: formData.short_description,
        price: formData.price || 0,
        promotional_price: formData.promotional_price || null,
        currency: formData.currency || 'XOF',
        category: formData.category,
        category_id: formData.category_id,
        image_url: formData.images?.[0] || null,
        images: formData.images || [],
        tags: formData.tags || [],
        meta_title: formData.seo?.meta_title,
        meta_description: formData.seo?.meta_description,
        og_image: formData.seo?.og_image,
        faqs: formData.faqs || [],
        payment_options: formData.payment,
        hide_purchase_count: formData.hide_purchase_count,
        hide_likes_count: formData.hide_likes_count,
        hide_recommendations_count: formData.hide_recommendations_count,
        hide_downloads_count: formData.hide_downloads_count,
        hide_reviews_count: formData.hide_reviews_count,
        hide_rating: formData.hide_rating,
        is_active: formData.is_active,
      };

      const syncedCategory = await resolveServiceProductCategoryPayload(
        formData.parent_category_id,
        formData.category_id
      );
      productPayload.category = syncedCategory.category;
      productPayload.category_id = syncedCategory.category_id;

      const servicePayload: Record<string, unknown> = {
        service_type: formData.service_type || 'appointment',
        duration_minutes: formData.duration_minutes || 60,
        location_type: formData.location_type || 'on_site',
        location_address: formData.location_address || null,
        meeting_url: formData.meeting_url || null,
        timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        requires_staff: formData.requires_staff ?? false,
        max_participants: formData.max_participants || 1,
        pricing_type: toPersistedPricingType(formData.pricing_type),
        deposit_required: formData.deposit_required || false,
        deposit_amount: formData.deposit_amount || null,
        deposit_type: formData.deposit_type || null,
        fulfillment_mode: formData.fulfillment_mode || 'appointment',
        allow_booking_cancellation: formData.booking_options?.allow_booking_cancellation ?? true,
        cancellation_deadline_hours: formData.booking_options?.cancellation_deadline_hours || 24,
        require_approval: formData.booking_options?.require_approval || false,
        buffer_time_before: formData.booking_options?.buffer_time_before || 0,
        buffer_time_after: formData.booking_options?.buffer_time_after || 0,
        max_bookings_per_day: formData.booking_options?.max_bookings_per_day,
        advance_booking_days: formData.booking_options?.advance_booking_days || 30,
        category_attributes: formData.category_attributes || {},
      };

      let affiliatePayload = null;
      if (formData.affiliate?.enabled) {
        affiliatePayload = {
          enabled: formData.affiliate.enabled ?? false,
          commission_rate: formData.affiliate.commission_rate ?? 10,
          commission_type: formData.affiliate.commission_type ?? 'percentage',
          fixed_commission_amount: formData.affiliate.fixed_commission_amount ?? 0,
          cookie_duration_days: formData.affiliate.cookie_duration_days ?? 30,
          min_order_amount: formData.affiliate.min_order_amount ?? 0,
          allow_self_referral: formData.affiliate.allow_self_referral ?? false,
          require_approval: formData.affiliate.require_approval ?? false,
          terms_and_conditions: formData.affiliate.terms_and_conditions ?? '',
        };
      }

      const slotsData = (formData.availability_slots || []).map(slot => ({
        day_of_week: slot.day_of_week ?? slot.day,
        start_time: slot.start_time,
        end_time: slot.end_time,
      }));

      const staffData = (formData.staff_members || []).map(staff => ({
        name: staff.name,
        email: staff.email,
        role: staff.role || null,
        avatar_url: staff.avatar_url || null,
        is_active: true,
      }));

      const resourcesList = formData.resources || formData.resources_needed || [];
      const resourcesData = resourcesList
        .map((resource: string | { name?: string }) =>
          typeof resource === 'string' ? resource : resource.name
        )
        .filter((name): name is string => Boolean(name?.trim()))
        .map(name => ({
          name,
          resource_type: 'other',
          quantity: 1,
          is_required: true,
        }));

      const rpcResult = await updateServiceProductTx(
        store.id,
        productId,
        productPayload,
        servicePayload,
        staffData,
        slotsData,
        resourcesData,
        affiliatePayload
      );

      await persistProductWhatsApp(productId, formData.whatsapp_number, formData.whatsapp_enabled);
      await persistServiceCategoryAttributes(
        rpcResult.service_product_id,
        formData.category_attributes,
        productId
      );

      const { data: existingAffiliate } = await supabase
        .from('product_affiliate_settings')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      const affiliateRow = {
        product_id: productId,
        store_id: store.id,
        affiliate_enabled: Boolean(formData.affiliate?.enabled),
        commission_rate: formData.affiliate?.commission_rate ?? 10,
        commission_type: formData.affiliate?.commission_type ?? 'percentage',
        fixed_commission_amount: formData.affiliate?.fixed_commission_amount ?? 0,
        cookie_duration_days: formData.affiliate?.cookie_duration_days ?? 30,
        min_order_amount: formData.affiliate?.min_order_amount ?? 0,
        allow_self_referral: formData.affiliate?.allow_self_referral ?? false,
        require_approval: formData.affiliate?.require_approval ?? false,
        terms_and_conditions: formData.affiliate?.terms_and_conditions ?? '',
      };

      if (existingAffiliate?.id) {
        await supabase
          .from('product_affiliate_settings')
          .update(affiliateRow)
          .eq('id', existingAffiliate.id);
      } else if (formData.affiliate?.enabled) {
        await supabase.from('product_affiliate_settings').insert(affiliateRow);
      }

      const serviceProductId = rpcResult.service_product_id;
      if (!serviceProductId) {
        throw new Error('Enregistrement produit service introuvable');
      }

      toast({
        title: '✅ Service mis à jour',
        description: 'Le service a été modifié avec succès',
      });

      invalidateCatalog();
      onSuccess?.();
    } catch (error) {
      logger.error('Error updating service product', { error, productId });
      toast({
        title: '❌ Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de mettre à jour le service',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [formData, productId, store, onSuccess, toast, invalidateCatalog]);

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
    const publishValidation = validateServiceWizardPublishSteps(formData, { categoryTree });
    if (!publishValidation.valid) {
      if (publishValidation.failedStep) {
        setCurrentStep(publishValidation.failedStep);
      }
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

    const serverStep = await validateStep(1);
    if (!serverStep.valid) {
      setCurrentStep(1);
      toast({
        title: 'Erreurs de validation',
        description: serverStep.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    await saveProduct();
  }, [formData, validateStep, saveProduct, toast, categoryTree]);

  const getStepProps = useCallback(() => {
    const baseProps = {
      data: formData,
      onUpdate: handleUpdateFormData,
    };

    switch (currentStep) {
      case 1:
        return {
          ...baseProps,
          storeSlug: storeSlug || (store && 'slug' in store ? store.slug : undefined),
        };

      case 5:
        return {
          productPrice: formData.price || 0,
          productName: formData.name || t('products.product', 'Service'),
          data: formData.affiliate || {},
          onUpdate: (affiliateData: ServiceProductFormData['affiliate']) =>
            handleUpdateFormData({ affiliate: affiliateData }),
        };

      case 6:
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

      case 7:
        return {
          productPrice:
            typeof formData.price === 'number' && !isNaN(formData.price) ? formData.price : 0,
          productType: 'service' as const,
          data: formData.payment || {},
          onUpdate: (paymentData: ServiceProductFormData['payment']) =>
            handleUpdateFormData({ payment: paymentData }),
        };

      default:
        return baseProps;
    }
  }, [currentStep, formData, handleUpdateFormData, t, storeSlug, store]);

  const CurrentStep = STEPS[currentStep - 1];
  const CurrentStepComponent = CurrentStep.component;
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  if (storeLoading || loadingProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (productError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement du service. Veuillez réessayer.
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
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Modifier le service</h1>
          </div>

          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Étape {currentStep} sur {STEPS.length} ({Math.round(progress)}%)
          </p>
        </div>

        {/* Validation Errors */}
        {validationErrors[currentStep] && validationErrors[currentStep].length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside text-sm space-y-1">
                {validationErrors[currentStep].map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Step */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(CurrentStep.icon, { className: 'h-5 w-5' })}
              {CurrentStep.title}
            </CardTitle>
            <CardDescription>{CurrentStep.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 6 ? (
              <div className="space-y-6">
                {CurrentStepComponent && <CurrentStepComponent {...getStepProps()} />}
                <ProductStatisticsDisplaySettings
                  formData={{
                    hide_purchase_count: formData.hide_purchase_count,
                    hide_likes_count: formData.hide_likes_count,
                    hide_recommendations_count: formData.hide_recommendations_count,
                    hide_downloads_count: formData.hide_downloads_count,
                    hide_reviews_count: formData.hide_reviews_count,
                    hide_rating: formData.hide_rating,
                  }}
                  updateFormData={(field, value) => handleUpdateFormData({ [field]: value })}
                  productType="service"
                  variant="compact"
                />
                <ProductWhatsAppContactConfig
                  whatsappNumber={formData.whatsapp_number || ''}
                  whatsappEnabled={Boolean(formData.whatsapp_enabled)}
                  onChange={patch => handleUpdateFormData(patch)}
                  disabled={isSaving}
                />
              </div>
            ) : CurrentStepComponent ? (
              <CurrentStepComponent {...getStepProps()} />
            ) : null}
          </CardContent>
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
