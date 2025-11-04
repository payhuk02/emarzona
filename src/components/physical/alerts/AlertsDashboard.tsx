/**
 * Alerts Dashboard Component
 * Dashboard pour afficher et gérer les alertes produits physiques
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveAlerts, useAcknowledgeAlert, useResolveAlert, useDismissAlert, type PhysicalProductAlert } from '@/hooks/physical/useAlerts';
import { useStore } from '@/hooks/useStore';
import { AlertTriangle, CheckCircle2, XCircle, Package, Filter, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SEVERITY_COLORS: Record<PhysicalProductAlert['severity'], string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const ALERT_TYPE_LABELS: Record<PhysicalProductAlert['alert_type'], string> = {
  low_stock: 'Stock faible',
  out_of_stock: 'Stock épuisé',
  reorder_needed: 'Réapprovisionnement nécessaire',
  high_return_rate: 'Taux de retour élevé',
  slow_moving: 'Produit lent à vendre',
  overstock: 'Surstock',
  expiring_soon: 'Expiration proche',
  price_competition: 'Concurrence prix',
};

interface AlertsDashboardProps {
  storeId: string;
}

export const AlertsDashboard = ({ storeId }: AlertsDashboardProps) => {
  const [selectedType, setSelectedType] = useState<PhysicalProductAlert['alert_type'] | 'all'>('all');
  const { data: alerts = [], isLoading } = useActiveAlerts(storeId);
  
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const dismissAlert = useDismissAlert();

  const filteredAlerts = selectedType === 'all' 
    ? alerts 
    : alerts.filter(a => a.alert_type === selectedType);

  const criticalAlerts = filteredAlerts.filter(a => a.severity === 'critical');
  const highAlerts = filteredAlerts.filter(a => a.severity === 'high');
  const mediumAlerts = filteredAlerts.filter(a => a.severity === 'medium');
  const lowAlerts = filteredAlerts.filter(a => a.severity === 'low');

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Alertes Produits
          </h1>
          <p className="text-muted-foreground">
            {filteredAlerts.length} alerte{filteredAlerts.length > 1 ? 's' : ''} active{filteredAlerts.length > 1 ? 's' : ''}
          </p>
        </div>
        <Select value={selectedType} onValueChange={(value) => setSelectedType(value as typeof selectedType)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="low_stock">Stock faible</SelectItem>
            <SelectItem value="out_of_stock">Stock épuisé</SelectItem>
            <SelectItem value="reorder_needed">Réapprovisionnement</SelectItem>
            <SelectItem value="high_return_rate">Taux retour élevé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn(criticalAlerts.length > 0 && 'border-red-500')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{criticalAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Critiques</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{highAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Élevées</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{mediumAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Moyennes</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{lowAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Faibles</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <p className="text-lg font-medium">Aucune alerte active</p>
              <p className="text-sm">Tout est sous contrôle !</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={cn(
              alert.severity === 'critical' && 'border-red-500',
              alert.severity === 'high' && 'border-orange-500'
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{alert.title}</CardTitle>
                      <Badge className={cn(SEVERITY_COLORS[alert.severity])}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline">
                        {ALERT_TYPE_LABELS[alert.alert_type]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(alert.triggered_at), 'PPp', { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Message */}
                <p className="text-sm">{alert.message}</p>

                {/* Product Info */}
                {alert.product && (
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    {alert.product.image_url && (
                      <img
                        src={alert.product.image_url}
                        alt={alert.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{alert.product.name}</p>
                      {alert.details?.current_stock !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          Stock actuel: {alert.details.current_stock} unités
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {alert.action_url && (
                    <Button
                      size="sm"
                      onClick={() => window.open(alert.action_url, '_blank')}
                    >
                      {alert.action_label || 'Agir'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert.mutate(alert.id)}
                    disabled={acknowledgeAlert.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Reconnaître
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAlert.mutate(alert.id)}
                    disabled={resolveAlert.isPending}
                  >
                    Résoudre
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissAlert.mutate(alert.id)}
                    disabled={dismissAlert.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Ignorer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

