/**
 * Hook useMutation avec Retry Intelligent et Exponential Backoff
 * Date: 28 Janvier 2025
 * 
 * Wrapper pour useMutation avec retry automatique basé sur le type d'erreur
 */

import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { normalizeError, shouldRetryError, getRetryDelay, ErrorSeverity } from '@/lib/error-handling';
import { getUserFriendlyError, getShortErrorMessage, getShortErrorTitle } from '@/lib/user-friendly-errors';

/**
 * Options pour useMutationWithRetry
 */
export interface MutationWithRetryOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'retry' | 'retryDelay'> {
  /**
   * Nombre maximum de tentatives (défaut: 3)
   * Si 0, pas de retry
   */
  maxRetries?: number;

  /**
   * Délai de base en ms pour le backoff exponentiel (défaut: 1000)
   */
  baseDelay?: number;

  /**
   * Délai maximum en ms (défaut: 30000)
   */
  maxDelay?: number;

  /**
   * Afficher un toast d'erreur (défaut: true)
   */
  showErrorToast?: boolean;

  /**
   * Titre du toast d'erreur
   */
  errorToastTitle?: string;

  /**
   * Callback appelé avant chaque retry
   */
  onRetry?: (attempt: number, error: TError, delay: number) => void;

  /**
   * Callback appelé après tous les retries échoués
   */
  onMaxRetriesExceeded?: (error: TError, attempts: number) => void;
}

/**
 * Hook useMutation avec retry intelligent et exponential backoff
 * 
 * @example
 * ```tsx
 * const mutation = useMutationWithRetry({
 *   mutationFn: async (data) => {
 *     const { data, error } = await supabase.from('products').insert(data);
 *     if (error) throw error;
 *     return data;
 *   },
 *   maxRetries: 3,
 *   baseDelay: 1000,
 *   onSuccess: (data) => {
 *     toast({ title: 'Succès', description: 'Produit créé' });
 *   },
 * });
 * ```
 */
export function useMutationWithRetry<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: MutationWithRetryOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { toast } = useToast();
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    showErrorToast = true,
    errorToastTitle,
    onRetry,
    onMaxRetriesExceeded,
    onError,
    onSuccess,
    onSettled,
    ...mutationOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    retry: (failureCount, error) => {
      // Si maxRetries est 0, pas de retry
      if (maxRetries === 0) {
        return false;
      }

      // Si on a atteint le maximum, ne plus retry
      if (failureCount >= maxRetries) {
        return false;
      }

      // Utiliser la logique de retry intelligente
      return shouldRetryError(error, failureCount);
    },
    retryDelay: (attemptIndex) => {
      // Calculer le délai avec exponential backoff
      const delay = getRetryDelay(attemptIndex, baseDelay, maxDelay);

      // Logger le retry
      logger.debug('Mutation retry', {
        attempt: attemptIndex + 1,
        maxRetries,
        delay,
      });

      // Note: onRetry sera appelé dans onError si nécessaire

      return delay;
    },
    onError: (error: TError, variables: TVariables, context: TContext | undefined) => {
      // Normaliser l'erreur
      const normalized = normalizeError(error);

      // Logger l'erreur
      logger.error('Mutation error', {
        error: normalized.message,
        type: normalized.type,
        severity: normalized.severity,
        retryable: normalized.retryable,
      });

      // Afficher toast selon la sévérité avec message user-friendly
      if (showErrorToast && normalized.severity !== ErrorSeverity.LOW) {
        const friendlyError = getUserFriendlyError(normalized, {
          operation: mutationOptions.mutationKey?.[0] as string,
        });
        
        toast({
          title: errorToastTitle || friendlyError.title,
          description: friendlyError.description,
          variant: normalized.severity === ErrorSeverity.CRITICAL ? 'destructive' : 'default',
          duration: friendlyError.duration || (normalized.severity === ErrorSeverity.CRITICAL ? 10000 : 5000),
        });
      }

      // Appeler le callback personnalisé
      onError?.(error, variables, context);
    },
    onSuccess: (data: TData, variables: TVariables, context: TContext | undefined) => {
      // Logger le succès
      logger.debug('Mutation success');

      // Appeler le callback personnalisé
      onSuccess?.(data, variables, context);
    },
    onSettled: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => {
      // Si erreur et max retries atteint, appeler onMaxRetriesExceeded
      if (error && onMaxRetriesExceeded) {
        // Note: On ne peut pas savoir exactement combien de retries ont été faits
        // On assume que si on arrive ici avec une erreur, tous les retries ont été tentés
        onMaxRetriesExceeded(error, maxRetries);
      }

      // Appeler le callback personnalisé
      onSettled?.(data, error, variables, context);
    },
  });
}

/**
 * Hook useMutation avec retry pour les opérations critiques
 * Utilise des paramètres plus agressifs (plus de retries, délais plus longs)
 */
export function useMutationWithRetryCritical<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: Omit<MutationWithRetryOptions<TData, TError, TVariables, TContext>, 'maxRetries' | 'baseDelay' | 'maxDelay'>
): UseMutationResult<TData, TError, TVariables, TContext> {
  return useMutationWithRetry({
    ...options,
    maxRetries: 5, // Plus de retries pour les opérations critiques
    baseDelay: 2000, // Délai de base plus long
    maxDelay: 60000, // Délai maximum plus long (1 minute)
  });
}

/**
 * Hook useMutation avec retry pour les opérations non-critiques
 * Utilise des paramètres moins agressifs (moins de retries, délais plus courts)
 */
export function useMutationWithRetryLight<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: Omit<MutationWithRetryOptions<TData, TError, TVariables, TContext>, 'maxRetries' | 'baseDelay' | 'maxDelay'>
): UseMutationResult<TData, TError, TVariables, TContext> {
  return useMutationWithRetry({
    ...options,
    maxRetries: 1, // Moins de retries pour les opérations non-critiques
    baseDelay: 500, // Délai de base plus court
    maxDelay: 5000, // Délai maximum plus court
  });
}

