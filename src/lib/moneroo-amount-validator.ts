/**
 * Validateur de montants pour Moneroo
 * Valide les montants selon les limites de l'API Moneroo
 */

import { Currency } from './currency-converter';
import { MonerooValidationError } from './moneroo-errors';
import { logger } from './logger';

/**
 * Limites de montants par devise selon Moneroo
 * Source: Documentation Moneroo (à vérifier avec la documentation officielle)
 */
const AMOUNT_LIMITS: Record<Currency, { min: number; max: number }> = {
  XOF: { min: 100, max: 10000000 },      // 100 XOF à 10,000,000 XOF (10M)
  NGN: { min: 100, max: 10000000 },      // 100 NGN à 10,000,000 NGN
  GHS: { min: 1, max: 100000 },          // 1 GHS à 100,000 GHS
  KES: { min: 10, max: 1000000 },        // 10 KES à 1,000,000 KES
  ZAR: { min: 10, max: 1000000 },        // 10 ZAR à 1,000,000 ZAR
  UGX: { min: 1000, max: 50000000 },      // 1,000 UGX à 50,000,000 UGX
  TZS: { min: 1000, max: 50000000 },      // 1,000 TZS à 50,000,000 TZS
  RWF: { min: 100, max: 10000000 },       // 100 RWF à 10,000,000 RWF
  ETB: { min: 10, max: 1000000 },        // 10 ETB à 1,000,000 ETB
  USD: { min: 1, max: 10000 },           // 1 USD à 10,000 USD
  EUR: { min: 1, max: 10000 },           // 1 EUR à 10,000 EUR
  GBP: { min: 1, max: 10000 },           // 1 GBP à 10,000 GBP
};

/**
 * Limites par défaut (si devise non supportée)
 */
const DEFAULT_LIMITS = { min: 100, max: 10000000 };

/**
 * Obtient les limites de montant pour une devise
 */
export function getAmountLimits(currency: Currency): { min: number; max: number } {
  return AMOUNT_LIMITS[currency] || DEFAULT_LIMITS;
}

/**
 * Valide un montant selon les limites Moneroo
 * @param amount - Montant à valider
 * @param currency - Devise
 * @throws MonerooValidationError si le montant est invalide
 */
export function validateAmount(amount: number, currency: Currency = 'XOF'): void {
  // Vérifier que le montant est un nombre valide
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    throw new MonerooValidationError(
      `Montant invalide: ${amount}. Le montant doit être un nombre valide.`
    );
  }

  // Vérifier que le montant est positif
  if (amount <= 0) {
    throw new MonerooValidationError(
      `Montant invalide: ${amount}. Le montant doit être supérieur à 0.`
    );
  }

  // Vérifier que le montant est un entier (pas de décimales)
  // Moneroo utilise généralement des montants en unités entières (centimes, etc.)
  if (!Number.isInteger(amount)) {
    logger.warn('[MonerooAmountValidator] Amount is not an integer, rounding:', {
      amount,
      currency,
      rounded: Math.round(amount),
    });
    // Note: On pourrait arrondir, mais pour l'instant on rejette
    throw new MonerooValidationError(
      `Montant invalide: ${amount}. Le montant doit être un nombre entier (pas de décimales).`
    );
  }

  // Obtenir les limites pour la devise
  const limits = getAmountLimits(currency);

  // Vérifier le minimum
  if (amount < limits.min) {
    throw new MonerooValidationError(
      `Montant trop faible: ${amount} ${currency}. Le montant minimum est ${limits.min} ${currency}.`
    );
  }

  // Vérifier le maximum
  if (amount > limits.max) {
    throw new MonerooValidationError(
      `Montant trop élevé: ${amount} ${currency}. Le montant maximum est ${limits.max} ${currency}.`
    );
  }

  logger.debug('[MonerooAmountValidator] Amount validated', {
    amount,
    currency,
    limits,
  });
}

/**
 * Normalise un montant (arrondit si nécessaire)
 * @param amount - Montant à normaliser
 * @param currency - Devise
 * @returns Montant normalisé (entier)
 */
export function normalizeAmount(amount: number, currency: Currency = 'XOF'): number {
  // Arrondir à l'entier le plus proche
  const rounded = Math.round(amount);
  
  // Vérifier les limites après arrondi
  const limits = getAmountLimits(currency);
  
  if (rounded < limits.min) {
    return limits.min;
  }
  
  if (rounded > limits.max) {
    return limits.max;
  }
  
  return rounded;
}

/**
 * Formate un montant pour l'affichage avec la devise
 */
export function formatAmount(amount: number, currency: Currency = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Vérifie si un montant est dans les limites acceptables
 */
export function isAmountValid(amount: number, currency: Currency = 'XOF'): boolean {
  try {
    validateAmount(amount, currency);
    return true;
  } catch {
    return false;
  }
}


