/**
 * Monitoring Core Web Vitals pour images — client-safe.
 */
import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export function useImagePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<{
    lcp: number[];
    cls: number[];
    fid: number[];
  }>({
    lcp: [],
    cls: [],
    fid: [],
  });

  const recordMetric = useCallback((type: 'lcp' | 'cls' | 'fid', value: number) => {
    setMetrics(prev => ({
      ...prev,
      [type]: [...prev[type], value].slice(-10),
    }));

    if (type === 'lcp' && value > 2500) {
      logger.warn('LCP trop élevé', { value });
    }
    if (type === 'cls' && value > 0.1) {
      logger.warn('CLS trop élevé', { value });
    }
    if (type === 'fid' && value > 100) {
      logger.warn('FID trop élevé', { value });
    }
  }, []);

  const getAverageMetrics = useCallback(() => {
    return {
      lcp: metrics.lcp.length > 0 ? metrics.lcp.reduce((a, b) => a + b, 0) / metrics.lcp.length : 0,
      cls: metrics.cls.length > 0 ? metrics.cls.reduce((a, b) => a + b, 0) / metrics.cls.length : 0,
      fid: metrics.fid.length > 0 ? metrics.fid.reduce((a, b) => a + b, 0) / metrics.fid.length : 0,
    };
  }, [metrics]);

  return {
    recordMetric,
    metrics,
    averages: getAverageMetrics(),
    thresholds: {
      lcp: { good: 2500, needsImprovement: 4000 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      fid: { good: 100, needsImprovement: 300 },
    },
  };
}
