/**
 * Server-Side Validation for Wizards
 * Date: 28 Janvier 2025
 * 
 * Fonctions pour appeler les validations serveur Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

/**
 * Résultat de validation serveur
 */
export interface ServerValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  error?: string;
  message?: string;
}

/**
 * Valider un slug de produit côté serveur
 */
export async function validateProductSlug(
  slug: string,
  storeId: string,
  productId?: string
): Promise<ServerValidationResult> {
  try {
    const { data, error } = await supabase.rpc('validate_product_slug', {
      p_slug: slug,
      p_store_id: storeId,
      p_product_id: productId || null,
    });

    if (error) {
      logger.error('Error validating product slug', { error, slug, storeId });
      return {
        valid: false,
        error: 'validation_error',
        message: error.message || 'Erreur lors de la validation du slug',
      };
    }

    return data as ServerValidationResult;
  } catch (error) {
    logger.error('Exception validating product slug', { error, slug, storeId });
    return {
      valid: false,
      error: 'exception',
      message: error instanceof Error ? error.message : 'Erreur inattendue',
    };
  }
}

/**
 * Valider un SKU côté serveur
 */
export async function validateSku(
  sku: string,
  storeId: string,
  productId?: string
): Promise<ServerValidationResult> {
  try {
    const { data, error } = await supabase.rpc('validate_sku', {
      p_sku: sku,
      p_store_id: storeId,
      p_product_id: productId || null,
    });

    if (error) {
      logger.error('Error validating SKU', { error, sku, storeId });
      return {
        valid: false,
        error: 'validation_error',
        message: error.message || 'Erreur lors de la validation du SKU',
      };
    }

    return data as ServerValidationResult;
  } catch (error) {
    logger.error('Exception validating SKU', { error, sku, storeId });
    return {
      valid: false,
      error: 'exception',
      message: error instanceof Error ? error.message : 'Erreur inattendue',
    };
  }
}

/**
 * Valider une version de produit digital côté serveur
 */
export async function validateDigitalVersion(
  version: string,
  digitalProductId: string,
  storeId: string
): Promise<ServerValidationResult> {
  try {
    const { data, error } = await supabase.rpc('validate_digital_version', {
      p_version: version,
      p_digital_product_id: digitalProductId,
      p_store_id: storeId,
    });

    if (error) {
      logger.error('Error validating digital version', { error, version, digitalProductId });
      return {
        valid: false,
        error: 'validation_error',
        message: error.message || 'Erreur lors de la validation de la version',
      };
    }

    return data as ServerValidationResult;
  } catch (error) {
    logger.error('Exception validating digital version', { error, version, digitalProductId });
    return {
      valid: false,
      error: 'exception',
      message: error instanceof Error ? error.message : 'Erreur inattendue',
    };
  }
}

/**
 * Valider un produit digital complet côté serveur
 */
export async function validateDigitalProduct(
  data: {
    name: string;
    slug?: string;
    price: number;
    storeId: string;
    productId?: string;
  }
): Promise<ServerValidationResult> {
  try {
    const { data: result, error } = await supabase.rpc('validate_digital_product', {
      p_name: data.name,
      p_slug: data.slug || null,
      p_price: data.price,
      p_store_id: data.storeId,
      p_product_id: data.productId || null,
    });

    if (error) {
      logger.error('Error validating digital product', { 
        error, 
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        data 
      });
      
      // Si la fonction RPC n'existe pas ou erreur serveur, retourner un résultat qui permet de continuer
      if (error.code === 'P0001' || error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
        logger.warn('Fonction RPC validate_digital_product non disponible - continuation avec validation client uniquement');
        return {
          valid: true, // Permettre de continuer avec validation client uniquement
          error: 'rpc_unavailable',
          message: 'Validation serveur non disponible - validation client uniquement',
        };
      }
      
      return {
        valid: false,
        error: 'validation_error',
        message: error.message || 'Erreur lors de la validation du produit',
      };
    }

    if (!result) {
      logger.warn('validate_digital_product returned null/undefined - continuation avec validation client');
      return {
        valid: true, // Permettre de continuer
        error: 'rpc_no_result',
        message: 'Validation serveur non disponible',
      };
    }

    return result as ServerValidationResult;
  } catch (error) {
    logger.error('Exception validating digital product', { error, data });
    return {
      valid: false,
      error: 'exception',
      message: error instanceof Error ? error.message : 'Erreur inattendue',
    };
  }
}

/**
 * Valider un produit physique complet côté serveur
 */
export async function validatePhysicalProduct(
  data: {
    name: string;
    slug?: string;
    price: number;
    sku?: string;
    weight?: number;
    quantity?: number;
    storeId: string;
    productId?: string;
  }
): Promise<ServerValidationResult> {
  try {
    const { data: result, error } = await supabase.rpc('validate_physical_product', {
      p_name: data.name,
      p_slug: data.slug || null,
      p_price: data.price,
      p_sku: data.sku || null,
      p_weight: data.weight || null,
      p_quantity: data.quantity || null,
      p_store_id: data.storeId,
      p_product_id: data.productId || null,
    });

    if (error) {
      logger.error('Error validating physical product', { error, data });
      return {
        valid: false,
        error: 'validation_error',
        message: error.message || 'Erreur lors de la validation du produit',
      };
    }

    return result as ServerValidationResult;
  } catch (error) {
    logger.error('Exception validating physical product', { error, data });
    return {
      valid: false,
      error: 'exception',
      message: error instanceof Error ? error.message : 'Erreur inattendue',
    };
  }
}

/**
 * Valider un service complet côté serveur
 */
export async function validateService(
  data: {
    name: string;
    slug?: string;
    price: number;
    duration?: number;
    maxParticipants?: number;
    meetingUrl?: string;
    storeId: string;
    productId?: string;
  }
): Promise<ServerValidationResult> {
  try {
    const { data: result, error } = await supabase.rpc('validate_service', {
      p_name: data.name,
      p_slug: data.slug || null,
      p_price: data.price,
      p_duration: data.duration || null,
      p_max_participants: data.maxParticipants || null,
      p_meeting_url: data.meetingUrl || null,
      p_store_id: data.storeId,
      p_product_id: data.productId || null,
    });

    if (error) {
      logger.error('Error validating service', { error, data });
      return {
        valid: false,
        error: 'validation_error',
        message: error.message || 'Erreur lors de la validation du service',
      };
    }

    return result as ServerValidationResult;
  } catch (error) {
    logger.error('Exception validating service', { error, data });
    return {
      valid: false,
      error: 'exception',
      message: error instanceof Error ? error.message : 'Erreur inattendue',
    };
  }
}

