/**
 * Create Physical Product Wizard - Professional
 * Date: 27 octobre 2025
 * 
 * Wizard professionnel en 5 étapes pour produits physiques
 * Inspiré de: Shopify, WooCommerce, BigCommerce
 */

import React, { useState } from 'react';
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
    title: 'Aperçu & Validation',
    description: 'Vérifier et publier',
    icon: Eye,
    component: PhysicalPreview,
  },
];

export const CreatePhysicalProductWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PhysicalProductFormData>>({
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
  const handleUpdateFormData = (data: Partial<PhysicalProductFormData>) => {
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

    // 2. Create base product
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
        length: formData.length,
        width: formData.width,
        height: formData.height,
        dimension_unit: formData.dimension_unit || 'cm',
        requires_shipping: formData.requires_shipping !== false,
        is_fragile: formData.is_fragile || false,
        is_perishable: formData.is_perishable || false,
        customs_value: formData.customs_value,
        country_of_origin: formData.country_of_origin,
      });

    if (physicalError) throw physicalError;

    // 4. Create variants
    if (formData.variants && formData.variants.length > 0) {
      const variantsData = formData.variants.map(variant => ({
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
        quantity_available: formData.quantity_available || 0,
        quantity_reserved: 0,
        low_stock_threshold: formData.low_stock_threshold || 5,
        track_inventory: formData.track_inventory !== false,
      });

    if (inventoryError) throw inventoryError;

    // 6. Create shipping zones
    if (formData.shipping_zones && formData.shipping_zones.length > 0) {
      const zonesData = formData.shipping_zones.map(zone => ({
        physical_product_id: product.id,
        zone_name: zone.zone_name,
        countries: zone.countries,
        is_active: zone.is_active !== false,
      }));

      const { data: zones, error: zonesError } = await supabase
        .from('physical_product_shipping_zones')
        .insert(zonesData)
        .select();

      if (zonesError) throw zonesError;

      // 7. Create shipping rates for each zone
      if (formData.shipping_rates && zones) {
        const ratesData: any[] = [];
        zones.forEach((zone, zoneIndex) => {
          const zoneRates = formData.shipping_rates?.filter(
            (_, rateIndex) => rateIndex === zoneIndex
          );
          zoneRates?.forEach(rate => {
            ratesData.push({
              shipping_zone_id: zone.id,
              rate_name: rate.rate_name,
              price: rate.price,
              estimated_days_min: rate.estimated_days_min,
              estimated_days_max: rate.estimated_days_max,
              is_active: rate.is_active !== false,
            });
          });
        });

        if (ratesData.length > 0) {
          const { error: ratesError } = await supabase
            .from('physical_product_shipping_rates')
            .insert(ratesData);

          if (ratesError) throw ratesError;
        }
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
      
      navigate('/dashboard/products');
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
    // Validate all steps
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
        description: `"${product.name}" est maintenant en ligne et disponible à l'achat`,
      });
      
      navigate('/dashboard/products');
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

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Nouveau Produit Physique</h1>
              <p className="text-muted-foreground">
                Créez un produit physique en 5 étapes simples
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
          <div className="grid grid-cols-5 gap-2">
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
              {React.createElement(STEPS[currentStep - 1].icon, { className: 'h-5 w-5' })}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent
              data={formData}
              onUpdate={handleUpdateFormData}
            />
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
