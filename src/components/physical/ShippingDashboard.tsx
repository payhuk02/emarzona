import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Download,
  RefreshCw,
  BarChart3,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShippingInfo, ShippingStatus } from '@/hooks/physical/useShippingTracking';
import { useShipments, useShippingStats } from '@/hooks/physical/useShippingTracking';
import { useQueryClient } from '@tanstack/react-query';

// ============================================================================
// TYPES
// ============================================================================

export interface ShippingDashboardProps {
  storeId: string;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function countShipmentsSince(shipments: ShippingInfo[], since: Date) {
  return shipments.filter(s => new Date(s.created_at) >= since).length;
}

function buildCarrierCounts(shipments: ShippingInfo[]) {
  return shipments.reduce<Record<string, number>>((acc, shipment) => {
    const key = (shipment.carrier || shipment.carrier_name || 'other').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildCountryCounts(shipments: ShippingInfo[]) {
  return shipments.reduce<Record<string, number>>((acc, shipment) => {
    const country = shipment.shipping_address?.country?.trim() || 'unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ShippingStatusBadge({ status }: { status: ShippingStatus }) {
  const config: Record<ShippingStatus, { label: string; className: string; icon: typeof Package }> =
    {
      pending: { label: 'En attente', className: 'bg-gray-600', icon: Clock },
      processing: { label: 'Traitement', className: 'bg-blue-600', icon: Package },
      packed: { label: 'Emballé', className: 'bg-indigo-600', icon: Package },
      shipped: { label: 'Expédié', className: 'bg-purple-600', icon: Truck },
      in_transit: { label: 'En transit', className: 'bg-orange-600', icon: Truck },
      out_for_delivery: { label: 'En livraison', className: 'bg-yellow-600', icon: Truck },
      delivered: { label: 'Livré', className: 'bg-green-600', icon: CheckCircle2 },
      failed: { label: 'Échec', className: 'bg-red-600', icon: XCircle },
      returned: { label: 'Retourné', className: 'bg-gray-600', icon: Package },
    };

  const { label, className, icon: Icon } = config[status];

  return (
    <Badge className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShippingDashboard({ storeId, className }: ShippingDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();
  const {
    data: statsData,
    isLoading: statsLoading,
    isFetching: statsFetching,
  } = useShippingStats(storeId);
  const { data: shipments = [], isLoading: shipmentsLoading } = useShipments(storeId);

  const isRefreshing = statsFetching || shipmentsLoading;

  const dashboard = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const carriers = buildCarrierCounts(shipments);
    const countries = buildCountryCounts(shipments);
    const total = statsData?.total ?? shipments.length;

    return {
      total_shipments: total,
      pending: statsData?.pending ?? 0,
      in_transit: statsData?.in_transit ?? 0,
      delivered: statsData?.delivered ?? 0,
      failed: statsData?.failed ?? 0,
      on_time_rate: statsData?.on_time_delivery_rate ?? 0,
      avg_delivery_days: statsData?.avg_delivery_time_days ?? 0,
      carriers,
      countries,
      today_shipments: countShipmentsSince(shipments, startOfToday),
      this_week: countShipmentsSince(shipments, startOfWeek),
      recent: [...shipments]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10),
    };
  }, [shipments, statsData]);

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['shipping-stats', storeId] }),
      queryClient.invalidateQueries({ queryKey: ['shipments', storeId] }),
    ]);
  };

  if (statsLoading && shipmentsLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const stats = dashboard;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord Expéditions</h1>
          <p className="text-muted-foreground mt-1">Suivi complet de vos livraisons</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Actualiser
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Shipments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expéditions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_shipments}</div>
            <p className="text-xs text-muted-foreground mt-1">+{stats.this_week} cette semaine</p>
          </CardContent>
        </Card>

        {/* In Transit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transit</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.in_transit}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.pending} en attente</p>
          </CardContent>
        </Card>

        {/* Delivered */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.failed} échecs</p>
          </CardContent>
        </Card>

        {/* On-Time Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux À Temps</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.on_time_rate > 0 ? `${stats.on_time_rate.toFixed(1)}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.avg_delivery_days > 0
                ? `Moy. ${stats.avg_delivery_days.toFixed(1)}j de livraison`
                : 'Pas encore de livraisons mesurées'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Delivery Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance de Livraison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Livrés à temps</span>
                <span className="font-medium">
                  {stats.on_time_rate > 0 ? `${stats.on_time_rate.toFixed(1)}%` : '—'}
                </span>
              </div>
              <Progress value={stats.on_time_rate || 0} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.today_shipments}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cette semaine</p>
                <p className="text-2xl font-bold">{stats.this_week}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carriers Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par Transporteur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(stats.carriers).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune expédition enregistrée.</p>
            ) : (
              Object.entries(stats.carriers).map(([carrier, count]) => {
                const percentage =
                  stats.total_shipments > 0 ? (count / stats.total_shipments) * 100 : 0;
                return (
                  <div key={carrier} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium uppercase">{carrier}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="recent">Récentes</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="carriers">Transporteurs</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="mt-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">En Préparation</p>
                        <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
                      </div>
                      <Package className="h-10 w-10 text-blue-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-900">En Route</p>
                        <p className="text-3xl font-bold text-orange-600">{stats.in_transit}</p>
                      </div>
                      <Truck className="h-10 w-10 text-orange-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Livrés</p>
                        <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
                      </div>
                      <CheckCircle2 className="h-10 w-10 text-green-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recent Shipments Tab */}
            <TabsContent value="recent" className="mt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commande</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Transporteur</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Livraison Estimée</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recent.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Aucune expédition récente
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.recent.map(shipment => (
                        <TableRow key={shipment.id}>
                          <TableCell className="font-medium">
                            {shipment.order_number || shipment.order_id}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {shipment.customer_name || '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {shipment.carrier_name || shipment.carrier || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">
                              {shipment.tracking_number || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <ShippingStatusBadge status={shipment.status} />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {shipment.estimated_delivery_date
                                ? new Date(shipment.estimated_delivery_date).toLocaleDateString(
                                    'fr-FR'
                                  )
                                : '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tendances Hebdomadaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center bg-muted rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Graphique des expéditions</p>
                        <p className="text-xs">Chart.js / Recharts integration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Destinations Populaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(stats.countries).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Les destinations apparaîtront après vos premières expéditions.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(stats.countries)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([country, count]) => {
                            const pct =
                              stats.total_shipments > 0 ? (count / stats.total_shipments) * 100 : 0;
                            return (
                              <div key={country} className="flex items-center gap-3">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {country} ({pct.toFixed(0)}%)
                                  </p>
                                  <Progress value={pct} className="h-2 mt-1" />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Carriers Tab */}
            <TabsContent value="carriers" className="mt-0">
              {Object.keys(stats.carriers).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Aucun transporteur utilisé pour le moment.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(stats.carriers).map(([carrier, count]) => (
                    <Card key={carrier}>
                      <CardHeader>
                        <CardTitle className="text-sm uppercase">{carrier}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.total_shipments > 0
                              ? `${((count / stats.total_shipments) * 100).toFixed(1)}% du total`
                              : '0% du total'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Package className="h-4 w-4" />
              Nouvelle Expédition
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Truck className="h-4 w-4" />
              Imprimer Étiquettes
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <BarChart3 className="h-4 w-4" />
              Rapport Mensuel
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              Exporter Données
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
