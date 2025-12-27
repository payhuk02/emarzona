/**
 * Hook pour gérer les opérations asynchrones avec états de chargement et erreurs
 * Simplifie la gestion des états async dans les composants
 * 
 * @example
 * ```tsx
 * const { execute, loading, error, data } = useAsyncOperation(async () => {
 *   const result = await fetchData();
 *   return result;
 * });
 * 
 * <button onClick={() => execute()}>Charger</button>
 * {loading && <Spinner />}
 * {error && <Error message={error} />}
 * {data && <DataDisplay data={data} />}
 * ```
 */

import { useState, useCallback, useRef } from 'react';

export interface UseAsyncOperationOptions<T> {
  /**
   * Fonction async à exécuter
   */
  operation: () => Promise<T>;
  /**
   * Callback appelé en cas de succès
   */
  onSuccess?: (data: T) => void;
  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error) => void;
  /**
   * Réinitialiser l'erreur avant chaque exécution
   * @default true
   */
  resetErrorOnExecute?: boolean;
}

export interface UseAsyncOperationReturn<T> {
  /**
   * Exécuter l'opération
   */
  execute: () => Promise<T | undefined>;
  /**
   * État de chargement
   */
  loading: boolean;
  /**
   * Erreur éventuelle
   */
  error: Error | null;
  /**
   * Données retournées
   */
  data: T | null;
  /**
   * Réinitialiser l'état
   */
  reset: () => void;
}

/**
 * Hook pour gérer les opérations asynchrones
 */
export function useAsyncOperation<T>(
  options: UseAsyncOperationOptions<T>
): UseAsyncOperationReturn<T> {
  const {
    operation,
    onSuccess,
    onError,
    resetErrorOnExecute = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (): Promise<T | undefined> => {
    // Annuler l'opération précédente si elle est en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();

    // Réinitialiser l'erreur si demandé
    if (resetErrorOnExecute) {
      setError(null);
    }

    setLoading(true);
    setData(null);

    try {
      const result = await operation();
      
      // Vérifier si l'opération a été annulée
      if (abortControllerRef.current?.signal.aborted) {
        return undefined;
      }

      setData(result);
      setError(null);
      onSuccess?.(result);
      
      return result;
    } catch (err) {
      // Ignorer les erreurs d'annulation
      if (abortControllerRef.current?.signal.aborted) {
        return undefined;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setData(null);
      onError?.(error);
      
      throw error;
    } finally {
      // Ne mettre à jour le loading que si l'opération n'a pas été annulée
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [operation, onSuccess, onError, resetErrorOnExecute]);

  const reset = useCallback(() => {
    // Annuler l'opération en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
}

/**
 * Hook pour gérer les opérations async avec retry automatique
 */
export function useAsyncOperationWithRetry<T>(
  options: UseAsyncOperationOptions<T> & {
    maxRetries?: number;
    retryDelay?: number;
  }
): UseAsyncOperationReturn<T> & {
  retryCount: number;
} {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    ...baseOptions
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const baseOperation = useAsyncOperation<T>({
    ...baseOptions,
    operation: async () => {
      let  lastError: Error;
      
      for (let  attempt= 0; attempt < maxRetries; attempt++) {
        try {
          setRetryCount(attempt);
          const result = await baseOptions.operation();
          setRetryCount(0); // Reset on success
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt < maxRetries - 1) {
            // Attendre avant de réessayer (exponential backoff)
            await new Promise(resolve => 
              setTimeout(resolve, retryDelay * Math.pow(2, attempt))
            );
          }
        }
      }
      
      setRetryCount(0);
      throw lastError!;
    },
  });

  return {
    ...baseOperation,
    retryCount,
  };
}







