/**
 * Configuration centralisée pour GeniusPay
 */

import { GeniusPayConfig, GeniusPayPaymentMethod } from './geniuspay-types';
import { logger } from './logger';

/**
 * Méthodes acceptées par GeniusPay (`payment_method`).
 * @see https://geniuspay.ci/docs/api
 */
export const GENIUSPAY_PAYMENT_METHODS = [
  'pawapay',
  'wave',
  'orange_money',
  'mtn_money',
  'moov_money',
  'airtel_money',
  'paystack',
  'card',
] as const satisfies readonly GeniusPayPaymentMethod[];

/**
 * PawaPay = agrégateur Mobile Money (défaut checkout Emarzona).
 * Override possible via VITE_GENIUSPAY_DEFAULT_PAYMENT_METHOD.
 */
export const GENIUSPAY_DEFAULT_PAYMENT_METHOD: GeniusPayPaymentMethod = (() => {
  const raw = (import.meta.env.VITE_GENIUSPAY_DEFAULT_PAYMENT_METHOD || 'pawapay')
    .trim()
    .toLowerCase();
  return (GENIUSPAY_PAYMENT_METHODS as readonly string[]).includes(raw)
    ? (raw as GeniusPayPaymentMethod)
    : 'pawapay';
})();

/**
 * Configuration GeniusPay avec valeurs par défaut
 */
export const GENIUSPAY_CONFIG: GeniusPayConfig = {
  timeout: parseInt(import.meta.env.VITE_GENIUSPAY_TIMEOUT_MS || '30000', 10),
  maxRetries: parseInt(import.meta.env.VITE_GENIUSPAY_MAX_RETRIES || '3', 10),
  retryBackoff: parseInt(import.meta.env.VITE_GENIUSPAY_RETRY_BACKOFF_MS || '1000', 10),
  apiUrl: import.meta.env.VITE_GENIUSPAY_API_URL || 'https://geniuspay.ci/api/v1/merchant',
  defaultPaymentMethod: GENIUSPAY_DEFAULT_PAYMENT_METHOD,
};

export function isGeniusPayPaymentMethod(value: unknown): value is GeniusPayPaymentMethod {
  return (
    typeof value === 'string' && (GENIUSPAY_PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

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
    config: GENIUSPAY_CONFIG,
  });
}
