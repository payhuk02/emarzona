/**
 * Hook useLoadingState - Gestion simplifiée des états de chargement
 * Fournit une API simple pour gérer les états de chargement, erreur et succès
 * 
 * @example
 * ```tsx
 * const { loading, error, success, execute, reset } = useLoadingState();
 * 
 * const handleSubmit = async () => {
 *   await execute(async () => {
 *     await saveData();
 *   });
 * };
 * ```
 */

import { useState, useCallback } from 'react';

export interface UseLoadingStateReturn {
  /**
   * Indique si une opération est en cours
   */
  loading: boolean;
  /**
   * Erreur éventuelle
   */
  error: Error | null;
  /**
   * Indique si l'opération a réussi
   */
  success: boolean;
  /**
   * Exécuter une opération asynchrone
   */
  execute: <T>(operation: () => Promise<T>) => Promise<T | undefined>;
  /**
   * Réinitialiser l'état
   */
  reset: () => void;
  /**
   * Définir manuellement l'état de chargement
   */
  setLoading: (loading: boolean) => void;
  /**
   * Définir manuellement l'erreur
   */
  setError: (error: Error | null) => void;
  /**
   * Définir manuellement le succès
   */
  setSuccess: (success: boolean) => void;
}

/**
 * Hook pour gérer les états de chargement
 */
export function useLoadingState(): UseLoadingStateReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const execute = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await operation();
      setSuccess(true);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setSuccess(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    execute,
    reset,
    setLoading,
    setError,
    setSuccess,
  };
}

