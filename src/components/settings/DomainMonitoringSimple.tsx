import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MonitoringData {
  uptime: {
    percentage: number;
    status: 'online' | 'offline' | 'warning';
    lastCheck: string;
    responseTime: number;
  };
  performance: {
    loadTime: number;
    lighthouseScore: number;
    cdnStatus: 'active' | 'inactive';
  };
  traffic: {
    visitors24h: number;
    pageViews24h: number;
    bounceRate: number;
  };
  alerts: {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }[];
}

interface DomainMonitoringSimpleProps {
  domain: string | null;
  onStartMonitoring?: () => Promise<boolean>;
  onCheckHealth?: () => Promise<boolean>;
  onSendAlert?: (message: string) => Promise<boolean>;
}

export const DomainMonitoringSimple: React.FC<DomainMonitoringSimpleProps> = ({
  domain,
  onStartMonitoring,
  onCheckHealth,
  onSendAlert
}) => {
  const { toast } = useToast();
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Simulation de données de monitoring
  const generateMockData = (): MonitoringData => {
    const now = new Date();
    return {
      uptime: {
        percentage: Math.random() > 0.1 ? 99.9 : 95.2,
        status: Math.random() > 0.1 ? 'online' : 'warning',
        lastCheck: now.toISOString(),
        responseTime: Math.floor(Math.random() * 200) + 50
      },
      performance: {
        loadTime: Math.random() * 2 + 0.5,
        lighthouseScore: Math.floor(Math.random() * 20) + 80,
        cdnStatus: 'active'
      },
      traffic: {
        visitors24h: Math.floor(Math.random() * 1000) + 500,
        pageViews24h: Math.floor(Math.random() * 3000) + 1000,
        bounceRate: Math.random() * 30 + 20
      },
      alerts: [
        {
          id: '1',
          type: 'warning',
          message: 'Temps de réponse élevé détecté',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          type: 'info',
          message: 'Pic de trafic détecté',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          resolved: true
        }
      ]
    };
  };

  const startMonitoring = async () => {
    if (!domain) {
      toast({
        title: "Erreur",
        description: "Aucun domaine configuré",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulation du démarrage du monitoring
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (onStartMonitoring) {
        await onStartMonitoring();
      }
      
      setIsMonitoring(true);
      setMonitoringData(generateMockData());
      
      toast({
        title: "Monitoring démarré",
        description: `Le monitoring de ${domain} a été activé avec succès.`
      });
    } catch (error) {
      console.error('Error starting monitoring:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le monitoring.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkHealth = async () => {
    if (!domain) return;

    setIsLoading(true);
    try {
      // Simulation de vérification de santé
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onCheckHealth) {
        await onCheckHealth();
      }
      
      setMonitoringData(generateMockData());
      
      toast({
        title: "Vérification terminée",
        description: "L'état de santé du domaine a été vérifié."
      });
    } catch (error) {
      console.error('Error checking health:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier l'état de santé.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUptimeStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getUptimeStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    if (isMonitoring && !monitoringData) {
      setMonitoringData(generateMockData());
    }
  }, [isMonitoring, monitoringData]);

  if (!domain) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Configurez d'abord un domaine pour activer le monitoring</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monitoring du domaine
              </CardTitle>
              <CardDescription>
                Surveillance en temps réel de {domain}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isMonitoring ? (
                <Button
                  onClick={startMonitoring}
                  disabled={isLoading}
                  className="gradient-primary"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Démarrer le monitoring
                </Button>
              ) : (
                <Button
                  onClick={checkHealth}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Vérifier maintenant
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {isMonitoring && monitoringData && (
        <>
          {/* Statut général */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold">{monitoringData.uptime.percentage}%</p>
                  </div>
                  <div className={`${getUptimeStatusColor(monitoringData.uptime.status)}`}>
                    {getUptimeStatusIcon(monitoringData.uptime.status)}
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={monitoringData.uptime.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Temps de réponse</p>
                    <p className="text-2xl font-bold">{monitoringData.uptime.responseTime}ms</p>
                  </div>
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dernière vérification: {new Date(monitoringData.uptime.lastCheck).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score Lighthouse</p>
                    <p className="text-2xl font-bold">{monitoringData.performance.lighthouseScore}/100</p>
                  </div>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="mt-2">
                  <Progress value={monitoringData.performance.lighthouseScore} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Visiteurs (24h)</p>
                    <p className="text-2xl font-bold">{monitoringData.traffic.visitors24h.toLocaleString()}</p>
                  </div>
                  <Users className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {monitoringData.traffic.pageViews24h.toLocaleString()} pages vues
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance détaillée */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance détaillée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Temps de chargement</span>
                    <span className="font-medium">{monitoringData.performance.loadTime.toFixed(2)}s</span>
                  </div>
                  <Progress value={(3 - monitoringData.performance.loadTime) / 3 * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taux de rebond</span>
                    <span className="font-medium">{monitoringData.traffic.bounceRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={100 - monitoringData.traffic.bounceRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CDN</span>
                    <Badge variant={monitoringData.performance.cdnStatus === 'active' ? 'default' : 'secondary'}>
                      {monitoringData.performance.cdnStatus === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertes */}
          {monitoringData.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes récentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {monitoringData.alerts.map((alert) => (
                  <Alert key={alert.id} variant={alert.resolved ? 'default' : 'destructive'}>
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <span>{alert.message}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
