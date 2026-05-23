/**
 * Fourchettes de budget du quiz marketplace — montants de référence en XOF (FCFA).
 */

import { convertAmountFromXof, formatCurrencyCode } from '@/lib/currency-converter';
import { formatFcfa } from '@/lib/format-currency';
import { getCurrencyDisplayName, getQuizCurrencyCodes } from '@/lib/world-currencies';

export const QUIZ_BUDGET_BASE_CURRENCY = 'XOF';

export type QuizBudgetTierId = 'budget' | 'midrange' | 'premium' | 'luxury';

export interface QuizBudgetTier {
  id: QuizBudgetTierId;
  titleFr: string;
  minXof: number;
  maxXof: number | null;
}

/** Montants en FCFA (XOF), alignés sur le marketplace africain */
export const QUIZ_BUDGET_TIERS: QuizBudgetTier[] = [
  { id: 'budget', titleFr: 'Économique', minXof: 0, maxXof: 10_000 },
  { id: 'midrange', titleFr: 'Intermédiaire', minXof: 10_001, maxXof: 50_000 },
  { id: 'premium', titleFr: 'Haut de gamme', minXof: 50_001, maxXof: 500_000 },
  { id: 'luxury', titleFr: 'Luxe', minXof: 500_001, maxXof: null },
];

/** Toutes les devises ISO pour le sélecteur du quiz (XOF en premier). */
export { getQuizCurrencyCodes };

export function formatQuizAmount(amountXof: number, currencyCode: string): string {
  if (currencyCode === 'XOF') {
    return formatFcfa(amountXof);
  }
  const converted = convertAmountFromXof(amountXof, currencyCode);
  return formatCurrencyCode(converted, currencyCode);
}

export function formatBudgetRangeLabel(tier: QuizBudgetTier, currencyCode: string): string {
  if (tier.maxXof === null) {
    return `${tier.titleFr} (+${formatQuizAmount(tier.minXof, currencyCode)})`;
  }
  const minLabel =
    tier.minXof === 0
      ? formatQuizAmount(0, currencyCode)
      : formatQuizAmount(tier.minXof, currencyCode);
  const maxLabel = formatQuizAmount(tier.maxXof, currencyCode);
  return `${tier.titleFr} (${minLabel} - ${maxLabel})`;
}

/** Libellé lisible pour le sélecteur de devise du quiz */
export function getQuizCurrencyLabel(currencyCode: string): string {
  const name = getCurrencyDisplayName(currencyCode);
  return `${currencyCode} — ${name}`;
}

export function getBudgetPriceFilters(tierId: QuizBudgetTierId): {
  min_price?: number;
  max_price?: number;
} {
  const tier = QUIZ_BUDGET_TIERS.find(t => t.id === tierId);
  if (!tier) return {};

  if (tier.maxXof === null) {
    return { min_price: tier.minXof };
  }
  if (tier.minXof === 0) {
    return { max_price: tier.maxXof };
  }
  return { min_price: tier.minXof, max_price: tier.maxXof };
}
