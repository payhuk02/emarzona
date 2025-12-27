/**
 * Hook useDateFormat - Gestion simplifiée du formatage de dates
 * Fournit une API simple pour formater les dates dans les composants
 * 
 * @example
 * ```tsx
 * const { formatDate, formatRelativeTime, formatDuration } = useDateFormat();
 * 
 * <div>{formatDate(new Date(), 'long')}</div>
 * <div>{formatRelativeTime(date)}</div>
 * ```
 */

import { useCallback } from 'react';
import { formatDate as formatDateUtil, formatRelativeTime, formatDuration, DateFormat } from '@/lib/date-utils';
import { useI18n } from './useI18n';

export interface UseDateFormatReturn {
  /**
   * Formate une date selon le format spécifié
   */
  formatDate: (
    date: Date | string | null | undefined,
    format?: DateFormat,
    options?: { includeTime?: boolean; includeSeconds?: boolean }
  ) => string;
  /**
   * Formate une date en temps relatif
   */
  formatRelativeTime: (date: Date | string | null | undefined) => string;
  /**
   * Formate une durée en format lisible
   */
  formatDuration: (seconds: number | null | undefined, format?: 'short' | 'long' | 'hms') => string;
}

/**
 * Hook pour formater les dates
 */
export function useDateFormat(): UseDateFormatReturn {
  const { currentLanguage } = useI18n();
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';

  const formatDate = useCallback(
    (
      date: Date | string | null | undefined,
      format: DateFormat = 'short',
      options?: { includeTime?: boolean; includeSeconds?: boolean }
    ) => {
      return formatDateUtil(date, format, { locale, ...options });
    },
    [locale]
  );

  const formatRelative = useCallback(
    (date: Date | string | null | undefined) => {
      return formatRelativeTime(date, locale);
    },
    [locale]
  );

  const formatDurationHook = useCallback(
    (seconds: number | null | undefined, format: 'short' | 'long' | 'hms' = 'short') => {
      return formatDuration(seconds, format);
    },
    []
  );

  return {
    formatDate,
    formatRelativeTime: formatRelative,
    formatDuration: formatDurationHook,
  };
}







