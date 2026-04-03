/**
 * Wizard Validation Utilities
 * Date: 28 Janvier 2025
 *
 * Utilitaires de validation pour les wizards de création de produits
 * Support validation synchrone, asynchrone et temps réel
 */

import { z } from 'zod';
import { validateSlug, validateEmail, validatePhone, validateURL } from './validation-utils';
import { logger } from './logger';

/**
 * Types d'erreurs de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'async' | 'custom';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Schémas Zod pour les wizards
 */

// Schéma Digital Product
export const digitalProductSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  slug: z
    .string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format de slug invalide')
    .optional()
    .or(z.literal('')),

  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),

  price: z
    .number()
    .min(0, 'Le prix ne peut pas être négatif')
    .max(1000000, 'Le prix ne peut pas dépasser 1,000,000')
    .refine(val => {
      const decimals = val.toString().split('.')[1];
      return !decimals || decimals.length <= 2;
    }, 'Le prix ne peut avoir que 2 décimales maximum'),

  version: z
    .string()
    .regex(
      /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9]+)?$/,
      'Format de version invalide (ex: 1.0.0 ou 1.0.0-beta)'
    )
    .optional()
    .or(z.literal('')),

  main_file_url: z.string().url('URL de fichier invalide').optional().or(z.literal('')),

  preview_url: z.string().url('URL de prévisualisation invalide').optional().or(z.literal('')),

  demo_url: z.string().url('URL de démo invalide').optional().or(z.literal('')),
});

// Schéma Physical Product
export const physicalProductSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  slug: z
    .string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format de slug invalide')
    .optional(),

  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),

  price: z
    .number()
    .positive('Le prix doit être positif')
    .max(1000000, 'Le prix ne peut pas dépasser 1,000,000'),

  sku: z
    .union([
      z
        .string()
        .min(3, 'Le SKU doit contenir au moins 3 caractères')
        .max(50, 'Le SKU ne peut pas dépasser 50 caractères')
        .regex(
          /^[A-Z0-9-_]+$/,
          'Format de SKU invalide (majuscules, chiffres, tirets, underscores)'
        ),
      z.literal(''),
      z.undefined(),
    ])
    .optional(),

  weight: z
    .number()
    .positive('Le poids doit être positif')
    .max(1000, 'Le poids ne peut pas dépasser 1000 kg')
    .optional(),

  quantity: z
    .number()
    .int('La quantité doit être un nombre entier')
    .min(0, 'La quantité ne peut pas être négative')
    .optional(),
});

// Schéma pour l'étape 1 uniquement (Informations de base)
export const physicalProductStep1Schema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  slug: z
    .union([
      z
        .string()
        .min(3, 'Le slug doit contenir au moins 3 caractères')
        .max(50, 'Le slug ne peut pas dépasser 50 caractères')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format de slug invalide'),
      z.literal(''),
      z.undefined(),
    ])
    .optional(),

  short_description: z
    .union([
      z.string().max(160, 'La description courte ne peut pas dépasser 160 caractères'),
      z.literal(''),
      z.undefined(),
    ])
    .optional(),

  description: z
    .union([
      z.string().max(2000, 'La description ne peut pas dépasser 2000 caractères'),
      z.literal(''),
      z.undefined(),
    ])
    .optional(),

  price: z
    .number()
    .positive('Le prix doit être positif')
    .max(1000000, 'Le prix ne peut pas dépasser 1,000,000'),
});

// Schéma Service
export const serviceSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  slug: z
    .string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format de slug invalide')
    .optional(),

  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),

  price: z
    .number()
    .positive('Le prix doit être positif')
    .max(1000000, 'Le prix ne peut pas dépasser 1,000,000'),

  duration: z
    .number()
    .positive('La durée doit être positive')
    .max(1440, 'La durée ne peut pas dépasser 1440 minutes (24h)')
    .int('La durée doit être un nombre entier'),

  max_participants: z
    .number()
    .int('Le nombre de participants doit être un nombre entier')
    .min(1, 'Le nombre de participants doit être au moins 1')
    .max(1000, 'Le nombre de participants ne peut pas dépasser 1000')
    .optional(),

  meeting_url: z.string().url('URL de réunion invalide').optional().or(z.literal('')),

  location_address: z.string().max(500, "L'adresse ne peut pas dépasser 500 caractères").optional(),
});

/**
 * Validation synchrone avec Zod
 */
export function validateWithZod<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult {
  try {
    schema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const  errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        type: err.code === 'invalid_type' ? 'format' : 'custom',
      }));
      return { valid: false, errors };
    }
    logger.error('Erreur de validation Zod', { error });
    return {
      valid: false,
      errors: [{ field: 'unknown', message: 'Erreur de validation inconnue', type: 'custom' }],
    };
  }
}

/**
 * Validation asynchrone (ex: vérification disponibilité slug)
 */
export async function validateAsync(
  field: string,
  value: string,
  validator: (value: string) => Promise<boolean>,
  errorMessage: string
): Promise<ValidationResult> {
  try {
    const isValid = await validator(value);
    if (isValid) {
      return { valid: true, errors: [] };
    }
    return {
      valid: false,
      errors: [{ field, message: errorMessage, type: 'async' }],
    };
  } catch (error) {
    logger.error('Erreur validation asynchrone', { field, error });
    return {
      valid: false,
      errors: [{ field, message: 'Erreur lors de la validation', type: 'async' }],
    };
  }
}

/**
 * Validation temps réel (pour useForm ou useState)
 */
export function createRealtimeValidator<T>(
  schema: z.ZodSchema<T>,
  asyncValidators?: Record<string, (value: string) => Promise<boolean>>
) {
  return async (data: unknown): Promise<ValidationResult> => {
    // Validation synchrone d'abord
    const syncResult = validateWithZod(schema, data);
    if (!syncResult.valid) {
      return syncResult;
    }

    // Validation asynchrone si nécessaire
    if (asyncValidators) {
      const dataObj = data as Record<string, unknown>;
      for (const [field, validator] of Object.entries(asyncValidators)) {
        const value = dataObj[field];
        if (typeof value === 'string' && value.trim()) {
          const asyncResult = await validateAsync(
            field,
            value,
            validator,
            `La valeur de ${field} n'est pas valide`
          );
          if (!asyncResult.valid) {
            return asyncResult;
          }
        }
      }
    }

    return { valid: true, errors: [] };
  };
}

/**
 * Validation de format spécifique
 */
export const formatValidators = {
  slug: (value: string): ValidationResult => {
    const result = validateSlug(value, { required: false, minLength: 3, maxLength: 50 });
    return {
      valid: result.valid,
      errors: result.error ? [{ field: 'slug', message: result.error, type: 'format' }] : [],
    };
  },

  email: (value: string): ValidationResult => {
    const result = validateEmail(value, { required: false });
    return {
      valid: result.valid,
      errors: result.error ? [{ field: 'email', message: result.error, type: 'format' }] : [],
    };
  },

  phone: (value: string): ValidationResult => {
    const result = validatePhone(value, { required: false });
    return {
      valid: result.valid,
      errors: result.error ? [{ field: 'phone', message: result.error, type: 'format' }] : [],
    };
  },

  url: (value: string): ValidationResult => {
    const result = validateURL(value, { required: false });
    return {
      valid: result.valid,
      errors: result.error ? [{ field: 'url', message: result.error, type: 'format' }] : [],
    };
  },

  version: (value: string): ValidationResult => {
    const versionRegex = /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9]+)?$/;
    if (!versionRegex.test(value)) {
      return {
        valid: false,
        errors: [
          {
            field: 'version',
            message: 'Format de version invalide (ex: 1.0.0 ou 1.0.0-beta)',
            type: 'format',
          },
        ],
      };
    }
    return { valid: true, errors: [] };
  },

  sku: (value: string): ValidationResult => {
    const skuRegex = /^[A-Z0-9-_]+$/;
    if (!skuRegex.test(value)) {
      return {
        valid: false,
        errors: [
          {
            field: 'sku',
            message: 'Format de SKU invalide (majuscules, chiffres, tirets, underscores)',
            type: 'format',
          },
        ],
      };
    }
    return { valid: true, errors: [] };
  },
};

/**
 * Helper pour afficher les erreurs dans l'UI
 */
export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find(err => err.field === field)?.message;
}

/**
 * Helper pour vérifier si un champ a des erreurs
 */
export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some(err => err.field === field);
}






