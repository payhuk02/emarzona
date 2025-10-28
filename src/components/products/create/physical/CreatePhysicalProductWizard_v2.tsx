/**
 * Create Physical Product Wizard - PROFESSIONAL V2
 * Date: 28 octobre 2025
 * 
 * Wizard professionnel en 7 étapes pour produits physiques
 * Avec Affiliation + SEO/FAQs intégrés
 * 100% Parité avec Online Courses
 */

import { useState } from 'react';
import React from 'react';
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
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PhysicalBasicInfoForm } from './PhysicalBasicInfoForm';
import { PhysicalVariantsBuilder } from './PhysicalVariantsBuilder';
import { PhysicalInventoryConfig } from './PhysicalInventoryConfig';
import { PhysicalShippingConfig } from './PhysicalShippingConfig';
import { PhysicalAffiliateSettings } from './PhysicalAffiliateSettings';
import { PhysicalSEOAndFAQs } from './PhysicalSEOAndFAQs';
import { PhysicalPreview } from './PhysicalPreview';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import type { PhysicalProductFormData } from '@/types/physical-product';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore; // Use hook store (props not needed with useStore)
  const [currentStep, setCurrentStep] = useState(1);
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
    
    // Affiliation (Step 5 - NOUVEAU)
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
    
    // SEO & FAQs (Step 6 - NOUVEAU)
    seo: {
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
    },
    faqs: [],
    
    // Meta
    is_active: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Validate current step
   */
  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.name?.trim()) errors.push('Le nom est requis');
        if (!formData.description?.trim()) errors.push('La description est requise');
        if (!formData.price || formData.price <= 0) errors.push('Le prix doit être supérieur à 0');
        if (!formData.images || formData.images.length === 0) errors.push('Au moins une image est requise');
        break;

      case 2:
        if (formData.has_variants) {
          if (!formData.options || formData.options.length === 0) {
            errors.push('Au moins une option est requise pour les variantes');
          }
          if (!formData.variants || formData.variants.length === 0) {
            errors.push('Au moins une variante est requise');
          }
        }
        break;

      case 3:
        if (formData.track_inventory) {
          if (!formData.sku?.trim()) errors.push('Le SKU est requis');
          if (formData.quantity === undefined || formData.quantity < 0) {
            errors.push('La quantité en stock est requise');
          }
        }
        break;

      case 4:
        if (formData.requires_shipping) {
          if (!formData.weight || formData.weight <= 0) {
            errors.push('Le poids est requis pour les produits avec expédition');
          }
        }
        break;

      case 5:
        // Affiliation est optionnelle
        break;

      case 6:
        // SEO & FAQs sont optionnels
        break;
    }

    setValidationErrors({ ...validationErrors, [step]: errors });
    return errors.length === 0;
  };

  /**
   * Handle step navigation
   */
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      toast({
        title: 'Erreurs de validation',
        description: 'Veuillez corriger les erreurs avant de continuer',
        variant: 'destructive',
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  /**
   * Handle form data update
   */
  const handleUpdateFormData = (data: any) => {
    setFormData({ ...formData, ...data });
  };

  /**
   * Helper function to save physical product
   */
  const savePhysicalProduct = async (isDraft: boolean) => {
    if (!store) {
      throw new Error('Aucune boutique trouvée');
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

    // 6. Create affiliate settings if enabled (NOUVEAU)
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
        // Don't throw, affiliate is optional
      }
    }

    return product;
  };

  /**
   * Save as draft
   */
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const product = await savePhysicalProduct(true);
      
      toast({
        title: '✅ Brouillon sauvegardé',
        description: `Produit "${product.name}" enregistré. Vous pouvez continuer plus tard.`,
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/products');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast({
        title: '❌ Erreur de sauvegarde',
        description: error instanceof Error ? error.message : 'Impossible de sauvegarder le brouillon',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Publish product
   */
  const handlePublish = async () => {
    // Validate required steps (1-4 are required, 5-6 are optional)
    let allValid = true;
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) {
        allValid = false;
      }
    }

    if (!allValid) {
      toast({
        title: '⚠️ Erreurs de validation',
        description: 'Veuillez corriger toutes les erreurs avant de publier',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const product = await savePhysicalProduct(false);
      
      toast({
        title: '🎉 Produit publié !',
        description: `"${product.name}" est maintenant en ligne${formData.affiliate?.enabled ? ' avec programme d\'affiliation activé' : ''}`,
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/products');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: '❌ Erreur de publication',
        description: error instanceof Error ? error.message : 'Impossible de publier le produit',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const CurrentStep = STEPS[currentStep - 1];
  const CurrentStepComponent = CurrentStep.component;
  const progress = (currentStep / STEPS.length) * 100;

  // Props for current step
  const getStepProps = () => {
    const baseProps = {
      data: formData,
      onUpdate: handleUpdateFormData,
    };

    switch (currentStep) {
      case 5: // Affiliation
        return {
          productPrice: formData.price || 0,
          productName: formData.name || 'Produit',
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
      
      default:
        return baseProps;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au choix du type
            </Button>
          )}
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Nouveau Produit Physique</h1>
              <p className="text-muted-foreground">
                Créez un produit physique professionnel en 7 étapes
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Étape {currentStep} sur {STEPS.length}</span>
              <span className="text-muted-foreground">{Math.round(progress)}% complété</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="grid grid-cols-7 gap-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const hasErrors = validationErrors[step.id]?.length > 0;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (step.id < currentStep || validateStep(currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-left
                    ${isActive ? 'border-primary bg-primary/5' : ''}
                    ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
                    ${!isActive && !isCompleted ? 'border-gray-200 hover:border-gray-300' : ''}
                    ${hasErrors ? 'border-red-500' : ''}
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`} />
                    {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-600 ml-auto" />}
                    {hasErrors && <AlertCircle className="h-3 w-3 text-red-600 ml-auto" />}
                  </div>
                  <div className="text-xs font-medium truncate">{step.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors[currentStep]?.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors[currentStep].map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Step */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {React.createElement(CurrentStep.icon, { className: 'h-5 w-5' })}
              {CurrentStep.title}
            </CardTitle>
            <CardDescription>
              {CurrentStep.description}
              {currentStep >= 5 && <Badge variant="outline" className="ml-2">Optionnel</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent {...getStepProps()} />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSaving}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder brouillon
            </Button>

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={isSaving}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={isSaving}>
                {isSaving ? 'Publication...' : 'Publier le produit'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

