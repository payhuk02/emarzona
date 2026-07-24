/**
 * Frais checkout acheteur : 2 % + 100 XOF (converti si autre devise).
 * Miroir de src/lib/checkout/platform-fee.ts — utilisé pour validation abonnements physiques.
 */

const CHECKOUT_PLATFORM_FEE_RATE = 0.02;
const CHECKOUT_PLATFORM_FEE_FIXED_XOF = 100;

const ZERO_DECIMAL = new Set(['XOF', 'XAF', 'XPF', 'JPY', 'KRW', 'VND', 'CLP', 'UGX', 'RWF']);

/** Taux fallback alignés sur physical-plan-pricing.ts */
const FALLBACK_RATES: Record<string, number> = {
  USD_XOF: 599.04,
  XOF_USD: 0.00167,
  EUR_XOF: 655.957,
  XOF_EUR: 0.00152,
  GBP_XOF: 757.576,
  XOF_GBP: 0.00132,
};

function roundForCurrency(amount: number, currency: string): number {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL.has(code)) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

function convertXofTo(amountXof: number, toCurrency: string): number {
  const code = toCurrency.toUpperCase();
  if (code === 'XOF' || code === 'XAF') return amountXof;
  const direct = FALLBACK_RATES[`XOF_${code}`];
  if (direct) return amountXof * direct;
  const viaUsd = FALLBACK_RATES.XOF_USD;
  const usdTo = FALLBACK_RATES[`USD_${code}`];
  if (viaUsd && usdTo) return amountXof * viaUsd * usdTo;
  // Dernier recours : inverse USD_XOF
  if (code === 'USD') return amountXof * (FALLBACK_RATES.XOF_USD || 1 / FALLBACK_RATES.USD_XOF);
  return amountXof;
}

function fixedFeeInCurrency(currency: string): number {
  const code = currency.toUpperCase();
  if (code === 'XOF' || code === 'XAF') return CHECKOUT_PLATFORM_FEE_FIXED_XOF;
  return roundForCurrency(convertXofTo(CHECKOUT_PLATFORM_FEE_FIXED_XOF, code), code);
}

/** Montant des frais (2 % + 100 XOF) pour un sous-total. */
export function getCheckoutPlatformFee(subtotal: number, currency = 'XOF'): number {
  const base = Math.max(0, Number(subtotal) || 0);
  if (base <= 0) return 0;
  const percent = base * CHECKOUT_PLATFORM_FEE_RATE;
  const fixed = fixedFeeInCurrency(currency);
  return roundForCurrency(percent + fixed, currency);
}

/** Sous-total + frais plateforme. */
export function applyCheckoutPlatformFee(subtotal: number, currency = 'XOF'): number {
  const base = Math.max(0, Number(subtotal) || 0);
  return roundForCurrency(base + getCheckoutPlatformFee(base, currency), currency);
}

/**
 * Estime le montant plan hors frais à partir d'un TTC (total = base * 1.02 + fixed).
 */
export function estimatePlanAmountFromCheckoutTtc(ttc: number, currency: string): number {
  const total = Math.max(0, Number(ttc) || 0);
  if (total <= 0) return 0;
  const fixed = fixedFeeInCurrency(currency);
  const base = (total - fixed) / (1 + CHECKOUT_PLATFORM_FEE_RATE);
  return roundForCurrency(Math.max(0, base), currency);
}
