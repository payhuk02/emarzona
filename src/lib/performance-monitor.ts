/**
 * Système de monitoring des performances
 * Track les Core Web Vitals et métriques personnalisées
 */

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface WebVitals {
  FCP?: PerformanceMetric; // First Contentful Paint
  LCP?: PerformanceMetric; // Largest Contentful Paint
  FID?: PerformanceMetric; // First Input Delay
  CLS?: PerformanceMetric; // Cumulative Layout Shift
  TTFB?: PerformanceMetric; // Time to First Byte
  TTI?: PerformanceMetric; // Time to Interactive
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitals = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initWebVitals();
      this.initCustomMetrics();
    }
  }

  /**
   * Initialiser le monitoring des Web Vitals
   */
  private initWebVitals() {
    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            const value = entry.startTime;
            const rating = this.getRating('FCP', value);
            this.webVitals.FCP = { name: 'FCP', value, rating, timestamp: Date.now() };
            this.logMetric('FCP', value, rating);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (error) {
      logger.warn('Failed to observe FCP', { error });
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          const value = lastEntry.renderTime || lastEntry.loadTime;
          const rating = this.getRating('LCP', value);
          this.webVitals.LCP = { name: 'LCP', value, rating, timestamp: Date.now() };
          this.logMetric('LCP', value, rating);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      logger.warn('Failed to observe LCP', { error });
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          const value = entry.processingStart - entry.startTime;
          const rating = this.getRating('FID', value);
          this.webVitals.FID = { name: 'FID', value, rating, timestamp: Date.now() };
          this.logMetric('FID', value, rating);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      logger.warn('Failed to observe FID', { error });
    }

    // Cumulative Layout Shift (CLS)
    try {
      let  clsValue= 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            const rating = this.getRating('CLS', clsValue);
            this.webVitals.CLS = { name: 'CLS', value: clsValue, rating, timestamp: Date.now() };
            this.logMetric('CLS', clsValue, rating);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      logger.warn('Failed to observe CLS', { error });
    }

    // Time to First Byte (TTFB)
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const value = navigationEntry.responseStart - navigationEntry.requestStart;
        const rating = this.getRating('TTFB', value);
        this.webVitals.TTFB = { name: 'TTFB', value, rating, timestamp: Date.now() };
        this.logMetric('TTFB', value, rating);
      }
    } catch (error) {
      logger.warn('Failed to measure TTFB', { error });
    }
  }

  /**
   * Initialiser les métriques personnalisées
   */
  private initCustomMetrics() {
    // Time to Interactive (TTI) - Approximation
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationEntry) {
          const value = navigationEntry.domInteractive - navigationEntry.fetchStart;
          const rating = this.getRating('TTI', value);
          this.webVitals.TTI = { name: 'TTI', value, rating, timestamp: Date.now() };
          this.logMetric('TTI', value, rating);
        }
      });
    }
  }

  /**
   * Obtenir le rating d'une métrique
   */
  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const  thresholds: Record<string, { good: number; poor: number }> = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      TTI: { good: 3500, poor: 7300 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Logger une métrique
   */
  private logMetric(name: string, value: number, rating: string) {
    const  metric: PerformanceMetric = {
      name,
      value: Math.round(value),
      rating: rating as 'good' | 'needs-improvement' | 'poor',
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Logger seulement si pas bon
    if (rating !== 'good') {
      logger.warn(`Performance metric ${name}`, {
        value: `${Math.round(value)}ms`,
        rating,
      });
    } else {
      logger.debug(`Performance metric ${name}`, {
        value: `${Math.round(value)}ms`,
        rating,
      });
    }
  }

  /**
   * Mesurer une action personnalisée
   */
  measureAction(name: string, fn: () => void | Promise<void>): void {
    const start = performance.now();
    
    try {
      const result = fn();
      if (result instanceof Promise) {
        result.then(() => {
          const duration = performance.now() - start;
          this.logMetric(name, duration, 'good');
        }).catch((error) => {
          logger.error(`Action ${name} failed`, { error, duration: performance.now() - start });
        });
      } else {
        const duration = performance.now() - start;
        this.logMetric(name, duration, 'good');
      }
    } catch (error) {
      logger.error(`Action ${name} failed`, { error, duration: performance.now() - start });
    }
  }

  /**
   * Obtenir toutes les métriques
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Obtenir les Web Vitals
   */
  getWebVitals(): WebVitals {
    return { ...this.webVitals };
  }

  /**
   * Obtenir un rapport de performance
   */
  getReport(): {
    webVitals: WebVitals;
    metrics: PerformanceMetric[];
    summary: {
      good: number;
      needsImprovement: number;
      poor: number;
    };
  } {
    const summary = {
      good: 0,
      needsImprovement: 0,
      poor: 0,
    };

    this.metrics.forEach((metric) => {
      summary[metric.rating]++;
    });

    return {
      webVitals: this.getWebVitals(),
      metrics: this.getMetrics(),
      summary,
    };
  }

  /**
   * Nettoyer les observers
   */
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Instance singleton
let  performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * Obtenir l'instance du monitor de performance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
}

/**
 * Mesurer une action personnalisée
 */
export function measurePerformance(name: string, fn: () => void | Promise<void>): void {
  getPerformanceMonitor().measureAction(name, fn);
}

/**
 * Obtenir le rapport de performance
 */
export function getPerformanceReport() {
  return getPerformanceMonitor().getReport();
}






