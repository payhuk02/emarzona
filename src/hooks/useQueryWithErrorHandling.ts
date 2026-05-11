/**
 * useQueryWithErrorHandling Hook
 * Date: 28 Janvier 2025
 * 
 * Wrapper pour useQuery avec gestion d'erreurs améliorée
 */

import { useEffect } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { normalizeError, shouldRetryError, getRetryDelay, ErrorSeverity, logError } from '@/lib/error-handling';
import { getUserFriendlyError } from '@/lib/user-friendly-errors';

interface QueryWithErrorHandlingOptions<TData, TError = Error> 
  extends Omit<UseQueryOptions<TData, TError>, 'retry' | 'retryDelay'> {
  showErrorToast?: boolean;
  errorToastTitle?: string;
  onErrorCallback?: (error: TError, normalizedError: ReturnType<typeof normalizeError>) => void;
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
    onErrorCallback,
    ...queryOptions
  } = options;

  const result = useQuery<TData, TError>({
    ...queryOptions,
    retry: (failureCount, error) => {
      return shouldRetryError(error, failureCount);
    },
    retryDelay: (attemptIndex) => {
      return getRetryDelay(attemptIndex);
    },
  });

  // Handle errors via useEffect (onError removed in React Query v5)
  useEffect(() => {
    if (result.error) {
      const error = result.error;
      const normalized = normalizeError(error);

      logError(error, {
        queryKey: queryOptions.queryKey,
        failureCount: 0,
      });

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

      onErrorCallback?.(error, normalized);
    }
  }, [result.error]);

  return result;
}
