/**
 * Système de Validation Centralisé
 * Date: 3 Février 2025
 *
 * Système unifié pour toutes les validations (client et serveur)
 * Centralise les schémas Zod et les fonctions RPC Supabase
 */

import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;
  errors?: Record<string, string>;
  error?: string;
}

export interface ServerValidationOptions {
  skipServerValidation?: boolean;
  validateUniqueness?: boolean;
}

// =====================================================
// SCHÉMAS DE BASE RÉUTILISABLES
// =====================================================

export const baseSchemas = {
  /**
   * Slug : minuscules, chiffres, tirets uniquement
   */
  slug: z
    .string()
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(100, 'Le slug ne peut pas dépasser 100 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des minuscules, chiffres et tirets')
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), {
      message: 'Le slug ne peut pas commencer ou se terminer par un tiret',
    }),

  /**
   * Nom de produit
   */
  productName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères'),

  /**
   * Description
   */
  description: z
    .string()
    .max(10000, 'La description ne peut pas dépasser 10000 caractères')
    .optional(),

  /**
   * Prix
   */
  price: z
    .number()
    .positive('Le prix doit être positif')
    .max(999999999.99, 'Le prix ne peut pas dépasser 999,999,999.99')
    .refine(val => {
      const decimals = val.toString().split('.')[1];
      return !decimals || decimals.length <= 2;
    }, 'Le prix ne peut avoir que 2 décimales maximum'),

  /**
   * SKU
   */
  sku: z
    .string()
    .max(100, 'Le SKU ne peut pas dépasser 100 caractères')
    .regex(
      /^[A-Z0-9-_]+$/,
      'Le SKU ne peut contenir que des majuscules, chiffres, tirets et underscores'
    )
    .optional()
    .or(z.literal('')),

  /**
   * Email
   */
  email: z.string().email('Email invalide'),

  /**
   * URL
   */
  url: z.string().url('URL invalide').optional().or(z.literal('')),

  /**
   * Quantité
   */
  quantity: z
    .number()
    .int('La quantité doit être un nombre entier')
    .min(0, 'La quantité ne peut pas être négative')
    .optional(),

  /**
   * Poids (en kg)
   */
  weight: z
    .number()
    .positive('Le poids doit être positif')
    .max(10000, 'Le poids ne peut pas dépasser 10000 kg')
    .optional(),

  /**
   * Dimensions
   */
  dimensions: z
    .object({
      length: z.number().positive().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      unit: z.enum(['cm', 'in', 'm']).optional(),
    })
    .optional(),
};

// =====================================================
// VALIDATION SERVEUR - UNICITÉ
// =====================================================

/**
 * Valider l'unicité d'un slug
 */
export async function validateSlugUniqueness(
  slug: string,
  storeId: string,
  productId?: string,
  productType?: 'digital' | 'physical' | 'service' | 'course' | 'artist'
): Promise<ValidationResult> {
  try {
    // Vérifier le format du slug côté client
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return {
        valid: false,
        errors: {
          slug: 'Le slug ne peut contenir que des minuscules, chiffres et tirets',
        },
      };
    }

    // Vérifier la longueur
    if (slug.length < 3 || slug.length > 50) {
      return {
        valid: false,
        errors: {
          slug: 'Le slug doit contenir entre 3 et 50 caractères',
        },
      };
    }

    // Essayer d'utiliser la fonction RPC si elle existe
    const { data, error } = await supabase.rpc('validate_product_slug', {
      p_slug: slug,
      p_store_id: storeId,
      p_product_id: productId || null,
      // Note: p_product_type n'est pas utilisé par la fonction RPC
      // Le slug est unique dans la table products, donc pas besoin de filtrer par type
    });

    // Si la fonction RPC n'existe pas (404), utiliser un fallback
    if (
      error &&
      (error.code === 'P0001' ||
        error.message?.includes('function') ||
        error.message?.includes('404'))
    ) {
      logger.warn('RPC validate_product_slug not found, using fallback validation', {
        error,
        slug,
        storeId,
      });

      // Fallback: Vérifier directement dans la table products
      const { data: existing, error: queryError } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId)
        .eq('slug', slug)
        .limit(1);

      if (queryError) {
        logger.error('Error checking slug uniqueness (fallback)', {
          error: queryError,
          slug,
          storeId,
        });
        return {
          valid: false,
          error: 'Erreur lors de la vérification du slug',
        };
      }

      // Si un produit existe avec ce slug (et ce n'est pas le produit actuel)
      if (existing && existing.length > 0) {
        const existingProduct = existing[0];
        if (!productId || existingProduct.id !== productId) {
          return {
            valid: false,
            errors: {
              slug: 'Ce slug est déjà utilisé pour un autre produit',
            },
          };
        }
      }

      return { valid: true };
    }

    // Si erreur autre que "fonction non trouvée"
    if (error) {
      logger.error('Error validating slug uniqueness', { error, slug, storeId });
      return {
        valid: false,
        error: 'Erreur lors de la validation du slug',
      };
    }

    // RPC a réussi
    if (!data || !data.valid) {
      return {
        valid: false,
        errors: {
          slug: data?.message || 'Ce slug est déjà utilisé',
        },
      };
    }

    return { valid: true };
  } catch (error) {
    logger.error('Exception validating slug uniqueness', { error, slug });
    return {
      valid: false,
      error: 'Erreur lors de la validation du slug',
    };
  }
}

/**
 * Valider l'unicité d'un SKU
 */
export async function validateSkuUniqueness(
  sku: string,
  storeId: string,
  productId?: string
): Promise<ValidationResult> {
  if (!sku || sku.trim() === '') {
    return { valid: true }; // SKU optionnel
  }

  try {
    const { data, error } = await supabase.rpc('validate_sku', {
      p_sku: sku,
      p_store_id: storeId,
      p_product_id: productId || null,
    });

    if (error) {
      logger.error('Error validating SKU uniqueness', { error, sku, storeId });
      return {
        valid: false,
        error: 'Erreur lors de la validation du SKU',
      };
    }

    if (!data || !data.valid) {
      return {
        valid: false,
        errors: {
          sku: data?.message || 'Ce SKU est déjà utilisé',
        },
      };
    }

    return { valid: true };
  } catch (error) {
    logger.error('Exception validating SKU uniqueness', { error, sku });
    return {
      valid: false,
      error: 'Erreur lors de la validation du SKU',
    };
  }
}

/**
 * Valider l'unicité d'une version (produits digitaux)
 */
export async function validateVersionUniqueness(
  version: string,
  productId: string
): Promise<ValidationResult> {
  if (!version || version.trim() === '') {
    return { valid: true }; // Version optionnelle
  }

  try {
    const { data, error } = await supabase.rpc('validate_digital_version', {
      p_version: version,
      p_product_id: productId,
    });

    if (error) {
      logger.error('Error validating version uniqueness', { error, version, productId });
      return {
        valid: false,
        error: 'Erreur lors de la validation de la version',
      };
    }

    if (!data || !data.valid) {
      return {
        valid: false,
        errors: {
          version: data?.message || 'Cette version existe déjà',
        },
      };
    }

    return { valid: true };
  } catch (error) {
    logger.error('Exception validating version uniqueness', { error, version });
    return {
      valid: false,
      error: 'Erreur lors de la validation de la version',
    };
  }
}

// =====================================================
// VALIDATION HYBRIDE (CLIENT + SERVEUR)
// =====================================================

/**
 * Valider avec schéma Zod + validation serveur
 */
export async function validateWithSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  options: {
    serverValidation?: (validatedData: z.infer<T>) => Promise<ValidationResult>;
    skipServerValidation?: boolean;
  } = {}
): Promise<ValidationResult<z.infer<T>>> {
  // 1. Validation client (Zod)
  const clientResult = schema.safeParse(data);

  if (!clientResult.success) {
    const errors: Record<string, string> = {};
    clientResult.error.errors.forEach(err => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });

    return {
      valid: false,
      errors,
    };
  }

  // 2. Validation serveur si fournie
  if (!options.skipServerValidation && options.serverValidation) {
    try {
      const serverResult = await options.serverValidation(clientResult.data);
      if (!serverResult.valid) {
        return {
          valid: false,
          errors: serverResult.errors || {},
          error: serverResult.error,
        };
      }
    } catch (error) {
      logger.error('Error in server validation', { error });
      return {
        valid: false,
        error: 'Erreur lors de la validation serveur',
      };
    }
  }

  return {
    valid: true,
    data: clientResult.data,
  };
}

// =====================================================
// VALIDATION PAR TYPE DE PRODUIT
// =====================================================

/**
 * Valider un produit digital complet
 */
export async function validateDigitalProduct(
  data: unknown,
  storeId: string,
  productId?: string
): Promise<ValidationResult> {
  // Schéma de base pour produits digitaux
  const schema = z.object({
    name: baseSchemas.productName,
    slug: baseSchemas.slug,
    description: baseSchemas.description,
    price: baseSchemas.price,
    version: z.string().max(50).optional().or(z.literal('')),
  });

  return validateWithSchema(schema, data, {
    serverValidation: async validatedData => {
      // Valider l'unicité du slug
      const slugResult = await validateSlugUniqueness(
        validatedData.slug,
        storeId,
        productId,
        'digital'
      );

      if (!slugResult.valid) {
        return slugResult;
      }

      // Valider l'unicité de la version si fournie
      if (validatedData.version && validatedData.version.trim() !== '' && productId) {
        const versionResult = await validateVersionUniqueness(validatedData.version, productId);

        if (!versionResult.valid) {
          return versionResult;
        }
      }

      return { valid: true };
    },
  });
}

/**
 * Valider un produit physique complet
 */
export async function validatePhysicalProduct(
  data: unknown,
  storeId: string,
  productId?: string
): Promise<ValidationResult> {
  const schema = z.object({
    name: baseSchemas.productName,
    slug: baseSchemas.slug,
    description: baseSchemas.description,
    price: baseSchemas.price,
    sku: baseSchemas.sku,
    weight: baseSchemas.weight,
    quantity: baseSchemas.quantity,
  });

  return validateWithSchema(schema, data, {
    serverValidation: async validatedData => {
      // Valider l'unicité du slug
      const slugResult = await validateSlugUniqueness(
        validatedData.slug,
        storeId,
        productId,
        'physical'
      );

      if (!slugResult.valid) {
        return slugResult;
      }

      // Valider l'unicité du SKU si fourni
      if (validatedData.sku && validatedData.sku.trim() !== '') {
        const skuResult = await validateSkuUniqueness(validatedData.sku, storeId, productId);

        if (!skuResult.valid) {
          return skuResult;
        }
      }

      return { valid: true };
    },
  });
}

/**
 * Valider un service complet
 */
export async function validateService(
  data: unknown,
  storeId: string,
  productId?: string
): Promise<ValidationResult> {
  const schema = z.object({
    name: baseSchemas.productName,
    slug: baseSchemas.slug,
    description: baseSchemas.description,
    price: baseSchemas.price,
    duration_minutes: z.number().int().positive().optional(),
  });

  return validateWithSchema(schema, data, {
    serverValidation: async validatedData => {
      const slugResult = await validateSlugUniqueness(
        validatedData.slug,
        storeId,
        productId,
        'service'
      );

      if (!slugResult.valid) {
        return slugResult;
      }

      return { valid: true };
    },
  });
}

/**
 * Valider un cours complet
 */
export async function validateCourse(
  data: unknown,
  storeId: string,
  productId?: string
): Promise<ValidationResult> {
  const schema = z.object({
    name: baseSchemas.productName,
    slug: baseSchemas.slug,
    description: baseSchemas.description,
    price: baseSchemas.price,
  });

  return validateWithSchema(schema, data, {
    serverValidation: async validatedData => {
      const slugResult = await validateSlugUniqueness(
        validatedData.slug,
        storeId,
        productId,
        'course'
      );

      if (!slugResult.valid) {
        return slugResult;
      }

      return { valid: true };
    },
  });
}

/**
 * Valider un produit artiste complet
 */
export async function validateArtistProduct(
  data: unknown,
  storeId: string,
  productId?: string
): Promise<ValidationResult> {
  const schema = z.object({
    name: baseSchemas.productName,
    slug: baseSchemas.slug,
    description: baseSchemas.description,
    price: baseSchemas.price,
    artist_name: z.string().min(2, "Le nom de l'artiste est requis"),
    artwork_title: z.string().min(2, "Le titre de l'œuvre est requis"),
  });

  return validateWithSchema(schema, data, {
    serverValidation: async validatedData => {
      const slugResult = await validateSlugUniqueness(
        validatedData.slug,
        storeId,
        productId,
        'artist'
      );

      if (!slugResult.valid) {
        return slugResult;
      }

      return { valid: true };
    },
  });
}

// =====================================================
// EXPORT UNIFIÉ
// =====================================================

export const centralizedValidation = {
  // Schémas de base
  schemas: baseSchemas,

  // Validation d'unicité
  validateSlugUniqueness,
  validateSkuUniqueness,
  validateVersionUniqueness,

  // Validation hybride
  validateWithSchema,

  // Validation par type de produit
  validateDigitalProduct,
  validatePhysicalProduct,
  validateService,
  validateCourse,
  validateArtistProduct,
};
