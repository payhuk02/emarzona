import { getFieldError, validateWithZod, digitalProductSchema } from '@/lib/wizard-validation';

export type DigitalWizardFormFields = {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  pricing_model?: string;
  version?: string;
  main_file_url?: string;
  downloadable_files?: Array<{ url?: string }>;
  is_active?: boolean;
};

export type DigitalWizardStepValidationResult = {
  valid: boolean;
  errors: string[];
  toastTitle?: string;
  toastDescription?: string;
};

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export function validateDigitalWizardStep(
  step: number,
  formData: DigitalWizardFormFields
): DigitalWizardStepValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    const nameValue = (formData.name || '').trim();
    const pricingModel = formData.pricing_model || 'one-time';
    const priceValue =
      typeof formData.price === 'number' ? formData.price : parseFloat(String(formData.price)) || 0;

    if (!nameValue || nameValue.length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    if (pricingModel !== 'free' && (!priceValue || priceValue <= 0)) {
      errors.push('Le prix doit être supérieur à 0');
    }

    const validationData: Record<string, unknown> = { name: nameValue };
    if (pricingModel !== 'free') {
      validationData.price = priceValue;
    } else {
      validationData.price = 0;
    }
    if (formData.slug?.trim()) {
      validationData.slug = formData.slug.trim();
    }
    if (formData.description?.trim()) {
      validationData.description = stripHtml(formData.description);
    }
    if (formData.version?.trim()) {
      validationData.version = formData.version.trim();
    }

    const result = validateWithZod(digitalProductSchema, validationData);
    if (!result.valid) {
      for (const field of ['name', 'price', 'slug', 'description', 'version'] as const) {
        const message = getFieldError(result.errors, field);
        if (message) errors.push(message);
      }
    }
  }

  if (step === 2) {
    const hasMainFile = Boolean(formData.main_file_url?.trim());
    const hasDownloadableFiles = Boolean(
      formData.downloadable_files?.some(file => file.url?.trim())
    );
    if (!hasMainFile && !hasDownloadableFiles) {
      errors.push('Au moins un fichier est requis');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDigitalWizardPublishSteps(
  formData: DigitalWizardFormFields
): DigitalWizardStepValidationResult & { failedStep?: number } {
  for (const step of [1, 2] as const) {
    const result = validateDigitalWizardStep(step, formData);
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

export function validateDigitalWizardSaveSteps(
  formData: DigitalWizardFormFields
): DigitalWizardStepValidationResult & { failedStep?: number } {
  if (formData.is_active === false) {
    const result = validateDigitalWizardStep(1, formData);
    if (!result.valid) {
      return {
        ...result,
        failedStep: 1,
        toastTitle: 'Erreurs de validation',
        toastDescription: result.errors.join(', '),
      };
    }
    return result;
  }
  return validateDigitalWizardPublishSteps(formData);
}
