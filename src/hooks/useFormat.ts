/**
 * Hook useFormat - Gestion simplifiée du formatage
 * Fournit une API simple pour formater différents types de données
 * 
 * @example
 * ```tsx
 * const { formatNumber, formatCurrency, formatPercentage } = useFormat();
 * 
 * <div>{formatCurrency(1000, 'XOF')}</div>
 * <div>{formatPercentage(25)}</div>
 * ```
 */

import { useCallback } from 'react';
import {
  formatNumber as formatNumberUtil,
  formatCompactNumber,
  formatPercentage as formatPercentageUtil,
  formatCurrency as formatCurrencyUtil,
  formatFileSize,
  formatDuration as formatDurationUtil,
  formatWithSeparators,
  formatAbbreviated,
  formatWithPadding,
  formatOrdinal,
} from '@/lib/format-utils';
import { useI18n } from './useI18n';

export interface UseFormatReturn {
  /**
   * Formate un nombre selon la locale
   */
  formatNumber: (value: number | null | undefined, options?: Intl.NumberFormatOptions) => string;
  /**
   * Formate un nombre en format compact
   */
  formatCompactNumber: (value: number | null | undefined) => string;
  /**
   * Formate un pourcentage
   */
  formatPercentage: (value: number | null | undefined, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => string;
  /**
   * Formate une devise
   */
  formatCurrency: (amount: number | null | undefined, currency?: string, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => string;
  /**
   * Formate une taille de fichier
   */
  formatFileSize: (bytes: number | null | undefined, options?: { decimals?: number }) => string;
  /**
   * Formate une durée
   */
  formatDuration: (seconds: number | null | undefined, options?: { showHours?: boolean; showSeconds?: boolean }) => string;
  /**
   * Formate avec séparateurs de milliers
   */
  formatWithSeparators: (value: number | null | undefined) => string;
  /**
   * Formate en format abrégé
   */
  formatAbbreviated: (value: number | null | undefined, units?: { [key: string]: number }) => string;
  /**
   * Formate avec padding
   */
  formatWithPadding: (value: number | null | undefined, length?: number, padChar?: string) => string;
  /**
   * Formate en format ordinal
   */
  formatOrdinal: (value: number | null | undefined) => string;
}

/**
 * Hook pour formater différents types de données
 */
export function useFormat(): UseFormatReturn {
  const { currentLanguage } = useI18n();
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';

  const formatNumber = useCallback(
    (value: number | null | undefined, options?: Intl.NumberFormatOptions) => {
      return formatNumberUtil(value, { locale, ...options });
    },
    [locale]
  );

  const formatCompact = useCallback(
    (value: number | null | undefined) => {
      return formatCompactNumber(value, locale);
    },
    [locale]
  );

  const formatPercentage = useCallback(
    (value: number | null | undefined, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => {
      return formatPercentageUtil(value, { locale, ...options });
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (amount: number | null | undefined, currency: string = 'XOF', options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => {
      return formatCurrencyUtil(amount, currency, { locale, ...options });
    },
    [locale]
  );

  const formatFileSizeHook = useCallback(
    (bytes: number | null | undefined, options?: { decimals?: number }) => {
      return formatFileSize(bytes, { locale, ...options });
    },
    [locale]
  );

  const formatDuration = useCallback(
    (seconds: number | null | undefined, options?: { showHours?: boolean; showSeconds?: boolean }) => {
      return formatDurationUtil(seconds, options);
    },
    []
  );

  const formatWithSeparatorsHook = useCallback(
    (value: number | null | undefined) => {
      return formatWithSeparators(value, locale);
    },
    [locale]
  );

  const formatAbbreviatedHook = useCallback(
    (value: number | null | undefined, units?: { [key: string]: number }) => {
      return formatAbbreviated(value, units, locale);
    },
    [locale]
  );

  const formatWithPaddingHook = useCallback(
    (value: number | null | undefined, length: number = 3, padChar: string = '0') => {
      return formatWithPadding(value, length, padChar);
    },
    []
  );

  const formatOrdinalHook = useCallback(
    (value: number | null | undefined) => {
      return formatOrdinal(value, locale);
    },
    [locale]
  );

  return {
    formatNumber,
    formatCompactNumber: formatCompact,
    formatPercentage,
    formatCurrency,
    formatFileSize: formatFileSizeHook,
    formatDuration,
    formatWithSeparators: formatWithSeparatorsHook,
    formatAbbreviated: formatAbbreviatedHook,
    formatWithPadding: formatWithPaddingHook,
    formatOrdinal: formatOrdinalHook,
  };
}

