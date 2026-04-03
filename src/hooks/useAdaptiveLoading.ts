import { useState, useEffect } from 'react';

interface NetworkInformation extends EventTarget {
  readonly downlink?: number;
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt?: number;
  readonly saveData?: boolean;
  onchange?: EventListener;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

/**
 * Hook pour implémenter le chargement adaptatif basé sur la connexion réseau.
 * Détecte la vitesse du réseau et le mode économie de données pour adapter
 * le chargement des ressources (ex: images, composants).
 *
 * Retourne:
 * - isLowBandwidth: true si la connexion est lente (2g, slow-2g) ou en mode économie de données.
 * - effectiveConnectionType: le type de connexion effectif (slow-2g, 2g, 3g, 4g).
 * - downlink: la vitesse de téléchargement estimée en Mbps.
 * - saveData: true si le mode économie de données est activé.
 */
export function useAdaptiveLoading() {
  const getConnectionState = () => {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const { effectiveType, downlink, saveData } = navigator.connection;
      return {
        effectiveType: effectiveType || '4g',
        downlink: downlink || 10, // Valeur par défaut si non disponible
        saveData: saveData || false,
      };
    }
    return {
      effectiveType: '4g', // Valeur par défaut pour SSR ou navigateurs non supportés
      downlink: 10,
      saveData: false,
    };
  };

  const [connectionState, setConnectionState] = useState(getConnectionState);

  useEffect(() => {
    const connection = navigator.connection;
    if (!connection) return;

    const handleConnectionChange = () => {
      setConnectionState(getConnectionState());
    };

    connection.addEventListener('change', handleConnectionChange);
    return () => {
      connection.removeEventListener('change', handleConnectionChange);
    };
  }, []);

  const isLowBandwidth =
    connectionState.effectiveType &&
    (connectionState.effectiveType === '2g' ||
      connectionState.effectiveType === 'slow-2g' ||
      connectionState.saveData);

  return {
    isLowBandwidth,
    effectiveConnectionType: connectionState.effectiveType,
    downlink: connectionState.downlink,
    saveData: connectionState.saveData,
  };
}
