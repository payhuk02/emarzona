/**
 * Hook useDeviceOrientation - Orientation de l'appareil
 * Fournit une API simple pour obtenir l'orientation de l'appareil
 * 
 * @example
 * ```tsx
 * const { angle, type, isPortrait, isLandscape } = useDeviceOrientation();
 * ```
 */

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export type OrientationType = 'portrait' | 'landscape' | 'unknown';

export interface DeviceOrientation {
  /**
   * Angle de rotation en degrés (0-360)
   */
  angle: number | null;
  /**
   * Type d'orientation (portrait/landscape)
   */
  type: OrientationType;
  /**
   * Indique si l'appareil est en mode portrait
   */
  isPortrait: boolean;
  /**
   * Indique si l'appareil est en mode paysage
   */
  isLandscape: boolean;
}

export interface UseDeviceOrientationReturn {
  /**
   * Orientation de l'appareil
   */
  orientation: DeviceOrientation;
  /**
   * Indique si l'API Device Orientation est supportée
   */
  isSupported: boolean;
  /**
   * Angle de rotation en degrés
   */
  angle: number | null;
  /**
   * Type d'orientation
   */
  type: OrientationType;
  /**
   * Indique si l'appareil est en mode portrait
   */
  isPortrait: boolean;
  /**
   * Indique si l'appareil est en mode paysage
   */
  isLandscape: boolean;
}

/**
 * Détermine le type d'orientation à partir de l'angle
 */
function getOrientationType(angle: number | null): OrientationType {
  if (angle === null) return 'unknown';
  
  // Normaliser l'angle entre 0 et 360
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  // Portrait: 0° ou 180°
  // Landscape: 90° ou 270°
  if (normalizedAngle === 0 || normalizedAngle === 180) {
    return 'portrait';
  } else if (normalizedAngle === 90 || normalizedAngle === 270) {
    return 'landscape';
  }
  
  return 'unknown';
}

/**
 * Hook pour gérer l'orientation de l'appareil
 */
export function useDeviceOrientation(): UseDeviceOrientationReturn {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    angle: null,
    type: 'unknown',
    isPortrait: false,
    isLandscape: false,
  });
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Vérifier le support de l'API Device Orientation
    const hasDeviceOrientation = 'DeviceOrientationEvent' in window;
    const hasOrientation = 'orientation' in window;
    
    setIsSupported(hasDeviceOrientation || hasOrientation);

    if (!hasDeviceOrientation && !hasOrientation) {
      // Fallback: Utiliser window.orientation si disponible
      if ('orientation' in window) {
        const angle = (window as any).orientation;
        const type = getOrientationType(angle);
        setOrientation({
          angle,
          type,
          isPortrait: type === 'portrait',
          isLandscape: type === 'landscape',
        });
      }
      return;
    }

    const handleOrientationChange = (event: DeviceOrientationEvent) => {
      const angle = event.alpha !== null ? event.alpha : null;
      const type = getOrientationType(angle);
      
      setOrientation({
        angle,
        type,
        isPortrait: type === 'portrait',
        isLandscape: type === 'landscape',
      });
    };

    // Écouter les changements d'orientation
    if (hasDeviceOrientation) {
      window.addEventListener('deviceorientation', handleOrientationChange);
    }

    // Écouter les changements d'orientation (fallback)
    const handleOrientationChangeFallback = () => {
      if ('orientation' in window) {
        const angle = (window as any).orientation;
        const type = getOrientationType(angle);
        setOrientation({
          angle,
          type,
          isPortrait: type === 'portrait',
          isLandscape: type === 'landscape',
        });
      }
    };

    window.addEventListener('orientationchange', handleOrientationChangeFallback);

    // Initialiser avec l'orientation actuelle
    if (hasDeviceOrientation) {
      // Demander la permission si nécessaire (iOS 13+)
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleOrientationChange);
            }
          })
          .catch((error: Error) => {
            logger.error('Error requesting device orientation permission', { error });
          });
      }
    }

    // Initialiser avec l'orientation actuelle (fallback)
    handleOrientationChangeFallback();

    return () => {
      if (hasDeviceOrientation) {
        window.removeEventListener('deviceorientation', handleOrientationChange);
      }
      window.removeEventListener('orientationchange', handleOrientationChangeFallback);
    };
  }, []);

  return {
    orientation,
    isSupported,
    angle: orientation.angle,
    type: orientation.type,
    isPortrait: orientation.isPortrait,
    isLandscape: orientation.isLandscape,
  };
}







