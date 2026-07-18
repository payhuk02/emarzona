import {
  getFieldError,
  validateWithZod,
  physicalProductStep1Schema,
} from '@/lib/wizard-validation';

export type PhysicalWizardFormFields = {
  name?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  price?: number;
  images?: unknown[];
  has_variants?: boolean;
  options?: unknown[];
  variants?: Array<{ quantity?: number }>;
  track_inventory?: boolean;
  sku?: string;
  quantity?: number;
  requires_shipping?: boolean;
  weight?: number | null;
};

export type PhysicalWizardStepValidationResult = {
  valid: boolean;
  errors: string[];
  toastTitle?: string;
  toastDescription?: string;
};

export function validatePhysicalWizardStep(
  step: number,
  formData: PhysicalWizardFormFields
): PhysicalWizardStepValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    const result = validateWithZod(physicalProductStep1Schema, {
      name: formData.name,
      slug: formData.slug?.trim() || undefined,
      short_description: formData.short_description?.trim() || undefined,
      description: formData.description?.trim() || undefined,
      price: formData.price,
    });

    if (!result.valid) {
      for (const field of ['name', 'price', 'slug', 'short_description', 'description'] as const) {
        const message = getFieldError(result.errors, field);
        if (message) errors.push(message);
      }
    }

    if (!formData.images || formData.images.length === 0) {
      errors.push('Au moins une image est requise');
    }
  }

  if (step === 2) {
    if (formData.has_variants) {
      if (!formData.options || formData.options.length === 0) {
        errors.push('Au moins une option de variante est requise');
      }
      if (!formData.variants || formData.variants.length === 0) {
        errors.push('Au moins une variante est requise');
      }
    }
  }

  if (step === 3) {
    if (formData.track_inventory !== false) {
      if (!formData.sku?.trim()) {
        errors.push('Le SKU est requis');
      }
      if (!formData.has_variants && (formData.quantity === undefined || formData.quantity < 0)) {
        errors.push('La quantité en stock est requise');
      }
      if (formData.has_variants && formData.variants?.some(v => (v.quantity ?? 0) < 0)) {
        errors.push('La quantité de chaque variante doit être valide');
      }
    }
  }

  if (step === 4) {
    if (formData.requires_shipping !== false) {
      if (!formData.weight || formData.weight <= 0) {
        errors.push('Le poids est requis pour les produits avec expédition');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validatePhysicalWizardPublishSteps(
  formData: PhysicalWizardFormFields
): PhysicalWizardStepValidationResult & { failedStep?: number } {
  for (const step of [1, 2, 3, 4] as const) {
    const result = validatePhysicalWizardStep(step, formData);
    if (!result.valid) {
      return {
        ...result,
        failedStep: step,
        toastTitle: 'Erreurs de validation',
        toastDescription: result.errors.join(', '),
      };
    }
  }
  return { valid: true, errors: [] };
}
