import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { CompactShippingInfo } from './ShippingInfoDisplay';
import type { ShippingStatus } from '@/hooks/physical/useShippingTracking';

// ============================================================================
// TYPES
// ============================================================================

export interface ShippingDashboardProps {
  storeId: string;
  className?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_STATS = {
  total_shipments: 342,
  pending: 15,
  in_transit: 48,
  delivered: 279,
  failed: 0,
  on_time_rate: 94.2,
  avg_delivery_days: 3.5,
  carriers: {
    dhl: 145,
    fedex: 98,
    ups: 65,
    la_poste: 34,
  },
  today_shipments: 12,
  this_week: 67,
  trending: 'up' as 'up' | 'down',
};

const MOCK_RECENT_SHIPMENTS = [
  {
    id: 'ship_1',
    order_number: '#12345',
    customer_name: 'Marie Diallo',
    status: 'in_transit' as ShippingStatus,
    carrier: 'DHL',
    tracking_number: 'DHL123456789',
    shipped_date: '2025-10-27',
    estimated_delivery: '2025-10-30',
  },
  {
    id: 'ship_2',
    order_number: '#12346',
    customer_name: 'Amadou Traoré',
    status: 'delivered' as ShippingStatus,
    carrier: 'FedEx',
    tracking_number: 'FDX987654321',
    shipped_date: '2025-10-25',
    estimated_delivery: '2025-10-28',
  },
  {
    id: 'ship_3',
    order_number: '#12347',
    customer_name: 'Fatou Sow',
    status: 'pending' as ShippingStatus,
    carrier: 'UPS',
    tracking_number: '',
    shipped_date: '',
    estimated_delivery: '2025-11-01',
  },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ShippingStatusBadge({ status }: { status: ShippingStatus }) {
  const config: Record<
    ShippingStatus,
    { label: string; className: string; icon: typeof Package }
  > = {
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = MOCK_STATS;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord Expéditions</h1>
          <p className="text-muted-foreground mt-1">
            Suivi complet de vos livraisons
          </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              +{stats.this_week} cette semaine
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pending} en attente
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {stats.failed} échecs
            </p>
          </CardContent>
        </Card>

        {/* On-Time Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux À Temps</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.on_time_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Moy. {stats.avg_delivery_days}j de livraison
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
                <span className="font-medium">{stats.on_time_rate}%</span>
              </div>
              <Progress value={stats.on_time_rate} className="h-2" />
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
            {Object.entries(stats.carriers).map(([carrier, count]) => {
              const percentage = (count / stats.total_shipments) * 100;
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
            })}
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
                    {MOCK_RECENT_SHIPMENTS.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">{shipment.order_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {shipment.customer_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{shipment.carrier}</Badge>
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
                            {shipment.estimated_delivery || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    <div className="space-y-3">
                      {['Dakar (45%)', 'Abidjan (28%)', 'Lomé (15%)', 'Bamako (12%)'].map(
                        (city, index) => (
                          <div key={city} className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{city}</p>
                              <Progress
                                value={[45, 28, 15, 12][index]}
                                className="h-2 mt-1"
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Carriers Tab */}
            <TabsContent value="carriers" className="mt-0">
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
                          {((count / stats.total_shipments) * 100).toFixed(1)}% du total
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4">
                          Voir Détails
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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

