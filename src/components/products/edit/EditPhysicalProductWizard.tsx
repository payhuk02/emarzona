/**
 * Edit Physical Product Wizard
 * Date: 2025-01-26
 *
 * Wizard professionnel pour l'édition complète de produits physiques
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
  Loader2,
  CreditCard,
  Ruler,
} from 'lucide-react';
import { PhysicalBasicInfoForm } from '../create/physical/PhysicalBasicInfoForm';
import { PhysicalVariantsBuilder } from '../create/physical/PhysicalVariantsBuilder';
import { PhysicalInventoryConfig } from '../create/physical/PhysicalInventoryConfig';
import { PhysicalShippingConfig } from '../create/physical/PhysicalShippingConfig';
import { PhysicalSizeChartSelector } from '../create/physical/PhysicalSizeChartSelector';
import { PhysicalAffiliateSettings } from '../create/physical/PhysicalAffiliateSettings';
import { PhysicalSEOAndFAQs } from '../create/physical/PhysicalSEOAndFAQs';
import { PhysicalPreview } from '../create/physical/PhysicalPreview';
import { PaymentOptionsForm } from '../create/shared/PaymentOptionsForm';
import { ProductStatisticsDisplaySettings } from '../create/shared/ProductStatisticsDisplaySettings';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useWizardServerValidation } from '@/hooks/useWizardServerValidation';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type {
  PhysicalProductFormData,
  PhysicalProductFormDataUpdate,
  PhysicalProductVariant,
} from '@/types/physical-product';
import {
  validateWithZod,
  getFieldError,
  physicalProductStep1Schema,
} from '@/lib/wizard-validation';
import { useQuery } from '@tanstack/react-query';

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
    title: 'Guide des Tailles',
    description: 'Size chart (optionnel)',
    icon: Ruler,
    component: null,
  },
  {
    id: 6,
    title: 'Affiliation',
    description: 'Commission, affiliés (optionnel)',
    icon: Users,
    component: PhysicalAffiliateSettings,
  },
  {
    id: 7,
    title: 'SEO & FAQs',
    description: 'Référencement, questions',
    icon: Search,
    component: PhysicalSEOAndFAQs,
  },
  {
    id: 8,
    title: 'Options de Paiement',
    description: 'Complet, partiel, escrow',
    icon: CreditCard,
    component: PaymentOptionsForm,
  },
  {
    id: 9,
    title: 'Aperçu & Validation',
    description: 'Vérifier et publier',
    icon: Eye,
    component: PhysicalPreview,
  },
];

interface EditPhysicalProductWizardProps {
  productId: string;
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

/**
 * Convert physical product from DB to form data
 * ✅ SÉCURITÉ: Inclut validation de propriété
 */
const convertToFormData = async (productId: string, userId?: string): Promise<Partial<PhysicalProductFormData>> => {
  // ✅ SÉCURITÉ: Vérifier propriété du produit avant chargement
  if (userId) {
    const { data: ownershipCheck, error: ownershipError } = await supabase
      .from('products')
      .select(`
        id,
        stores!inner(user_id)
      `)
      .eq('id', productId)
      .eq('stores.user_id', userId)
      .single();

    if (ownershipError || !ownershipCheck) {
      throw new Error('Accès non autorisé à ce produit');
    }
  }

  // Load product with security check
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  // Load physical product data
  const { data: physicalProduct, error: physicalError } = await supabase
    .from('physical_products')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (physicalError && physicalError.code !== 'PGRST116') throw physicalError;

  // Load variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('physical_product_id', physicalProduct?.id || productId);

  // Load inventory
  const { data: inventory } = await supabase
    .from('physical_product_inventory')
    .select('*')
    .eq('product_id', productId);

  // Load size chart
  const { data: sizeChart } = await supabase
    .from('product_size_charts')
    .select('size_chart_id')
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle();

  // Load return policy
  const { data: returnPolicy } = await supabase
    .from('product_return_policies')
    .select('return_policy_id')
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle();

  return {
    // Basic Info
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    short_description: product.short_description || '',
    price: product.price || 0,
    compare_at_price: product.compare_at_price || null,
    cost_per_item: product.cost_per_item || null,
    images: product.images || [],
    category_id: product.category_id || null,
    tags: product.tags || [],

    // Variants
    has_variants: (variants?.length || 0) > 0,
    variants: (variants || []).map(
      (v: {
        id: string;
        option1_value?: string;
        option2_value?: string;
        option3_value?: string;
        price?: number;
        compare_at_price?: number | null;
        cost_per_item?: number | null;
        sku?: string;
        barcode?: string;
        quantity?: number;
        weight?: number | null;
        image_url?: string | null;
      }) => ({
        id: v.id,
        option1_value: v.option1_value || '',
        option2_value: v.option2_value,
        option3_value: v.option3_value,
        price: v.price || product.price || 0,
        compare_at_price: v.compare_at_price,
        cost_per_item: v.cost_per_item,
        sku: v.sku || '',
        barcode: v.barcode,
        quantity: v.quantity || 0,
        weight: v.weight,
        image_url: v.image_url,
      })
    ) as PhysicalProductVariant[],
    options: [], // Will be extracted from variants

    // Inventory
    track_inventory: physicalProduct?.track_inventory ?? true,
    continue_selling_when_out_of_stock:
      physicalProduct?.continue_selling_when_out_of_stock ?? false,
    inventory_policy: (physicalProduct?.inventory_policy as 'deny' | 'continue') || 'deny',
    quantity: inventory?.[0]?.quantity_available || physicalProduct?.quantity || 0,
    sku: physicalProduct?.sku || '',
    barcode: physicalProduct?.barcode || '',

    // Shipping
    requires_shipping: physicalProduct?.requires_shipping ?? true,
    weight: physicalProduct?.weight || null,
    weight_unit: (physicalProduct?.weight_unit as 'kg' | 'lb' | 'g' | 'oz') || 'kg',
    dimensions: physicalProduct?.dimensions || {
      length: null,
      width: null,
      height: null,
      unit: 'cm',
    },
    shipping_class: physicalProduct?.shipping_class || null,
    free_shipping: physicalProduct?.free_shipping || false,

    // Affiliation
    affiliate: physicalProduct?.affiliate_settings || {
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

    // SEO & FAQs
    seo: {
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: product.og_image || '',
    },
    faqs: product.faqs || [],

    // Payment Options
    payment: product.payment_options || {
      payment_type: 'full',
      percentage_rate: 30,
    },

    // Size Chart
    size_chart_id: sizeChart?.size_chart_id || null,

    // Statistics Display Settings
    hide_purchase_count: product.hide_purchase_count || false,
    hide_likes_count: product.hide_likes_count || false,
    hide_recommendations_count: product.hide_recommendations_count || false,
    hide_downloads_count: product.hide_downloads_count || false,
    hide_reviews_count: product.hide_reviews_count || false,
    hide_rating: product.hide_rating || false,

    // Meta
    is_active: product.is_active ?? true,
  };
};

export const EditPhysicalProductWizard = ({
  productId,
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: EditPhysicalProductWizardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);
  const storeId = propsStoreId || store?.id;

  // Load existing product with security validation
  const {
    data: formDataInitial,
    isLoading: loadingProduct,
    error: productError,
  } = useQuery({
    queryKey: ['physical-product-edit', productId, user?.id],
    queryFn: () => convertToFormData(productId, user?.id),
    enabled: !!productId && !!user?.id,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<Partial<PhysicalProductFormData>>({});
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
    validateSku,
    validatePhysicalProduct: validatePhysicalProductServer,
    serverErrors,
    clearServerErrors,
  } = useWizardServerValidation({
    storeId: storeId || undefined,
    productId,
  });

  const handleUpdateFormData = useCallback((updates: PhysicalProductFormDataUpdate) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Validate current step
   */
  const validateStep = useCallback(
    async (step: number): Promise<{ valid: boolean; errors: string[] }> => {
      const errors: string[] = [];
      clearServerErrors();

      switch (step) {
        case 1: {
          const step1Data = {
            name: formData.name,
            slug: formData.slug?.trim() || undefined,
            short_description: formData.short_description?.trim() || undefined,
            description: formData.description?.trim() || undefined,
            price: formData.price,
          };

          const result = validateWithZod(physicalProductStep1Schema, step1Data);

          if (!result.valid) {
            const nameError = getFieldError(result.errors, 'name');
            const priceError = getFieldError(result.errors, 'price');
            const slugError = getFieldError(result.errors, 'slug');
            const shortDescriptionError = getFieldError(result.errors, 'short_description');
            const descriptionError = getFieldError(result.errors, 'description');

            if (nameError) errors.push(nameError);
            if (priceError) errors.push(priceError);
            if (slugError) errors.push(slugError);
            if (shortDescriptionError) errors.push(shortDescriptionError);
            if (descriptionError) errors.push(descriptionError);
          }

          if (!formData.images || formData.images.length === 0) {
            errors.push('Au moins une image est requise');
          }

          if (errors.length > 0) {
            setValidationErrors(prev => ({ ...prev, [step]: errors }));
            return { valid: false, errors };
          }

          // Server validation
          // Générer le slug si nécessaire pour la validation
          const slugForValidation =
            formData.slug?.trim() ||
            formData.name
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '') ||
            null;

          if (storeId && slugForValidation) {
            const serverResult = await validatePhysicalProductServer({
              name: formData.name || '',
              slug: slugForValidation,
              price: formData.price || 0,
              sku: undefined,
              weight: undefined,
              quantity: undefined,
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
              logger.warn('[EditPhysicalProductWizard] Validation échouée', {
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

        case 3: {
          if (formData.track_inventory) {
            if (!formData.sku?.trim()) {
              errors.push('Le SKU est requis');
            }
            if (formData.quantity === undefined || formData.quantity < 0) {
              errors.push('La quantité en stock est requise');
            }
          }

          if (errors.length > 0) {
            setValidationErrors(prev => ({ ...prev, [step]: errors }));
            return { valid: false, errors };
          }

          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
          });
          return { valid: true, errors: [] };
        }

        case 4: {
          if (formData.requires_shipping) {
            if (!formData.weight || formData.weight <= 0) {
              errors.push('Le poids est requis pour les produits avec expédition');
            }
          }

          if (errors.length > 0) {
            setValidationErrors(prev => ({ ...prev, [step]: errors }));
            return { valid: false, errors };
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
    [formData, storeId, validatePhysicalProductServer, clearServerErrors]
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
          .select(`
            id,
            stores!inner(user_id)
          `)
          .eq('id', productId)
          .eq('stores.user_id', user.id)
          .single();

        if (ownershipError || !ownershipCheck) {
          throw new Error('Vous n\'avez pas les permissions pour modifier ce produit');
        }
      }
      // Generate slug if not provided
      let slug =
        formData.slug?.trim() ||
        formData.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ||
        'product';

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
          'product';
        slug = `${baseSlug}-${attempts}`;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Impossible de générer un slug unique');
      }

      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          slug,
          description: formData.description,
          short_description: formData.short_description,
          price: formData.price || 0,
          compare_at_price: formData.compare_at_price,
          cost_per_item: formData.cost_per_item,
          images: formData.images || [],
          category_id: formData.category_id,
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
        })
        .eq('id', productId);

      if (productError) throw productError;

      // Update or create physical product
      const { data: existingPhysical } = await supabase
        .from('physical_products')
        .select('id')
        .eq('product_id', productId)
        .limit(1)
        .maybeSingle();

      const physicalProductData = {
        product_id: productId,
        track_inventory: formData.track_inventory ?? true,
        continue_selling_when_out_of_stock: formData.continue_selling_when_out_of_stock ?? false,
        inventory_policy: formData.inventory_policy || 'deny',
        quantity: formData.quantity || 0,
        sku: formData.sku || '',
        barcode: formData.barcode || '',
        requires_shipping: formData.requires_shipping ?? true,
        weight: formData.weight,
        weight_unit: formData.weight_unit || 'kg',
        dimensions: formData.dimensions,
        shipping_class: formData.shipping_class,
        free_shipping: formData.free_shipping || false,
        affiliate_settings: formData.affiliate,
      };

      if (existingPhysical) {
        const { error: physicalError } = await supabase
          .from('physical_products')
          .update(physicalProductData)
          .eq('id', existingPhysical.id);

        if (physicalError) throw physicalError;
      } else {
        const { error: physicalError } = await supabase
          .from('physical_products')
          .insert(physicalProductData);

        if (physicalError) throw physicalError;
      }

      // Update size chart
      if (formData.size_chart_id) {
        const { data: existingSizeChart } = await supabase
          .from('product_size_charts')
          .select('id')
          .eq('product_id', productId)
          .limit(1)
          .maybeSingle();

        if (existingSizeChart) {
          await supabase
            .from('product_size_charts')
            .update({ size_chart_id: formData.size_chart_id })
            .eq('id', existingSizeChart.id);
        } else {
          await supabase.from('product_size_charts').insert({
            product_id: productId,
            size_chart_id: formData.size_chart_id,
          });
        }
      }

      toast({
        title: '✅ Produit mis à jour',
        description: 'Le produit a été modifié avec succès',
      });

      onSuccess?.();
    } catch (error) {
      logger.error('Error updating physical product', { error, productId });
      toast({
        title: '❌ Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de mettre à jour le produit',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [formData, productId, store, onSuccess, toast]);

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
    const result = await validateStep(currentStep);
    if (result.valid) {
      await saveProduct();
    } else {
      const errorMessages =
        result.errors.length > 0
          ? result.errors.join(', ')
          : 'Veuillez corriger les erreurs avant de sauvegarder';
      toast({
        title: 'Erreurs de validation',
        description: errorMessages,
        variant: 'destructive',
      });
    }
  }, [currentStep, validateStep, saveProduct, toast]);

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

      case 6:
        return {
          productPrice: formData.price || 0,
          productName: formData.name || t('products.product', 'Produit'),
          data: formData.affiliate || {},
          onUpdate: (affiliateData: PhysicalProductFormDataUpdate['affiliate']) =>
            handleUpdateFormData({ affiliate: affiliateData }),
        };

      case 7:
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

      case 8:
        return {
          productPrice:
            typeof formData.price === 'number' && !isNaN(formData.price) ? formData.price : 0,
          productType: 'physical' as const,
          data: formData.payment || {},
          onUpdate: (paymentData: PhysicalProductFormDataUpdate['payment']) =>
            handleUpdateFormData({ payment: paymentData }),
        };

      default:
        return baseProps;
    }
  }, [currentStep, formData, handleUpdateFormData, t, storeSlug, store]);

  const CurrentStep = STEPS[currentStep - 1];
  const CurrentStepComponent = CurrentStep.component;
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  const handleStepClick = useCallback(
    (stepId: number) => {
      if (stepId <= currentStep) {
        setCurrentStep(stepId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [currentStep]
  );

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
            Erreur lors du chargement du produit. Veuillez réessayer.
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
            <Button variant="ghost" onClick={onBack} className="mb-3 sm:mb-4" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back', 'Retour')}
            </Button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Modifier le produit</h1>
          </div>

          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Étape {currentStep} sur {STEPS.length} ({Math.round(progress)}%)
          </p>
        </div>

        {/* Steps Navigator - Responsive */}
        <Card className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 sm:gap-3"
              role="tablist"
              aria-label="Étapes du formulaire"
            >
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const isAccessible = step.id <= currentStep;
                const hasErrors = validationErrors[step.id]?.length > 0;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isAccessible}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Étape ${step.id}: ${step.title}`}
                    className={cn(
                      'p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 text-left',
                      'hover:shadow-md hover:scale-[1.02] touch-manipulation',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                      isActive &&
                        'border-primary bg-primary/5 shadow-lg scale-[1.02] ring-2 ring-primary/20',
                      isCompleted && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                      !isActive &&
                        !isCompleted &&
                        isAccessible &&
                        'border-border hover:border-primary/50 bg-card/50',
                      !isAccessible && 'border-border/30 bg-muted/30',
                      hasErrors && !isCompleted && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                      'animate-in fade-in slide-in-from-bottom-4'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <Icon
                        className={cn(
                          'h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-colors',
                          isActive
                            ? 'text-primary'
                            : isCompleted
                              ? 'text-green-600 dark:text-green-400'
                              : hasErrors
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-muted-foreground'
                        )}
                      />
                      {isCompleted && (
                        <CheckCircle2
                          className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 ml-auto"
                          aria-hidden="true"
                        />
                      )}
                      {hasErrors && !isCompleted && (
                        <AlertCircle
                          className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0 ml-auto"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div
                      className={cn(
                        'text-[10px] sm:text-xs font-medium truncate',
                        isActive && 'text-primary font-semibold',
                        hasErrors && !isActive && 'text-red-600 dark:text-red-400',
                        !isActive && !hasErrors && 'text-muted-foreground'
                      )}
                    >
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
            {currentStep === 5 ? (
              <PhysicalSizeChartSelector
                selectedSizeChartId={formData.size_chart_id || undefined}
                onSelectSizeChart={sizeChartId => {
                  handleUpdateFormData({ size_chart_id: sizeChartId });
                }}
              />
            ) : currentStep === 7 ? (
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
                  productType="physical"
                  variant="compact"
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
