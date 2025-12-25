/**
 * Hook standardisé pour la gestion d'erreurs
 * Utilise le système de normalisation d'erreurs pour une gestion cohérente
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { normalizeError, logError, ErrorSeverity, ErrorType } from '@/lib/error-handling';
import { logger } from '@/lib/logger';

interface UseErrorHandlerOptions {
  /**
   * Si true, n'affiche pas de toast pour les erreurs non-critiques
   */
  silent?: boolean;
  
  /**
   * Message personnalisé pour l'utilisateur
   */
  customMessage?: string;
  
  /**
   * Callback appelé après la gestion de l'erreur
   */
  onError?: (normalizedError: ReturnType<typeof normalizeError>) => void;
}

/**
 * Hook pour gérer les erreurs de manière standardisée
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { toast } = useToast();
  const { silent = false, customMessage, onError } = options;

  const handleError = useCallback((error: unknown, context?: Record<string, unknown>) => {
    // Normaliser l'erreur
    const normalized = logError(error, context);

    // Appeler le callback si fourni
    if (onError) {
      onError(normalized);
    }

    // Ne pas afficher de toast pour les erreurs non-critiques si silent
    if (silent && normalized.severity === ErrorSeverity.LOW) {
      return normalized;
    }

    // Afficher un toast selon la sévérité
    const userMessage = customMessage || normalized.userMessage;

    switch (normalized.severity) {
      case ErrorSeverity.CRITICAL:
        toast({
          title: 'Erreur critique',
          description: userMessage,
          variant: 'destructive',
          duration: 10000,
        });
        break;

      case ErrorSeverity.HIGH:
        toast({
          title: 'Erreur',
          description: userMessage,
          variant: 'destructive',
          duration: 5000,
        });
        break;

      case ErrorSeverity.MEDIUM:
        toast({
          title: 'Attention',
          description: userMessage,
          variant: 'default',
          duration: 3000,
        });
        break;

      case ErrorSeverity.LOW:
        // Ne pas afficher de toast pour les erreurs non-critiques
        logger.info('Erreur non-critique ignorée', { error: normalized });
        break;
    }

    return normalized;
  }, [toast, silent, customMessage, onError]);

  return { handleError };
}

/**
 * Hook spécialisé pour les erreurs de requêtes (React Query)
 */
export function useQueryErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { handleError } = useErrorHandler(options);

  return useCallback((error: unknown) => {
    return handleError(error, { source: 'react-query' });
  }, [handleError]);
}

/**
 * Hook spécialisé pour les erreurs de mutations (React Query)
 */
export function useMutationErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { handleError } = useErrorHandler(options);

  return useCallback((error: unknown, variables?: unknown) => {
    return handleError(error, { 
      source: 'react-query-mutation',
      variables,
    });
  }, [handleError]);
}


