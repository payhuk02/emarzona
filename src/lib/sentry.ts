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

