/**
 * Hooks utilitaires pour l'internationalisation
 */

import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import type { LanguageCode } from '@/i18n/config';

/**
 * Hook principal pour l'i18n avec helpers
 */
export function useI18n() {
  const { t, i18n } = useTranslation();

  const changeLanguage = useCallback((lang: LanguageCode) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('payhuk_language', lang);
    document.documentElement.lang = lang;
  }, [i18n]);

  const currentLanguage = i18n.language as LanguageCode;

  const isRTL = useCallback(() => {
    // Ajouter les langues RTL si nécessaire (arabe, hébreu, etc.)
    const rtlLanguages: LanguageCode[] = [];
    return rtlLanguages.includes(currentLanguage);
  }, [currentLanguage]);

  return {
    t,
    i18n,
    currentLanguage,
    changeLanguage,
    isRTL: isRTL(),
  };
}

/**
 * Hook pour formater les devises selon la langue
 */
export function useCurrencyFormat() {
  const { currentLanguage } = useI18n();

  const formatCurrency = useCallback((amount: number, currency: string = 'XOF') => {
    const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      // Fallback si la devise n'est pas supportée
      return `${amount} ${currency}`;
    }
  }, [currentLanguage]);

  return { formatCurrency };
}

/**
 * Hook pour formater les dates selon la langue
 */
export function useDateFormat() {
  const { currentLanguage } = useI18n();

  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  }, [currentLanguage]);

  const formatRelativeTime = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 604800) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  }, [currentLanguage]);

  return { formatDate, formatRelativeTime };
}

/**
 * Hook pour formater les nombres selon la langue
 */
export function useNumberFormat() {
  const { currentLanguage } = useI18n();

  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions) => {
    const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(num);
  }, [currentLanguage]);

  const formatPercentage = useCallback((num: number) => {
    return formatNumber(num, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  }, [formatNumber]);

  const formatCompact = useCallback((num: number) => {
    return formatNumber(num, {
      notation: 'compact',
      compactDisplay: 'short',
    });
  }, [formatNumber]);

  return { formatNumber, formatPercentage, formatCompact };
}

