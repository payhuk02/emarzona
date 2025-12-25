/**
 * Configuration centralisée pour Moneroo
 */

import { MonerooConfig } from './moneroo-types';
import { logger } from './logger';

/**
 * Configuration Moneroo avec valeurs par défaut
 */
export const MONEROO_CONFIG: MonerooConfig = {
  timeout: parseInt(import.meta.env.VITE_MONEROO_TIMEOUT_MS || '30000', 10),
  maxRetries: parseInt(import.meta.env.VITE_MONEROO_MAX_RETRIES || '3', 10),
  retryBackoff: parseInt(import.meta.env.VITE_MONEROO_RETRY_BACKOFF_MS || '1000', 10),
  apiUrl: import.meta.env.VITE_MONEROO_API_URL || 'https://api.moneroo.io/v1',
};

/**
 * Valide la configuration Moneroo
 */
export function validateMonerooConfig(): void {
  if (MONEROO_CONFIG.timeout <= 0) {
    throw new Error('VITE_MONEROO_TIMEOUT_MS must be greater than 0');
  }
  
  if (MONEROO_CONFIG.maxRetries < 0) {
    throw new Error('VITE_MONEROO_MAX_RETRIES must be >= 0');
  }
  
  if (MONEROO_CONFIG.retryBackoff <= 0) {
    throw new Error('VITE_MONEROO_RETRY_BACKOFF_MS must be greater than 0');
  }
  
  if (!MONEROO_CONFIG.apiUrl || !MONEROO_CONFIG.apiUrl.startsWith('http')) {
    throw new Error('VITE_MONEROO_API_URL must be a valid HTTP(S) URL');
  }
}

// Valider la configuration au chargement du module
try {
  validateMonerooConfig();
} catch (error) {
  logger.error('Invalid Moneroo configuration', { 
    error, 
    config: MONEROO_CONFIG 
  });
}


