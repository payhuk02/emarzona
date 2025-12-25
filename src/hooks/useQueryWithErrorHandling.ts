/**
 * useQueryWithErrorHandling Hook
 * Date: 28 Janvier 2025
 * 
 * Wrapper pour useQuery avec gestion d'erreurs améliorée
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { normalizeError, shouldRetryError, getRetryDelay, ErrorSeverity, logError } from '@/lib/error-handling';
import { getUserFriendlyError } from '@/lib/user-friendly-errors';
import { logger } from '@/lib/logger';

interface QueryWithErrorHandlingOptions<TData, TError = Error> 
  extends Omit<UseQueryOptions<TData, TError>, 'retry' | 'retryDelay' | 'onError'> {
  showErrorToast?: boolean;
  errorToastTitle?: string;
  onError?: (error: TError, normalizedError: ReturnType<typeof normalizeError>) => void;
}

/**
 * Hook useQuery avec gestion d'erreurs améliorée
 */
export function useQueryWithErrorHandling<TData = unknown, TError = Error>(
  options: QueryWithErrorHandlingOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const { toast } = useToast();
  const {
    showErrorToast = true,
    errorToastTitle,
    onError,
    ...queryOptions
  } = options;

  return useQuery<TData, TError>({
    ...queryOptions,
    retry: (failureCount, error) => {
      // Utiliser la logique de retry améliorée
      return shouldRetryError(error, failureCount);
    },
    retryDelay: (attemptIndex) => {
      // Utiliser le délai de retry calculé
      return getRetryDelay(attemptIndex);
    },
    onError: (error: TError) => {
      // Normaliser l'erreur
      const normalized = normalizeError(error);

      // Logger l'erreur
      logError(error, {
        queryKey: queryOptions.queryKey,
        failureCount: 0, // React Query gère ça
      });

      // Afficher toast selon la sévérité avec message user-friendly
      if (showErrorToast && normalized.severity !== ErrorSeverity.LOW) {
        const friendlyError = getUserFriendlyError(normalized, {
          operation: queryOptions.queryKey?.[0] as string,
        });
        
        toast({
          title: errorToastTitle || friendlyError.title,
          description: friendlyError.description,
          variant: normalized.severity === ErrorSeverity.CRITICAL ? 'destructive' : 'default',
          duration: friendlyError.duration || (normalized.severity === ErrorSeverity.CRITICAL ? 10000 : 5000),
        });
      }

      // Appeler le callback personnalisé
      onError?.(error, normalized);
    },
  });
}

