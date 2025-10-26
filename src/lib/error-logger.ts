/**
 * Système de logging des erreurs
 * Capture, formate et envoie les erreurs à différents services
 */

import * as Sentry from '@sentry/react';

export interface ErrorLogContext {
  userId?: string;
  componentStack?: string;
  level?: 'app' | 'page' | 'section' | 'component';
  extra?: Record<string, any>;
}

export interface ErrorLog {
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: ErrorLogContext;
  userAgent: string;
  url: string;
}

/**
 * Log une erreur dans tous les services configurés
 */
export function logError(error: Error, context: ErrorLogContext = {}): void {
  // Créer le log structuré
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Console en développement
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 Error Logged');
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Full Log:', errorLog);
    console.groupEnd();
  }

  // Sentry (production)
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      level: context.level === 'app' ? 'fatal' : 'error',
      contexts: {
        error_context: context,
      },
      tags: {
        error_level: context.level || 'component',
      },
      extra: context.extra,
    });
  }

  // LocalStorage pour l'historique local
  saveErrorToLocalStorage(errorLog);
}

/**
 * Log une erreur réseau
 */
export function logNetworkError(
  url: string,
  status?: number,
  statusText?: string,
  context: ErrorLogContext = {}
): void {
  const error = new Error(
    `Network Error: ${status || 'Unknown'} ${statusText || ''} - ${url}`
  );
  error.name = 'NetworkError';

  logError(error, {
    ...context,
    extra: {
      ...context.extra,
      url,
      status,
      statusText,
    },
  });
}

/**
 * Log un avertissement (non-bloquant)
 */
export function logWarning(message: string, context: ErrorLogContext = {}): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Warning:', message, context);
  }

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, {
      level: 'warning',
      contexts: {
        warning_context: context,
      },
    });
  }
}

/**
 * Log une info (pour monitoring)
 */
export function logInfo(message: string, data?: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    console.info('ℹ️ Info:', message, data);
  }

  if (process.env.NODE_ENV === 'production' && data) {
    Sentry.captureMessage(message, {
      level: 'info',
      extra: data,
    });
  }
}

/**
 * Sauvegarde l'erreur dans LocalStorage pour l'historique
 */
function saveErrorToLocalStorage(errorLog: ErrorLog): void {
  try {
    const storageKey = 'payhuk_error_logs';
    const maxLogs = 50; // Garder les 50 dernières erreurs

    // Récupérer les logs existants
    const existingLogsStr = localStorage.getItem(storageKey);
    const existingLogs: ErrorLog[] = existingLogsStr
      ? JSON.parse(existingLogsStr)
      : [];

    // Ajouter le nouveau log
    existingLogs.unshift(errorLog);

    // Limiter le nombre de logs
    const limitedLogs = existingLogs.slice(0, maxLogs);

    // Sauvegarder
    localStorage.setItem(storageKey, JSON.stringify(limitedLogs));
  } catch (e) {
    // Silencieux si LocalStorage est plein ou indisponible
    console.error('Failed to save error to localStorage:', e);
  }
}

/**
 * Récupère l'historique des erreurs
 */
export function getErrorLogs(): ErrorLog[] {
  try {
    const storageKey = 'payhuk_error_logs';
    const logsStr = localStorage.getItem(storageKey);
    return logsStr ? JSON.parse(logsStr) : [];
  } catch (e) {
    console.error('Failed to retrieve error logs:', e);
    return [];
  }
}

/**
 * Vide l'historique des erreurs
 */
export function clearErrorLogs(): void {
  try {
    localStorage.removeItem('payhuk_error_logs');
  } catch (e) {
    console.error('Failed to clear error logs:', e);
  }
}

/**
 * Monitore les erreurs non gérées
 */
export function setupGlobalErrorHandlers(): void {
  // Erreurs non capturées
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      level: 'app',
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Promesses rejetées non gérées
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    logError(error, {
      level: 'app',
      extra: {
        type: 'unhandledrejection',
        promise: event.promise,
      },
    });
  });

  // Erreurs de chargement de ressources
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      const resourceUrl = (target as any).src || (target as any).href;

      if (resourceUrl) {
        logWarning(`Failed to load resource: ${resourceUrl}`, {
          extra: {
            tagName: target.tagName,
            resourceUrl,
          },
        });
      }
    }
  }, true);
}

/**
 * Helper pour envelopper les fonctions async avec gestion d'erreur
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorLogContext = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, context);
      throw error; // Re-throw pour permettre la gestion locale
    }
  }) as T;
}

/**
 * Helper pour envelopper les fonctions sync avec gestion d'erreur
 */
export function withErrorHandlingSync<T extends (...args: any[]) => any>(
  fn: T,
  context: ErrorLogContext = {}
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      logError(error as Error, context);
      throw error;
    }
  }) as T;
}

