/**
 * Inventory Dashboard
 * Date: 28 octobre 2025
 * 
 * Dashboard complet de gestion des stocks
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Search,
  Download,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  BarChart3,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  useInventoryItems,
  useLowStockAlerts,
  useInventoryValue,
} from '@/hooks/physical/useInventory';
import type { StockAlert } from '@/hooks/physical/useInventory';
import { useStore } from '@/hooks/useStore';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryChart } from '@/components/inventory/InventoryChart';
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog';
import { LowStockAlerts } from '@/components/inventory/LowStockAlerts';

export default function InventoryDashboard() {
  const { store, loading: storeLoading } = useStore();
  const { data: inventoryItems, isLoading: itemsLoading, refetch } = useInventoryItems(store?.id);
  const { data: alerts } = useLowStockAlerts(store?.id || '');
  const { data: inventoryValue } = useInventoryValue(store?.id || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const isLoading = storeLoading || itemsLoading;

  // Filter items
  const filteredItems = inventoryItems?.filter((item: any) => {
    const productName =
      item.physical_product?.product?.name ||
      item.variant?.physical_product?.product?.name ||
      '';
    const matchesSearch =
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'low' && item.quantity_available <= item.reorder_point) ||
      (activeTab === 'out' && item.quantity_available === 0) ||
      (activeTab === 'ok' && item.quantity_available > item.reorder_point);

    return matchesSearch && matchesTab;
  });

  // Stats
  const stats = {
    total_items: inventoryItems?.length || 0,
    total_value: inventoryValue?.total_value || 0,
    total_quantity: inventoryValue?.total_quantity || 0,
    low_stock_count: alerts?.filter((a) => a.alert_type === 'low_stock').length || 0,
    out_of_stock_count: alerts?.filter((a) => a.alert_type === 'out_of_stock').length || 0,
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!inventoryItems) return;

    const headers = [
      'SKU',
      'Produit',
      'Quantité Disponible',
      'Quantité Réservée',
      'Point de Réapprovisionnement',
      'Valeur Totale',
      'Emplacement',
    ];

    const rows = inventoryItems.map((item: any) => {
      const productName =
        item.physical_product?.product?.name ||
        item.variant?.physical_product?.product?.name ||
        'N/A';

      return [
        item.sku,
        productName,
        item.quantity_available,
        item.quantity_reserved,
        item.reorder_point,
        item.total_value || 0,
        item.warehouse_location || 'N/A',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Aucune boutique trouvée</h2>
                <p className="text-muted-foreground mb-6">
                  Vous devez créer une boutique avant de gérer l'inventaire.
                </p>
                <Button onClick={() => (window.location.href = '/store')}>
                  Créer ma boutique
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  Gestion d'Inventaire
                </h1>
                <p className="text-muted-foreground mt-1">
                  Suivez et gérez vos stocks en temps réel
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rafraîchir
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Articles</p>
                      <p className="text-2xl font-bold">{stats.total_items}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Quantité Totale</p>
                      <p className="text-2xl font-bold">{stats.total_quantity}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Valeur Totale</p>
                      <p className="text-2xl font-bold">
                        {stats.total_value.toLocaleString()} XOF
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Faible</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.low_stock_count}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Rupture</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.out_of_stock_count}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alerts */}
          {alerts && alerts.length > 0 && (
            <LowStockAlerts alerts={alerts} className="mb-6" />
          )}

          {/* Search & Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom de produit ou SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                Tous ({stats.total_items})
              </TabsTrigger>
              <TabsTrigger value="ok">
                Stock OK
              </TabsTrigger>
              <TabsTrigger value="low">
                Stock Faible ({stats.low_stock_count})
              </TabsTrigger>
              <TabsTrigger value="out">
                Rupture ({stats.out_of_stock_count})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {/* Inventory Table */}
              <InventoryTable
                items={filteredItems || []}
                onAdjust={(item) => {
                  setSelectedItem(item);
                  setAdjustDialogOpen(true);
                }}
              />

              {/* Analytics Chart */}
              {filteredItems && filteredItems.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Analyse des Stocks</CardTitle>
                    <CardDescription>
                      Visualisation de la répartition des quantités
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InventoryChart items={filteredItems} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Stock Adjustment Dialog */}
          <StockAdjustmentDialog
            open={adjustDialogOpen}
            onOpenChange={setAdjustDialogOpen}
            item={selectedItem}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}

