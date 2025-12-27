/**
 * Système de logging des erreurs
 * Capture, formate et envoie les erreurs à différents services
 */

import { captureException, captureMessage } from '@sentry/react';

// Sauvegarder les méthodes originales de la console pour éviter les boucles infinies
// avec console-guard.ts
const originalConsole = {
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
  group: console.group?.bind(console) || (() => {}),
  groupEnd: console.groupEnd?.bind(console) || (() => {}),
};

export interface ErrorLogContext {
  userId?: string;
  componentStack?: string;
  level?: 'app' | 'page' | 'section' | 'component';
  extra?: Record<string, unknown>;
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
  // S'assurer que l'erreur a un message valide
  let errorMessage = error?.message || 'Unknown error';
  const errorStack = error?.stack;
  const errorName = error?.name || 'Error';

  // Si l'erreur n'est pas une instance d'Error, essayer de la convertir
  if (!(error instanceof Error)) {
    try {
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = (error as { message?: string }).message || JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
    } catch (e) {
      errorMessage = 'Error object could not be serialized';
    }
  }

  // Créer le log structuré
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: errorMessage,
      stack: errorStack,
      name: errorName,
    },
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Console en développement
  if (process.env.NODE_ENV === 'development') {
    originalConsole.group('🔴 Error Logged');
    originalConsole.error('Error:', error);
    originalConsole.groupEnd();
  }

  // Sentry (production)
  if (process.env.NODE_ENV === 'production') {
    captureException(error, {
      level: context.level === 'app' ? 'fatal' : 'error',
      contexts: {
        error_context: context as Record<string, unknown>,
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
    originalConsole.warn('⚠️ Warning:', message, context);
  }

  if (process.env.NODE_ENV === 'production') {
    captureMessage(message, {
      level: 'warning',
      contexts: {
        warning_context: context as Record<string, unknown>,
      },
    });
  }
}

/**
 * Log une info (pour monitoring)
 */
export function logInfo(message: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    originalConsole.info('ℹ️ Info:', message, data);
  }

  if (process.env.NODE_ENV === 'production' && data) {
    captureMessage(message, {
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
    const storageKey = 'emarzona_error_logs';
    const maxLogs = 50; // Garder les 50 dernières erreurs

    // Récupérer les logs existants
    const existingLogsStr = localStorage.getItem(storageKey);
    const  existingLogs: ErrorLog[] = existingLogsStr
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
    // Utiliser originalConsole pour éviter la boucle infinie
    originalConsole.error('Failed to save error to localStorage:', e);
  }
}

/**
 * Récupère l'historique des erreurs
 */
export function getErrorLogs(): ErrorLog[] {
  try {
    const storageKey = 'emarzona_error_logs';
    const logsStr = localStorage.getItem(storageKey);
    return logsStr ? JSON.parse(logsStr) : [];
  } catch (e) {
    originalConsole.error('Failed to retrieve error logs:', e);
    return [];
  }
}

/**
 * Vide l'historique des erreurs
 */
export function clearErrorLogs(): void {
  try {
    localStorage.removeItem('emarzona_error_logs');
  } catch (e) {
    originalConsole.error('Failed to clear error logs:', e);
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
    let error: Error;

    if (event.reason instanceof Error) {
      error = event.reason;
    } else if (typeof event.reason === 'string') {
      error = new Error(event.reason);
    } else if (event.reason && typeof event.reason === 'object') {
      // Pour les objets complexes, essayer de les sérialiser en JSON
      try {
        const message = event.reason.message || event.reason.toString?.() || JSON.stringify(event.reason);
        error = new Error(String(message));
      } catch (e) {
        // Si la sérialisation échoue, utiliser un message générique
        error = new Error('Unhandled promise rejection (non-serializable object)');
      }
    } else {
      // Pour les valeurs primitives (number, boolean, etc.)
      error = new Error(String(event.reason ?? 'Unknown rejection reason'));
    }

    logError(error, {
      level: 'app',
      extra: {
        type: 'unhandledrejection',
        reasonType: typeof event.reason,
        reasonValue: event.reason && typeof event.reason === 'object' 
          ? (event.reason.message || 'object') 
          : event.reason,
      },
    });
  });

  // Erreurs de chargement de ressources
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      const resourceUrl = (target as HTMLImageElement | HTMLScriptElement | HTMLLinkElement).src || 
                          (target as HTMLLinkElement | HTMLAnchorElement).href;

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







