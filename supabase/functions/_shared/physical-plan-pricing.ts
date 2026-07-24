/**
 * Tarification plans physiques — conversion USD → devise checkout (Edge Functions)
 * Les checkouts d'abonnement vendeur incluent les frais acheteur 2%+100.
 */

import {
  applyCheckoutPlatformFee,
  estimatePlanAmountFromCheckoutTtc,
} from './checkout-platform-fee.ts';

const ZERO_DECIMAL = new Set(['XOF', 'XAF', 'XPF', 'JPY', 'KRW', 'VND', 'CLP', 'UGX', 'RWF']);

const FALLBACK_RATES: Record<string, number> = {
  USD_XOF: 599.04,
  USD_EUR: 0.91,
  USD_GBP: 0.79,
  USD_NGN: 1500,
  USD_GHS: 15,
  USD_KES: 138,
  USD_ZAR: 18.6,
  EUR_USD: 1.1,
  GBP_USD: 1.27,
  XOF_USD: 0.00167,
};

function getRateBetween(from: string, to: string): number {
  if (from === to) return 1;
  const direct = FALLBACK_RATES[`${from}_${to}`];
  if (direct) return direct;

  if (from !== 'USD' && to !== 'USD') {
    const toUsd = FALLBACK_RATES[`${from}_USD`];
    const usdTo = FALLBACK_RATES[`USD_${to}`];
    if (toUsd && usdTo) return toUsd * usdTo;
  }

  if (from === 'USD') {
    const inverse = FALLBACK_RATES[`${to}_USD`];
    if (inverse) return 1 / inverse;
  }

  return 1;
}

export function roundAmountForCurrency(amount: number, currency: string): number {
  if (ZERO_DECIMAL.has(currency)) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

export function convertPlanAmountToCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return roundAmountForCurrency(amount, toCurrency);
  }
  const converted = amount * getRateBetween(fromCurrency, toCurrency);
  return roundAmountForCurrency(converted, toCurrency);
}

/** Client (taux API live) vs serveur (fallback) — marge pour divergence FX légitime. */
const FX_TOLERANCE_RATIO = 0.05;
const FX_TOLERANCE_USD_MIN = 0.5;

function amountInCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return roundAmountForCurrency(amount, toCurrency);
  }
  return convertPlanAmountToCurrency(amount, fromCurrency, toCurrency);
}

/** Valide qu'un montant checkout correspond au montant plan (avec conversion). */
export function isAuthorizedPlanCheckoutAmount(
  expectedAmount: number,
  expectedCurrency: string,
  clientAmount: number,
  clientCurrency: string
): boolean {
  const normalizedExpected = roundAmountForCurrency(expectedAmount, expectedCurrency);
  const normalizedClient = roundAmountForCurrency(clientAmount, clientCurrency);

  if (expectedCurrency === clientCurrency) {
    return normalizedClient === normalizedExpected;
  }

  // Compare in the plan's reference currency so client live FX and server fallback both work.
  const clientInExpectedCurrency = amountInCurrency(
    normalizedClient,
    clientCurrency,
    expectedCurrency
  );
  const tolerance = Math.max(FX_TOLERANCE_USD_MIN, normalizedExpected * FX_TOLERANCE_RATIO);

  return Math.abs(clientInExpectedCurrency - normalizedExpected) <= tolerance;
}

/**
 * Valide un checkout d'abonnement physique TTC (plan + frais 2%+100).
 * Le client envoie toujours le total avec frais ; on estime le plan hors frais puis on compare.
 */
export function isAuthorizedPlanCheckoutAmountWithFee(
  expectedPlanAmount: number,
  expectedCurrency: string,
  clientTtcAmount: number,
  clientCurrency: string
): boolean {
  const normalizedExpected = roundAmountForCurrency(expectedPlanAmount, expectedCurrency);
  const normalizedClientTtc = roundAmountForCurrency(clientTtcAmount, clientCurrency);

  if (expectedCurrency === clientCurrency) {
    const expectedTtc = applyCheckoutPlatformFee(normalizedExpected, expectedCurrency);
    return normalizedClientTtc === expectedTtc;
  }

  const estimatedPlanInClient = estimatePlanAmountFromCheckoutTtc(
    normalizedClientTtc,
    clientCurrency
  );
  return isAuthorizedPlanCheckoutAmount(
    normalizedExpected,
    expectedCurrency,
    estimatedPlanInClient,
    clientCurrency
  );
}

/** Montant autorisé pour GeniusPay après validation (aligné sur ce que le client a affiché). */
export function resolveAuthorizedCheckoutAmount(
  expectedAmount: number,
  expectedCurrency: string,
  clientAmount: number,
  clientCurrency: string
): number {
  if (expectedCurrency === clientCurrency) {
    return roundAmountForCurrency(expectedAmount, expectedCurrency);
  }
  return roundAmountForCurrency(clientAmount, clientCurrency);
}

/** Montant TTC autorisé (plan + frais 2%+100) après validation. */
export function resolveAuthorizedCheckoutAmountWithFee(
  expectedPlanAmount: number,
  expectedCurrency: string,
  clientTtcAmount: number,
  clientCurrency: string
): number {
  if (expectedCurrency === clientCurrency) {
    return applyCheckoutPlatformFee(
      roundAmountForCurrency(expectedPlanAmount, expectedCurrency),
      expectedCurrency
    );
  }
  return roundAmountForCurrency(clientTtcAmount, clientCurrency);
}
