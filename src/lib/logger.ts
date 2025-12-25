/**
 * Logger conditionnel pour le développement et la production
 * En production : logs envoyés à Sentry (si configuré)
 * En développement : logs dans la console
 */
import * as Sentry from '@sentry/react';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Niveaux de log
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

// Sauvegarder les méthodes originales de la console AVANT qu'elles ne soient remplacées
// par console-guard.ts pour éviter les boucles infinies
const originalConsole = {
  log: console.log.bind(console),
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
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      originalConsole.log(`[LOG] ${message}`, ...args);
    }
    // En production, on n'envoie pas les logs normaux à Sentry pour éviter le spam
  },

  /**
   * Log d'information
   */
  info: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      originalConsole.info(`[INFO] ${message}`, context);
    }
    // En production, envoyer à Sentry si important
    if (isProduction && context) {
      Sentry.addBreadcrumb({
        category: 'info',
        message,
        data: context,
        level: 'info',
      });
    }
  },

  /**
   * Avertissement
   */
  warn: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      originalConsole.warn(`[WARN] ${message}`, context);
    }
    // En production, envoyer à Sentry
    if (isProduction) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  },

  /**
   * Erreur
   */
  error: (message: string | Error, context?: LogContext) => {
    if (isDevelopment) {
      originalConsole.error(`[ERROR] ${message}`, context);
    }
    // En production, toujours envoyer à Sentry
    if (isProduction) {
      if (message instanceof Error) {
        Sentry.captureException(message, {
          extra: context,
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: context,
        });
      }
    }
  },

  /**
   * Debug (uniquement en développement)
   */
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      originalConsole.debug(`[DEBUG] ${message}`, ...args);
    }
    // Jamais en production
  },
};
