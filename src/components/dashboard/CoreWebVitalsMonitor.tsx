/**
 * Moniteur Core Web Vitals pour le Dashboard
 * Mesure et affiche les métriques de performance en temps réel
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Zap,
  Eye,
  MousePointer,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { logger } from '@/lib/logger';

interface CoreWebVitalsMetrics {
  // Largest Contentful Paint
  lcp: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;

  // First Input Delay
  fid: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;

  // Cumulative Layout Shift
  cls: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;

  // First Contentful Paint (bonus)
  fcp: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;

  // Time to First Byte (bonus)
  ttfb: {
    value: number;
    timestamp: number;
  } | null;
}

interface PerformanceEntryWithRating extends PerformanceEntry {
  rating?: 'good' | 'needs-improvement' | 'poor';
}

export const CoreWebVitalsMonitor = () => {
  const [metrics, setMetrics] = useState<CoreWebVitalsMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fonction pour obtenir la notation d'une métrique
  const getRating = useCallback((name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    switch (name) {
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'fcp':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      default:
        return 'good';
    }
  }, []);

  // Fonction pour obtenir l'icône de notation
  const getRatingIcon = (rating: 'good' | 'needs-improvement' | 'poor') => {
    const iconClass = "h-4 w-4 inline";
    switch (rating) {
      case 'good':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'needs-improvement':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'poor':
        return <XCircle className={`${iconClass} text-red-500`} />;
    }
  };

  // Fonction pour obtenir la couleur de notation
  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'bg-green-500';
      case 'needs-improvement':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
    }
  };

  // Fonction pour formater les valeurs
  const formatValue = (name: string, value: number): string => {
    switch (name) {
      case 'lcp':
      case 'fcp':
      case 'fid':
        return `${value.toFixed(0)}ms`;
      case 'cls':
        return value.toFixed(4);
      case 'ttfb':
        return `${value.toFixed(0)}ms`;
      default:
        return value.toString();
    }
  };

  // Démarrer le monitoring
  const startMonitoring = useCallback(() => {
    if (typeof window === 'undefined' || !('web-vitals' in window)) {
      logger.warn('Web Vitals non disponible');
      return;
    }

    setIsMonitoring(true);
    logger.info('🎯 Démarrage monitoring Core Web Vitals');

    // Importer web-vitals dynamiquement
    import('web-vitals').then(({ getLCP, getFID, getCLS, getFCP, getTTFB }) => {
      // Largest Contentful Paint
      getLCP((metric) => {
        const rating = getRating('lcp', metric.value);
        setMetrics(prev => ({
          ...prev,
          lcp: {
            value: metric.value,
            rating,
            timestamp: Date.now(),
          },
        }));
        logger.info(`📏 LCP: ${metric.value}ms (${rating})`);
      });

      // First Input Delay
      getFID((metric) => {
        const rating = getRating('fid', metric.value);
        setMetrics(prev => ({
          ...prev,
          fid: {
            value: metric.value,
            rating,
            timestamp: Date.now(),
          },
        }));
        logger.info(`👆 FID: ${metric.value}ms (${rating})`);
      });

      // Cumulative Layout Shift
      getCLS((metric) => {
        const rating = getRating('cls', metric.value);
        setMetrics(prev => ({
          ...prev,
          cls: {
            value: metric.value,
            rating,
            timestamp: Date.now(),
          },
        }));
        logger.info(`📐 CLS: ${metric.value} (${rating})`);
      });

      // First Contentful Paint (bonus)
      getFCP((metric) => {
        const rating = getRating('fcp', metric.value);
        setMetrics(prev => ({
          ...prev,
          fcp: {
            value: metric.value,
            rating,
            timestamp: Date.now(),
          },
        }));
        logger.info(`🎨 FCP: ${metric.value}ms (${rating})`);
      });

      // Time to First Byte (bonus)
      getTTFB((metric) => {
        setMetrics(prev => ({
          ...prev,
          ttfb: {
            value: metric.value,
            timestamp: Date.now(),
          },
        }));
        logger.info(`🌐 TTFB: ${metric.value}ms`);
      });

      setLastUpdate(new Date());
    }).catch((error) => {
      logger.error('Erreur chargement web-vitals:', error);
      setIsMonitoring(false);
    });
  }, [getRating]);

  // Arrêter le monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    logger.info('⏹️ Monitoring Core Web Vitals arrêté');
  }, []);

  // Test manuel des métriques (pour développement)
  const runPerformanceTest = useCallback(() => {
    logger.info('🧪 Test manuel des métriques de performance');

    // Simuler des métriques pour test
    const testMetrics = {
      lcp: { value: 1800, rating: 'good' as const, timestamp: Date.now() },
      fid: { value: 80, rating: 'good' as const, timestamp: Date.now() },
      cls: { value: 0.05, rating: 'good' as const, timestamp: Date.now() },
      fcp: { value: 1200, rating: 'good' as const, timestamp: Date.now() },
      ttfb: { value: 150, timestamp: Date.now() },
    };

    setMetrics(testMetrics);
    setLastUpdate(new Date());
    logger.info('✅ Métriques de test appliquées');
  }, []);

  // Calculer le score global Core Web Vitals
  const calculateOverallScore = useCallback(() => {
    const { lcp, fid, cls } = metrics;
    if (!lcp || !fid || !cls) return null;

    // Poids: LCP (25%), FID (25%), CLS (25%), FCP (25%)
    const weights = { lcp: 0.3, fid: 0.3, cls: 0.2, fcp: 0.2 };

    const score = (
      (lcp.rating === 'good' ? 100 : lcp.rating === 'needs-improvement' ? 50 : 0) * weights.lcp +
      (fid.rating === 'good' ? 100 : fid.rating === 'needs-improvement' ? 50 : 0) * weights.fid +
      (cls.rating === 'good' ? 100 : cls.rating === 'needs-improvement' ? 50 : 0) * weights.cls +
      (metrics.fcp?.rating === 'good' ? 100 : metrics.fcp?.rating === 'needs-improvement' ? 50 : 0) * weights.fcp
    );

    return Math.round(score);
  }, [metrics]);

  const overallScore = calculateOverallScore();

  // Démarrer automatiquement le monitoring au montage
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Core Web Vitals Monitor
        </CardTitle>
        <div className="flex items-center space-x-2">
          {overallScore !== null && (
            <Badge variant={overallScore >= 80 ? "default" : overallScore >= 50 ? "secondary" : "destructive"}>
              Score: {overallScore}/100
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-1" />
                Start
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={runPerformanceTest}>
            <Zap className="h-4 w-4 mr-1" />
            Test
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status du monitoring */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Status: {isMonitoring ? '🟢 Monitoring actif' : '🔴 Monitoring inactif'}</span>
          {lastUpdate && (
            <span>Dernière mise à jour: {lastUpdate.toLocaleTimeString()}</span>
          )}
        </div>

        {/* Métriques individuelles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* LCP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">LCP</span>
              {metrics.lcp && getRatingIcon(metrics.lcp.rating)}
            </div>
            {metrics.lcp ? (
              <>
                <div className="text-2xl font-bold">
                  {formatValue('lcp', metrics.lcp.value)}
                </div>
                <Progress
                  value={Math.min((metrics.lcp.value / 4000) * 100, 100)}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  Cible: ≤ 2.5s
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">En attente...</div>
            )}
          </div>

          {/* FID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">FID</span>
              {metrics.fid && getRatingIcon(metrics.fid.rating)}
            </div>
            {metrics.fid ? (
              <>
                <div className="text-2xl font-bold">
                  {formatValue('fid', metrics.fid.value)}
                </div>
                <Progress
                  value={Math.min((metrics.fid.value / 300) * 100, 100)}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  Cible: ≤ 100ms
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">En attente...</div>
            )}
          </div>

          {/* CLS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CLS</span>
              {metrics.cls && getRatingIcon(metrics.cls.rating)}
            </div>
            {metrics.cls ? (
              <>
                <div className="text-2xl font-bold">
                  {formatValue('cls', metrics.cls.value)}
                </div>
                <Progress
                  value={Math.min(metrics.cls.value * 400, 100)}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  Cible: ≤ 0.1
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">En attente...</div>
            )}
          </div>

          {/* FCP (bonus) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">FCP</span>
              {metrics.fcp && getRatingIcon(metrics.fcp.rating)}
            </div>
            {metrics.fcp ? (
              <>
                <div className="text-2xl font-bold">
                  {formatValue('fcp', metrics.fcp.value)}
                </div>
                <Progress
                  value={Math.min((metrics.fcp.value / 3000) * 100, 100)}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  Cible: ≤ 1.8s
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">En attente...</div>
            )}
          </div>

          {/* TTFB (bonus) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">TTFB</span>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            {metrics.ttfb ? (
              <>
                <div className="text-2xl font-bold">
                  {formatValue('ttfb', metrics.ttfb.value)}
                </div>
                <Progress
                  value={Math.min((metrics.ttfb.value / 600) * 100, 100)}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  Cible: ≤ 600ms
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">En attente...</div>
            )}
          </div>

          {/* Score global */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score Global</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            {overallScore !== null ? (
              <>
                <div className="text-2xl font-bold">
                  {overallScore}/100
                </div>
                <Progress value={overallScore} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {overallScore >= 80 ? 'Excellent' : overallScore >= 50 ? 'Bon' : 'À améliorer'}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">Calcul en cours...</div>
            )}
          </div>
        </div>

        {/* Alertes de performance */}
        {(metrics.lcp?.rating === 'poor' ||
          metrics.fid?.rating === 'poor' ||
          metrics.cls?.rating === 'poor') && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Certaines métriques Core Web Vitals nécessitent une attention.
              Vérifiez les optimisations de performance.
            </AlertDescription>
          </Alert>
        )}

        {/* Recommandations */}
        <div className="text-xs text-muted-foreground">
          💡 Conseil: Les métriques se mettent à jour automatiquement lors des interactions utilisateur.
          Utilisez le bouton "Test" pour simuler des métriques en développement.
        </div>
      </CardContent>
    </Card>
  );
};