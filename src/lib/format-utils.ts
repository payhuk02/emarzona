/**
 * Utilitaires pour le formatage de nombres, devises et autres valeurs
 * Fournit des fonctions réutilisables pour formater différents types de données
 */

export interface FormatCurrencyOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}

/**
 * Formate un nombre selon la locale
 */
export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions & { locale?: string }
): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  const { locale = 'fr-FR', ...formatOptions } = options || {};
  
  return new Intl.NumberFormat(locale, formatOptions).format(value);
}

/**
 * Formate un nombre en format compact (ex: 1.2K, 1.5M)
 */
export function formatCompactNumber(
  value: number | null | undefined,
  locale: string = 'fr-FR'
): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(
  value: number | null | undefined,
  options?: { locale?: string; minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  const { locale = 'fr-FR', minimumFractionDigits = 0, maximumFractionDigits = 1 } = options || {};

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
}

/**
 * Formate une devise
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'XOF',
  options?: FormatCurrencyOptions
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';

  const {
    locale = 'fr-FR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    showSymbol = true,
  } = options || {};

  try {
    return new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch (error) {
    // Fallback si la devise n'est pas supportée
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

/**
 * Formate une taille de fichier
 */
export function formatFileSize(
  bytes: number | null | undefined,
  options?: { locale?: string; decimals?: number }
): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B';

  const { locale = 'fr-FR', decimals = 2 } = options || {};
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

/**
 * Formate une durée en secondes
 */
export function formatDuration(
  seconds: number | null | undefined,
  options?: { showHours?: boolean; showSeconds?: boolean }
): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '—';

  const { showHours = true, showSeconds = true } = options || {};

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const  parts: string[] = [];

  if (showHours && hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0 || (hours > 0 && showSeconds)) {
    parts.push(`${minutes}m`);
  }

  if (showSeconds && (secs > 0 || parts.length === 0)) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ') || '0s';
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatWithSeparators(
  value: number | null | undefined,
  locale: string = 'fr-FR'
): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Formate un nombre en format abrégé avec unités personnalisées
 */
export function formatAbbreviated(
  value: number | null | undefined,
  units: { [key: string]: number } = {
    K: 1000,
    M: 1000000,
    B: 1000000000,
  },
  locale: string = 'fr-FR'
): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  const sortedUnits = Object.entries(units).sort((a, b) => b[1] - a[1]);

  for (const [unit, multiplier] of sortedUnits) {
    if (value >= multiplier) {
      const formatted = (value / multiplier).toLocaleString(locale, {
        maximumFractionDigits: 1,
      });
      return `${formatted}${unit}`;
    }
  }

  return value.toLocaleString(locale);
}

/**
 * Formate un nombre avec padding (ex: 001, 002)
 */
export function formatWithPadding(
  value: number | null | undefined,
  length: number = 3,
  padChar: string = '0'
): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  return value.toString().padStart(length, padChar);
}

/**
 * Formate un nombre en format ordinal (1er, 2ème, 3ème)
 */
export function formatOrdinal(
  value: number | null | undefined,
  locale: string = 'fr-FR'
): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  const formatter = new Intl.PluralRules(locale, { type: 'ordinal' });
  const rule = formatter.select(value);

  const  suffixes: Record<string, Record<string, string>> = {
    'fr-FR': {
      one: 'er',
      two: 'ème',
      few: 'ème',
      many: 'ème',
      other: 'ème',
    },
    'en-US': {
      one: 'st',
      two: 'nd',
      few: 'rd',
      many: 'th',
      other: 'th',
    },
  };

  const suffix = suffixes[locale]?.[rule] || suffixes['en-US'][rule] || '';
  return `${value}${suffix}`;
}







