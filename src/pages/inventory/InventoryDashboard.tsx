/**
 * 📦 Gestion d'Inventaire - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète de l'inventaire avec recherche, filtres, tri, export et actions
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  Camera,
  FileSpreadsheet,
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
import { BarcodeScanner } from '@/components/physical/barcode/BarcodeScanner';
import { BarcodeScanResult } from '@/hooks/physical/useBarcodeScanner';
import { InventoryCSVManager } from '@/components/physical/inventory/InventoryCSVManager';
import { useExportInventoryCSV } from '@/hooks/physical/useInventoryCSV';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function InventoryDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState('all');
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const { exportToCSV: exportInventoryCSV } = useExportInventoryCSV();

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
      await exportInventoryCSV(filteredItems);
      logger.info('Inventory exported to CSV', { count: filteredItems.length });
    } catch ( _error: any) {
      logger.error('Error exporting inventory', { error: error.message });
    } finally {
      setIsExporting(false);
    }
  }, [filteredItems, exportInventoryCSV, toast, logger]);

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
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1.5 sm:mb-2">Aucune boutique trouvée</h2>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mb-4 sm:mb-6">
                  Vous devez créer une boutique avant de gérer l'inventaire.
                </p>
                <Button onClick={() => navigate('/store')} className="min-h-[44px] text-xs sm:text-sm">
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
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header avec animation - Style MyTemplates */}
          <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Gestion d'Inventaire
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                Suivez et gérez vos stocks en temps réel
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                disabled={isExporting || filteredItems.length === 0}
                className="min-h-[44px] h-9 sm:h-10 text-xs sm:text-sm transition-all hover:scale-105"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                onClick={handleRefresh}
                size="sm"
                className="min-h-[44px] h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Rafraîchir</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards - Style MyTemplates (Purple-Pink Gradient) */}
          <div 
            ref={statsRef}
            className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            {[
              { label: 'Articles', value: stats.total_items, icon: Package, color: "from-purple-600 to-pink-600" },
              { label: 'Quantité Totale', value: stats.total_quantity, icon: BarChart3, color: "from-blue-600 to-cyan-600" },
              { label: 'Valeur Totale', value: `${stats.total_value.toLocaleString('fr-FR')} XOF`, icon: DollarSign, color: "from-green-600 to-emerald-600" },
              { label: 'Stock Faible', value: stats.low_stock_count, icon: AlertTriangle, color: "from-yellow-600 to-orange-600" },
              { label: 'Rupture', value: stats.out_of_stock_count, icon: AlertTriangle, color: "from-red-600 to-rose-600" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                      {stat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                    <div className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent break-words`}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

          {/* Search & Filters - Style MyTemplates */}
          <Card ref={filtersRef} className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  <Input
                    id="search-inventory"
                    placeholder="Rechercher par nom de produit ou SKU..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8 sm:pl-10 pr-8 sm:pr-20 min-h-[44px] h-9 sm:h-10 text-xs sm:text-sm"
                    aria-label="Rechercher"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {searchInput && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => setSearchInput('')}
                        aria-label="Effacer"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px] h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => setShowBarcodeScanner(true)}
                      aria-label="Scanner code-barres"
                      title="Scanner un code-barres"
                    >
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  {/* Keyboard shortcut indicator */}
                  <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                      ⌘K
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Tabs - Style MyTemplates */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
                <TabsTrigger value="csv" className="text-[10px] xs:text-xs sm:text-sm min-h-[44px] py-2 sm:py-1.5 md:py-2">
                  <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">CSV</span>
                  <span className="sm:hidden">CSV</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="all" 
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span className="hidden sm:inline">Tous</span>
                  <span className="sm:hidden">Tous</span>
                  <span className="opacity-80">({stats.total_items})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ok" 
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span className="hidden sm:inline">Stock OK</span>
                  <span className="sm:hidden">OK</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="low" 
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span className="hidden sm:inline">Stock Faible</span>
                  <span className="sm:hidden">Faible</span>
                  <span className="opacity-80">({stats.low_stock_count})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="out" 
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span className="hidden sm:inline">Rupture</span>
                  <span className="sm:hidden">Rupture</span>
                  <span className="opacity-80">({stats.out_of_stock_count})</span>
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
                  <Card className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400 border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                      <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                        Analyse des Stocks
                      </CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                        Visualisation de la répartition des quantités
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                      <InventoryChart items={filteredItems} />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Import/Export CSV */}
              <TabsContent value="csv" className="space-y-4">
                <InventoryCSVManager />
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

    {/* Dialog Scanner Code-barres */}
    <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scanner de Code-barres</DialogTitle>
          <DialogDescription>
            Scannez un code-barres pour rechercher un produit dans l'inventaire
          </DialogDescription>
        </DialogHeader>
        <BarcodeScanner
          onScanSuccess={(result: BarcodeScanResult) => {
            setSearchInput(result.code);
            setShowBarcodeScanner(false);
            toast({
              title: 'Code-barres scanné',
              description: `Recherche de: ${result.code}`,
            });
          }}
          onClose={() => setShowBarcodeScanner(false)}
          autoStop={true}
        />
      </DialogContent>
    </Dialog>
  </SidebarProvider>
  );
}






