import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  BarChart3,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import our components
import { PhysicalProductsList } from './PhysicalProductsList';
import { StockMovementHistory } from './StockMovementHistory';
import { BulkInventoryUpdate } from './BulkInventoryUpdate';
import { PreOrderManager } from './PreOrderManager';
import { BackorderManager } from './BackorderManager';

// ============================================================================
// TYPES
// ============================================================================

export interface InventoryDashboardProps {
  storeId: string;
  className?: string;
}

// ============================================================================
// MOCK STATS
// ============================================================================

const MOCK_STATS = {
  total_products: 156,
  total_value: 8_450_000,
  total_quantity: 2_345,
  low_stock_alerts: 12,
  out_of_stock: 5,
  pre_orders: 3,
  backorders: 2,
  movements_today: 48,
  avg_stock_value: 54_166,
  turnover_rate: 2.3, // times per month
  top_category: 'Électronique',
  trending: 'up' as 'up' | 'down',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InventoryDashboard({ storeId, className }: InventoryDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = MOCK_STATS;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExportReport = () => {
    // Export functionality
    console.log('Exporting inventory report...');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord Inventaire</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble complète de votre stock
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
          <Button variant="outline" onClick={handleExportReport} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_products}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total_quantity.toLocaleString()} unités en stock
            </p>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur du Stock</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_value.toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground mt-1">
              Moy. {stats.avg_stock_value.toLocaleString()} XOF/produit
            </p>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-orange-600">{stats.low_stock_alerts}</div>
              <Badge variant="destructive">{stats.out_of_stock} ruptures</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stock faible</p>
          </CardContent>
        </Card>

        {/* Turnover */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotation</CardTitle>
            {stats.trending === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.turnover_rate}x</div>
            <p className="text-xs text-muted-foreground mt-1">Par mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pré-commandes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pre_orders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Backorders</p>
                <p className="text-2xl font-bold text-orange-600">{stats.backorders}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mouvements (24h)</p>
                <p className="text-2xl font-bold">{stats.movements_today}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="movements">Mouvements</TabsTrigger>
              <TabsTrigger value="bulk">Mise à jour groupée</TabsTrigger>
              <TabsTrigger value="preorders">Pré-commandes</TabsTrigger>
              <TabsTrigger value="backorders">Backorders</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="mt-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Liste des Produits</h3>
                  <Badge variant="secondary">{stats.total_products} produits</Badge>
                </div>
                <PhysicalProductsList
                  storeId={storeId}
                  onCreateProduct={() => console.log('Create product')}
                  onEditProduct={(id) => console.log('Edit:', id)}
                  onViewProduct={(id) => console.log('View:', id)}
                />
              </div>
            </TabsContent>

            {/* Movements Tab */}
            <TabsContent value="movements" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Historique des Mouvements</h3>
                  <Badge variant="secondary">{stats.movements_today} aujourd'hui</Badge>
                </div>
                <StockMovementHistory
                  storeId={storeId}
                  maxHeight="600px"
                />
              </div>
            </TabsContent>

            {/* Bulk Update Tab */}
            <TabsContent value="bulk" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Mise à Jour Groupée</h3>
                  <Badge variant="outline">CSV Import/Export</Badge>
                </div>
                <BulkInventoryUpdate
                  storeId={storeId}
                  onComplete={(count) => console.log(`Updated ${count} products`)}
                />
              </div>
            </TabsContent>

            {/* Pre-orders Tab */}
            <TabsContent value="preorders" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pré-commandes</h3>
                  <Badge variant="default" className="bg-blue-600">
                    {stats.pre_orders} actives
                  </Badge>
                </div>
                <PreOrderManager storeId={storeId} />
              </div>
            </TabsContent>

            {/* Backorders Tab */}
            <TabsContent value="backorders" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Backorders (Ruptures)</h3>
                  <Badge variant="default" className="bg-orange-600">
                    {stats.backorders} actifs
                  </Badge>
                </div>
                <BackorderManager storeId={storeId} />
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
              Nouveau Produit
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              Importer CSV
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <BarChart3 className="h-4 w-4" />
              Rapport Complet
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <AlertTriangle className="h-4 w-4" />
              Générer Alertes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

