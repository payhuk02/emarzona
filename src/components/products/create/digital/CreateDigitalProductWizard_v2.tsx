/**
 * Create Digital Product Wizard V2 - Professional
 * Date: 28 octobre 2025
 * 
 * Wizard 6 étapes avec SEO & FAQs intégrés
 * 100% Parité avec Courses
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/lib/store-utils';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Template system
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const { applyTemplate } = useTemplateApplier();

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
   * Update form data
   */
  const updateFormData = (updates: any) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  /**
   * Handle template selection
   */
  const handleTemplateSelect = (template: ProductTemplate) => {
    try {
      const updatedData = applyTemplate(template, formData, {
        mergeMode: 'smart', // Ne remplace que les champs vides
      });
      
      setFormData(updatedData);
      setShowTemplateSelector(false);
      
      toast({
        title: '✨ Template appliqué !',
        description: `Le template "${template.name}" a été appliqué avec succès. Personnalisez maintenant votre produit.`,
      });
      
      // Optionnel : passer à l'étape 1 si on n'y est pas déjà
      if (currentStep !== 1) {
        setCurrentStep(1);
      }
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'appliquer le template',
        variant: 'destructive',
      });
    }
  };

  /**
   * Validate current step
   */
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.price) {
          toast({
            title: 'Erreur',
            description: 'Veuillez remplir tous les champs obligatoires',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 2:
        if (!formData.main_file_url) {
          toast({
            title: 'Erreur',
            description: 'Veuillez uploader au moins un fichier principal',
            variant: 'destructive',
          });
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
  };

  /**
   * Navigation
   */
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  /**
   * Save product to database
   */
  const saveProduct = async (isDraft: boolean) => {
    try {
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
          console.error('Affiliate settings error:', affiliateError);
        }
      }

      return product;
    } catch (error) {
      console.error('Save product error:', error);
      throw error;
    }
  };

  /**
   * Handle submit (publish)
   */
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      const product = await saveProduct(false);

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
      console.error('Publish error:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la publication',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle save draft
   */
  const handleSaveDraft = async () => {
    setIsSubmitting(true);

    try {
      const product = await saveProduct(true);

      toast({
        title: '✅ Brouillon sauvegardé',
        description: `Produit "${product.name}" enregistré. Vous pouvez continuer plus tard.`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/products');
      }
    } catch (error: any) {
      console.error('Save draft error:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder le brouillon',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Render step content
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <DigitalBasicInfoForm
            formData={formData}
            updateFormData={updateFormData}
            storeSlug={storeSlug}
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
          <div className="space-y-6">
            <Alert>
              <Search className="h-4 w-4" />
              <AlertDescription>
                Optimisez votre référencement et ajoutez des réponses aux questions fréquentes
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
  };

  const progress = (currentStep / STEPS.length) * 100;

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

          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Nouveau Produit Digital</h1>
                <p className="text-muted-foreground">
                  Créez un produit digital professionnel en 6 étapes
                </p>
              </div>
            </div>
            
            {/* Template Button */}
            {currentStep === 1 && (
              <Button
                variant="outline"
                onClick={() => setShowTemplateSelector(true)}
                className="gap-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Utiliser un template</span>
                <Badge variant="secondary" className="ml-1">Nouveau</Badge>
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Étape {currentStep} sur {STEPS.length}</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Steps Navigator */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-6 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all text-left
                  ${isActive ? 'border-primary bg-primary/5' : ''}
                  ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
                  ${!isActive && !isCompleted ? 'border-border hover:border-primary/50' : ''}
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${isCompleted ? 'text-green-600' : isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {isCompleted && <Check className="h-3 w-3 text-green-600" />}
                </div>
                <div className="text-xs font-medium truncate">{step.title}</div>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < STEPS.length && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Sauvegarder brouillon
                </Button>
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {currentStep === STEPS.length && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Sauvegarder brouillon
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Publier le produit
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Template Selector Dialog */}
      <TemplateSelector
        productType="digital"
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

