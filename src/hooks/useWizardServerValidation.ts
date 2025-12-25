/**
 * Hook pour validation serveur dans les wizards
 * Date: 28 Janvier 2025
 *
 * Combine validation client (Zod) et validation serveur (RPC)
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  validateProductSlug,
  validateSku,
  validateDigitalVersion,
  validateDigitalProduct,
  validatePhysicalProduct,
  validateService,
  ServerValidationResult,
} from '@/lib/server-validation';
import { normalizeError, ErrorSeverity } from '@/lib/error-handling';
import { getUserFriendlyError } from '@/lib/user-friendly-errors';

/**
 * Options pour la validation serveur
 */
export interface ServerValidationOptions {
  /**
   * Afficher les erreurs dans des toasts
   */
  showToasts?: boolean;

  /**
   * Store ID (requis pour certaines validations)
   */
  storeId?: string;

  /**
   * Product ID (pour les mises à jour)
   */
  productId?: string;
}

/**
 * Hook pour validation serveur dans les wizards
 */
export function useWizardServerValidation(options: ServerValidationOptions = {}) {
  const { showToasts = true, storeId, productId } = options;
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  /**
   * Valider un slug de produit
   */
  const validateSlug = useCallback(
    async (slug: string): Promise<boolean> => {
      if (!slug || !storeId) return true;

      setIsValidating(true);
      setServerErrors(prev => ({ ...prev, slug: '' }));

      try {
        const result = await validateProductSlug(slug, storeId, productId);

        if (!result.valid) {
          const errorMessage = result.message || 'Slug invalide';
          setServerErrors(prev => ({ ...prev, slug: errorMessage }));

          if (showToasts) {
            toast({
              title: 'Slug invalide',
              description: errorMessage,
              variant: 'destructive',
            });
          }

          return false;
        }

        return true;
      } catch (error) {
        const normalized = normalizeError(error);
        const friendly = getUserFriendlyError(normalized, { operation: 'product.validate' });

        if (showToasts) {
          toast({
            title: friendly.title,
            description: friendly.description,
            variant: normalized.severity === ErrorSeverity.CRITICAL ? 'destructive' : 'default',
          });
        }

        logger.error('Error validating slug', { error, slug, storeId });
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [storeId, productId, showToasts, toast]
  );

  /**
   * Valider un SKU
   */
  const validateSkuField = useCallback(
    async (sku: string): Promise<boolean> => {
      if (!sku || !storeId) return true;

      setIsValidating(true);
      setServerErrors(prev => ({ ...prev, sku: '' }));

      try {
        const result = await validateSku(sku, storeId, productId);

        if (!result.valid) {
          const errorMessage = result.message || 'SKU invalide';
          setServerErrors(prev => ({ ...prev, sku: errorMessage }));

          if (showToasts) {
            toast({
              title: 'SKU invalide',
              description: errorMessage,
              variant: 'destructive',
            });
          }

          return false;
        }

        return true;
      } catch (error) {
        const normalized = normalizeError(error);
        const friendly = getUserFriendlyError(normalized, { operation: 'product.validate' });

        if (showToasts) {
          toast({
            title: friendly.title,
            description: friendly.description,
            variant: normalized.severity === ErrorSeverity.CRITICAL ? 'destructive' : 'default',
          });
        }

        logger.error('Error validating SKU', { error, sku, storeId });
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [storeId, productId, showToasts, toast]
  );

  /**
   * Valider une version de produit digital
   */
  const validateVersion = useCallback(
    async (version: string, digitalProductId: string): Promise<boolean> => {
      if (!version || !storeId) return true;

      setIsValidating(true);
      setServerErrors(prev => ({ ...prev, version: '' }));

      try {
        const result = await validateDigitalVersion(version, digitalProductId, storeId);

        if (!result.valid) {
          const errorMessage = result.message || 'Version invalide';
          setServerErrors(prev => ({ ...prev, version: errorMessage }));

          if (showToasts) {
            toast({
              title: 'Version invalide',
              description: errorMessage,
              variant: 'destructive',
            });
          }

          return false;
        }

        return true;
      } catch (error) {
        const normalized = normalizeError(error);
        const friendly = getUserFriendlyError(normalized, { operation: 'product.validate' });

        if (showToasts) {
          toast({
            title: friendly.title,
            description: friendly.description,
            variant: normalized.severity === ErrorSeverity.CRITICAL ? 'destructive' : 'default',
          });
        }

        logger.error('Error validating version', { error, version, digitalProductId });
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [storeId, showToasts, toast]
  );

  /**
   * Valider un produit digital complet
   */
  const validateDigitalProductData = useCallback(
    async (data: {
      name: string;
      slug?: string;
      price: number;
    }): Promise<ServerValidationResult> => {
      if (!storeId) {
        return {
          valid: false,
          error: 'missing_store_id',
          message: 'Store ID manquant',
        };
      }

      setIsValidating(true);
      setServerErrors({});

      try {
        const result = await validateDigitalProduct({
          name: data.name,
          slug: data.slug,
          price: data.price,
          storeId,
          productId,
        });

        if (!result.valid && result.errors) {
          const errors: Record<string, string> = {};
          // Filtrer les erreurs de prix si le prix est 0 (produit gratuit)
          const filteredErrors =
            data.price === 0
              ? result.errors.filter(
                  err => err.field !== 'price' && !err.message?.toLowerCase().includes('prix')
                )
              : result.errors;

          filteredErrors.forEach(err => {
            errors[err.field] = err.message;
          });
          setServerErrors(errors);

          if (showToasts && filteredErrors.length > 0) {
            toast({
              title: 'Erreurs de validation',
              description: filteredErrors[0].message,
              variant: 'destructive',
            });
          }
        }

        return result;
      } catch (error) {
        const normalized = normalizeError(error);
        const friendly = getUserFriendlyError(normalized, { operation: 'product.validate' });

        if (showToasts) {
          toast({
            title: friendly.title,
            description: friendly.description,
            variant: normalized.severity === ErrorSeverity.CRITICAL ? 'destructive' : 'default',
          });
        }

        logger.error('Error validating digital product', { error, data });
        return {
          valid: false,
          error: 'exception',
          message: friendly.description,
        };
      } finally {
        setIsValidating(false);
      }
    },
    [storeId, productId, showToasts, toast]
  );

  /**
   * Valider un produit physique complet
   */
  const validatePhysicalProductData = useCallback(
    async (data: {
      name: string;
      slug?: string;
      price: number;
      sku?: string;
      weight?: number;
      quantity?: number;
    }): Promise<ServerValidationResult> => {
      if (!storeId) {
        return {
          valid: false,
          error: 'missing_store_id',
          message: 'Store ID manquant',
        };
      }

      setIsValidating(true);
      setServerErrors({});

      try {
        const result = await validatePhysicalProduct({
          name: data.name,
          slug: data.slug,
          price: data.price,
          sku: data.sku,
          weight: data.weight,
          quantity: data.quantity,
          storeId,
          productId,
        });

        if (!result.valid && result.errors) {
          const errors: Record<string, string> = {};
          result.errors.forEach(err => {
            errors[err.field] = err.message;
          });
          setServerErrors(errors);

          if (showToasts && result.errors.length > 0) {
            toast({
              title: 'Erreurs de validation',
              description: result.errors[0].message,
              variant: 'destructive',
            });
          }
        }

        return result;
      } catch (error) {
        const normalized = normalizeError(error);
        const friendly = getUserFriendlyError(normalized, { operation: 'product.validate' });

        if (showToasts) {
          toast({
            title: friendly.title,
            description: friendly.description,
            variant: normalized.severity === ErrorSeverity.CRITICAL ? 'destructive' : 'default',
          });
        }

        logger.error('Error validating physical product', { error, data });
        return {
          valid: false,
          error: 'exception',
          message: friendly.description,
        };
      } finally {
        setIsValidating(false);
      }
    },
    [storeId, productId, showToasts, toast]
  );

  /**
   * Valider un service complet
   */
  const validateServiceData = useCallback(
    async (data: {
      name: string;
      slug?: string;
      price: number;
      duration?: number;
      maxParticipants?: number;
      meetingUrl?: string;
    }): Promise<ServerValidationResult> => {
      if (!storeId) {
        return {
          valid: false,
          error: 'missing_store_id',
          message: 'Store ID manquant',
        };
      }

      setIsValidating(true);
      setServerErrors({});

      try {
        const result = await validateService({
          name: data.name,
          slug: data.slug,
          price: data.price,
          duration: data.duration,
          maxParticipants: data.maxParticipants,
          meetingUrl: data.meetingUrl,
          storeId,
          productId,
        });

        if (!result.valid && result.errors) {
          const errors: Record<string, string> = {};
          result.errors.forEach(err => {
            errors[err.field] = err.message;
          });
          setServerErrors(errors);

          if (showToasts && result.errors.length > 0) {
            toast({
              title: 'Erreurs de validation',
              description: result.errors[0].message,
              variant: 'destructive',
            });
          }
        }

        return result;
      } catch (error) {
        const normalized = normalizeError(error);
        const friendly = getUserFriendlyError(normalized, { operation: 'product.validate' });

        if (showToasts) {
          toast({
            title: friendly.title,
            description: friendly.description,
            variant: normalized.severity === ErrorSeverity.CRITICAL ? 'destructive' : 'default',
          });
        }

        logger.error('Error validating service', { error, data });
        return {
          valid: false,
          error: 'exception',
          message: friendly.description,
        };
      } finally {
        setIsValidating(false);
      }
    },
    [storeId, productId, showToasts, toast]
  );

  /**
   * Réinitialiser les erreurs serveur
   */
  const clearServerErrors = useCallback(() => {
    setServerErrors({});
  }, []);

  return {
    isValidating,
    serverErrors,
    validateSlug,
    validateSku: validateSkuField,
    validateVersion,
    validateDigitalProduct: validateDigitalProductData,
    validatePhysicalProduct: validatePhysicalProductData,
    validateService: validateServiceData,
    clearServerErrors,
  };
}
