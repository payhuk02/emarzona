import {
  PRODUCT_DESCRIPTION_MAX_WORDS,
  PRODUCT_DESCRIPTION_WORD_LIMIT_MESSAGE,
} from '@/constants/product-description';
import { countPlainTextWords } from '@/lib/string-utils';

export type CourseWizardBasicFields = {
  title?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  level?: string;
  language?: string;
  category?: string;
  price?: number;
};

export type CourseWizardSectionLike = {
  lessons: unknown[];
};

export type CourseWizardStepValidationResult = {
  valid: boolean;
  fieldErrors: Record<string, string>;
  errors: string[];
  toastTitle?: string;
  toastDescription?: string;
};

export function validateCourseWizardStep(
  step: number,
  formData: CourseWizardBasicFields,
  sections: CourseWizardSectionLike[]
): CourseWizardStepValidationResult {
  const fieldErrors: Record<string, string> = {};
  const errors: string[] = [];

  if (step === 1) {
    if (!formData.title?.trim()) {
      fieldErrors.title = 'Le titre est requis';
      errors.push(fieldErrors.title);
    }
    if (!formData.slug?.trim()) {
      fieldErrors.slug = 'Le slug est requis';
      errors.push(fieldErrors.slug);
    }
    if (!formData.short_description?.trim()) {
      fieldErrors.short_description = 'La description courte est requise';
      errors.push(fieldErrors.short_description);
    }
    if (!formData.description?.trim()) {
      fieldErrors.description = 'La description est requise';
      errors.push(fieldErrors.description);
    } else if (countPlainTextWords(formData.description) > PRODUCT_DESCRIPTION_MAX_WORDS) {
      fieldErrors.description = PRODUCT_DESCRIPTION_WORD_LIMIT_MESSAGE;
      errors.push(fieldErrors.description);
    }
    if (!formData.level?.trim()) {
      fieldErrors.level = 'Le niveau est requis';
      errors.push(fieldErrors.level);
    }
    if (!formData.language?.trim()) {
      fieldErrors.language = 'La langue est requise';
      errors.push(fieldErrors.language);
    }
    if (!formData.category?.trim()) {
      fieldErrors.category = 'La catégorie est requise';
      errors.push(fieldErrors.category);
    }
    if (formData.price == null || formData.price <= 0) {
      fieldErrors.price = 'Le prix doit être supérieur à 0';
      errors.push(fieldErrors.price);
    }
  }

  if (step === 2) {
    if (sections.length === 0) {
      errors.push('Ajoutez au moins une section avec une leçon');
      return {
        valid: false,
        fieldErrors,
        errors,
        toastTitle: 'Curriculum vide',
        toastDescription: 'Ajoutez au moins une section avec une leçon',
      };
    }
    const hasLessons = sections.some(section => section.lessons.length > 0);
    if (!hasLessons) {
      errors.push('Ajoutez au moins une leçon dans une section');
      return {
        valid: false,
        fieldErrors,
        errors,
        toastTitle: 'Aucune leçon',
        toastDescription: 'Ajoutez au moins une leçon dans une section',
      };
    }
  }

  return {
    valid: errors.length === 0,
    fieldErrors,
    errors,
  };
}

export function validateCourseWizardPublishSteps(
  formData: CourseWizardBasicFields,
  sections: CourseWizardSectionLike[]
): CourseWizardStepValidationResult & { failedStep?: number } {
  for (const step of [1, 2] as const) {
    const result = validateCourseWizardStep(step, formData, sections);
    if (!result.valid) {
      return { ...result, failedStep: step };
    }
  }
  return { valid: true, fieldErrors: {}, errors: [] };
}
