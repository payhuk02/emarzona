/**
 * Edit Generic Product Wizard
 * Date: 2025-01-26
 *
 * Wizard professionnel pour l'édition de produits génériques
 * (produits sans type spécifique ou avec type non supporté)
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Info,
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
import { ProductSEOForm } from '../create/shared/ProductSEOForm';
import { ProductFAQForm } from '../create/shared/ProductFAQForm';
import { PaymentOptionsForm } from '../create/shared/PaymentOptionsForm';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Switch } from '@/components/ui/switch';
import { generateSlug } from '@/lib/store-utils';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import { useIsMobile } from '@/hooks/use-mobile';

const STEPS = [
  {
    id: 1,
    title: 'Informations de base',
    description: 'Nom, description, prix, images',
    icon: Info,
  },
  {
    id: 2,
    title: 'SEO & FAQs',
    description: 'Référencement et questions',
    icon: Search,
  },
  {
    id: 3,
    title: 'Options de Paiement',
    description: 'Complet, partiel, escrow',
    icon: CreditCard,
  },
  {
    id: 4,
    title: 'Aperçu & Validation',
    description: 'Vérifier et publier',
    icon: Eye,
  },
];

interface EditGenericProductWizardProps {
  productId: string;
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

interface GenericProductFormData {
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  currency: string;
  image_url?: string;
  category?: string;
  is_active: boolean;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
  };
  faqs?: Array<{
    id: string;
    question: string;
    answer: string;
    order: number;
  }>;
  payment?: {
    payment_type: 'full' | 'percentage' | 'delivery_secured';
    percentage_rate?: number;
  };
}

/**
 * Convert product from DB to form data
 */
const convertToFormData = async (productId: string): Promise<Partial<GenericProductFormData>> => {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) throw error;

  // Parse JSON fields
  const seo =
    product.meta_title || product.meta_description
      ? {
          meta_title: product.meta_title || '',
          meta_description: product.meta_description || '',
          meta_keywords: '',
          og_title: product.og_image ? product.name : '',
          og_description: product.meta_description || '',
          og_image: product.og_image || '',
        }
      : undefined;

  const faqs = product.faqs
    ? Array.isArray(product.faqs)
      ? product.faqs
      : JSON.parse(product.faqs as string)
    : [];

  const payment = product.payment_options
    ? typeof product.payment_options === 'string'
      ? JSON.parse(product.payment_options)
      : product.payment_options
    : { payment_type: 'full', percentage_rate: 30 };

  return {
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    short_description: product.short_description || '',
    price: product.price || 0,
    currency: product.currency || 'XOF',
    image_url: product.image_url || '',
    category: product.category || '',
    is_active: product.is_active ?? true,
    seo,
    faqs: faqs.map(
      (
        faq: {
          id?: string;
          question?: string;
          answer?: string;
          order?: number;
        },
        index: number
      ) => ({
        id: faq.id || `faq-${Date.now()}-${index}`,
        question: faq.question || '',
        answer: faq.answer || '',
        order: faq.order ?? index,
      })
    ),
    payment: {
      payment_type: payment.payment_type || 'full',
      percentage_rate: payment.percentage_rate ?? 30,
    },
  };
};

/**
 * Basic Info Form Component
 */
const GenericBasicInfoForm = ({
  formData,
  updateFormData,
  storeSlug,
}: {
  formData: GenericProductFormData;
  updateFormData: (updates: Partial<GenericProductFormData>) => void;
  storeSlug: string;
}) => {
  const [slugChecking, setSlugChecking] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const { toast } = useToast();

  const handleSlugChange = useCallback(
    (newSlug: string) => {
      updateFormData({ slug: newSlug });
    },
    [updateFormData]
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      setImageUploading(true);
      try {
        const url = await uploadToSupabaseStorage(file, `stores/${storeSlug}/products`);
        updateFormData({ image_url: url });
        toast({
          title: 'Image uploadée',
          description: "L'image a été uploadée avec succès",
        });
      } catch (error) {
        logger.error('Erreur upload image', { error });
        toast({
          title: 'Erreur',
          description: "Impossible d'uploader l'image",
          variant: 'destructive',
        });
      } finally {
        setImageUploading(false);
      }
    },
    [storeSlug, updateFormData, toast]
  );

  const regenerateSlug = useCallback(() => {
    if (formData.name) {
      const newSlug = generateSlug(formData.name);
      handleSlugChange(newSlug);
    }
  }, [formData.name, handleSlugChange]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du produit <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Ex: Mon produit"
          value={formData.name || ''}
          onChange={e => updateFormData({ name: e.target.value })}
          required
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="slug">
            Slug (URL) <span className="text-destructive">*</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={regenerateSlug}
            disabled={!formData.name || slugChecking}
          >
            <Loader2 className={cn('h-4 w-4 mr-2', slugChecking && 'animate-spin')} />
            Régénérer
          </Button>
        </div>
        <Input
          id="slug"
          type="text"
          placeholder="mon-produit"
          value={formData.slug || ''}
          onChange={e => handleSlugChange(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground">
          URL: /stores/{storeSlug}/products/{formData.slug || 'slug'}
        </p>
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="short_description">Description courte</Label>
        <Textarea
          id="short_description"
          placeholder="Une description courte de votre produit..."
          value={formData.short_description || ''}
          onChange={e => updateFormData({ short_description: e.target.value })}
          rows={3}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description complète</Label>
        <RichTextEditorPro
          value={formData.description || ''}
          onChange={value => updateFormData({ description: value })}
          placeholder="Décrivez votre produit en détail..."
        />
      </div>

      {/* Price & Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">
            Prix <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.price || 0}
            onChange={e => updateFormData({ price: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <CurrencySelect
            value={formData.currency || 'XOF'}
            onValueChange={value => updateFormData({ currency: value })}
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Input
          id="category"
          type="text"
          placeholder="Ex: Électronique, Mode, etc."
          value={formData.category || ''}
          onChange={e => updateFormData({ category: e.target.value })}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Image du produit</Label>
        <div className="flex flex-col sm:flex-row gap-4">
          {formData.image_url && (
            <div className="relative w-full sm:w-48 h-48 rounded-lg overflow-hidden border">
              <img
                src={formData.image_url}
                alt={formData.name || 'Produit'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              disabled={imageUploading}
            />
            {imageUploading && (
              <p className="text-sm text-muted-foreground mt-2">Upload en cours...</p>
            )}
          </div>
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="is_active">Produit actif</Label>
          <p className="text-sm text-muted-foreground">
            Le produit sera visible dans votre boutique
          </p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={checked => updateFormData({ is_active: checked })}
        />
      </div>
    </div>
  );
};

/**
 * Preview Component
 */
const GenericPreview = ({ formData }: { formData: GenericProductFormData }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Nom</Label>
            <p className="font-semibold">{formData.name}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Slug</Label>
            <p className="font-mono text-sm">{formData.slug}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Prix</Label>
            <p className="font-semibold text-lg">
              {formData.price.toLocaleString()} {formData.currency}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Statut</Label>
            <Badge variant={formData.is_active ? 'default' : 'secondary'}>
              {formData.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {formData.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formData.description }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const EditGenericProductWizard = ({
  productId,
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: EditGenericProductWizardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store } = useStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const storeId = propsStoreId || store?.id || '';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<GenericProductFormData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await convertToFormData(productId);
        setFormData(data);
      } catch (error) {
        logger.error('Erreur chargement produit', { error });
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le produit',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, toast]);

  const updateFormData = useCallback(
    (updates: Partial<GenericProductFormData>) => {
      setFormData(prev => ({ ...prev, ...updates }));
      // Clear validation errors for current step
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[currentStep];
        return newErrors;
      });
    },
    [currentStep]
  );

  const handleNext = useCallback(() => {
    // Validate current step
    if (currentStep === 1) {
      const errors: string[] = [];
      if (!formData.name?.trim()) errors.push('Le nom est requis');
      if (!formData.slug?.trim()) errors.push('Le slug est requis');
      if (!formData.price || formData.price < 0) errors.push('Le prix doit être positif');

      if (errors.length > 0) {
        setValidationErrors(prev => ({ ...prev, [currentStep]: errors }));
        return;
      }
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, formData]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Prepare update data
      const updateData: {
        name?: string;
        slug?: string;
        description?: string;
        short_description?: string;
        price?: number;
        currency?: string;
        image_url?: string;
        category?: string;
        is_active?: boolean;
        meta_title?: string;
        meta_description?: string;
        og_image?: string;
        faqs?: string | null;
        payment_options?: string | null;
        updated_at: string;
      } = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description,
        price: formData.price,
        currency: formData.currency,
        image_url: formData.image_url,
        category: formData.category,
        is_active: formData.is_active,
        meta_title: formData.seo?.meta_title,
        meta_description: formData.seo?.meta_description,
        og_image: formData.seo?.og_image,
        faqs: formData.faqs ? JSON.stringify(formData.faqs) : null,
        payment_options: formData.payment ? JSON.stringify(formData.payment) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('products').update(updateData).eq('id', productId);

      if (error) throw error;

      logger.info('Produit générique mis à jour', { productId });
      toast({
        title: 'Succès',
        description: 'Le produit a été mis à jour avec succès',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/products');
      }
    } catch (error) {
      logger.error('Erreur sauvegarde produit', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le produit',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [formData, productId, toast, onSuccess, navigate]);

  const CurrentStep = STEPS[currentStep - 1];
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sm:p-6 lg:p-8 overflow-x-hidden w-full">
      <div className="w-full max-w-4xl mx-auto sm:px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Modifier le produit</h1>
              <p className="text-sm text-muted-foreground">
                Étape {currentStep} sur {STEPS.length}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Étape {currentStep} sur {STEPS.length} ({Math.round(progress)}%)
            </p>
          </CardContent>
        </Card>

        {/* Steps Navigator */}
        <Card className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div
              className={cn('grid gap-2 sm:gap-3', isMobile ? 'grid-cols-2' : 'grid-cols-4')}
              role="tablist"
              aria-label="Étapes du formulaire"
            >
              {STEPS.map(step => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepClick(step.id)}
                    disabled={step.id > currentStep}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                      'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring',
                      isActive && 'border-primary bg-primary/5',
                      isCompleted && 'border-green-500 bg-green-500/5',
                      step.id > currentStep && 'opacity-50 cursor-not-allowed'
                    )}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-full',
                        isActive && 'bg-primary text-primary-foreground',
                        isCompleted && 'bg-green-500 text-white',
                        !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p
                        className={cn(
                          'text-xs font-medium',
                          isActive && 'text-primary',
                          isCompleted && 'text-green-600'
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Validation Errors */}
        {validationErrors[currentStep] && validationErrors[currentStep].length > 0 && (
          <Alert variant="destructive">
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

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CurrentStep.icon className="h-5 w-5" />
              {CurrentStep.title}
            </CardTitle>
            <CardDescription>{CurrentStep.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <GenericBasicInfoForm
                formData={formData as GenericProductFormData}
                updateFormData={updateFormData}
                storeSlug={storeSlug || store?.slug || ''}
              />
            )}
            {currentStep === 2 && (
              <div className="space-y-6">
                <ProductSEOForm
                  productName={formData.name || ''}
                  productDescription={formData.description}
                  productPrice={formData.price}
                  data={formData.seo}
                  onUpdate={seo => updateFormData({ seo })}
                />
                <ProductFAQForm
                  data={formData.faqs || []}
                  onUpdate={faqs => updateFormData({ faqs })}
                />
              </div>
            )}
            {currentStep === 3 && (
              <PaymentOptionsForm
                productPrice={formData.price || 0}
                productType="generic"
                data={formData.payment}
                onUpdate={payment => updateFormData({ payment })}
              />
            )}
            {currentStep === 4 && <GenericPreview formData={formData as GenericProductFormData} />}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            )}
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext}>
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
