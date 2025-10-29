/**
 * Create Service Wizard - PROFESSIONAL V2
 * Date: 28 octobre 2025
 * 
 * Wizard professionnel en 8 étapes pour services
 * Avec Affiliation + SEO/FAQs + Payment Options intégrés
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
  Calendar,
  Info,
  Clock,
  Users,
  DollarSign,
  Share2,
  Search,
  Eye,
  ArrowLeft,
  ArrowRight,
  Save,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { ServiceBasicInfoForm } from './ServiceBasicInfoForm';
import { ServiceDurationAvailabilityForm } from './ServiceDurationAvailabilityForm';
import { ServiceStaffResourcesForm } from './ServiceStaffResourcesForm';
import { ServicePricingOptionsForm } from './ServicePricingOptionsForm';
import { ServiceAffiliateSettings } from './ServiceAffiliateSettings';
import { ServiceSEOAndFAQs } from './ServiceSEOAndFAQs';
import { ServicePreview } from './ServicePreview';
import { PaymentOptionsForm } from '../shared/PaymentOptionsForm';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import type { ServiceProductFormData } from '@/types/service-product';

// Template system
import { TemplateSelector } from '@/components/templates/TemplateSelector';
import { useTemplateApplier } from '@/hooks/useTemplateApplier';
import type { ProductTemplate } from '@/types/templates';

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

interface CreateServiceWizardProps {
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export const CreateServiceWizard = ({
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: CreateServiceWizardProps = {}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore; // Use hook store (props not needed with useStore)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Template system
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const { applyTemplate } = useTemplateApplier();
  
  const [formData, setFormData] = useState<Partial<any>>({
    // Basic Info (Step 1)
    name: '',
    description: '',
    price: 0,
    category_id: null,
    tags: [],
    images: [],
    service_type: 'appointment',
    
    // Duration & Availability (Step 2)
    duration: 60,
    location_type: 'on_site',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    availability_slots: [],
    
    // Staff & Resources (Step 3)
    requires_staff: true,
    max_participants: 1,
    staff_members: [],
    resources: [],
    
    // Pricing & Options (Step 4)
    pricing_type: 'fixed',
    deposit_required: false,
    allow_booking_cancellation: true,
    cancellation_deadline_hours: 24,
    require_approval: false,
    buffer_time_before: 0,
    buffer_time_after: 0,
    advance_booking_days: 30,
    
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
    
    // Payment Options (Step 7 - NOUVEAU)
    payment: {
      payment_type: 'full', // 'full' | 'percentage' | 'delivery_secured'
      percentage_rate: 30, // Pour paiement partiel (10-90%)
    },
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
        if (!formData.name?.trim()) errors.push('Le nom du service est requis');
        if (!formData.description?.trim()) errors.push('La description est requise');
        if (!formData.price || formData.price <= 0) errors.push('Le prix doit être supérieur à 0');
        break;

      case 2:
        if (!formData.duration || formData.duration <= 0) {
          errors.push('La durée du service est requise');
        }
        if (formData.location_type === 'on_site' && !formData.location_address?.trim()) {
          errors.push('L\'adresse est requise pour les services sur site');
        }
        if (formData.location_type === 'online' && !formData.meeting_url?.trim()) {
          errors.push('L\'URL de réunion est requise pour les services en ligne');
        }
        break;

      case 3:
        if (formData.requires_staff && (!formData.staff_members || formData.staff_members.length === 0)) {
          errors.push('Au moins un membre du personnel est requis');
        }
        if (!formData.max_participants || formData.max_participants < 1) {
          errors.push('Le nombre maximum de participants doit être au moins 1');
        }
        break;

      case 4:
        if (formData.deposit_required) {
          if (!formData.deposit_amount || formData.deposit_amount <= 0) {
            errors.push('Le montant de l\'acompte est requis');
          }
        }
        break;

      case 5:
        // Affiliation est optionnelle
        break;

      case 6:
        // SEO & FAQs sont optionnels
        break;

      case 7:
        // Payment Options sont optionnelles
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

  const handleBack = () => {
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
        description: `Le template "${template.name}" a été appliqué avec succès. Personnalisez maintenant votre service.`,
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
   * Helper function to save service product
   */
  const saveServiceProduct = async (isDraft: boolean) => {
    if (!store) {
      throw new Error('Aucune boutique trouvée');
    }

    // 1. Generate slug from name
    const slug = formData.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'service';

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
        product_type: 'service',
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
        // Payment Options (NOUVEAU)
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

    // 3. Create service_product
    const { error: serviceError } = await supabase
      .from('service_products')
      .insert({
        product_id: product.id,
        service_type: formData.service_type || 'appointment',
        duration_minutes: formData.duration || 60,
        location_type: formData.location_type || 'on_site',
        location_address: formData.location_address,
        meeting_url: formData.meeting_url,
        timezone: formData.timezone || 'UTC',
        requires_staff: formData.requires_staff !== false,
        max_participants: formData.max_participants || 1,
        pricing_type: formData.pricing_type || 'fixed',
        deposit_required: formData.deposit_required || false,
        deposit_amount: formData.deposit_amount,
        deposit_type: formData.deposit_type,
        allow_booking_cancellation: formData.allow_booking_cancellation !== false,
        cancellation_deadline_hours: formData.cancellation_deadline_hours || 24,
        require_approval: formData.require_approval || false,
        buffer_time_before: formData.buffer_time_before || 0,
        buffer_time_after: formData.buffer_time_after || 0,
        max_bookings_per_day: formData.max_bookings_per_day,
        advance_booking_days: formData.advance_booking_days || 30,
      });

    if (serviceError) throw serviceError;

    // 4. Create staff members
    if (formData.staff_members && formData.staff_members.length > 0) {
      const staffData = formData.staff_members.map((member: any) => ({
        service_id: product.id,
        name: member.name,
        role: member.role,
        bio: member.bio,
        email: member.email,
        phone: member.phone,
        avatar_url: member.avatar_url,
        is_active: member.is_active !== false,
      }));

      const { error: staffError } = await supabase
        .from('service_staff_members')
        .insert(staffData);

      if (staffError) throw staffError;
    }

    // 5. Create availability slots
    if (formData.availability_slots && formData.availability_slots.length > 0) {
      const slotsData = formData.availability_slots.map((slot: any) => ({
        service_id: product.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available !== false,
        max_bookings_per_slot: slot.max_bookings_per_slot,
      }));

      const { error: slotsError } = await supabase
        .from('service_availability_slots')
        .insert(slotsData);

      if (slotsError) throw slotsError;
    }

    // 6. Create resources
    if (formData.resources && formData.resources.length > 0) {
      const resourcesData = formData.resources.map((resource: any) => ({
        service_id: product.id,
        name: resource.name,
        type: resource.type,
        quantity_available: resource.quantity_available,
        location: resource.location,
      }));

      const { error: resourcesError } = await supabase
        .from('service_resources')
        .insert(resourcesData);

      if (resourcesError) throw resourcesError;
    }

    // 7. Create affiliate settings if enabled (NOUVEAU)
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
      const product = await saveServiceProduct(true);
      
      toast({
        title: '✅ Brouillon sauvegardé',
        description: `Service "${product.name}" enregistré. Vous pouvez continuer plus tard.`,
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
   * Publish service
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
      const product = await saveServiceProduct(false);
      
      toast({
        title: '🎉 Service publié !',
        description: `"${product.name}" est maintenant disponible à la réservation${formData.affiliate?.enabled ? ' avec programme d\'affiliation activé' : ''}`,
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
        description: error instanceof Error ? error.message : 'Impossible de publier le service',
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
          productName: formData.name || 'Service',
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
          productType: 'service' as const,
          data: formData.payment || {},
          onUpdate: (paymentData: any) => handleUpdateFormData({ payment: paymentData }),
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
          
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Nouveau Service</h1>
                <p className="text-muted-foreground">
                  Créez un service professionnel en 8 étapes
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
              <span className="text-muted-foreground">{Math.round(progress)}% complété</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="grid grid-cols-8 gap-2">
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
              {currentStep >= 5 && currentStep <= 7 && <Badge variant="outline" className="ml-2">Optionnel</Badge>}
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
                onClick={handleBack}
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
                {isSaving ? 'Publication...' : 'Publier le service'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Template Selector Dialog */}
      <TemplateSelector
        productType="service"
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

