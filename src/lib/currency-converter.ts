/**
 * Service de conversion de devises
 * Supporte la conversion entre différentes devises pour Moneroo
 * Utilise une API de taux de change en temps réel avec fallback sur taux statiques
 */

import { updateExchangeRates as fetchRatesFromAPI } from './currency-exchange-api';
import { logger } from './logger';

export type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'NGN' | 'GHS' | 'KES' | 'ZAR';

export interface CurrencyRate {
  from: Currency;
  to: Currency;
  rate: number;
  updatedAt: string;
}

/**
 * Taux de change de base (fallback si l'API n'est pas disponible)
 * Ces taux sont utilisés en cas d'erreur API ou lors du premier chargement
 */
const FALLBACK_RATES: Record<string, number> = {
  // XOF (Franc CFA) comme devise de base
  'XOF_EUR': 0.00152, // 1 XOF = 0.00152 EUR
  'XOF_USD': 0.00167, // 1 XOF = 0.00167 USD
  'XOF_GBP': 0.00132, // 1 XOF = 0.00132 GBP
  'XOF_NGN': 2.50,    // 1 XOF = 2.50 NGN
  'XOF_GHS': 0.025,   // 1 XOF = 0.025 GHS
  'XOF_KES': 0.23,    // 1 XOF = 0.23 KES
  'XOF_ZAR': 0.031,   // 1 XOF = 0.031 ZAR

  // Taux inverses
  'EUR_XOF': 655.957, // 1 EUR = 655.957 XOF
  'USD_XOF': 599.04,  // 1 USD = 599.04 XOF
  'GBP_XOF': 757.576, // 1 GBP = 757.576 XOF
  'NGN_XOF': 0.40,    // 1 NGN = 0.40 XOF
  'GHS_XOF': 40.00,   // 1 GHS = 40.00 XOF
  'KES_XOF': 4.35,    // 1 KES = 4.35 XOF
  'ZAR_XOF': 32.26,   // 1 ZAR = 32.26 XOF

  // Autres conversions
  'EUR_USD': 1.10,
  'USD_EUR': 0.91,
  'EUR_GBP': 0.86,
  'GBP_EUR': 1.16,
  'USD_GBP': 0.79,
  'GBP_USD': 1.27,
};

/**
 * Taux de change dynamiques (mis à jour depuis l'API)
 * Sera mis à jour automatiquement lors du premier appel
 */
let DYNAMIC_RATES: Record<string, number> | null = null;

/**
 * Indique si les taux ont été initialisés
 */
let ratesInitialized = false;

/**
 * Initialise les taux de change depuis l'API (appelé automatiquement au premier usage)
 */
async function initializeRates(): Promise<void> {
  if (ratesInitialized) {
    return;
  }

  try {
    // Récupérer les taux depuis l'API
    const apiRates = await fetchRatesFromAPI();
    
    if (apiRates) {
      DYNAMIC_RATES = apiRates;
      logger.info('Exchange rates initialized from API', {
        ratesCount: Object.keys(apiRates).length,
      });
    } else {
      logger.warn('Failed to fetch rates from API, using fallback rates');
      DYNAMIC_RATES = FALLBACK_RATES;
    }
  } catch (error: any) {
    logger.error('Error initializing exchange rates', { error: error.message });
    DYNAMIC_RATES = FALLBACK_RATES;
  } finally {
    ratesInitialized = true;
  }
}

/**
 * Récupère le taux de change entre deux devises (priorité: API > Fallback)
 */
function getRate(from: Currency, to: Currency): number {
  const rateKey = `${from}_${to}`;
  
  // Essayer d'abord les taux dynamiques (API)
  if (DYNAMIC_RATES && DYNAMIC_RATES[rateKey]) {
    return DYNAMIC_RATES[rateKey];
  }
  
  // Fallback sur les taux statiques
  if (FALLBACK_RATES[rateKey]) {
    return FALLBACK_RATES[rateKey];
  }
  
  // Si pas de taux direct, essayer de calculer via une devise intermédiaire (EUR)
  if (from !== 'EUR' && to !== 'EUR') {
    const fromToEurKey = `${from}_EUR`;
    const eurToToKey = `EUR_${to}`;
    
    let fromToEur: number | undefined;
    let eurToTo: number | undefined;
    
    // Essayer depuis les taux dynamiques
    if (DYNAMIC_RATES) {
      fromToEur = DYNAMIC_RATES[fromToEurKey];
      eurToTo = DYNAMIC_RATES[eurToToKey];
    }
    
    // Si pas trouvé, essayer depuis les taux de fallback
    if (!fromToEur) fromToEur = FALLBACK_RATES[fromToEurKey];
    if (!eurToTo) eurToTo = FALLBACK_RATES[eurToToKey];
    
    // Si on a les deux taux, calculer le taux de conversion
    if (fromToEur && eurToTo) {
      return fromToEur * eurToTo;
    }
  }
  
  // Si toujours pas de taux, retourner 1 (pas de conversion)
  logger.warn(`Exchange rate not found for ${from} to ${to}, using 1:1`);
  return 1;
}

/**
 * Convertit un montant d'une devise à une autre
 * Utilise les taux de l'API si disponibles, sinon les taux de fallback
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) {
    return amount;
  }

  // Initialiser les taux si ce n'est pas déjà fait (de façon asynchrone)
  if (!ratesInitialized) {
    initializeRates().catch((error) => {
      logger.error('Failed to initialize rates', { error });
    });
  }

  const rate = getRate(from, to);
  return amount * rate;
}

/**
 * Formate un montant selon la devise
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'XOF' ? 0 : 2,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2,
  });

  return formatter.format(amount);
}

/**
 * Récupère le symbole de devise
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    XOF: 'CFA',
    EUR: '€',
    USD: '$',
    GBP: '£',
    NGN: '₦',
    GHS: '₵',
    KES: 'KSh',
    ZAR: 'R',
  };

  return symbols[currency] || currency;
}

/**
 * Vérifie si une devise est supportée
 */
export function isSupportedCurrency(currency: string): currency is Currency {
  return ['XOF', 'EUR', 'USD', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'].includes(currency);
}

/**
 * Récupère toutes les devises supportées
 */
export function getSupportedCurrencies(): Currency[] {
  return ['XOF', 'EUR', 'USD', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'];
}

/**
 * Récupère le taux de change entre deux devises
 * Utilise les taux de l'API si disponibles, sinon les taux de fallback
 */
export function getExchangeRate(from: Currency, to: Currency): number {
  if (from === to) {
    return 1;
  }

  // Initialiser les taux si ce n'est pas déjà fait (de façon asynchrone)
  if (!ratesInitialized) {
    initializeRates().catch((error) => {
      logger.error('Failed to initialize rates', { error });
    });
  }

  return getRate(from, to);
}

/**
 * Met à jour les taux de change depuis une API externe
 * Force un nouveau fetch des taux depuis l'API et met à jour le cache
 */
export async function updateExchangeRates(): Promise<void> {
  try {
    logger.info('Updating exchange rates from API...');
    
    // Forcer un nouveau fetch (le cache sera ignoré)
    const apiRates = await fetchRatesFromAPI();
    
    if (apiRates) {
      DYNAMIC_RATES = apiRates;
      ratesInitialized = true;
      logger.info('Exchange rates updated successfully', {
        ratesCount: Object.keys(apiRates).length,
      });
    } else {
      logger.warn('Failed to update rates from API, keeping existing rates');
    }
  } catch (error: any) {
    logger.error('Error updating exchange rates', { error: error.message });
    throw error;
  }
}

/**
 * Récupère les taux de change actuels (depuis l'API ou fallback)
 */
export function getCurrentRates(): Record<string, number> {
  return DYNAMIC_RATES || FALLBACK_RATES;
}

/**
 * Vérifie si les taux proviennent de l'API ou du fallback
 */
export function areRatesFromAPI(): boolean {
  return DYNAMIC_RATES !== null && DYNAMIC_RATES !== FALLBACK_RATES;
}

