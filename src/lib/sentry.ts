import * as Sentry from '@sentry/react';

/**
 * Configuration de Sentry pour le monitoring d'erreurs
 */
export const initSentry = () => {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  const ENV = import.meta.env.MODE;
  
  // Ne pas initialiser Sentry en développement si pas de DSN configuré
  if (!SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN non configuré. Error tracking désactivé.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: ENV === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    
    // Options avancées
    beforeSend(event, hint) {
      // Filtrer certains types d'erreurs en production
      if (ENV === 'production') {
        // Ignorer les erreurs réseau
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }
        
        // Ignorer les erreurs de script cross-origin
        if (event.exception?.values?.[0]?.value?.includes('Script error')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Ignorer certaines erreurs
    ignoreErrors: [
      // Erreurs du navigateur
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Erreurs d'extensions de navigateur
      'chrome-extension://',
      'moz-extension://',
    ],
  });
  
  console.log('✅ Sentry initialisé avec succès');
};

/**
 * Capture une erreur manuellement
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
};

/**
 * Définir l'utilisateur courant pour Sentry
 */
export const setSentryUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

/**
 * Effacer l'utilisateur Sentry (lors de la déconnexion)
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Ajouter une trace (breadcrumb)
 */
export const addBreadcrumb = (message: string, category?: string, level?: Sentry.SeverityLevel) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    timestamp: Date.now() / 1000,
  });
};

/**
 * Mesurer la performance d'une fonction
 */
export const measurePerformance = async <T,>(
  name: string,
  fn: () => Promise<T> | T,
  tags?: Record<string, string>
): Promise<T> => {
  return await Sentry.startSpan(
    {
      name,
      op: 'function',
      attributes: tags,
    },
    async (span) => {
      try {
        const result = await fn();
        span?.setStatus({ code: 1 }); // OK status
        return result;
      } catch (error) {
        span?.setStatus({ code: 2 }); // ERROR status
        Sentry.captureException(error);
        throw error;
      }
    }
  );
};

/**
 * Capturer un message (non-error)
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureMessage(message, level);
};

/**
 * Créer un span pour tracer une opération
 * Note: Dans Sentry v8+, utiliser directement startSpan au lieu de createSpan
 */
export const createSpan = (
  operation: string,
  description?: string
): any => {
  // Dans Sentry v8+, startSpan doit être utilisé directement
  // Cette fonction est conservée pour compatibilité mais deprecated
  console.warn('createSpan is deprecated, use Sentry.startSpan directly');
  return {
    setStatus: () => {},
    finish: () => {},
  };
};

/**
 * Helper pour wrapper des opérations async avec error tracking
 */
export const withSentry = async <T,>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  return await Sentry.startSpan(
    {
      name: operation,
      op: 'function',
    },
    async (span) => {
      try {
        const result = await fn();
        span?.setStatus({ code: 1 }); // OK status
        return result;
      } catch (error) {
        span?.setStatus({ code: 2 }); // ERROR status
        captureError(error as Error, context);
        throw error;
      }
    }
  );
};

