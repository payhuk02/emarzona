/**
 * Service de récupération des taux de change depuis une API externe
 * Utilise ExchangeRate-API (gratuit, pas de clé API requise)
 * Fallback sur les taux statiques en cas d'erreur
 */

import { logger } from './logger';
import type { Currency } from './currency-converter';

export interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
  base: string;
}

// Cache en mémoire (durée de vie : 1 heure)
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes
let cachedRates: CachedRates | null = null;

/**
 * Récupère les taux de change depuis ExchangeRate-API
 * Note: ExchangeRate-API gratuit ne supporte pas XOF directement
 * On utilise EUR comme base et on convertit via les taux fixes XOF/EUR
 */
export async function fetchExchangeRates(
  baseCurrency: Currency = 'EUR'
): Promise<Record<string, number> | null> {
  try {
    // Vérifier le cache d'abord
    if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
      logger.debug('Using cached exchange rates', {
        base: cachedRates.base,
        age: Math.round((Date.now() - cachedRates.timestamp) / 1000 / 60) + ' minutes',
      });
      return cachedRates.rates;
    }

    // Récupérer les taux depuis l'API
    // ExchangeRate-API gratuit : https://api.exchangerate-api.com/v4/latest/{base}
    const apiUrl = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
    
    logger.info('Fetching exchange rates from API', { apiUrl, baseCurrency });
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Timeout de 5 secondes
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data: ExchangeRateResponse = await response.json();

    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid API response format');
    }

    // Convertir les taux en format attendu
    const rates: Record<string, number> = {
      ...data.rates,
      // Ajouter le taux de base (1:1)
      [baseCurrency]: 1,
    };

    // Mettre en cache
    cachedRates = {
      rates,
      timestamp: Date.now(),
      base: baseCurrency,
    };

    logger.info('Exchange rates fetched successfully', {
      base: baseCurrency,
      date: data.date,
      currenciesCount: Object.keys(rates).length,
    });

    return rates;
  } catch (error: any) {
    logger.error('Failed to fetch exchange rates from API', {
      error: error.message,
      baseCurrency,
      fallback: 'using static rates',
    });
    
    // Retourner null pour utiliser les taux statiques en fallback
    return null;
  }
}

/**
 * Convertit les taux depuis une devise de base (EUR) vers XOF
 * Utilise le taux fixe XOF/EUR pour convertir tous les autres taux
 * 
 * L'API retourne des taux comme : { USD: 1.10 } signifiant "1 EUR = 1.10 USD"
 * On convertit cela en taux XOF : "1 currency = X XOF"
 */
export function convertRatesToXOF(
  eurRates: Record<string, number>,
  xofToEurRate: number = 0.00152
): Record<string, number> {
  const eurToXofRate = 1 / xofToEurRate; // ~655.957 XOF pour 1 EUR
  
  // Taux de base : 1 XOF = 1 XOF
  const baseRates: Record<string, number> = {
    XOF: 1,
  };

  // Convertir tous les taux depuis EUR vers XOF
  // Si l'API dit "1 EUR = 1.10 USD", alors:
  // - 1 EUR = 655.957 XOF
  // - 1 USD = (1/1.10) EUR = 0.909 EUR = 0.909 * 655.957 XOF = 596.27 XOF
  for (const [currency, eurRate] of Object.entries(eurRates)) {
    if (currency === 'EUR') {
      baseRates['EUR'] = eurToXofRate;
    } else if (currency !== 'XOF' && eurRate > 0) {
      // Taux en XOF = (1 / taux EUR) * (EUR vers XOF)
      // Car si 1 EUR = X currency, alors 1 currency = (1/X) EUR
      baseRates[currency] = (1 / eurRate) * eurToXofRate;
    }
  }

  // Générer tous les taux de conversion entre les devises supportées
  const supportedCurrencies: Currency[] = ['XOF', 'EUR', 'USD', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'];
  
  const conversionRates: Record<string, number> = {};
  
  for (const from of supportedCurrencies) {
    for (const to of supportedCurrencies) {
      if (from === to) continue;
      
      const key = `${from}_${to}`;
      
      // Obtenir les taux de base en XOF
      const fromRateInXof = from === 'XOF' ? 1 : baseRates[from];
      const toRateInXof = to === 'XOF' ? 1 : baseRates[to];
      
      if (fromRateInXof && toRateInXof && fromRateInXof > 0) {
        // Taux de conversion = (Taux de destination en XOF) / (Taux de source en XOF)
        // Exemple: XOF vers USD = (Taux USD en XOF) / (Taux XOF) = USD_rate / 1
        conversionRates[key] = toRateInXof / fromRateInXof;
      }
    }
  }

  // Fusionner les taux de base et les taux de conversion
  return {
    ...baseRates,
    ...conversionRates,
  };
}

/**
 * Met à jour les taux de change et retourne les nouveaux taux
 */
export async function updateExchangeRates(): Promise<Record<string, number> | null> {
  try {
    // Récupérer les taux depuis l'API (base EUR)
    const eurRates = await fetchExchangeRates('EUR');
    
    if (!eurRates) {
      logger.warn('Failed to fetch rates from API, using static rates');
      return null;
    }

    // Convertir en taux XOF
    const xofRates = convertRatesToXOF(eurRates);
    
    return xofRates;
  } catch (error: any) {
    logger.error('Error updating exchange rates', { error: error.message });
    return null;
  }
}

/**
 * Récupère un taux de change spécifique depuis le cache ou l'API
 */
export async function getExchangeRate(
  from: Currency,
  to: Currency
): Promise<number | null> {
  if (from === to) {
    return 1;
  }

  // Essayer de récupérer depuis le cache ou l'API
  const rates = await fetchExchangeRates('EUR');
  
  if (!rates) {
    return null; // Utiliser les taux statiques en fallback
  }

  // Convertir en taux XOF
  const xofRates = convertRatesToXOF(rates);

  // Récupérer le taux spécifique
  const rateKey = `${from}_${to}`;
  const rate = xofRates[rateKey] || xofRates[to] / xofRates[from];

  return rate || null;
}

/**
 * Efface le cache des taux de change (force un nouveau fetch)
 */
export function clearExchangeRateCache(): void {
  cachedRates = null;
  logger.info('Exchange rate cache cleared');
}

/**
 * Récupère les informations du cache actuel
 */
export function getCacheInfo(): { cached: boolean; age?: number; base?: string } {
  if (!cachedRates) {
    return { cached: false };
  }

  const age = Date.now() - cachedRates.timestamp;
  return {
    cached: true,
    age: Math.round(age / 1000 / 60), // Age en minutes
    base: cachedRates.base,
  };
}

