/**
 * StockAlertManager - Gestionnaire d'alertes de stock
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Plus,
  MoreVertical,
  Trash2,
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  useStockAlerts,
  useCreateStockAlert,
  useToggleStockAlert,
  useDeleteStockAlert,
  StockAlert,
} from '@/hooks/physical/usePhysicalNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StockAlertForm } from './StockAlertForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const StockAlertManager = () => {
  const { data: alerts, isLoading, error } = useStockAlerts();
  const toggleAlert = useToggleStockAlert();
  const deleteAlert = useDeleteStockAlert();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des alertes. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            En stock
          </Badge>
        );
      case 'low_stock':
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Stock faible
          </Badge>
        );
      case 'out_of_stock':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Rupture
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Alertes de stock
              </CardTitle>
              <CardDescription>
                Soyez notifié lorsque vos produits favoris sont de nouveau en stock
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle alerte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une alerte de stock</DialogTitle>
                  <DialogDescription>
                    Configurez une alerte pour être notifié du retour en stock
                  </DialogDescription>
                </DialogHeader>
                <StockAlertForm
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!alerts || alerts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune alerte</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre première alerte pour être notifié du retour en stock
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une alerte
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead>Statut stock</TableHead>
                  <TableHead>Notifier</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière alerte</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">
                      Produit #{alert.product_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {alert.variant_id ? (
                        <span className="text-sm text-muted-foreground">
                          Variante #{alert.variant_id.slice(0, 8)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Toutes</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(alert.stock_status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {alert.notify_on_back_in_stock && (
                          <Badge variant="outline" className="text-xs">
                            Retour stock
                          </Badge>
                        )}
                        {alert.notify_on_low_stock && (
                          <Badge variant="outline" className="text-xs">
                            Stock faible
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={alert.is_active}
                          onCheckedChange={(checked) =>
                            toggleAlert.mutate({ alertId: alert.id, isActive: checked })
                          }
                          disabled={toggleAlert.isPending}
                        />
                        {alert.is_active ? (
                          <Badge variant="default" className="gap-1">
                            <Bell className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <BellOff className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.alert_sent_at ? (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(alert.alert_sent_at), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions pour l'alerte de stock ${alert.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              deleteAlert.mutate(alert.id, {
                                onSuccess: () => {
                                  // Toast déjà géré par le hook
                                },
                              })
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};







