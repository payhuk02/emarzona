/**
 * Stock Alerts Component
 * Date: 2025-01-28
 * 
 * Component for displaying and managing stock alerts
 * Design responsive avec le même style que Mes Templates
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Package, X, Search, RefreshCw, TrendingDown, AlertCircle, Clock } from '@/components/icons';
import { useStockAlerts, useResolveStockAlert } from '@/hooks/physical/useAdvancedInventory';
import { useStore } from '@/hooks/useStore';
import { StockAlert } from '@/hooks/physical/useAdvancedInventory';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export const StockAlerts: React.FC = () => {
  const { store } = useStore();
  const { data: alerts = [], isLoading } = useStockAlerts(store?.id, false);
  const { data: unresolvedAlerts = [] } = useStockAlerts(store?.id, false);
  const resolveMutation = useResolveStockAlert();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAlert, setSelectedAlert] = React.useState<StockAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = React.useState('');
  const [searchInput, setSearchInput] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const alertsRef = useScrollAnimation<HTMLDivElement>();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return 'Rupture de stock';
      case 'low_stock':
        return 'Stock faible';
      case 'overstock':
        return 'Surstock';
      case 'reorder':
        return 'Réapprovisionnement';
      default:
        return type;
    }
  };

  // Stats calculées
  const stats = useMemo(() => {
    const total = alerts.length;
    const unresolved = alerts.filter(a => !a.is_resolved).length;
    const critical = alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length;
    const resolved = alerts.filter(a => a.is_resolved).length;
    return { total, unresolved, critical, resolved };
  }, [alerts]);

  // Filtrage
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = 
        getAlertTypeLabel(alert.alert_type).toLowerCase().includes(searchLower) ||
        (alert.warehouse_inventory?.inventory_item?.sku || '').toLowerCase().includes(searchLower) ||
        (alert.warehouse_inventory?.warehouse?.name || '').toLowerCase().includes(searchLower);
      return matchesSeverity && matchesSearch;
    });
  }, [alerts, severityFilter, debouncedSearch]);

  const handleResolve = async () => {
    if (!selectedAlert) return;
    try {
      await resolveMutation.mutateAsync({
        id: selectedAlert.id,
        resolution_notes: resolutionNotes,
      });
      setSelectedAlert(null);
      setResolutionNotes('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['stock-alerts', store?.id] });
    toast({
      title: 'Actualisé',
      description: 'Les alertes ont été actualisées',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Alertes de stock</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Surveillez les niveaux de stock et les alertes de réapprovisionnement
          </p>
        </div>
        {stats.unresolved > 0 && (
          <Badge variant="destructive" className="gap-2">
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {stats.unresolved} non résolues
          </Badge>
        )}
      </div>

      {/* Stats Cards - Responsive */}
      {alerts.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total Alertes', value: stats.total, icon: Package, color: 'from-purple-600 to-pink-600' },
            { label: 'Non résolues', value: stats.unresolved, icon: AlertTriangle, color: 'from-red-600 to-orange-600' },
            { label: 'Critiques', value: stats.critical, icon: AlertCircle, color: 'from-red-600 to-pink-600' },
            { label: 'Résolues', value: stats.resolved, icon: CheckCircle2, color: 'from-green-600 to-emerald-600' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Search & Filters - Responsive */}
      {alerts.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-8 sm:pl-10 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                  aria-label="Rechercher dans les alertes de stock"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] h-11 w-11 sm:h-12 sm:w-12"
                    onClick={handleClearSearch}
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                )}
              </div>

              {/* Severity Filter */}
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-48 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm" aria-label="Filtrer par sévérité">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sévérités</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="min-h-[44px] h-11 sm:h-12"
                aria-label="Rafraîchir"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Liste des alertes</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredAlerts.length} alerte{filteredAlerts.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-green-500 mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Aucune alerte de stock pour le moment.
              </p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Search className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Aucune alerte trouvée
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {filteredAlerts.map((alert, index) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    getSeverityColor={getSeverityColor}
                    getAlertTypeLabel={getAlertTypeLabel}
                    onResolve={() => setSelectedAlert(alert)}
                    animationDelay={index * 50}
                  />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Type</TableHead>
                      <TableHead className="min-w-[150px]">Produit</TableHead>
                      <TableHead className="min-w-[150px]">Entrepôt</TableHead>
                      <TableHead className="min-w-[120px]">Quantité</TableHead>
                      <TableHead className="min-w-[120px]">Sévérité</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[100px]">Statut</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{getAlertTypeLabel(alert.alert_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="truncate block">
                            {alert.warehouse_inventory?.inventory_item?.sku || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="truncate block">
                            {alert.warehouse_inventory?.warehouse?.name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{alert.current_quantity}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">
                              {alert.threshold_quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getSeverityColor(alert.severity)} text-white`}
                            variant="default"
                          >
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate block">
                            {format(new Date(alert.created_at), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {alert.is_resolved ? (
                            <Badge variant="outline" className="text-green-600">
                              Résolu
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              En attente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!alert.is_resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAlert(alert)}
                              className="min-h-[44px] h-11"
                            >
                              Résoudre
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Résoudre l'alerte</DialogTitle>
            <DialogDescription>
              Ajoutez des notes sur la résolution de cette alerte de stock.
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>{' '}
                    {getAlertTypeLabel(selectedAlert.alert_type)}
                  </div>
                  <div>
                    <span className="font-medium">Produit:</span>{' '}
                    {selectedAlert.warehouse_inventory?.inventory_item?.sku || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Entrepôt:</span>{' '}
                    {selectedAlert.warehouse_inventory?.warehouse?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Quantité actuelle:</span>{' '}
                    {selectedAlert.current_quantity}
                  </div>
                  <div>
                    <span className="font-medium">Seuil:</span>{' '}
                    {selectedAlert.threshold_quantity}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes de résolution</Label>
                <Textarea
                  id="notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Ex: Stock réapprovisionné, commande passée au fournisseur..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAlert(null);
                setResolutionNotes('');
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleResolve} disabled={resolveMutation.isPending}>
              Résoudre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Alert Card Component for Mobile View
interface AlertCardProps {
  alert: StockAlert;
  getSeverityColor: (severity: string) => string;
  getAlertTypeLabel: (type: string) => string;
  onResolve: () => void;
  animationDelay?: number;
}

function AlertCard({ alert, getSeverityColor, getAlertTypeLabel, onResolve, animationDelay = 0 }: AlertCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation",
        !alert.is_resolved && "border-l-4",
        !alert.is_resolved && alert.severity === 'critical' && "border-l-red-500",
        !alert.is_resolved && alert.severity === 'high' && "border-l-orange-500",
        !alert.is_resolved && alert.severity === 'medium' && "border-l-yellow-500",
        !alert.is_resolved && alert.severity === 'low' && "border-l-blue-500"
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">
                {getAlertTypeLabel(alert.alert_type)}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {alert.warehouse_inventory?.inventory_item?.sku || 'N/A'}
              </CardDescription>
            </div>
          </div>
          <Badge
            className={`${getSeverityColor(alert.severity)} text-white flex-shrink-0`}
            variant="default"
          >
            {alert.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Entrepôt: {alert.warehouse_inventory?.warehouse?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Quantité: {alert.current_quantity} / {alert.threshold_quantity}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{format(new Date(alert.created_at), 'dd MMM yyyy', { locale: fr })}</span>
          </div>
          <div>
            {alert.is_resolved ? (
              <Badge variant="outline" className="text-green-600">
                Résolu
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600">
                En attente
              </Badge>
            )}
          </div>
        </div>
        {!alert.is_resolved && (
          <Button
            onClick={onResolve}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Résoudre
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
