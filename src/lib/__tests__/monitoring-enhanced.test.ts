/**
 * Tests unitaires pour monitoring-enhanced.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordMetric,
  getRecentMetrics,
  getMetricsByType,
  getActiveAlerts,
  getAllAlerts,
  acknowledgeAlert,
  getStatistics,
  setAlertThreshold,
  getAlertThreshold,
  measureOperation,
  type Metric,
  type Alert,
} from '../monitoring-enhanced';

describe('Monitoring Enhanced', () => {
  beforeEach(() => {
    // Note: Le store est global, donc les métriques peuvent persister entre les tests
    // En production, cela n'est pas un problème car le store est réinitialisé à chaque chargement
  });

  describe('recordMetric', () => {
    it('devrait enregistrer une métrique', () => {
      recordMetric({
        name: 'Test Metric',
        type: 'page_load',
        value: 100,
        unit: 'ms',
      });

      const metrics = getRecentMetrics(1);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].name).toBe('Test Metric');
      expect(metrics[0].value).toBe(100);
    });

    it('devrait générer un ID et un timestamp automatiquement', () => {
      recordMetric({
        name: 'Test Metric',
        type: 'api_response',
        value: 200,
        unit: 'ms',
      });

      const metrics = getRecentMetrics(1);
      expect(metrics[0].id).toBeDefined();
      expect(metrics[0].timestamp).toBeDefined();
      expect(metrics[0].timestamp).toBeGreaterThan(0);
    });
  });

  describe('getRecentMetrics', () => {
    it('devrait retourner les métriques récentes', () => {
      recordMetric({ name: 'Metric 1', type: 'page_load', value: 100, unit: 'ms' });
      recordMetric({ name: 'Metric 2', type: 'api_response', value: 200, unit: 'ms' });
      recordMetric({ name: 'Metric 3', type: 'component_render', value: 50, unit: 'ms' });

      const metrics = getRecentMetrics(2);
      expect(metrics.length).toBe(2);
    });

    it('devrait respecter la limite', () => {
      for (let i = 0; i < 5; i++) {
        recordMetric({
          name: `Metric ${i}`,
          type: 'page_load',
          value: i * 10,
          unit: 'ms',
        });
      }

      const metrics = getRecentMetrics(3);
      expect(metrics.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getMetricsByType', () => {
    it('devrait filtrer les métriques par type', () => {
      recordMetric({ name: 'Page Load 1', type: 'page_load', value: 100, unit: 'ms' });
      recordMetric({ name: 'API Response 1', type: 'api_response', value: 200, unit: 'ms' });
      recordMetric({ name: 'Page Load 2', type: 'page_load', value: 150, unit: 'ms' });

      const pageLoadMetrics = getMetricsByType('page_load');
      expect(pageLoadMetrics.every(m => m.type === 'page_load')).toBe(true);
    });
  });

  describe('Alert Thresholds', () => {
    it('devrait configurer un seuil d\'alerte', () => {
      setAlertThreshold({
        metricType: 'page_load',
        warning: 2000,
        critical: 5000,
        enabled: true,
      });

      const threshold = getAlertThreshold('page_load');
      expect(threshold).toBeDefined();
      expect(threshold?.warning).toBe(2000);
      expect(threshold?.critical).toBe(5000);
    });

    it('devrait générer une alerte si le seuil est dépassé', () => {
      setAlertThreshold({
        metricType: 'page_load',
        warning: 100,
        critical: 500,
        enabled: true,
      });

      recordMetric({
        name: 'Slow Page Load',
        type: 'page_load',
        value: 600, // Dépassement du seuil critique
        unit: 'ms',
      });

      const alerts = getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.severity === 'critical')).toBe(true);
    });
  });

  describe('getActiveAlerts', () => {
    it('devrait retourner uniquement les alertes non acquittées', () => {
      setAlertThreshold({
        metricType: 'api_response',
        warning: 100,
        critical: 500,
        enabled: true,
      });

      recordMetric({
        name: 'Slow API',
        type: 'api_response',
        value: 600,
        unit: 'ms',
      });

      const alerts = getActiveAlerts();
      expect(alerts.every(a => !a.acknowledged)).toBe(true);
    });
  });

  describe('acknowledgeAlert', () => {
    it('devrait acquitter une alerte', () => {
      setAlertThreshold({
        metricType: 'component_render',
        warning: 10,
        critical: 50,
        enabled: true,
      });

      recordMetric({
        name: 'Slow Render',
        type: 'component_render',
        value: 60,
        unit: 'ms',
      });

      const alerts = getActiveAlerts();
      if (alerts.length > 0) {
        const alertId = alerts[0].id;
        acknowledgeAlert(alertId);

        const updatedAlerts = getActiveAlerts();
        expect(updatedAlerts.some(a => a.id === alertId)).toBe(false);
      }
    });
  });

  describe('getStatistics', () => {
    it('devrait retourner les statistiques', () => {
      recordMetric({ name: 'Metric 1', type: 'page_load', value: 100, unit: 'ms' });
      recordMetric({ name: 'Metric 2', type: 'api_response', value: 200, unit: 'ms' });
      recordMetric({ name: 'Metric 3', type: 'page_load', value: 150, unit: 'ms' });

      const stats = getStatistics();
      expect(stats.totalMetrics).toBeGreaterThan(0);
      expect(stats.metricsByType).toBeDefined();
      expect(stats.averageValues).toBeDefined();
    });
  });

  describe('measureOperation', () => {
    it('devrait mesurer une opération synchrone', async () => {
      const result = await measureOperation(
        'Test Operation',
        'api_response',
        () => {
          return 'success';
        }
      );

      expect(result).toBe('success');

      const metrics = getMetricsByType('api_response', 1);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].name).toBe('Test Operation');
    });

    it('devrait mesurer une opération asynchrone', async () => {
      const result = await measureOperation(
        'Async Operation',
        'page_load',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'done';
        }
      );

      expect(result).toBe('done');

      const metrics = getMetricsByType('page_load', 1);
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('devrait enregistrer une métrique d\'erreur en cas d\'échec', async () => {
      try {
        await measureOperation(
          'Failing Operation',
          'api_response',
          async () => {
            throw new Error('Test error');
          }
        );
      } catch (error) {
        // Erreur attendue
      }

      const metrics = getMetricsByType('api_response', 1);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].name).toContain('error');
    });
  });
});

