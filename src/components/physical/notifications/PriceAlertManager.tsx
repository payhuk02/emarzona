/**
 * PriceAlertManager - Gestionnaire d'alertes de prix
 * Date: 2025-01-27
 */

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
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  DollarSign,
  Plus,
  MoreVertical,
  Trash2,
  Bell,
  BellOff,
  TrendingDown,
} from 'lucide-react';
import {
  usePriceAlerts,
  useCreatePriceAlert,
  useTogglePriceAlert,
  useDeletePriceAlert,
  PriceAlert,
} from '@/hooks/physical/usePhysicalNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PriceAlertForm } from './PriceAlertForm';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PriceAlertManager = () => {
  const { data: alerts, isLoading, error } = usePriceAlerts();
  const toggleAlert = useTogglePriceAlert();
  const deleteAlert = useDeletePriceAlert();
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Alertes de prix
              </CardTitle>
              <CardDescription>
                Soyez notifié lorsque les prix de vos produits favoris baissent
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
                  <DialogTitle>Créer une alerte de prix</DialogTitle>
                  <DialogDescription>
                    Configurez une alerte pour être notifié des baisses de prix
                  </DialogDescription>
                </DialogHeader>
                <PriceAlertForm
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
              <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune alerte</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre première alerte pour être notifié des baisses de prix
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
                  <TableHead>Prix initial</TableHead>
                  <TableHead>Prix actuel</TableHead>
                  <TableHead>Réduction</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière alerte</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const priceDrop = alert.original_price - alert.current_price;
                  const priceDropPercentage = (priceDrop / alert.original_price) * 100;

                  return (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        Produit #{alert.product_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {alert.original_price.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                        })}
                      </TableCell>
                      <TableCell>
                        {alert.current_price.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                        })}
                      </TableCell>
                      <TableCell>
                        {priceDrop > 0 ? (
                          <Badge variant="default" className="bg-green-500">
                            -{priceDropPercentage.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                        <Select>
                          <SelectTrigger
                            <Button variant="ghost" size="icon" aria-label={`Actions pour l'alerte de prix ${alert.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <SelectItem value="edit" onSelect
                              onSelect={() =>
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
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};







