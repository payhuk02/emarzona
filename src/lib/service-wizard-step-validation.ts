import { getFieldError, validateWithZod, serviceSchema } from '@/lib/wizard-validation';

export type ServiceWizardFormFields = {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  duration?: number;
  duration_minutes?: number;
  max_participants?: number;
  meeting_url?: string;
  location_address?: string;
  location_type?: string;
  availability_slots?: unknown[];
  category_id?: string | null;
  category?: string;
  parent_category_id?: string | null;
  fulfillment_mode?: 'appointment' | 'project' | 'both';
  promotional_price?: number;
  pricing_model?: string;
};

export type ServiceWizardStepValidationResult = {
  valid: boolean;
  errors: string[];
  toastTitle?: string;
  toastDescription?: string;
};

export function validateServiceWizardStep(
  step: number,
  formData: ServiceWizardFormFields
): ServiceWizardStepValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    const effectiveDuration = formData.duration_minutes ?? formData.duration;
    const result = validateWithZod(serviceSchema, {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      price: formData.price,
      duration: effectiveDuration,
      max_participants: formData.max_participants,
      meeting_url: formData.meeting_url,
      location_address: formData.location_address,
    });

    if (!result.valid) {
      for (const field of [
        'name',
        'price',
        'description',
        'duration',
        'max_participants',
        'meeting_url',
      ] as const) {
        const message = getFieldError(result.errors, field);
        if (message) errors.push(message);
      }
    }

    if (!formData.category_id) {
      errors.push('La catégorie et la sous-catégorie sont requises');
    }

    if (formData.pricing_model !== 'free') {
      const promo = Number(formData.promotional_price);
      const price = Number(formData.price);
      if (!promo || promo <= 0) {
        errors.push('Le prix promotionnel est requis : c’est le prix facturé au client');
      } else if (price > 0 && promo >= price) {
        errors.push('Le prix promotionnel doit être inférieur au prix de référence');
      }
    }
  }

  if (step === 2) {
    const effectiveDuration = formData.duration_minutes ?? formData.duration;
    if (!effectiveDuration || effectiveDuration <= 0) {
      errors.push('La durée du service est requise');
    }
    if (formData.location_type === 'on_site' && !formData.location_address?.trim()) {
      errors.push("L'adresse est requise pour les services sur site");
    }
    if (formData.location_type === 'online' && !formData.meeting_url?.trim()) {
      errors.push("L'URL de réunion est requise pour les services en ligne");
    }
    if (!formData.availability_slots || formData.availability_slots.length === 0) {
      const mode = formData.fulfillment_mode;
      if (mode === 'project') {
        // Project-only services do not require appointment slots
      } else {
        return {
          valid: false,
          errors: ['Ajoutez au moins un créneau de disponibilité pour permettre les réservations'],
          toastTitle: 'Créneaux requis',
          toastDescription:
            'Ajoutez au moins un créneau de disponibilité pour permettre les réservations',
        };
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateServiceWizardPublishSteps(
  formData: ServiceWizardFormFields
): ServiceWizardStepValidationResult & { failedStep?: number } {
  for (const step of [1, 2] as const) {
    const result = validateServiceWizardStep(step, formData);
    if (!result.valid) {
      return { ...result, failedStep: step };
    }
  }
  return { valid: true, errors: [] };
}
