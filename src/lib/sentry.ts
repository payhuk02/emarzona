import * as Sentry from '@sentry/react';
import { logger } from './logger';

// Variable pour suivre si Sentry a déjà été initialisé
let isSentryInitialized = false;

/**
 * Configuration de Sentry pour le monitoring d'erreurs
 */
export const initSentry = () => {
  // Vérifier si Sentry est déjà initialisé pour éviter les erreurs de double initialisation
  // Cela peut arriver avec le hot reload de Vite en développement
  if (isSentryInitialized || Sentry.getClient()) {
    logger.debug('Sentry déjà initialisé, skip.', {
      environment: import.meta.env.MODE,
    });
    return;
  }

  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  const ENV = import.meta.env.MODE;

  // Ne pas initialiser Sentry en développement si pas de DSN configuré
  if (!SENTRY_DSN) {
    logger.warn('Sentry DSN non configuré. Error tracking désactivé.', {
      environment: ENV,
    });
    return;
  }

  // Valider le format du DSN de manière plus permissive
  // Sentry validera le DSN de toute façon, donc on évite de bloquer l'initialisation
  // Si le DSN est invalide, Sentry le détectera et ne l'utilisera pas silencieusement
  if (!SENTRY_DSN || typeof SENTRY_DSN !== 'string' || SENTRY_DSN.trim().length === 0) {
    logger.warn('Sentry DSN est vide ou invalide. Error tracking désactivé.', {
      environment: ENV,
    });
    return;
  }

  // Vérification basique : doit commencer par https://
  if (!SENTRY_DSN.startsWith('https://')) {
    logger.warn('Sentry DSN doit commencer par https://. Error tracking désactivé.', {
      environment: ENV,
      dsnPrefix: SENTRY_DSN.substring(0, 20) + '...',
    });
    return;
  }

  // Vérifier le format du DSN Sentry
  // Format attendu: https://<key>@<host>/<project_id>
  // Exemple: https://abc123def456@o123456.ingest.sentry.io/7891011
  const hasAtSymbol = SENTRY_DSN.includes('@');
  const hasSlash = SENTRY_DSN.includes('/');
  const parts = SENTRY_DSN.split('@');

  if (!hasAtSymbol || !hasSlash) {
    logger.warn('Sentry DSN format suspect. Format attendu: https://<key>@<host>/<project_id>', {
      environment: ENV,
      dsnPrefix: SENTRY_DSN.substring(0, 50) + '...',
      hasAtSymbol,
      hasSlash,
      suggestion:
        hasAtSymbol === false
          ? 'Le DSN semble manquer le séparateur "@". Vérifiez votre DSN dans le dashboard Sentry.'
          : 'Le DSN semble incomplet. Format attendu: https://<key>@<host>/<project_id>',
    });
    // Ne pas initialiser Sentry si le format est invalide
    return;
  } else if (parts.length > 2) {
    logger.warn('Sentry DSN contient plusieurs "@" - format suspect', {
      environment: ENV,
      dsnPrefix: SENTRY_DSN.substring(0, 50) + '...',
    });
    // Ne pas initialiser Sentry si le format est invalide
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENV,
      integrations: [
        Sentry.browserTracingIntegration({
          // Trace les navigations
          enableInp: true, // Interaction to Next Paint
          enableLongTask: true, // Long tasks
          enableWebVitalsInstrumentation: true, // Web Vitals
        }),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
          // Capturer les sessions avec erreurs - Réduit pour éviter 429
          sessionSampleRate: ENV === 'production' ? 0.05 : 0.5,
          errorSampleRate: ENV === 'production' ? 0.5 : 1.0,
        }),
        // Note: React Router integration sera ajoutée si nécessaire
        // Sentry.reactRouterV6BrowserTracingIntegration n'est pas disponible dans cette version
      ],

      // Performance Monitoring - APM amélioré
      // Réduire les sample rates pour éviter les erreurs 429
      tracesSampleRate: ENV === 'production' ? 0.1 : 0.5, // Réduit pour éviter le rate limiting
      profilesSampleRate: ENV === 'production' ? 0.05 : 0.5, // Réduit pour éviter le rate limiting

      // Options avancées
      beforeSend(event, hint) {
        // Filtrer certains types d'erreurs en production
        if (ENV === 'production') {
          // Ignorer les erreurs réseau mineures
          if (
            event.exception?.values?.[0]?.type === 'NetworkError' &&
            event.exception?.values?.[0]?.value?.includes('Failed to fetch')
          ) {
            return null;
          }

          // Ignorer les erreurs de script cross-origin
          if (event.exception?.values?.[0]?.value?.includes('Script error')) {
            return null;
          }

          // Ignorer les erreurs Sentry rate limiting (429)
          if (
            event.exception?.values?.[0]?.value?.includes('429') ||
            event.exception?.values?.[0]?.value?.includes('Too Many Requests')
          ) {
            return null;
          }

          // Ignorer les erreurs HTTP 429 dans les breadcrumbs
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => {
              if (breadcrumb.category === 'fetch' && breadcrumb.data) {
                const fetchData = breadcrumb.data as { status_code?: number };
                if (fetchData.status_code === 429) {
                  return false;
                }
              }
              return true;
            });
          }
        }

        // Ajouter des tags automatiques
        if (event.tags) {
          event.tags.environment = ENV;
          event.tags.platform = 'web';
        } else {
          event.tags = {
            environment: ENV,
            platform: 'web',
          };
        }

        return event;
      },

      // Rate limiting pour éviter les erreurs 429
      // Réduire la fréquence d'envoi en développement
      maxBreadcrumbs: ENV === 'production' ? 50 : 30,

      // Ignorer certaines erreurs
      ignoreErrors: [
        // Erreurs du navigateur
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        // Erreurs d'extensions de navigateur
        'chrome-extension://',
        'moz-extension://',
        // Erreurs de réseau courantes
        'Network request failed',
        'Failed to fetch',
        // Erreurs Sentry rate limiting
        '429',
        'Too Many Requests',
        // Erreurs de requêtes HTTP 429
        /429/,
        /Too Many Requests/i,
      ],

      // Options de release
      release: import.meta.env.VITE_APP_VERSION || undefined,

      // Options de transport
      transportOptions: {
        // Timeout pour les requêtes
        timeout: 5000,
      },

      // Rate limiting - Limiter le nombre d'événements par seconde
      // Cela aide à éviter les erreurs 429 de Sentry
      maxQueueSize: 30, // Limiter la taille de la queue
      beforeBreadcrumb(breadcrumb, hint) {
        // Filtrer les breadcrumbs qui peuvent causer des problèmes
        // Ignorer les breadcrumbs de fetch pour les requêtes Sentry
        if (breadcrumb.category === 'fetch' && breadcrumb.data) {
          const fetchData = breadcrumb.data as { url?: string };
          if (fetchData.url && fetchData.url.includes('sentry.io')) {
            return null; // Ne pas logger les requêtes vers Sentry
          }
        }
        return breadcrumb;
      },
    });

    // Marquer Sentry comme initialisé
    isSentryInitialized = true;

    logger.info('Sentry initialisé avec succès', {
      environment: ENV,
      tracesSampleRate: ENV === 'production' ? 0.1 : 0.5,
      profilesSampleRate: ENV === 'production' ? 0.05 : 0.5,
      replaySampleRate: ENV === 'production' ? 0.05 : 0.5,
    });
  } catch (error) {
    // Si l'initialisation échoue (par exemple, double initialisation), logger l'erreur mais ne pas la propager
    logger.warn("Erreur lors de l'initialisation de Sentry (peut être une double initialisation)", {
      error: error instanceof Error ? error.message : String(error),
      environment: ENV,
    });
    // Marquer comme initialisé quand même pour éviter les tentatives répétées
    isSentryInitialized = true;
  }
};

/**
 * Capture une erreur manuellement
 */
export const captureError = (error: Error, context?: Record<string, unknown>) => {
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
export const measurePerformance = async <T>(
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
    async span => {
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
  context?: Record<string, unknown>
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
): { setStatus: () => void; finish: () => void } => {
  // Dans Sentry v8+, startSpan doit être utilisé directement
  // Cette fonction est conservée pour compatibilité mais deprecated
  logger.warn('createSpan is deprecated, use Sentry.startSpan directly', {
    operation,
    description,
  });
  return {
    setStatus: () => {},
    finish: () => {},
  };
};

/**
 * Helper pour wrapper des opérations async avec error tracking
 */
export const withSentry = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> => {
  return await Sentry.startSpan(
    {
      name: operation,
      op: 'function',
    },
    async span => {
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






