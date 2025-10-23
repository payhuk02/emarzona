import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';

/**
 * Configuration Web Vitals pour surveiller les performances
 */

/**
 * Envoyer les métriques vers Sentry
 */
function sendToSentry(metric: Metric) {
  const metricValue = metric.value;
  const metricName = metric.name;
  
  // Ajouter comme breadcrumb Sentry
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metricName}: ${metricValue}`,
    level: 'info',
    data: {
      name: metricName,
      value: metricValue,
      rating: metric.rating,
      delta: metric.delta,
    },
  });
  
  // Envoyer comme mesure personnalisée
  Sentry.setMeasurement(metricName, metricValue, 'millisecond');
}

/**
 * Envoyer vers Google Analytics (si configuré)
 */
function sendToAnalytics(metric: Metric) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }
}

/**
 * Logger en console (dev uniquement)
 */
function logMetric(metric: Metric) {
  if (import.meta.env.DEV) {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
}

/**
 * Handler générique pour toutes les métriques
 */
function handleMetric(metric: Metric) {
  logMetric(metric);
  sendToSentry(metric);
  sendToAnalytics(metric);
}

/**
 * Initialiser le suivi Web Vitals
 */
export const initWebVitals = () => {
  // CLS - Cumulative Layout Shift (Stabilité visuelle)
  // Bon: < 0.1, Needs improvement: 0.1-0.25, Poor: > 0.25
  onCLS(handleMetric);
  
  // INP - Interaction to Next Paint (Interactivité - remplace FID)
  // Bon: < 200ms, Needs improvement: 200-500ms, Poor: > 500ms
  onINP(handleMetric);
  
  // LCP - Largest Contentful Paint (Performance de chargement)
  // Bon: < 2.5s, Needs improvement: 2.5-4s, Poor: > 4s
  onLCP(handleMetric);
  
  // FCP - First Contentful Paint (Première peinture)
  // Bon: < 1.8s, Needs improvement: 1.8-3s, Poor: > 3s
  onFCP(handleMetric);
  
  // TTFB - Time to First Byte (Temps de réponse serveur)
  // Bon: < 800ms, Needs improvement: 800-1800ms, Poor: > 1800ms
  onTTFB(handleMetric);
  
  console.log('✅ Web Vitals tracking initialisé');
};

/**
 * Obtenir un résumé des métriques (pour affichage)
 */
export const getVitalsRating = (value: number, metricName: string): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    INP: [200, 500],
    LCP: [2500, 4000],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
  };
  
  const [good, needsImprovement] = thresholds[metricName] || [0, 0];
  
  if (value <= good) return 'good';
  if (value <= needsImprovement) return 'needs-improvement';
  return 'poor';
};

