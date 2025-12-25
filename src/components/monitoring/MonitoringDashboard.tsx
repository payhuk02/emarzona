/**
 * Dashboard de Monitoring en Temps Réel
 * Affiche les métriques, alertes et statistiques de performance
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  getRecentMetrics, 
  getActiveAlerts, 
  getAllAlerts, 
  getStatistics,
  acknowledgeAlert,
  type Metric,
  type Alert as AlertType,
} from '@/lib/monitoring-enhanced';
import { AlertTriangle, CheckCircle, XCircle, Activity, TrendingUp, TrendingDown } from 'lucide-react';

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [statistics, setStatistics] = useState(getStatistics());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refresh = () => {
    setMetrics(getRecentMetrics(50));
    setAlerts(getActiveAlerts());
    setStatistics(getStatistics());
  };

  useEffect(() => {
    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, 5000); // Rafraîchir toutes les 5 secondes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
    refresh();
  };

  const getMetricColor = (type: string) => {
    switch (type) {
      case 'page_load':
        return 'bg-blue-500';
      case 'api_response':
        return 'bg-green-500';
      case 'component_render':
        return 'bg-purple-500';
      case 'error_rate':
        return 'bg-red-500';
      case 'memory_usage':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(2)}ms`;
    }
    if (unit === 'MB') {
      return `${value.toFixed(2)}MB`;
    }
    if (unit === 'ratio') {
      return `${(value * 100).toFixed(2)}%`;
    }
    return `${value.toFixed(2)}${unit}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Dashboard de Monitoring</h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            Surveillance en temps réel des performances et alertes
          </p>
        </div>
        <Button
          variant={autoRefresh ? 'default' : 'outline'}
          onClick={() => setAutoRefresh(!autoRefresh)}
          className="min-h-[44px]"
        >
          {autoRefresh ? 'Pause' : 'Reprendre'} Auto-refresh
        </Button>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Métriques</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalMetrics}</div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(statistics.metricsByType).length} types différents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalAlerts} alertes au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Chargement Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.averageValues.page_load
                ? `${statistics.averageValues.page_load.toFixed(0)}ms`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Page load time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Erreur</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.averageValues.error_rate
                ? `${(statistics.averageValues.error_rate * 100).toFixed(2)}%`
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Erreurs / Requêtes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertes Actives</CardTitle>
            <CardDescription>
              {alerts.length} alerte(s) nécessitant une attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.severity === 'critical' ? 'destructive' : 'default'}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>
                    {alert.severity === 'critical' ? 'Critique' : 'Avertissement'}: {alert.metricName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAcknowledge(alert.id)}
                    className="min-h-[44px]"
                  >
                    Acquitter
                  </Button>
                </AlertTitle>
                <AlertDescription>
                  {alert.message}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Valeur: {formatValue(alert.value, 'ms')} | Seuil: {formatValue(alert.threshold, 'ms')}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Métriques récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques Récentes</CardTitle>
          <CardDescription>
            Dernières 50 métriques enregistrées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune métrique enregistrée
              </p>
            ) : (
              metrics.slice().reverse().map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getMetricColor(metric.type)}`} />
                    <div>
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{metric.type}</Badge>
                    <span className="font-mono text-sm">
                      {formatValue(metric.value, metric.unit)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques par type */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques par Type</CardTitle>
          <CardDescription>
            Vue d'ensemble des métriques par catégorie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(statistics.metricsByType).map(([type, count]) => (
              <div key={type} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                  <Badge>{count}</Badge>
                </div>
                {statistics.averageValues[type as keyof typeof statistics.averageValues] && (
                  <div className="text-sm text-muted-foreground">
                    Moyenne: {formatValue(
                      statistics.averageValues[type as keyof typeof statistics.averageValues],
                      type === 'error_rate' ? 'ratio' : 'ms'
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

