/**
 * Create Digital Product Wizard
 * Date: 27 octobre 2025
 * 
 * Wizard guidé en 4 étapes pour créer un produit digital
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/lib/store-utils';

// Steps components
import { DigitalBasicInfoForm } from './DigitalBasicInfoForm';
import { DigitalFilesUploader } from './DigitalFilesUploader';
import { DigitalLicenseConfig } from './DigitalLicenseConfig';
import { DigitalAffiliateSettings } from './DigitalAffiliateSettings';
import { DigitalPreview } from './DigitalPreview';

interface CreateDigitalProductWizardProps {
  storeId: string;
  storeSlug: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

interface DigitalProductData {
  // Basic info
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  image_url: string;
  
  // Pricing
  price: number;
  promotional_price?: number;
  currency: string;
  
  // Files
  main_file_url: string;
  downloadable_files: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  
  // License & Download
  license_type: 'single' | 'multi' | 'unlimited';
  download_limit: number;
  download_expiry_days: number;
  watermark_enabled: boolean;
  
  // Affiliate
  affiliate?: {
    enabled: boolean;
    commission_rate: number;
    commission_type: 'percentage' | 'fixed';
    fixed_commission_amount: number;
    cookie_duration_days: number;
    max_commission_per_sale?: number;
    min_order_amount: number;
    allow_self_referral: boolean;
    require_approval: boolean;
    terms_and_conditions: string;
  };
  
  // Metadata
  product_type: 'digital';
  is_active: boolean;
}

const STEPS = [
  { id: 1, name: 'Informations', description: 'Nom, description, prix' },
  { id: 2, name: 'Fichiers', description: 'Upload et gestion' },
  { id: 3, name: 'Configuration', description: 'Licensing et téléchargements' },
  { id: 4, name: 'Affiliation', description: 'Programme d\'affiliation (optionnel)' },
  { id: 5, name: 'Prévisualisation', description: 'Vérifier et publier' },
];

export const CreateDigitalProductWizard = ({
  storeId,
  storeSlug,
  onSuccess,
  onBack,
}: CreateDigitalProductWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Partial<DigitalProductData>>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category: 'ebook',
    image_url: '',
    price: 0,
    currency: 'XOF',
    main_file_url: '',
    downloadable_files: [],
    license_type: 'single',
    download_limit: 5,
    download_expiry_days: 30,
    watermark_enabled: false,
    product_type: 'digital',
    is_active: true,
  });

  const progress = (currentStep / STEPS.length) * 100;

  /**
   * Update form data
   */
  const updateFormData = (updates: Partial<DigitalProductData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
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
        return true;
      case 4:
        return true; // Affiliation is optional
      case 5:
        return true;
      default:
        return true;
    }
  };

  /**
   * Go to next step
   */
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  /**
   * Go to previous step
   */
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Submit and create product
   * ✅ Now saves to dedicated digital_products tables
   */
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      // Générer slug si pas déjà fait
      const slug = formData.slug || generateSlug(formData.name || '');

      // 1. Create base product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          store_id: storeId,
          name: formData.name,
          slug,
          description: formData.description,
          category: formData.category,
          product_type: 'digital',
          price: formData.price,
          promotional_price: formData.promotional_price,
          currency: formData.currency,
          image_url: formData.image_url,
          is_active: formData.is_active,
          is_draft: false,
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Create digital_product
      const { error: digitalError } = await supabase
        .from('digital_products')
        .insert({
          product_id: product.id,
          digital_type: 'other', // Can be configured based on product category
          file_access_type: formData.license_type === 'unlimited' ? 'unlimited' : 'limited',
          download_limit: formData.download_limit || null,
          download_expiry_days: formData.download_expiry_days || null,
          watermark_enabled: formData.watermark_enabled || false,
          requires_license: formData.license_type !== 'single',
          file_size_mb: 0, // Will be calculated from files
          total_downloads: 0,
        });

      if (digitalError) throw digitalError;

      // 3. Create digital_product_files for each file
      if (formData.downloadable_files && formData.downloadable_files.length > 0) {
        const filesData = formData.downloadable_files.map((file, index) => ({
          digital_product_id: product.id,
          file_name: file.name,
          file_url: file.url,
          file_size_bytes: file.size,
          file_type: file.type,
          file_extension: file.name.split('.').pop() || '',
          display_order: index + 1,
          is_preview: index === 0, // First file as preview
          requires_purchase: true,
        }));

        const { error: filesError } = await supabase
          .from('digital_product_files')
          .insert(filesData);

        if (filesError) throw filesError;
      }

      // 4. Create license if needed
      if (formData.license_type === 'multi' || formData.license_type === 'unlimited') {
        const maxActivations = formData.license_type === 'unlimited' ? null : formData.download_limit;
        
        const { error: licenseError } = await supabase
          .from('digital_licenses')
          .insert({
            digital_product_id: product.id,
            license_key: `DL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            license_type: formData.license_type,
            max_activations: maxActivations,
            expires_at: formData.download_expiry_days 
              ? new Date(Date.now() + formData.download_expiry_days * 24 * 60 * 60 * 1000).toISOString()
              : null,
            is_active: true,
          });

        if (licenseError) throw licenseError;
      }

      // 5. Create affiliate settings if enabled
      if (formData.affiliate && formData.affiliate.enabled) {
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
          // Don't throw, affiliate is optional
        }
      }

      toast({
        title: '🎉 Succès !',
        description: `Produit digital "${product.name}" créé avec succès${formData.affiliate?.enabled ? ' avec programme d\'affiliation activé' : ''}`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/${storeSlug}/products/${slug}`);
      }
    } catch (error: any) {
      console.error('Error creating digital product:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la création',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Render current step content
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
            data={formData.affiliate || {
              enabled: false,
              commission_rate: 20,
              commission_type: 'percentage',
              fixed_commission_amount: 0,
              cookie_duration_days: 30,
              min_order_amount: 0,
              allow_self_referral: false,
              require_approval: false,
              terms_and_conditions: '',
            }}
            onUpdate={(affiliateData) => updateFormData({ affiliate: affiliateData })}
          />
        );
      case 5:
        return (
          <DigitalPreview
            formData={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au choix du type
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Créer un produit digital</h1>
        <p className="text-muted-foreground">
          Suivez les étapes pour créer votre produit
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2 mb-4" />
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                step.id === currentStep
                  ? 'text-primary font-medium'
                  : step.id < currentStep
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                {step.id < currentStep ? (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      step.id === currentStep
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {step.id}
                  </div>
                )}
              </div>
              <div className="text-sm font-medium">{step.name}</div>
              <div className="text-xs text-muted-foreground hidden md:block">
                {step.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext} disabled={isSubmitting}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Publier le produit
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};


