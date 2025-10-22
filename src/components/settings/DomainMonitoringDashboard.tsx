import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  Globe,
  Bell,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DomainMonitoring, DomainIncident, DomainAlert } from "@/hooks/useDomain";

interface DomainMonitoringDashboardProps {
  domain: string;
  monitoring: DomainMonitoring | null;
  onStartMonitoring: () => void;
  onCheckHealth: () => void;
  onSendAlert: (alert: DomainAlert, incident: DomainIncident) => void;
}

export const DomainMonitoringDashboard = ({
  domain,
  monitoring,
  onStartMonitoring,
  onCheckHealth,
  onSendAlert
}: DomainMonitoringDashboardProps) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<DomainAlert[]>([]);
  const [incidents, setIncidents] = useState<DomainIncident[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (monitoring) {
      setIsMonitoring(true);
      setAlerts(monitoring.alerts);
      setIncidents(monitoring.incidents);
    }
  }, [monitoring]);

  const handleStartMonitoring = async () => {
    await onStartMonitoring();
    setIsMonitoring(true);
  };

  const handleToggleAlert = async (alertId: string, enabled: boolean) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, enabled } : alert
    ));
    
    toast({
      title: enabled ? "Alerte activée" : "Alerte désactivée",
      description: `Notifications ${enabled ? 'activées' : 'désactivées'} pour ${domain}`,
    });
  };

  const handleSendTestAlert = async (alert: DomainAlert) => {
    const testIncident: DomainIncident = {
      id: `test-${Date.now()}`,
      domain,
      type: 'downtime',
      startTime: new Date().toISOString(),
      description: 'Test d\'alerte - Incident simulé',
      resolved: false
    };

    await onSendAlert(alert, testIncident);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'down': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!isMonitoring) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitoring du Domaine
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Surveillez la disponibilité et les performances de votre domaine
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Monitoring non activé</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Activez le monitoring pour surveiller la disponibilité de votre domaine en temps réel
            </p>
            <Button onClick={handleStartMonitoring} className="gradient-primary">
              <Activity className="h-4 w-4 mr-2" />
              Activer le Monitoring
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Activity className="h-5 w-5" />
            État du Domaine
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Surveillance en temps réel de {domain}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {monitoring && (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Status */}
              <div className="flex items-center gap-3">
                {getStatusIcon(monitoring.status)}
                <div>
                  <p className="font-medium capitalize">{monitoring.status}</p>
                  <p className="text-sm text-muted-foreground">Statut</p>
                </div>
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{monitoring.responseTime}ms</p>
                  <p className="text-sm text-muted-foreground">Temps de réponse</p>
                </div>
              </div>

              {/* Uptime */}
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{monitoring.uptime.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">Disponibilité</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {monitoring && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Disponibilité</span>
                <span>{monitoring.uptime.toFixed(2)}%</span>
              </div>
              <Progress 
                value={monitoring.uptime} 
                className="h-2"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCheckHealth}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Vérifier maintenant
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsMonitoring(false)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Configuration */}
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configuration des Alertes
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configurez les notifications en cas de problème
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium capitalize">{alert.type}</p>
                    <p className="text-sm text-muted-foreground">
                      Seuil: {alert.threshold}% de disponibilité
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={(enabled) => handleToggleAlert(alert.id, enabled)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendTestAlert(alert)}
                    disabled={!alert.enabled}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Alert */}
          <div className="mt-4 p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Ajouter une nouvelle alerte
              </p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Alerte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      {incidents.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Incidents Récents
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Historique des problèmes détectés
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium capitalize">{incident.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {incident.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(incident.startTime).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={incident.resolved ? "default" : "destructive"}>
                    {incident.resolved ? "Résolu" : "En cours"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
