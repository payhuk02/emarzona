/**
 * Hook useGeolocation - Gestion de la géolocalisation
 * Fournit une API simple pour obtenir la position de l'utilisateur
 * 
 * @example
 * ```tsx
 * const { position, error, loading, getPosition } = useGeolocation({
 *   enableHighAccuracy: true,
 *   timeout: 10000,
 * });
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface UseGeolocationOptions {
  /**
   * Activer la haute précision
   * @default false
   */
  enableHighAccuracy?: boolean;
  /**
   * Timeout en millisecondes
   * @default 10000
   */
  timeout?: number;
  /**
   * Durée maximale de cache en millisecondes
   * @default 0 (pas de cache)
   */
  maximumAge?: number;
  /**
   * Obtenir la position automatiquement au montage
   * @default false
   */
  watch?: boolean;
}

export interface UseGeolocationReturn {
  /**
   * Position actuelle
   */
  position: GeolocationPosition | null;
  /**
   * Erreur de géolocalisation
   */
  error: GeolocationPositionError | null;
  /**
   * Indique si la géolocalisation est en cours
   */
  loading: boolean;
  /**
   * Indique si la géolocalisation est supportée
   */
  isSupported: boolean;
  /**
   * Obtenir la position manuellement
   */
  getPosition: () => void;
  /**
   * Arrêter le watch
   */
  stopWatch: () => void;
}

export interface GeolocationPositionError {
  code: number;
  message: string;
}

/**
 * Hook pour gérer la géolocalisation
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const {
    enableHighAccuracy = false,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Vérifier le support
  useEffect(() => {
    const supported = 'geolocation' in navigator;
    setIsSupported(supported);

    if (!supported) {
      setError({
        code: 0,
        message: 'La géolocalisation n\'est pas supportée par ce navigateur',
      });
    }
  }, []);

  // Watch automatique
  useEffect(() => {
    if (!watch || !isSupported) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError({
          code: err.code,
          message: err.message,
        });
        setLoading(false);
        logger.error('Geolocation error', { error: err });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [watch, isSupported, enableHighAccuracy, timeout, maximumAge]);

  const getPosition = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'La géolocalisation n\'est pas supportée',
      });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError({
          code: err.code,
          message: err.message,
        });
        setLoading(false);
        logger.error('Geolocation error', { error: err });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [isSupported, enableHighAccuracy, timeout, maximumAge]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  return {
    position,
    error,
    loading,
    isSupported,
    getPosition,
    stopWatch,
  };
}







