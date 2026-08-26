import {
  resolveServiceCategorySelection,
  type ServiceCategoryTreeNode,
} from '@/lib/services/service-categories';
import {
  getServiceFormProfile,
  isServiceGigFamily,
  validateServiceFormAttributes,
} from '@/lib/services/service-form-profiles';
import {
  getFieldError,
  validateWithZod,
  serviceSchema,
  SERVICE_DURATION_MAX_MINUTES,
} from '@/lib/wizard-validation';
import {
  validateGigExtraDrafts,
  validateGigPackageDrafts,
  type ServiceGigExtraDraft,
  type ServiceGigPackageDraft,
} from '@/lib/services/service-gig-package-drafts';
import {
  validateBriefFieldDrafts,
  type ServiceBriefField,
} from '@/lib/services/service-delivery-commerce';

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
  requires_staff?: boolean;
  staff_members?: unknown[];
  deposit_required?: boolean;
  deposit_amount?: number;
  delivery_packages?: ServiceGigPackageDraft[];
  gig_extras?: ServiceGigExtraDraft[];
  brief_fields?: ServiceBriefField[];
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

function wizardFulfillmentContext(
  formData: Pick<
    ServiceWizardFormFields,
    'fulfillment_mode' | 'category' | 'category_id' | 'parent_category_id'
  >,
  categoryTree?: ServiceCategoryTreeNode[]
) {
  const profile = resolveServiceFormProfile(formData, categoryTree);
  return { profile, gig: isServiceGigFamily(profile) };
}

/** Gig families never need slots, even if the form still says appointment. */
export function serviceWizardRequiresSlots(
  formData: Pick<
    ServiceWizardFormFields,
    'fulfillment_mode' | 'category' | 'category_id' | 'parent_category_id'
  >,
  categoryTree?: ServiceCategoryTreeNode[]
): boolean {
  const { profile, gig } = wizardFulfillmentContext(formData, categoryTree);
  if (gig) return false;
  if (formData.fulfillment_mode === 'project') return false;
  if (formData.fulfillment_mode === 'appointment') return true;
  if (profile) return profile.requireSlots;
  return false;
}

/** Show the calendar UI (slots, buffers, booking window). Hidden for locked gigs. */
export function serviceWizardShowsCalendar(
  formData: Pick<
    ServiceWizardFormFields,
    'fulfillment_mode' | 'category' | 'category_id' | 'parent_category_id'
  >,
  categoryTree?: ServiceCategoryTreeNode[]
): boolean {
  const { gig } = wizardFulfillmentContext(formData, categoryTree);
  if (gig) return false;
  if (formData.fulfillment_mode === 'project') return false;
  if (formData.fulfillment_mode === 'appointment' || formData.fulfillment_mode === 'both') {
    return true;
  }
  return serviceWizardRequiresSlots(formData, categoryTree);
}

/** Public listing: never show an empty booking calendar. */
export function servicePublicShowsCalendar(
  formData: Pick<
    ServiceWizardFormFields,
    'fulfillment_mode' | 'category' | 'category_id' | 'parent_category_id'
  >,
  availabilitySlotCount: number,
  categoryTree?: ServiceCategoryTreeNode[]
): boolean {
  return serviceWizardShowsCalendar(formData, categoryTree) && availabilitySlotCount > 0;
}

export function resolvePersistedFulfillmentMode(
  formData: Pick<
    ServiceWizardFormFields,
    'fulfillment_mode' | 'category' | 'category_id' | 'parent_category_id'
  >,
  categoryTree?: ServiceCategoryTreeNode[]
): NonNullable<ServiceWizardFormFields['fulfillment_mode']> {
  const { gig } = wizardFulfillmentContext(formData, categoryTree);
  if (gig) return 'project';
  return formData.fulfillment_mode || 'appointment';
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
    } else if (effectiveDuration > SERVICE_DURATION_MAX_MINUTES) {
      errors.push('La durée ou le délai de livraison ne peut pas dépasser 90 jours');
    }
    if (formData.location_type === 'on_site' && !formData.location_address?.trim()) {
      errors.push("L'adresse est requise pour les services sur site");
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

  if (step === 3) {
    const gigFamily = isServiceGigFamily(
      resolveServiceFormProfile(formData, options?.categoryTree)
    );
    if (
      !gigFamily &&
      formData.requires_staff &&
      (!formData.staff_members || formData.staff_members.length === 0)
    ) {
      errors.push('Au moins un membre du personnel est requis');
    } else if (!gigFamily && formData.requires_staff && formData.staff_members) {
      const invalidStaff = formData.staff_members.some(member => {
        if (!member || typeof member !== 'object') return true;
        const row = member as { name?: unknown; email?: unknown };
        const name = typeof row.name === 'string' ? row.name.trim() : '';
        const email = typeof row.email === 'string' ? row.email.trim() : '';
        return !name || !email.includes('@');
      });
      if (invalidStaff) {
        errors.push('Chaque membre du personnel doit avoir un nom et un e-mail valides');
      }
    }
    if (!gigFamily && (!formData.max_participants || formData.max_participants < 1)) {
      errors.push('Le nombre maximum de participants doit être au moins 1');
    }
  }

  if (step === 4) {
    if (formData.deposit_required) {
      if (!formData.deposit_amount || formData.deposit_amount <= 0) {
        errors.push("Le montant de l'acompte est requis");
      }
    }
    const persistMode = resolvePersistedFulfillmentMode(formData, options?.categoryTree);
    if (persistMode === 'project' || persistMode === 'both') {
      errors.push(...validateGigPackageDrafts(formData.delivery_packages));
      errors.push(...validateGigExtraDrafts(formData.gig_extras));
      errors.push(...validateBriefFieldDrafts(formData.brief_fields));
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
  for (const step of [1, 2, 3, 4] as const) {
    const result = validateServiceWizardStep(step, formData, options);
    if (!result.valid) {
      return { ...result, failedStep: step };
    }
  }
  return { valid: true, errors: [] };
}
