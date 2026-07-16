/**
 * Configuration centralisée pour GeniusPay
 */

import { GeniusPayConfig } from './geniuspay-types';
import { logger } from './logger';

/**
 * Configuration GeniusPay avec valeurs par défaut
 */
export const GENIUSPAY_CONFIG : GeniusPayConfig = {
  timeout: parseInt(import.meta.env.VITE_GENIUSPAY_TIMEOUT_MS || '30000', 10),
  maxRetries: parseInt(import.meta.env.VITE_GENIUSPAY_MAX_RETRIES || '3', 10),
  retryBackoff: parseInt(import.meta.env.VITE_GENIUSPAY_RETRY_BACKOFF_MS || '1000', 10),
  apiUrl: import.meta.env.VITE_GENIUSPAY_API_URL || 'https://geniuspay.ci/api/v1/merchant',
};

/**
 * Valide la configuration GeniusPay
 */
export function validateGeniusPayConfig(): void {
  if (GENIUSPAY_CONFIG.timeout <= 0) {
    throw new Error('VITE_GENIUSPAY_TIMEOUT_MS must be greater than 0');
  }
  
  if (GENIUSPAY_CONFIG.maxRetries < 0) {
    throw new Error('VITE_GENIUSPAY_MAX_RETRIES must be >= 0');
  }
  
  if (GENIUSPAY_CONFIG.retryBackoff <= 0) {
    throw new Error('VITE_GENIUSPAY_RETRY_BACKOFF_MS must be greater than 0');
  }
  
  if (!GENIUSPAY_CONFIG.apiUrl || !GENIUSPAY_CONFIG.apiUrl.startsWith('http')) {
    throw new Error('VITE_GENIUSPAY_API_URL must be a valid HTTP(S) URL');
  }
}

// Valider la configuration au chargement du module
try {
  validateGeniusPayConfig();
} catch (error) {
  logger.error('Invalid GeniusPay configuration', { 
    error, 
    config: GENIUSPAY_CONFIG 
  });
}









