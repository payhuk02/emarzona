/**
 * Monitoring Amélioré - Dashboard et Alertes en Temps Réel
 * Extension du système APM existant avec alertes et visualisation
 */

import * as Sentry from '@sentry/react';
import { logger } from './logger';

/**
 * Types de métriques
 */
export type MetricType = 
  | 'page_load'
  | 'api_response'
  | 'database_query'
  | 'component_render'
  | 'user_interaction'
  | 'error_rate'
  | 'memory_usage'
  | 'custom';

/**
 * Interface pour une métrique
 */
export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

/**
 * Seuil d'alerte
 */
export interface AlertThreshold {
  metricType: MetricType;
  warning: number;
  critical: number;
  enabled: boolean;
}

/**
 * Alerte générée
 */
export interface Alert {
  id: string;
  metricId: string;
  metricName: string;
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
}

/**
 * Stockage des métriques en mémoire (pour le dashboard)
 */
class MetricsStore {
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  private thresholds: Map<MetricType, AlertThreshold> = new Map();
  private maxMetrics = 1000; // Limiter la taille du store

  constructor() {
    // Seuils par défaut
    this.thresholds.set('page_load', {
      metricType: 'page_load',
      warning: 2000, // 2s
      critical: 5000, // 5s
      enabled: true,
    });

    this.thresholds.set('api_response', {
      metricType: 'api_response',
      warning: 1000, // 1s
      critical: 3000, // 3s
      enabled: true,
    });

    this.thresholds.set('component_render', {
      metricType: 'component_render',
      warning: 16, // 1 frame
      critical: 50, // ~3 frames
      enabled: true,
    });

    this.thresholds.set('error_rate', {
      metricType: 'error_rate',
      warning: 0.05, // 5%
      critical: 0.1, // 10%
      enabled: true,
    });
  }

  /**
   * Ajouter une métrique
   */
  addMetric(metric: Metric): void {
    this.metrics.push(metric);
    
    // Limiter la taille
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Vérifier les seuils
    this.checkThresholds(metric);
  }

  /**
   * Vérifier les seuils et générer des alertes
   */
  private checkThresholds(metric: Metric): void {
    const threshold = this.thresholds.get(metric.type);
    if (!threshold || !threshold.enabled) return;

    let severity: 'warning' | 'critical' | null = null;
    let thresholdValue = 0;

    if (metric.value >= threshold.critical) {
      severity = 'critical';
      thresholdValue = threshold.critical;
    } else if (metric.value >= threshold.warning) {
      severity = 'warning';
      thresholdValue = threshold.warning;
    }

    if (severity) {
      const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random()}`,
        metricId: metric.id,
        metricName: metric.name,
        severity,
        message: `${metric.name} dépasse le seuil ${severity} (${metric.value}${metric.unit} >= ${thresholdValue}${metric.unit})`,
        value: metric.value,
        threshold: thresholdValue,
        timestamp: Date.now(),
        acknowledged: false,
      };

      this.alerts.push(alert);

      // Limiter les alertes
      if (this.alerts.length > 100) {
        this.alerts.shift();
      }

      // Envoyer à Sentry pour les alertes critiques
      if (severity === 'critical') {
        Sentry.captureMessage(alert.message, {
          level: 'error',
          tags: {
            component: 'monitoring',
            metricType: metric.type,
            severity: 'critical',
          },
          extra: {
            metric: metric.name,
            value: metric.value,
            threshold: thresholdValue,
            unit: metric.unit,
          },
        });
      }

      // Logger l'alerte
      logger.warn(`[Monitoring] ${alert.message}`, {
        metric: metric.name,
        value: metric.value,
        threshold: thresholdValue,
        severity,
      });
    }
  }

  /**
   * Obtenir les métriques récentes
   */
  getRecentMetrics(limit: number = 100): Metric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Obtenir les métriques par type
   */
  getMetricsByType(type: MetricType, limit: number = 100): Metric[] {
    return this.metrics
      .filter(m => m.type === type)
      .slice(-limit);
  }

  /**
   * Obtenir les alertes non acquittées
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  /**
   * Obtenir toutes les alertes
   */
  getAllAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Acquitter une alerte
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Obtenir les statistiques
   */
  getStatistics(): {
    totalMetrics: number;
    totalAlerts: number;
    activeAlerts: number;
    metricsByType: Partial<Record<MetricType, number>>;
    averageValues: Partial<Record<MetricType, number>>;
  } {
    const metricsByType: Partial<Record<MetricType, number>> = {};
    const sumByType: Partial<Record<MetricType, number>> = {};
    const countByType: Partial<Record<MetricType, number>> = {};

    this.metrics.forEach(metric => {
      metricsByType[metric.type] = (metricsByType[metric.type] || 0) + 1;
      sumByType[metric.type] = (sumByType[metric.type] || 0) + metric.value;
      countByType[metric.type] = (countByType[metric.type] || 0) + 1;
    });

    const averageValues: Partial<Record<MetricType, number>> = {};
    (Object.keys(metricsByType) as MetricType[]).forEach(type => {
      const count = countByType[type] || 1;
      averageValues[type] = (sumByType[type] || 0) / count;
    });

    return {
      totalMetrics: this.metrics.length,
      totalAlerts: this.alerts.length,
      activeAlerts: this.alerts.filter(a => !a.acknowledged).length,
      metricsByType,
      averageValues,
    };
  }

  /**
   * Configurer un seuil
   */
  setThreshold(threshold: AlertThreshold): void {
    this.thresholds.set(threshold.metricType, threshold);
  }

  /**
   * Obtenir un seuil
   */
  getThreshold(type: MetricType): AlertThreshold | undefined {
    return this.thresholds.get(type);
  }
}

// Instance globale du store
const metricsStore = new MetricsStore();

/**
 * Enregistrer une métrique
 */
export function recordMetric(metric: Omit<Metric, 'id' | 'timestamp'>): void {
  const fullMetric: Metric = {
    ...metric,
    id: `metric-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
  };

  metricsStore.addMetric(fullMetric);

  // Envoyer à Sentry si c'est une métrique importante
  if (metric.type === 'error_rate' || metric.type === 'page_load') {
    Sentry.setMeasurement(metric.name, metric.value, metric.unit as Sentry.MeasurementUnit);
  }
}

/**
 * Mesurer une opération et enregistrer la métrique
 */
export async function measureOperation<T>(
  name: string,
  type: MetricType,
  operation: () => Promise<T> | T,
  unit: string = 'ms'
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    recordMetric({
      name,
      type,
      value: duration,
      unit,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    recordMetric({
      name: `${name} (error)`,
      type,
      value: duration,
      unit,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

/**
 * Obtenir les métriques récentes
 */
export function getRecentMetrics(limit: number = 100): Metric[] {
  return metricsStore.getRecentMetrics(limit);
}

/**
 * Obtenir les métriques par type
 */
export function getMetricsByType(type: MetricType, limit: number = 100): Metric[] {
  return metricsStore.getMetricsByType(type, limit);
}

/**
 * Obtenir les alertes actives
 */
export function getActiveAlerts(): Alert[] {
  return metricsStore.getActiveAlerts();
}

/**
 * Obtenir toutes les alertes
 */
export function getAllAlerts(limit: number = 100): Alert[] {
  return metricsStore.getAllAlerts(limit);
}

/**
 * Acquitter une alerte
 */
export function acknowledgeAlert(alertId: string): void {
  metricsStore.acknowledgeAlert(alertId);
}

/**
 * Obtenir les statistiques
 */
export function getStatistics() {
  return metricsStore.getStatistics();
}

/**
 * Configurer un seuil d'alerte
 */
export function setAlertThreshold(threshold: AlertThreshold): void {
  metricsStore.setThreshold(threshold);
}

/**
 * Obtenir un seuil d'alerte
 */
export function getAlertThreshold(type: MetricType): AlertThreshold | undefined {
  return metricsStore.getThreshold(type);
}

// Type pour l'API performance.memory (Chrome-specific)
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

/**
 * Surveiller la mémoire
 */
export function startMemoryMonitoring(interval: number = 60000): () => void {
  const perfWithMemory = performance as PerformanceWithMemory;
  
  if (typeof performance === 'undefined' || !perfWithMemory.memory) {
    return () => {}; // Performance API non disponible
  }

  const intervalId = setInterval(() => {
    const memory = perfWithMemory.memory;
    if (!memory) return;
    
    recordMetric({
      name: 'Memory Usage',
      type: 'memory_usage',
      value: memory.usedJSHeapSize / 1024 / 1024, // MB
      unit: 'MB',
      metadata: {
        total: memory.totalJSHeapSize / 1024 / 1024,
        limit: memory.jsHeapSizeLimit / 1024 / 1024,
      },
    });
  }, interval);

  return () => clearInterval(intervalId);
}

/**
 * Surveiller le taux d'erreur
 */
export function startErrorRateMonitoring(): () => void {
  let errorCount = 0;
  let totalRequests = 0;
  const windowSize = 100; // Dernières 100 requêtes

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    totalRequests++;
    try {
      const response = await originalFetch(...args);
      return response;
    } catch (error) {
      errorCount++;
      throw error;
    } finally {
      if (totalRequests >= windowSize) {
        const errorRate = errorCount / totalRequests;
        recordMetric({
          name: 'Error Rate',
          type: 'error_rate',
          value: errorRate,
          unit: 'ratio',
        });

        // Réinitialiser le compteur
        errorCount = 0;
        totalRequests = 0;
      }
    }
  };

  return () => {
    window.fetch = originalFetch;
  };
}

