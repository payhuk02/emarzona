/**
 * Hook useCountdown - Compteur à rebours
 * Fournit une API simple pour créer des compteurs à rebours
 * 
 * @example
 * ```tsx
 * const { timeLeft, isFinished, start, pause, reset } = useCountdown({
 *   initialTime: 60, // 60 secondes
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseCountdownOptions {
  /**
   * Temps initial en secondes
   */
  initialTime: number;
  /**
   * Callback appelé quand le compteur atteint 0
   */
  onFinish?: () => void;
  /**
   * Démarrer automatiquement
   * @default false
   */
  autoStart?: boolean;
  /**
   * Intervalle de mise à jour en millisecondes
   * @default 1000 (1 seconde)
   */
  interval?: number;
}

export interface UseCountdownReturn {
  /**
   * Temps restant en secondes
   */
  timeLeft: number;
  /**
   * Indique si le compteur est terminé
   */
  isFinished: boolean;
  /**
   * Indique si le compteur est en pause
   */
  isPaused: boolean;
  /**
   * Démarrer le compteur
   */
  start: () => void;
  /**
   * Mettre en pause le compteur
   */
  pause: () => void;
  /**
   * Réinitialiser le compteur
   */
  reset: () => void;
  /**
   * Formater le temps restant (MM:SS)
   */
  formattedTime: string;
}

/**
 * Hook pour gérer un compteur à rebours
 */
export function useCountdown(
  options: UseCountdownOptions
): UseCountdownReturn {
  const {
    initialTime,
    onFinish,
    autoStart = false,
    interval = 1000,
  } = options;

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isPaused, setIsPaused] = useState(!autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsPaused(true);
  }, [initialTime]);

  // Gérer le compteur
  useEffect(() => {
    if (isPaused || timeLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPaused(true);
          onFinish?.();
          return 0;
        }
        return prev - 1;
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, timeLeft, interval, onFinish]);

  // Formater le temps (MM:SS)
  const formattedTime = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return {
    timeLeft,
    isFinished: timeLeft <= 0,
    isPaused,
    start,
    pause,
    reset,
    formattedTime: formattedTime(),
  };
}







