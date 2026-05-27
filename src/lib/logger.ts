/**
 * Logger conditionnel pour le développement et la production
 * En production : logs envoyés à Sentry (si configuré)
 * En développement : logs dans la console
 */
import * as Sentry from '@sentry/react';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Niveaux de log
// (Type conservé implicitement via les méthodes exposées; pas besoin d'un alias dédié ici.)

function safeFormatMessage(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) {
    const name = value.name || 'Error';
    const msg = value.message || '';
    return msg ? `${name}: ${msg}` : name;
  }
  const seen = new WeakSet<object>();
  const replacer = (_key: string, v: unknown) => {
    if (typeof v === 'bigint') return v.toString();
    if (typeof v === 'function') return '[Function]';
    if (typeof v === 'symbol') return v.toString();
    if (v && typeof v === 'object') {
      if (seen.has(v as object)) return '[Circular]';
      seen.add(v as object);
    }
    return v;
  };
  try {
    return JSON.stringify(value, replacer);
  } catch (_e) {
    try {
      return Object.prototype.toString.call(value);
    } catch (__e) {
      return 'Unknown error';
    }
  }
}

function toSentryExtras(context?: unknown): Record<string, unknown> | undefined {
  if (context === undefined || context === null) return undefined;
  if (typeof context === 'object' && !Array.isArray(context)) {
    return context as Record<string, unknown>;
  }
  return { detail: String(context) };
}

// Sauvegarder les méthodes originales de la console AVANT qu'elles ne soient remplacées
// par console-guard.ts pour éviter les boucles infinies
const originalConsole = {
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

/**
 * Logger amélioré avec support Sentry et contexte
 */
export const logger = {
  /**
   * Log générique (niveau debug)
   */
  log: (message: string, ...args: unknown[]) => {
    try {
      if (isDevelopment) {
        originalConsole.info(`[LOG] ${message}`, ...args);
      }
    } catch (_e) {
      // Never crash the app for logging issues.
    }
    // En production, on n'envoie pas les logs normaux à Sentry pour éviter le spam
  },

  /**
   * Log d'information
   */
  info: (message: string, context?: unknown) => {
    try {
      if (isDevelopment) {
        originalConsole.info(`[INFO] ${message}`, context);
      }
      // En production, envoyer à Sentry si important
      if (isProduction && context !== undefined && context !== null) {
        Sentry.addBreadcrumb({
          category: 'info',
          message,
          data: toSentryExtras(context) ?? {},
          level: 'info',
        });
      }
    } catch (_e) {
      // Never crash the app for logging issues.
    }
  },

  /**
   * Avertissement
   */
  warn: (message: string, context?: unknown) => {
    try {
      if (isDevelopment) {
        originalConsole.warn(`[WARN] ${message}`, context);
      }
      // En production, envoyer à Sentry
      if (isProduction) {
        Sentry.captureMessage(message, {
          level: 'warning',
          extra: toSentryExtras(context),
        });
      }
    } catch (_e) {
      // Never crash the app for logging issues.
    }
  },

  /**
   * Erreur
   */
  error: (message: string | Error, context?: unknown) => {
    try {
      if (isDevelopment) {
        originalConsole.error(`[ERROR] ${safeFormatMessage(message)}`, context);
      }
      // En production, toujours envoyer à Sentry
      if (isProduction) {
        const extras = toSentryExtras(context);
        if (message instanceof Error) {
          Sentry.captureException(message, {
            extra: extras,
          });
        } else {
          Sentry.captureMessage(message, {
            level: 'error',
            extra: extras,
          });
        }
      }
    } catch (_e) {
      // Never crash the app for logging issues.
    }
  },

  /**
   * Debug (uniquement en développement)
   */
  debug: (message: string, ...args: unknown[]) => {
    try {
      if (isDevelopment) {
        originalConsole.debug(`[DEBUG] ${message}`, ...args);
      }
    } catch (_e) {
      // Never crash the app for logging issues.
    }
    // Jamais en production
  },
};
