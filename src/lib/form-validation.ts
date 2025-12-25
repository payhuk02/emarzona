/**
 * Utilitaires de validation de formulaires améliorés
 * Validation côté client robuste avec messages d'erreur clairs
 */

import { z } from 'zod';

/**
 * Messages d'erreur en français
 */
export const validationMessages = {
  required: (field: string) => `${field} est requis`,
  email: (field: string) => `${field} doit être une adresse email valide`,
  minLength: (field: string, min: number) => `${field} doit contenir au moins ${min} caractères`,
  maxLength: (field: string, max: number) => `${field} doit contenir au plus ${max} caractères`,
  min: (field: string, min: number) => `${field} doit être supérieur ou égal à ${min}`,
  max: (field: string, max: number) => `${field} doit être inférieur ou égal à ${max}`,
  pattern: (field: string) => `${field} n'est pas au bon format`,
  url: (field: string) => `${field} doit être une URL valide`,
  phone: (field: string) => `${field} doit être un numéro de téléphone valide`,
  positive: (field: string) => `${field} doit être positif`,
  integer: (field: string) => `${field} doit être un nombre entier`,
  decimal: (field: string, decimals: number) => `${field} doit avoir au plus ${decimals} décimales`,
};

/**
 * Schémas de validation réutilisables
 */
export const commonSchemas = {
  /**
   * Validation d'email
   */
  email: z.string().email({
    message: validationMessages.email('L\'email'),
  }),

  /**
   * Validation de téléphone (format international)
   */
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
    message: validationMessages.phone('Le téléphone'),
  }),

  /**
   * Validation d'URL
   */
  url: z.string().url({
    message: validationMessages.url('L\'URL'),
  }),

  /**
   * Validation de nom (lettres, espaces, tirets, apostrophes)
   */
  name: z.string().min(2, {
    message: validationMessages.minLength('Le nom', 2),
  }).max(100, {
    message: validationMessages.maxLength('Le nom', 100),
  }).regex(/^[a-zA-ZàâäéèêëïîôùûüÿñçÀÂÄÉÈÊËÏÎÔÙÛÜŸÑÇ\s'-]+$/, {
    message: 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes',
  }),

  /**
   * Validation de prix (positif, max 2 décimales)
   */
  price: z.number().positive({
    message: validationMessages.positive('Le prix'),
  }).max(999999999.99, {
    message: validationMessages.max('Le prix', 999999999.99),
  }).refine((val) => {
    const decimals = val.toString().split('.')[1];
    return !decimals || decimals.length <= 2;
  }, {
    message: validationMessages.decimal('Le prix', 2),
  }),

  /**
   * Validation de quantité (entier positif)
   */
  quantity: z.number().int({
    message: validationMessages.integer('La quantité'),
  }).min(1, {
    message: validationMessages.min('La quantité', 1),
  }),

  /**
   * Validation de slug (minuscules, tirets, chiffres)
   */
  slug: z.string().min(2, {
    message: validationMessages.minLength('Le slug', 2),
  }).max(100, {
    message: validationMessages.maxLength('Le slug', 100),
  }).regex(/^[a-z0-9-]+$/, {
    message: 'Le slug ne peut contenir que des minuscules, chiffres et tirets',
  }),

  /**
   * Validation de mot de passe (min 8 caractères, au moins une majuscule, une minuscule, un chiffre)
   */
  password: z.string().min(8, {
    message: validationMessages.minLength('Le mot de passe', 8),
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  }),

  /**
   * Validation de code postal
   */
  postalCode: z.string().regex(/^\d{5}$/, {
    message: 'Le code postal doit contenir 5 chiffres',
  }),

  /**
   * Validation de code pays (ISO 3166-1 alpha-2)
   */
  countryCode: z.string().length(2, {
    message: 'Le code pays doit contenir 2 caractères',
  }).regex(/^[A-Z]{2}$/, {
    message: 'Le code pays doit être en majuscules (ex: FR, US)',
  }),
};

/**
 * Fonction helper pour valider un formulaire
 */
export function validateForm<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _global: 'Une erreur de validation est survenue' } };
  }
}

/**
 * Fonction helper pour valider un champ individuel
 */
export function validateField<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  try {
    const result = schema.parse(value);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation échouée' };
    }
    return { success: false, error: 'Une erreur de validation est survenue' };
  }
}

/**
 * Fonction helper pour valider un formulaire de façon asynchrone (avec validation serveur)
 */
export async function validateFormAsync<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  serverValidation?: (data: z.infer<T>) => Promise<{ success: boolean; errors?: Record<string, string> }>
): Promise<{ success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> }> {
  // Validation côté client
  const clientValidation = validateForm(schema, data);
  if (!clientValidation.success) {
    return clientValidation;
  }

  // Validation côté serveur si fournie
  if (serverValidation) {
    try {
      const serverResult = await serverValidation(clientValidation.data);
      if (!serverResult.success) {
        return { success: false, errors: serverResult.errors || {} };
      }
    } catch (error) {
      return {
        success: false,
        errors: { _global: 'Une erreur est survenue lors de la validation serveur' },
      };
    }
  }

  return clientValidation;
}

/**
 * Fonction helper pour formater les erreurs de validation pour l'affichage
 */
export function formatValidationErrors(
  errors: Record<string, string>
): { field: string; message: string }[] {
  return Object.entries(errors).map(([field, message]) => ({
    field,
    message,
  }));
}

/**
 * Fonction helper pour obtenir le message d'erreur d'un champ
 */
export function getFieldError(
  errors: Record<string, string>,
  field: string
): string | undefined {
  return errors[field];
}

/**
 * Fonction helper pour vérifier si un formulaire a des erreurs
 */
export function hasFormErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Fonction helper pour nettoyer les erreurs d'un formulaire
 */
export function clearFormErrors(
  errors: Record<string, string>,
  fields?: string[]
): Record<string, string> {
  if (fields) {
    const cleaned = { ...errors };
    fields.forEach((field) => {
      delete cleaned[field];
    });
    return cleaned;
  }
  return {};
}




