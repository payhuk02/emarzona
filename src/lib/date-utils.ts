/**
 * Utilitaires pour la gestion des dates
 * Fournit des fonctions réutilisables pour formater, manipuler et valider les dates
 */

export type DateFormat = 'short' | 'long' | 'full' | 'time' | 'relative' | 'iso' | 'custom';

export interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
  includeTime?: boolean;
  includeSeconds?: boolean;
}

/**
 * Formate une date selon le format spécifié
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: DateFormat = 'short',
  options?: DateFormatOptions
): string {
  if (!date) return '—';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '—';

  const {
    locale = 'fr-FR',
    timeZone,
    includeTime = false,
    includeSeconds = false,
  } = options || {};

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone,
      });

    case 'long':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone,
      });

    case 'full':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: includeTime ? '2-digit' : undefined,
        minute: includeTime ? '2-digit' : undefined,
        second: includeTime && includeSeconds ? '2-digit' : undefined,
        timeZone,
      });

    case 'time':
      return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        timeZone,
      });

    case 'relative':
      return formatRelativeTime(dateObj, locale);

    case 'iso':
      return dateObj.toISOString();

    default:
      return dateObj.toLocaleDateString(locale, { timeZone });
  }
}

/**
 * Formate une date en temps relatif (ex: "il y a 2 heures")
 */
export function formatRelativeTime(date: Date | string, locale: string = 'fr-FR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '—';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (Math.abs(diffInSeconds) < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (Math.abs(diffInSeconds) < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (Math.abs(diffInSeconds) < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (Math.abs(diffInSeconds) < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  } else if (Math.abs(diffInSeconds) < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Formate une durée en format lisible
 */
export function formatDuration(
  seconds: number | null | undefined,
  format: 'short' | 'long' | 'hms' = 'short'
): string {
  if (!seconds || seconds === 0) return '—';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  switch (format) {
    case 'short':
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      }
      return `${secs}s`;

    case 'long': {
      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      if (secs > 0 || parts.length === 0) parts.push(`${secs} seconde${secs > 1 ? 's' : ''}`);
      return parts.join(', ');
    }

    case 'hms':
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    default:
      return `${seconds}s`;
  }
}

/**
 * Obtient les dates de début et fin pour une période
 */
export function getPeriodDates(period: 'today' | 'week' | 'month' | 'year' | 'all'): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = new Date(0); // Début de l'époque Unix
      break;
  }

  return { startDate, endDate: new Date() };
}

/**
 * Vérifie si une date est dans une plage
 */
export function isDateInRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  return dateObj >= start && dateObj <= end;
}

/**
 * Ajoute des jours à une date
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Ajoute des heures à une date
 */
export function addHours(date: Date | string, hours: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Calcule la différence entre deux dates
 */
export function dateDiff(
  date1: Date | string,
  date2: Date | string,
  unit: 'days' | 'hours' | 'minutes' | 'seconds' = 'days'
): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffInMs = Math.abs(d1.getTime() - d2.getTime());

  switch (unit) {
    case 'days':
      return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    case 'hours':
      return Math.floor(diffInMs / (1000 * 60 * 60));
    case 'minutes':
      return Math.floor(diffInMs / (1000 * 60));
    case 'seconds':
      return Math.floor(diffInMs / 1000);
    default:
      return diffInMs;
  }
}

/**
 * Vérifie si une date est valide
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
}

/**
 * Obtient le début du jour
 */
export function startOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Obtient la fin du jour
 */
export function endOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setHours(23, 59, 59, 999);
  return result;
}

