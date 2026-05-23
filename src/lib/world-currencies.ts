/**
 * Liste des devises ISO 4217 pour l’UI (quiz, sélecteurs globaux).
 */

const FALLBACK_CURRENCY_CODES = [
  'XOF',
  'XAF',
  'EUR',
  'USD',
  'GBP',
  'NGN',
  'GHS',
  'KES',
  'ZAR',
  'MAD',
  'EGP',
  'CAD',
  'CHF',
  'JPY',
  'CNY',
  'AUD',
  'BRL',
  'INR',
  'MXN',
  'AED',
  'SAR',
];

let displayNamesCache: Intl.DisplayNames | undefined;

function getDisplayNames(locale: string): Intl.DisplayNames | undefined {
  try {
    if (typeof Intl === 'undefined' || !('DisplayNames' in Intl)) return undefined;
    return new Intl.DisplayNames(locale, { type: 'currency' });
  } catch {
    return undefined;
  }
}

/** Codes ISO 4217 disponibles dans l’environnement (sinon liste de repli). */
export function getWorldCurrencyCodes(): string[] {
  try {
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      return [...Intl.supportedValuesOf('currency')].sort((a, b) => a.localeCompare(b, 'fr'));
    }
  } catch {
    // navigateur ancien
  }
  return [...FALLBACK_CURRENCY_CODES];
}

/** Nom localisé de la devise (ex. « euro » pour EUR). */
export function getCurrencyDisplayName(code: string, locale = 'fr'): string {
  if (!displayNamesCache) {
    displayNamesCache = getDisplayNames(locale);
  }
  const name = displayNamesCache?.of(code);
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
}

/** XOF en tête, puis devises courantes en Afrique / international, puis le reste alphabétique. */
export function getQuizCurrencyCodes(): string[] {
  const all = new Set(getWorldCurrencyCodes());
  const priority = [
    'XOF',
    'XAF',
    'EUR',
    'USD',
    'GBP',
    'NGN',
    'GHS',
    'KES',
    'ZAR',
    'MAD',
    'EGP',
    'XPF',
    'CDF',
    'GNF',
    'CHF',
    'CAD',
    'JPY',
    'CNY',
    'AUD',
    'BRL',
    'INR',
  ];
  const head = priority.filter(c => all.has(c));
  const tail = [...all].filter(c => !head.includes(c)).sort((a, b) => a.localeCompare(b, 'fr'));
  return [...head, ...tail];
}
