/**
 * Hook useErrorState - Gestion simplifiée des états d'erreur
 * Fournit une API simple pour gérer les erreurs dans les composants
 * 
 * @example
 * ```tsx
 * const { error, setError, clearError, hasError } = useErrorState();
 * ```
 */

import { useState, useCallback } from 'react';

export interface UseErrorStateReturn {
  /**
   * Erreur actuelle
   */
  error: Error | null;
  /**
   * Message d'erreur
   */
  errorMessage: string | null;
  /**
   * Indique si une erreur existe
   */
  hasError: boolean;
  /**
   * Définir une erreur
   */
  setError: (error: Error | string | null) => void;
  /**
   * Effacer l'erreur
   */
  clearError: () => void;
  /**
   * Exécuter une opération et gérer automatiquement les erreurs
   */
  execute: <T>(operation: () => Promise<T>) => Promise<T | undefined>;
}

/**
 * Hook pour gérer les états d'erreur
 */
export function useErrorState(): UseErrorStateReturn {
  const [error, setErrorState] = useState<Error | null>(null);

  const setError = useCallback((error: Error | string | null) => {
    if (error === null) {
      setErrorState(null);
    } else if (typeof error === 'string') {
      setErrorState(new Error(error));
    } else {
      setErrorState(error);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const execute = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
    try {
      clearError();
      const result = await operation();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return undefined;
    }
  }, [clearError, setError]);

  const errorMessage = error?.message || null;
  const hasError = error !== null;

  return {
    error,
    errorMessage,
    hasError,
    setError,
    clearError,
    execute,
  };
}

