/**
 * Hook useBattery - Statut de la batterie
 * Fournit une API simple pour obtenir le statut de la batterie
 * 
 * @example
 * ```tsx
 * const { level, charging, chargingTime, dischargingTime } = useBattery();
 * ```
 */

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface BatteryStatus {
  /**
   * Niveau de batterie (0 à 1)
   */
  level: number;
  /**
   * Indique si la batterie est en charge
   */
  charging: boolean;
  /**
   * Temps estimé jusqu'à la charge complète (en secondes)
   */
  chargingTime: number | null;
  /**
   * Temps estimé jusqu'à la décharge complète (en secondes)
   */
  dischargingTime: number | null;
}

export interface UseBatteryReturn {
  /**
   * Statut de la batterie
   */
  battery: BatteryStatus | null;
  /**
   * Indique si l'API Battery est supportée
   */
  isSupported: boolean;
  /**
   * Niveau de batterie en pourcentage (0 à 100)
   */
  level: number;
  /**
   * Indique si la batterie est en charge
   */
  charging: boolean;
  /**
   * Temps estimé jusqu'à la charge complète (formaté)
   */
  chargingTimeFormatted: string | null;
  /**
   * Temps estimé jusqu'à la décharge complète (formaté)
   */
  dischargingTimeFormatted: string | null;
}

/**
 * Formater le temps en heures:minutes
 */
function formatTime(seconds: number | null): string | null {
  if (seconds === null || seconds === Infinity) return null;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Hook pour gérer le statut de la batterie
 */
export function useBattery(): UseBatteryReturn {
  const [battery, setBattery] = useState<BatteryStatus | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if ('getBattery' in navigator) {
        try {
          const batteryManager = await (navigator as any).getBattery();
          setIsSupported(true);

          const updateBattery = () => {
            setBattery({
              level: batteryManager.level,
              charging: batteryManager.charging,
              chargingTime: batteryManager.chargingTime,
              dischargingTime: batteryManager.dischargingTime,
            });
          };

          // Mettre à jour immédiatement
          updateBattery();

          // Écouter les changements
          batteryManager.addEventListener('chargingchange', updateBattery);
          batteryManager.addEventListener('levelchange', updateBattery);
          batteryManager.addEventListener('chargingtimechange', updateBattery);
          batteryManager.addEventListener('dischargingtimechange', updateBattery);

          return () => {
            batteryManager.removeEventListener('chargingchange', updateBattery);
            batteryManager.removeEventListener('levelchange', updateBattery);
            batteryManager.removeEventListener('chargingtimechange', updateBattery);
            batteryManager.removeEventListener('dischargingtimechange', updateBattery);
          };
        } catch (error) {
          logger.error('Error accessing battery API', { error });
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  const level = battery ? Math.round(battery.level * 100) : 0;
  const charging = battery?.charging ?? false;
  const chargingTimeFormatted = battery ? formatTime(battery.chargingTime) : null;
  const dischargingTimeFormatted = battery ? formatTime(battery.dischargingTime) : null;

  return {
    battery,
    isSupported,
    level,
    charging,
    chargingTimeFormatted,
    dischargingTimeFormatted,
  };
}







