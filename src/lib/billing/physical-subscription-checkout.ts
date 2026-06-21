import type { PhysicalPlanSlug } from '@/lib/billing/physical-plan-capabilities';
import {
  PHYSICAL_PLAN_BASE_CURRENCY,
  PHYSICAL_PLAN_PRICES_USD,
  type PhysicalPlanPriceKey,
} from '@/lib/billing/platform-pricing';
import {
  convertCurrency,
  formatCurrencyCode,
  isSupportedCurrency,
  type Currency,
} from '@/lib/currency-converter';

const ZERO_DECIMAL_CURRENCIES = new Set([
  'XOF',
  'XAF',
  'XPF',
  'JPY',
  'KRW',
  'VND',
  'CLP',
  'UGX',
  'RWF',
]);

const SLUG_TO_PRICE_KEY: Record<Exclude<PhysicalPlanSlug, null>, PhysicalPlanPriceKey> = {
  physical_basic: 'basic',
  physical_standard: 'standard',
  physical_premium: 'premium',
};

export type PhysicalCheckoutAmount = {
  amount: number;
  currency: Currency;
  usdAmount: number;
  baseCurrency: typeof PHYSICAL_PLAN_BASE_CURRENCY;
};

/** Détecte la devise locale préférée pour le checkout (localStorage ou navigateur). */
export function detectUserCheckoutCurrency(): Currency {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('user_currency');
    if (saved && isSupportedCurrency(saved)) {
      return saved;
    }
  }

  const locale = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

  if (locale.includes('fr') || locale.includes('SN') || locale.includes('BF')) {
    return 'XOF';
  }
  if (locale.includes('en-US')) return 'USD';
  if (locale.includes('en-GB')) return 'GBP';
  if (locale.includes('en') || locale.includes('EU')) return 'EUR';

  return 'USD';
}

export function roundAmountForCurrency(amount: number, currency: string): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

/** Convertit un montant plan (USD) vers la devise de checkout. */
export function convertUsdPlanPrice(usdAmount: number, checkoutCurrency: Currency): number {
  if (checkoutCurrency === 'USD') {
    return usdAmount;
  }
  const converted = convertCurrency(usdAmount, 'USD', checkoutCurrency);
  return roundAmountForCurrency(converted, checkoutCurrency);
}

export function resolvePhysicalPlanCheckout(
  planSlug: Exclude<PhysicalPlanSlug, null>,
  checkoutCurrency?: Currency
): PhysicalCheckoutAmount {
  const priceKey = SLUG_TO_PRICE_KEY[planSlug];
  const usdAmount = PHYSICAL_PLAN_PRICES_USD[priceKey];
  const currency = checkoutCurrency ?? detectUserCheckoutCurrency();

  return {
    amount: convertUsdPlanPrice(usdAmount, currency),
    currency,
    usdAmount,
    baseCurrency: PHYSICAL_PLAN_BASE_CURRENCY,
  };
}

/** Convertit une facture (montant en devise plan) vers la devise checkout. */
export function convertInvoiceAmountToCheckout(
  invoiceAmount: number,
  invoiceCurrency: string,
  checkoutCurrency: Currency
): number {
  const from = isSupportedCurrency(invoiceCurrency) ? invoiceCurrency : 'USD';
  if (from === checkoutCurrency) {
    return roundAmountForCurrency(invoiceAmount, checkoutCurrency);
  }
  const converted = convertCurrency(invoiceAmount, from, checkoutCurrency);
  return roundAmountForCurrency(converted, checkoutCurrency);
}

export function formatPhysicalPlanPrice(
  usdAmount: number,
  displayCurrency: Currency = 'USD'
): string {
  const amount =
    displayCurrency === 'USD' ? usdAmount : convertUsdPlanPrice(usdAmount, displayCurrency);
  return formatCurrencyCode(amount, displayCurrency);
}
