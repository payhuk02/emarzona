/**
 * useNetworkRetry Hook
 * Date: 28 Janvier 2025
 * 
 * Hook pour gérer les retries avec exponential backoff et détection réseau
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface RetryOptions {
  /**
   * Nombre maximum de tentatives
   */
  maxRetries?: number;
  /**
   * Délai de base en millisecondes
   */
  baseDelay?: number;
  /**
   * Délai maximum en millisecondes
   */
  maxDelay?: number;
  /**
   * Multiplicateur pour l'exponential backoff
   */
  multiplier?: number;
  /**
   * Activer le jitter (randomisation)
   */
  enableJitter?: boolean;
  /**
   * Callback appelé avant chaque retry
   */
  onRetry?: (attempt: number, delay: number) => void;
  /**
   * Callback appelé quand tous les retries sont épuisés
   */
  onMaxRetriesReached?: () => void;
}

export interface RetryState {
  attempt: number;
  isRetrying: boolean;
  nextRetryDelay: number;
  canRetry: boolean;
}

/**
 * Calculer le délai de retry avec exponential backoff
 */
function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number,
  enableJitter: boolean
): number {
  const exponentialDelay = baseDelay * Math.pow(multiplier, attempt);
  const delay = Math.min(exponentialDelay, maxDelay);
  
  if (enableJitter) {
    // Ajouter 0-30% de jitter pour éviter le thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return delay + jitter;
  }
  
  return delay;
}

/**
 * Hook pour gérer les retries avec exponential backoff
 */
export function useNetworkRetry(
  options: RetryOptions = {}
) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    enableJitter = true,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [state, setState] = useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    nextRetryDelay: baseDelay,
    canRetry: true,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(navigator.onLine);

  // Détecter les changements de connexion réseau
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      logger.info('Connexion réseau rétablie');
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      logger.warn('Connexion réseau perdue');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Exécuter un retry
  const executeRetry = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      currentAttempt: number = 0
    ): Promise<T> => {
      if (currentAttempt >= maxRetries) {
        setState((prev) => ({
          ...prev,
          isRetrying: false,
          canRetry: false,
        }));
        onMaxRetriesReached?.();
        throw new Error(`Maximum retries (${maxRetries}) reached`);
      }

      // Vérifier la connexion réseau
      if (!isOnlineRef.current) {
        logger.warn('Hors ligne, attente de la reconnexion...');
        // Attendre la reconnexion
        await new Promise<void>((resolve) => {
          const checkOnline = () => {
            if (isOnlineRef.current) {
              window.removeEventListener('online', checkOnline);
              resolve();
            }
          };
          window.addEventListener('online', checkOnline);
        });
      }

      setState((prev) => ({
        ...prev,
        attempt: currentAttempt + 1,
        isRetrying: true,
        nextRetryDelay: calculateRetryDelay(
          currentAttempt,
          baseDelay,
          maxDelay,
          multiplier,
          enableJitter
        ),
      }));

      try {
        const result = await fn();
        
        // Succès, réinitialiser l'état
        setState({
          attempt: 0,
          isRetrying: false,
          nextRetryDelay: baseDelay,
          canRetry: true,
        });

        return result;
      } catch (error) {
        // Erreur, planifier le prochain retry
        const delay = calculateRetryDelay(
          currentAttempt,
          baseDelay,
          maxDelay,
          multiplier,
          enableJitter
        );

        onRetry?.(currentAttempt + 1, delay);

        // Attendre avant le prochain retry
        await new Promise((resolve) => {
          timeoutRef.current = setTimeout(resolve, delay);
        });

        // Retry récursif
        return executeRetry(fn, currentAttempt + 1);
      }
    },
    [maxRetries, baseDelay, maxDelay, multiplier, enableJitter, onRetry, onMaxRetriesReached]
  );

  // Annuler les retries en cours
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isRetrying: false,
    }));
  }, []);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    cancel();
    setState({
      attempt: 0,
      isRetrying: false,
      nextRetryDelay: baseDelay,
      canRetry: true,
    });
  }, [cancel, baseDelay]);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    executeRetry,
    cancel,
    reset,
    isOnline: isOnlineRef.current,
  };
}

