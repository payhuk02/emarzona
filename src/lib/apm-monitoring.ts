/**
 * APM (Application Performance Monitoring) - Monitoring Avancé
 * Intégration avec Sentry pour le monitoring complet de l'application
 */

import * as Sentry from '@sentry/react';
import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';
import { logger } from './logger';
import { 
  startMemoryMonitoring, 
  startErrorRateMonitoring,
  recordMetric 
} from './monitoring-enhanced';

/**
 * Configuration APM
 */
interface APMConfig {
  enabled: boolean;
  sampleRate: number;
  enableWebVitals: boolean;
  enablePerformance: boolean;
  enableProfiling: boolean;
}

/**
 * Obtenir la configuration APM
 */
const getAPMConfig = (): APMConfig => {
  const env = import.meta.env.MODE;
  const enabled = import.meta.env.VITE_APM_ENABLED !== 'false';
  
  return {
    enabled,
    sampleRate: env === 'production' ? 0.2 : 1.0,
    enableWebVitals: import.meta.env.VITE_APM_WEB_VITALS !== 'false',
    enablePerformance: import.meta.env.VITE_APM_PERFORMANCE !== 'false',
    enableProfiling: env === 'production' ? false : true, // Profiling seulement en dev
  };
};

/**
 * Envoyer les métriques Web Vitals à Sentry
 */
const sendWebVitalsToSentry = (metric: Metric): void => {
  const config = getAPMConfig();
  
  if (!config.enabled || !config.enableWebVitals) return;

  // Envoyer comme mesure personnalisée
  Sentry.setMeasurement(metric.name, metric.value, 'millisecond');
  
  // Ajouter comme breadcrumb
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value.toFixed(2)}`,
    level: metric.rating === 'good' ? 'info' : metric.rating === 'needs-improvement' ? 'warning' : 'error',
    data: {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    },
  });

  // Si la métrique est mauvaise, envoyer un événement
  if (metric.rating === 'poor') {
    Sentry.captureMessage(`Poor ${metric.name} performance`, {
      level: 'warning',
      tags: {
        component: 'web-vitals',
        metric: metric.name,
        rating: metric.rating,
      },
      extra: {
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
      },
    });
  }
};

/**
 * Initialiser le monitoring Web Vitals
 */
export const initWebVitalsMonitoring = (): void => {
  const config = getAPMConfig();
  
  if (!config.enabled || !config.enableWebVitals) {
    logger.info('[APM] Web Vitals monitoring désactivé');
    return;
  }

  // CLS - Cumulative Layout Shift
  onCLS(sendWebVitalsToSentry);
  
  // INP - Interaction to Next Paint
  onINP(sendWebVitalsToSentry);
  
  // LCP - Largest Contentful Paint
  onLCP(sendWebVitalsToSentry);
  
  // FCP - First Contentful Paint
  onFCP(sendWebVitalsToSentry);
  
  // TTFB - Time to First Byte
  onTTFB(sendWebVitalsToSentry);
  
  logger.info('[APM] Web Vitals monitoring initialisé');
};

/**
 * Mesurer la performance d'une transaction
 */
export const measureTransaction = async <T,>(
  name: string,
  operation: string,
  fn: () => Promise<T> | T,
  tags?: Record<string, string>
): Promise<T> => {
  const config = getAPMConfig();
  
  if (!config.enabled || !config.enablePerformance) {
    return await fn();
  }

  return await Sentry.startSpan(
    {
      name,
      op: operation,
      attributes: tags,
    },
    async (span) => {
      const startTime = performance.now();
      
      try {
        const result = await fn();
        const duration = performance.now() - startTime;
        
        span?.setStatus({ code: 1 }); // OK
        span?.setData('duration', duration);
        
        // Logger si la transaction est lente
        if (duration > 1000) {
          logger.warn(`[APM] Slow transaction: ${name}`, {
            duration,
            operation,
          });
        }
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        span?.setStatus({ code: 2 }); // ERROR
        span?.setData('duration', duration);
        span?.setData('error', error);
        
        Sentry.captureException(error as Error, {
          tags: {
            component: 'apm',
            transaction: name,
            operation,
          },
        });
        
        throw error;
      }
    }
  );
};

/**
 * Mesurer la performance d'une requête API
 */
export const measureAPIRequest = async <T,>(
  url: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> => {
  return measureTransaction(
    `API ${method} ${url}`,
    'http.client',
    fn,
    {
      'http.method': method,
      'http.url': url,
    }
  );
};

/**
 * Mesurer le rendu d'un composant React
 */
export const measureComponentRender = <T,>(
  componentName: string,
  fn: () => T
): T => {
  const config = getAPMConfig();
  
  if (!config.enabled || !config.enablePerformance) {
    return fn();
  }

  const startTime = performance.now();
  
  try {
    const result = fn();
    const duration = performance.now() - startTime;
    
    // Logger si le rendu est lent
    if (duration > 16) { // Plus d'une frame (60fps)
      logger.warn(`[APM] Slow component render: ${componentName}`, {
        duration,
      });
      
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow render: ${componentName}`,
        level: 'warning',
        data: {
          component: componentName,
          duration,
        },
      });
    }
    
    return result;
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: {
        component: 'react',
        componentName,
      },
    });
    throw error;
  }
};

/**
 * Initialiser le monitoring APM complet
 */
export const initAPMMonitoring = (): void => {
  const config = getAPMConfig();
  
  if (!config.enabled) {
    logger.info('[APM] APM monitoring désactivé');
    return;
  }

  // Initialiser Web Vitals
  initWebVitalsMonitoring();
  
  // Monitorer les erreurs de performance
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      Sentry.captureException(event.error, {
        tags: {
          component: 'apm',
          type: 'window-error',
        },
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason, {
        tags: {
          component: 'apm',
          type: 'unhandled-rejection',
        },
      });
    });

    // Initialiser le monitoring amélioré
    try {
      // Démarrer le monitoring de la mémoire
      startMemoryMonitoring(60000); // Toutes les minutes
      
      // Démarrer le monitoring du taux d'erreur
      startErrorRateMonitoring();
      
      // Enregistrer les Web Vitals dans le système amélioré
      const originalOnCLS = onCLS;
      const originalOnLCP = onLCP;
      const originalOnFCP = onFCP;
      
      onCLS((metric) => {
        recordMetric({
          name: 'Cumulative Layout Shift',
          type: 'page_load',
          value: metric.value,
          unit: 'ratio',
        });
      });
      
      onLCP((metric) => {
        recordMetric({
          name: 'Largest Contentful Paint',
          type: 'page_load',
          value: metric.value,
          unit: 'ms',
        });
      });
      
      onFCP((metric) => {
        recordMetric({
          name: 'First Contentful Paint',
          type: 'page_load',
          value: metric.value,
          unit: 'ms',
        });
      });
      
      logger.info('[APM] Monitoring amélioré initialisé');
    } catch (error) {
      logger.warn('[APM] Impossible d\'initialiser le monitoring amélioré', error);
    }
  }
  
  logger.info('[APM] APM monitoring initialisé avec succès', {
    webVitals: config.enableWebVitals,
    performance: config.enablePerformance,
    profiling: config.enableProfiling,
  });
};

/**
 * Obtenir les métriques de performance actuelles
 */
export const getPerformanceMetrics = (): {
  navigation: PerformanceNavigationTiming | null;
  paint: PerformancePaintTiming[] | null;
  resource: PerformanceResourceTiming[] | null;
} => {
  if (typeof window === 'undefined' || !window.performance) {
    return {
      navigation: null,
      paint: null,
      resource: null,
    };
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const paint = performance.getEntriesByType('paint') as PerformancePaintTiming[];
  const resource = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  return {
    navigation: navigation || null,
    paint: paint.length > 0 ? paint : null,
    resource: resource.length > 0 ? resource : null,
  };
};



