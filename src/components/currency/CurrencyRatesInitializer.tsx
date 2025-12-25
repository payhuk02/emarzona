/**
 * Composant pour initialiser les taux de change au démarrage de l'application
 * Charge les taux depuis l'API en arrière-plan
 */

import { useEffect } from 'react';
import { updateExchangeRates } from '@/lib/currency-converter';
import { logger } from '@/lib/logger';

export function CurrencyRatesInitializer() {
  useEffect(() => {
    // Initialiser les taux de change au démarrage
    const initializeRates = async () => {
      try {
        logger.info('Initializing exchange rates on app startup...');
        await updateExchangeRates();
        logger.info('Exchange rates initialized successfully');
      } catch (error: any) {
        logger.error('Failed to initialize exchange rates on startup', {
          error: error.message,
          fallback: 'using static rates',
        });
        // Ne pas bloquer l'application si l'API échoue
        // Les taux de fallback seront utilisés
      }
    };

    initializeRates();

    // Mettre à jour les taux toutes les heures
    const intervalId = setInterval(() => {
      initializeRates();
    }, 60 * 60 * 1000); // 1 heure

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Ce composant ne rend rien
  return null;
}







