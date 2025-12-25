/**
 * Hook useNetworkStatus - Gestion améliorée du statut réseau
 * Fournit des informations détaillées sur la connexion réseau
 * 
 * @example
 * ```tsx
 * const { isOnline, isOffline, effectiveType, downlink } = useNetworkStatus();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useToastHelpers } from './useToastHelpers';

export interface NetworkStatus {
  /**
   * Indique si l'utilisateur est en ligne
   */
  isOnline: boolean;
  /**
   * Indique si l'utilisateur est hors ligne
   */
  isOffline: boolean;
  /**
   * Type de connexion effectif (2g, 3g, 4g, slow-2g)
   */
  effectiveType?: string;
  /**
   * Vitesse de téléchargement estimée (Mbps)
   */
  downlink?: number;
  /**
   * RTT estimé (ms)
   */
  rtt?: number;
  /**
   * Indique si la connexion permet d'économiser les données
   */
  saveData?: boolean;
  /**
   * Dernière fois que le statut a changé
   */
  lastChanged?: Date;
}

export interface UseNetworkStatusOptions {
  /**
   * Afficher des toasts lors des changements
   * @default true
   */
  showToasts?: boolean;
  /**
   * Callback appelé quand la connexion est rétablie
   */
  onOnline?: () => void;
  /**
   * Callback appelé quand la connexion est perdue
   */
  onOffline?: () => void;
}

/**
 * Hook pour obtenir le statut réseau
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}): NetworkStatus {
  const { showToasts = true, onOnline, onOffline } = options;
  const { showSuccess, showWarning } = useToastHelpers();

  const getNetworkInfo = useCallback((): NetworkStatus => {
    if (typeof navigator === 'undefined') {
      return {
        isOnline: true,
        isOffline: false,
      };
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      isOffline: !navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
    };
  }, []);

  const [status, setStatus] = useState<NetworkStatus>(() => ({
    ...getNetworkInfo(),
    lastChanged: new Date(),
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStatus = () => {
      const newStatus = {
        ...getNetworkInfo(),
        lastChanged: new Date(),
      };

      setStatus((prev) => {
        // Vérifier si le statut a changé
        if (prev.isOnline !== newStatus.isOnline) {
          if (newStatus.isOnline) {
            if (showToasts) {
              showSuccess('Connexion rétablie');
            }
            onOnline?.();
          } else {
            if (showToasts) {
              showWarning('Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.');
            }
            onOffline?.();
          }
        }

        return newStatus;
      });
    };

    // Écouter les événements online/offline
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Écouter les changements de connexion (si disponible)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    // Mettre à jour immédiatement
    updateStatus();

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, [getNetworkInfo, showToasts, onOnline, onOffline, showSuccess, showWarning]);

  return status;
}

/**
 * Hook simplifié pour vérifier si on est en ligne
 */
export function useIsOnline(): boolean {
  const { isOnline } = useNetworkStatus({ showToasts: false });
  return isOnline;
}

/**
 * Hook pour vérifier si la connexion est lente
 */
export function useIsSlowConnection(): boolean {
  const { effectiveType, downlink } = useNetworkStatus({ showToasts: false });
  
  if (effectiveType) {
    return effectiveType === 'slow-2g' || effectiveType === '2g';
  }
  
  if (downlink !== undefined) {
    return downlink < 1.5; // Moins de 1.5 Mbps
  }
  
  return false;
}

