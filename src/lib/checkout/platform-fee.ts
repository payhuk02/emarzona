/**
 * Frais plateforme checkout acheteur : 2 % du montant + 100 FCFA (XOF).
 * Le forfait 100 XOF est converti si la devise de la commande n'est pas XOF/XAF.
 * Affichage UI : le détail de la ligne n'est pas montré ; seul le Total (TTC frais) l'est.
 */
import { convertCurrency, isSupportedCurrency, type Currency } from '@/lib/currency-converter';

export const CHECKOUT_PLATFORM_FEE_RATE = 0.02;
export const CHECKOUT_PLATFORM_FEE_FIXED_XOF = 100;

const ZERO_DECIMAL = new Set(['XOF', 'XAF', 'XPF', 'JPY', 'KRW', 'VND', 'CLP', 'UGX', 'RWF']);

function roundForCurrency(amount: number, currency: string): number {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL.has(code)) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

function fixedFeeInCurrency(currency: string): number {
  const code = currency.toUpperCase();
  if (code === 'XOF' || code === 'XAF') {
    return CHECKOUT_PLATFORM_FEE_FIXED_XOF;
  }
  const to = (isSupportedCurrency(code) ? code : 'XOF') as Currency;
  return roundForCurrency(convertCurrency(CHECKOUT_PLATFORM_FEE_FIXED_XOF, 'XOF', to), code);
}

/** Montant des frais (2 % + 100 XOF) pour un sous-total déjà net de promo. */
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
