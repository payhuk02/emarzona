import {
  resolveServiceCategorySelection,
  type ServiceCategoryTreeNode,
} from '@/lib/services/service-categories';
import {
  getServiceFormProfile,
  validateServiceFormAttributes,
} from '@/lib/services/service-form-profiles';
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
  category_attributes?: Record<string, string | number | boolean | string[]>;
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

export type ServiceWizardValidationOptions = {
  categoryTree?: ServiceCategoryTreeNode[];
};

export function validateServiceCategorySelection(
  formData: Pick<ServiceWizardFormFields, 'category_id' | 'parent_category_id'>,
  categoryTree?: ServiceCategoryTreeNode[]
): string[] {
  if (!categoryTree || categoryTree.length === 0) {
    return formData.category_id ? [] : ['La catégorie et la sous-catégorie sont requises'];
  }
  const resolved = resolveServiceCategorySelection(
    categoryTree,
    formData.parent_category_id,
    formData.category_id
  );
  return resolved.error ? [resolved.error] : [];
}

export function resolveServiceFormProfile(
  formData: Pick<ServiceWizardFormFields, 'category' | 'category_id' | 'parent_category_id'>,
  categoryTree?: ServiceCategoryTreeNode[]
) {
  if (categoryTree && categoryTree.length > 0) {
    const resolved = resolveServiceCategorySelection(
      categoryTree,
      formData.parent_category_id,
      formData.category_id
    );
    const fromIds = getServiceFormProfile(resolved.parent?.slug, resolved.leaf?.slug);
    if (fromIds) return fromIds;
  }
  return getServiceFormProfile(undefined, formData.category);
}

/** Appointment always needs slots. Project never. "both" follows the family profile. */
export function serviceWizardRequiresSlots(
  formData: Pick<
    ServiceWizardFormFields,
    'fulfillment_mode' | 'category' | 'category_id' | 'parent_category_id'
  >,
  categoryTree?: ServiceCategoryTreeNode[]
): boolean {
  if (formData.fulfillment_mode === 'project') return false;
  if (formData.fulfillment_mode === 'appointment') return true;
  const profile = resolveServiceFormProfile(formData, categoryTree);
  if (profile) return profile.requireSlots;
  return true;
}

export function validateServiceWizardStep(
  step: number,
  formData: ServiceWizardFormFields,
  options?: ServiceWizardValidationOptions
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

    errors.push(...validateServiceCategorySelection(formData, options?.categoryTree));
    errors.push(
      ...validateServiceFormAttributes(
        resolveServiceFormProfile(formData, options?.categoryTree),
        formData.category_attributes
      )
    );

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
    if (
      (!formData.availability_slots || formData.availability_slots.length === 0) &&
      serviceWizardRequiresSlots(formData, options?.categoryTree)
    ) {
      return {
        valid: false,
        errors: ['Ajoutez au moins un créneau de disponibilité pour permettre les réservations'],
        toastTitle: 'Créneaux requis',
        toastDescription:
          'Ajoutez au moins un créneau de disponibilité pour permettre les réservations',
      };
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateServiceWizardPublishSteps(
  formData: ServiceWizardFormFields,
  options?: ServiceWizardValidationOptions
): ServiceWizardStepValidationResult & { failedStep?: number } {
  for (const step of [1, 2] as const) {
    const result = validateServiceWizardStep(step, formData, options);
    if (!result.valid) {
      return { ...result, failedStep: step };
    }
  }
  return { valid: true, errors: [] };
}
