/**
 * Create Service Wizard - Professional
 * Date: 28 octobre 2025
 * 
 * Wizard professionnel en 5 étapes pour services
 * Inspiré de: Calendly, Acuity Scheduling, Square Appointments
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Info,
  Clock,
  Users,
  DollarSign,
  Eye,
  ArrowLeft,
  ArrowRight,
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ServiceBasicInfoForm } from './ServiceBasicInfoForm';
import { ServiceDurationAvailabilityForm } from './ServiceDurationAvailabilityForm';
import { ServiceStaffResourcesForm } from './ServiceStaffResourcesForm';
import { logger } from '@/lib/logger';
import { ServicePricingOptionsForm } from './ServicePricingOptionsForm';
import { ServicePreview } from './ServicePreview';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import type { ServiceProductFormData } from '@/types/service-product';

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
    title: 'Aperçu & Validation',
    description: 'Vérifier et publier',
    icon: Eye,
    component: ServicePreview,
  },
];

export const CreateServiceWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ServiceProductFormData>>({
    // Basic Info (Step 1)
    name: '',
    description: '',
    price: 0,
    category_id: null,
    tags: [],
    images: [],
    
    // Duration & Availability (Step 2)
    service_type: 'appointment',
    duration_minutes: 60,
    location_type: 'on_site',
    availability_slots: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Staff & Resources (Step 3)
    requires_staff: true,
    staff_members: [],
    max_participants: 1,
    resources_needed: [],
    
    // Pricing & Options (Step 4)
    pricing_type: 'fixed',
    deposit_required: false,
    booking_options: {
      allow_booking_cancellation: true,
      cancellation_deadline_hours: 24,
      require_approval: false,
      buffer_time_before: 0,
      buffer_time_after: 0,
      advance_booking_days: 30,
    },
    
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
        if (!formData.service_type) errors.push('Le type de service est requis');
        break;

      case 2:
        if (!formData.duration_minutes || formData.duration_minutes <= 0) {
          errors.push('La durée doit être supérieure à 0');
        }
        if (!formData.location_type) {
          errors.push('Le type de localisation est requis');
        }
        if (formData.location_type === 'online' && !formData.meeting_url) {
          errors.push('L\'URL de réunion est requise pour les services en ligne');
        }
        if (!formData.availability_slots || formData.availability_slots.length === 0) {
          errors.push('Au moins un créneau de disponibilité est requis');
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
        if (!formData.pricing_type) {
          errors.push('Le type de tarification est requis');
        }
        if (formData.deposit_required && !formData.deposit_amount) {
          errors.push('Le montant de l\'acompte est requis');
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
  const handleUpdateFormData = (data: Partial<ServiceProductFormData>) => {
    setFormData({ ...formData, ...data });
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

    // 2. Create base product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        store_id: store.id,
        name: formData.name,
        slug,
        description: formData.description,
        price: formData.base_price || 0,
        currency: 'XOF',
        product_type: 'service',
        category_id: formData.category_id,
        image_url: formData.images?.[0] || null,
        images: formData.images || [],
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
      const staffData = formData.staff_members.map(member => ({
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
      const slotsData = formData.availability_slots.map(slot => ({
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
      const resourcesData = formData.resources.map(resource => ({
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
      
      navigate('/dashboard/products');
    } catch (error) {
      logger.error('Save draft error', { error });
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
      const product = await saveServiceProduct(false);
      
      toast({
        title: '🎉 Service publié !',
        description: `"${product.name}" est maintenant disponible à la réservation`,
      });
      
      navigate('/dashboard/products');
    } catch (error) {
      logger.error('Publish error', { error });
      toast({
        title: '❌ Erreur de publication',
        description: error instanceof Error ? error.message : 'Impossible de publier le service',
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
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Nouveau Service</h1>
              <p className="text-muted-foreground">
                Créez un service réservable en 5 étapes simples
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
                {isSaving ? 'Publication...' : 'Publier le service'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
