/**
 * 📦 Gestion d'Inventaire - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète de l'inventaire avec recherche, filtres, tri, export et actions
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Search,
  Download,
  AlertTriangle,
  DollarSign,
  BarChart3,
  RefreshCw,
  X,
  Keyboard,
  Loader2,
  Warehouse,
  TrendingUp,
} from 'lucide-react';
import {
  useInventoryItems,
  useLowStockAlerts,
  useInventoryValue,
} from '@/hooks/physical/useInventory';
import { useStore } from '@/hooks/useStore';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryChart } from '@/components/inventory/InventoryChart';
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog';
import { LowStockAlerts } from '@/components/inventory/LowStockAlerts';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';

export default function InventoryDashboard() {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState('all');
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  // Fetch data
  const { data: inventoryItems, isLoading: itemsLoading, error: itemsError, refetch } = useInventoryItems(store?.id);
  const { data: alerts } = useLowStockAlerts(store?.id || '');
  const { data: inventoryValue, error: valueError } = useInventoryValue(store?.id || '');

  const isLoading = storeLoading || itemsLoading;

  // Filter items with useMemo
  const filteredItems = useMemo(() => {
    if (!inventoryItems) return [];

    return inventoryItems.filter((item: any) => {
      const productName =
        item.physical_product?.product?.name ||
        item.variant?.physical_product?.product?.name ||
        '';
      
      // Search filter
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        productName.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.warehouse_location?.toLowerCase().includes(searchLower);

      // Tab filter
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'low' && item.quantity_available <= item.reorder_point && item.quantity_available > 0) ||
        (activeTab === 'out' && item.quantity_available === 0) ||
        (activeTab === 'ok' && item.quantity_available > item.reorder_point);

      return matchesSearch && matchesTab;
    });
  }, [inventoryItems, debouncedSearch, activeTab]);

  // Stats calculation with useMemo
  const stats = useMemo(() => {
    return {
      total_items: inventoryItems?.length || 0,
      total_value: inventoryValue?.total_value || 0,
      total_quantity: inventoryValue?.total_quantity || 0,
      low_stock_count: alerts?.filter((a) => a.alert_type === 'low_stock').length || 0,
      out_of_stock_count: alerts?.filter((a) => a.alert_type === 'out_of_stock').length || 0,
    };
  }, [inventoryItems, inventoryValue, alerts]);

  // Export CSV with logger
  const handleExportCSV = useCallback(async () => {
    if (!filteredItems || filteredItems.length === 0) {
      toast({
        title: '⚠️ Aucune donnée',
        description: 'Aucun article à exporter.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        'SKU',
        'Produit',
        'Quantité Disponible',
        'Quantité Réservée',
        'Point de Réapprovisionnement',
        'Valeur Totale',
        'Emplacement',
        'Statut',
      ];

      const rows = filteredItems.map((item: any) => {
        const productName =
          item.physical_product?.product?.name ||
          item.variant?.physical_product?.product?.name ||
          'N/A';

        let status = 'Disponible';
        if (item.quantity_available === 0) {
          status = 'Rupture';
        } else if (item.quantity_available <= item.reorder_point) {
          status = 'Stock Faible';
        }

        return [
          item.sku,
          productName,
          item.quantity_available,
          item.quantity_reserved,
          item.reorder_point,
          item.total_value || 0,
          item.warehouse_location || 'N/A',
          status,
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventaire-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Export réussi',
        description: `${filteredItems.length} article(s) exporté(s) en CSV.`,
      });
      logger.info('Inventory exported to CSV', { count: filteredItems.length });
    } catch (error: any) {
      logger.error('Error exporting inventory', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'exporter l\'inventaire.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredItems, toast]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setError(null);
    refetch();
    logger.info('Inventory refreshed');
    toast({
      title: '✅ Actualisé',
      description: 'L\'inventaire a été actualisé.',
    });
  }, [refetch, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K pour recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-inventory')?.focus();
      }
      // Esc pour effacer recherche
      if (e.key === 'Escape' && document.activeElement?.id === 'search-inventory') {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Error handling
  useEffect(() => {
    if (itemsError || valueError) {
      const errorMessage = itemsError?.message || valueError?.message || 'Erreur lors du chargement de l\'inventaire';
      setError(errorMessage);
      logger.error('Inventory fetch error', { error: itemsError || valueError });
    } else {
      setError(null);
    }
  }, [itemsError, valueError]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement de l'inventaire...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6">
            <Card className="animate-in fade-in slide-in-from-top-4">
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
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          {/* Header avec animation */}
          <div ref={headerRef} className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 bg-clip-text text-transparent">
                  Gestion d'Inventaire
                </h1>
                <p className="text-muted-foreground mt-2 text-sm md:text-base">
                  Suivez et gérez vos stocks en temps réel
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  disabled={isExporting || filteredItems.length === 0}
                  className="transition-all hover:scale-105"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  className="transition-all hover:scale-105"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Rafraîchir</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards avec animations - Design Violet Professionnel */}
          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            {/* Carte Articles */}
            <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <CardContent className="p-4 md:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-purple-100 mb-1">Articles</p>
                    <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{stats.total_items}</p>
                  </div>
                  <Package className="h-6 w-6 md:h-8 md:w-8 text-purple-200 drop-shadow-lg" />
                </div>
              </CardContent>
              <div className="absolute top-2 right-2 h-2 w-2 bg-purple-300 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
            </Card>

            {/* Carte Quantité Totale */}
            <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <CardContent className="p-4 md:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-purple-100 mb-1">Quantité Totale</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-400 drop-shadow-lg">{stats.total_quantity}</p>
                  </div>
                  <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-blue-400 drop-shadow-lg" />
                </div>
              </CardContent>
              <div className="absolute top-2 right-2 h-2 w-2 bg-blue-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-blue-400/50"></div>
            </Card>

            {/* Carte Valeur Totale */}
            <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-green-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <CardContent className="p-4 md:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-purple-100 mb-1">Valeur Totale</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-400 drop-shadow-lg">
                      {stats.total_value.toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-purple-200/90 mt-1 font-medium">XOF</p>
                  </div>
                  <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-400 drop-shadow-lg" />
                </div>
              </CardContent>
              <div className="absolute top-2 right-2 h-2 w-2 bg-green-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-green-400/50"></div>
            </Card>

            {/* Carte Stock Faible */}
            <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <CardContent className="p-4 md:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-purple-100 mb-1">Stock Faible</p>
                    <p className="text-2xl md:text-3xl font-bold text-yellow-400 drop-shadow-lg">{stats.low_stock_count}</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-400 drop-shadow-lg" />
                </div>
              </CardContent>
              <div className="absolute top-2 right-2 h-2 w-2 bg-yellow-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-yellow-400/50"></div>
            </Card>

            {/* Carte Rupture */}
            <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-red-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <CardContent className="p-4 md:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-purple-100 mb-1">Rupture</p>
                    <p className="text-2xl md:text-3xl font-bold text-red-400 drop-shadow-lg">{stats.out_of_stock_count}</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-400 drop-shadow-lg" />
                </div>
              </CardContent>
              <div className="absolute top-2 right-2 h-2 w-2 bg-red-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-red-400/50"></div>
            </Card>
          </div>

          {/* Alerts */}
          {alerts && alerts.length > 0 && (
            <LowStockAlerts alerts={alerts} className="animate-in fade-in slide-in-from-top-4 duration-500 delay-150" />
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search & Filters avec animation */}
          <div ref={filtersRef} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-inventory"
                      placeholder="Rechercher par nom de produit ou SKU... ⌘K"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-10 pr-10 w-full"
                    />
                    {searchInput && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchInput('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Raccourcis clavier */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              <span className="hidden sm:inline">Raccourcis: ⌘K (recherche), Esc (effacer)</span>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all" className="flex-1 sm:flex-none">
                  Tous ({stats.total_items})
                </TabsTrigger>
                <TabsTrigger value="ok" className="flex-1 sm:flex-none">
                  Stock OK
                </TabsTrigger>
                <TabsTrigger value="low" className="flex-1 sm:flex-none">
                  Stock Faible ({stats.low_stock_count})
                </TabsTrigger>
                <TabsTrigger value="out" className="flex-1 sm:flex-none">
                  Rupture ({stats.out_of_stock_count})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {/* Inventory Table */}
                <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <InventoryTable
                    items={filteredItems}
                    onAdjust={(item) => {
                      setSelectedItem(item);
                      setAdjustDialogOpen(true);
                      logger.info('Stock adjustment opened', { sku: item.sku });
                    }}
                  />
                </div>

                {/* Analytics Chart */}
                {filteredItems && filteredItems.length > 0 && (
                  <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Analyse des Stocks
                      </CardTitle>
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
          </div>

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
