/**
 * Configuration des alertes Sentry
 * Système d'alertes automatiques pour les erreurs critiques
 */

import * as Sentry from '@sentry/react';
import { logger } from './logger';

/**
 * Types d'alertes
 */
export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Configuration des seuils d'alerte
 */
export interface AlertThresholds {
  errorRate: number; // Taux d'erreur par minute
  errorCount: number; // Nombre d'erreurs en 5 minutes
  performanceThreshold: number; // Temps de réponse en ms
  apiErrorRate: number; // Taux d'erreur API par minute
}

/**
 * Seuils par défaut
 */
const DEFAULT_THRESHOLDS: AlertThresholds = {
  errorRate: 10, // 10 erreurs par minute
  errorCount: 50, // 50 erreurs en 5 minutes
  performanceThreshold: 3000, // 3 secondes
  apiErrorRate: 20, // 20 erreurs API par minute
};

/**
 * Store des erreurs récentes pour calculer les taux
 */
class ErrorTracker {
  private errors: Array<{ timestamp: number; type: string; severity: AlertSeverity }> = [];
  private readonly maxErrors = 1000;

  /**
   * Ajouter une erreur
   */
  addError(type: string, severity: AlertSeverity = 'error'): void {
    this.errors.push({
      timestamp: Date.now(),
      type,
      severity,
    });

    // Nettoyer les erreurs anciennes (plus de 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    this.errors = this.errors.filter(e => e.timestamp > tenMinutesAgo);

    // Limiter le nombre d'erreurs
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  /**
   * Calculer le taux d'erreur (par minute)
   */
  getErrorRate(windowMinutes: number = 1): number {
    const windowMs = windowMinutes * 60 * 1000;
    const cutoff = Date.now() - windowMs;
    const recentErrors = this.errors.filter(e => e.timestamp > cutoff);
    return recentErrors.length / windowMinutes;
  }

  /**
   * Obtenir le nombre d'erreurs dans une fenêtre
   */
  getErrorCount(windowMinutes: number = 5): number {
    const windowMs = windowMinutes * 60 * 1000;
    const cutoff = Date.now() - windowMs;
    return this.errors.filter(e => e.timestamp > cutoff).length;
  }

  /**
   * Obtenir le taux d'erreur par type
   */
  getErrorRateByType(type: string, windowMinutes: number = 1): number {
    const windowMs = windowMinutes * 60 * 1000;
    const cutoff = Date.now() - windowMs;
    const recentErrors = this.errors.filter(
      e => e.timestamp > cutoff && e.type === type
    );
    return recentErrors.length / windowMinutes;
  }
}

/**
 * Instance globale du tracker
 */
const errorTracker = new ErrorTracker();

/**
 * Vérifier les seuils et envoyer des alertes
 */
export function checkAlertThresholds(thresholds: AlertThresholds = DEFAULT_THRESHOLDS): void {
  const errorRate = errorTracker.getErrorRate(1);
  const errorCount = errorTracker.getErrorCount(5);
  const apiErrorRate = errorTracker.getErrorRateByType('api', 1);

  // Alerte : Taux d'erreur élevé
  if (errorRate >= thresholds.errorRate) {
    sendAlert('error-rate', 'critical', {
      message: `Taux d'erreur élevé : ${errorRate.toFixed(2)} erreurs/minute (seuil: ${thresholds.errorRate})`,
      errorRate,
      threshold: thresholds.errorRate,
    });
  }

  // Alerte : Nombre d'erreurs élevé
  if (errorCount >= thresholds.errorCount) {
    sendAlert('error-count', 'critical', {
      message: `Nombre d'erreurs élevé : ${errorCount} erreurs en 5 minutes (seuil: ${thresholds.errorCount})`,
      errorCount,
      threshold: thresholds.errorCount,
    });
  }

  // Alerte : Taux d'erreur API élevé
  if (apiErrorRate >= thresholds.apiErrorRate) {
    sendAlert('api-error-rate', 'error', {
      message: `Taux d'erreur API élevé : ${apiErrorRate.toFixed(2)} erreurs/minute (seuil: ${thresholds.apiErrorRate})`,
      apiErrorRate,
      threshold: thresholds.apiErrorRate,
    });
  }
}

/**
 * Envoyer une alerte à Sentry
 */
export function sendAlert(
  alertId: string,
  severity: AlertSeverity,
  data: {
    message: string;
    [key: string]: any;
  }
): void {
  const level: Sentry.SeverityLevel = 
    severity === 'critical' ? 'error' :
    severity === 'error' ? 'error' :
    severity === 'warning' ? 'warning' :
    'info';

  Sentry.captureMessage(data.message, {
    level,
    tags: {
      alertId,
      severity,
      component: 'alerting',
    },
    extra: data,
  });

  logger.warn(`[Alert] ${data.message}`, {
    alertId,
    severity,
    ...data,
  });
}

/**
 * Enregistrer une erreur pour le tracking
 */
export function trackError(type: string, severity: AlertSeverity = 'error'): void {
  errorTracker.addError(type, severity);
  
  // Vérifier les seuils après chaque erreur critique
  if (severity === 'critical' || severity === 'error') {
    checkAlertThresholds();
  }
}

/**
 * Enregistrer une erreur API
 */
export function trackApiError(endpoint: string, statusCode?: number): void {
  const severity: AlertSeverity = 
    statusCode && statusCode >= 500 ? 'critical' :
    statusCode && statusCode >= 400 ? 'error' :
    'warning';

  trackError('api', severity);

  // Envoyer une alerte pour les erreurs 5xx
  if (statusCode && statusCode >= 500) {
    sendAlert('api-5xx-error', 'critical', {
      message: `Erreur serveur API : ${endpoint} (${statusCode})`,
      endpoint,
      statusCode,
    });
  }
}

/**
 * Enregistrer une erreur de performance
 */
export function trackPerformanceIssue(
  operation: string,
  duration: number,
  threshold: number = DEFAULT_THRESHOLDS.performanceThreshold
): void {
  if (duration >= threshold) {
    trackError('performance', 'warning');
    
    sendAlert('performance-threshold', 'warning', {
      message: `Opération lente : ${operation} a pris ${duration}ms (seuil: ${threshold}ms)`,
      operation,
      duration,
      threshold,
    });
  }
}

/**
 * Vérifier périodiquement les seuils
 */
export function startAlertMonitoring(intervalMs: number = 60000): () => void {
  const interval = setInterval(() => {
    checkAlertThresholds();
  }, intervalMs);

  // Retourner une fonction pour arrêter le monitoring
  return () => clearInterval(interval);
}

/**
 * Obtenir les statistiques d'erreurs
 */
export function getErrorStats(): {
  totalErrors: number;
  errorRate: number;
  errorCount: number;
  apiErrorRate: number;
} {
  return {
    totalErrors: errorTracker.getErrorCount(10),
    errorRate: errorTracker.getErrorRate(1),
    errorCount: errorTracker.getErrorCount(5),
    apiErrorRate: errorTracker.getErrorRateByType('api', 1),
  };
}


