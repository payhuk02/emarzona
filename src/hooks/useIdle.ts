/**
 * Hook useIdle - Détecter l'inactivité de l'utilisateur
 * Fournit une API simple pour détecter quand l'utilisateur est inactif
 * 
 * @example
 * ```tsx
 * const { isIdle, idleTime } = useIdle({
 *   timeout: 30000, // 30 secondes
 *   events: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'],
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseIdleOptions {
  /**
   * Délai d'inactivité en millisecondes
   * @default 60000 (1 minute)
   */
  timeout?: number;
  /**
   * Événements à écouter pour détecter l'activité
   * @default ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
   */
  events?: string[];
  /**
   * Événements à écouter sur window
   * @default ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
   */
  windowEvents?: string[];
  /**
   * Événements à écouter sur document
   * @default []
   */
  documentEvents?: string[];
  /**
   * Activer la détection d'inactivité
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback appelé quand l'utilisateur devient inactif
   */
  onIdle?: () => void;
  /**
   * Callback appelé quand l'utilisateur redevient actif
   */
  onActive?: () => void;
}

export interface UseIdleReturn {
  /**
   * Indique si l'utilisateur est inactif
   */
  isIdle: boolean;
  /**
   * Temps d'inactivité en millisecondes
   */
  idleTime: number;
  /**
   * Réinitialiser le timer d'inactivité
   */
  reset: () => void;
}

/**
 * Hook pour détecter l'inactivité de l'utilisateur
 */
export function useIdle(options: UseIdleOptions = {}): UseIdleReturn {
  const {
    timeout = 60000,
    events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'],
    windowEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'],
    documentEvents = [],
    enabled = true,
    onIdle,
    onActive,
  } = options;

  const [isIdle, setIsIdle] = useState(false);
  const [idleTime, setIdleTime] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleTime(0);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isIdle) {
      setIsIdle(false);
      onActive?.();
    }

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle?.();
    }, timeout);
  }, [timeout, isIdle, onIdle, onActive]);

  useEffect(() => {
    if (!enabled) return;

    // Écouter les événements sur window
    const handleActivity = () => {
      reset();
    };

    windowEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    documentEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Mettre à jour le temps d'inactivité toutes les secondes
    intervalRef.current = setInterval(() => {
      if (!isIdle) {
        const elapsed = Date.now() - lastActivityRef.current;
        setIdleTime(elapsed);
      }
    }, 1000);

    // Initialiser le timer
    reset();

    return () => {
      windowEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      documentEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, windowEvents, documentEvents, reset, isIdle]);

  return {
    isIdle,
    idleTime,
    reset,
  };
}







