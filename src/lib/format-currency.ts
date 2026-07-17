/** Formate un montant en FCFA (devise plateforme) */
import { formatLocaleNumber, resolveIntlLocale } from '@/lib/i18n/locale-format';

export function formatFcfa(
  amount: number,
  options?: { compact?: boolean; language?: string | null }
): string {
  const locale = resolveIntlLocale(options?.language);
  if (options?.compact && amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })}M FCFA`;
  }
  if (options?.compact && amount >= 1_000) {
    return `${(amount / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 })}k FCFA`;
  }
  return `${formatLocaleNumber(Math.round(amount), options?.language)} FCFA`;
}
