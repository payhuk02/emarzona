/**
 * 📦 Commandes - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète des commandes avec recherche, filtres, tri, export et actions
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Package, 
  Download, 
  Search, 
  X, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  TrendingUp,
  Filter,
  Grid3x3,
  List,
  Keyboard,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useOrders, SortColumn, SortDirection, Order } from "@/hooks/useOrders";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { OrdersList } from "@/components/orders/OrdersList";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrdersPagination } from "@/components/orders/OrdersPagination";
import { exportOrdersToCSV } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

const Orders = () => {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [error, setError] = useState<string | null>(null);

  // Fetch orders with error handling
  const { orders, loading: ordersLoading, totalCount, error: ordersError, refetch } = useOrders(store?.id, { 
    page, 
    pageSize,
    sortBy,
    sortDirection 
  });

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const ordersRef = useScrollAnimation<HTMLDivElement>();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, completed: 0, totalRevenue: 0 };
    
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return { total, pending, completed, totalRevenue };
  }, [orders]);

  // Handle sort
  const handleSort = useCallback((column: SortColumn) => {
    logger.info('Tri des commandes', { column });
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
    setPage(0);
  }, [sortBy, sortDirection]);

  // Handle export CSV
  const handleExportCSV = useCallback(() => {
    try {
      if (!filteredOrders || filteredOrders.length === 0) {
        logger.warn('Export CSV: aucune commande à exporter');
        toast({
          title: t('orders.toast.warning', 'Attention'),
          description: t('orders.toast.noOrders', 'Aucune commande à exporter'),
          variant: "destructive",
        });
        return;
      }

      logger.info('Export CSV de commandes', { count: filteredOrders.length });
      exportOrdersToCSV(filteredOrders);
      logger.info('Export CSV réussi');
      toast({
        title: t('orders.toast.success', '✅ Export réussi'),
        description: t('orders.toast.exported', '{{count}} commande(s) exportée(s)', { count: filteredOrders.length }),
      });
    } catch (error: any) {
      logger.error('Erreur lors de l\'export CSV', error);
      toast({
        title: t('orders.toast.error', '❌ Erreur'),
        description: error.message || t('orders.toast.exportError', 'Impossible d\'exporter les commandes'),
        variant: "destructive",
      });
    }
  }, [filteredOrders, toast, t]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    logger.info('Recherche effacée');
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setError(null);
    setPage(0);
    refetch();
    logger.info('Rafraîchissement des commandes');
    toast({
      title: t('orders.refreshed', 'Actualisé'),
      description: t('orders.refreshedDesc', 'Les commandes ont été actualisées'),
    });
  }, [refetch, toast, t]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter((order) => {
      // Search filter
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchLower) ||
        order.customers?.name?.toLowerCase().includes(searchLower) ||
        order.customers?.email?.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      // Payment status filter
      const matchesPayment = paymentStatusFilter === "all" || order.payment_status === paymentStatusFilter;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange?.from && dateRange?.to) {
        const orderDate = new Date(order.created_at);
        matchesDateRange = isWithinInterval(orderDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        });
      } else if (dateRange?.from) {
        const orderDate = new Date(order.created_at);
        matchesDateRange = orderDate >= startOfDay(dateRange.from);
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesDateRange;
    });
  }, [orders, debouncedSearch, statusFilter, paymentStatusFilter, dateRange]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Ctrl/Cmd + K pour focus recherche
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Ctrl/Cmd + G pour basculer vue
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
        logger.info('Mode d\'affichage changé', { mode: viewMode === "grid" ? "list" : "grid" });
      }

      // Escape pour effacer recherche
      if (e.key === "Escape" && searchInput) {
        handleClearSearch();
      }

      // Ctrl/Cmd + N pour nouvelle commande
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setIsCreateDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInput, viewMode, handleClearSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, paymentStatusFilter, dateRange, debouncedSearch]);

  // Logging on mount
  useEffect(() => {
    logger.info('Page Commandes chargée', { 
      storeId: store?.id,
      totalOrders: orders?.length || 0 
    });
  }, [store?.id, orders?.length]);

  // Update error state from hook
  useEffect(() => {
    if (ordersError) {
      setError(ordersError.message || 'Une erreur est survenue lors du chargement des commandes');
    } else {
      setError(null);
    }
  }, [ordersError]);

  // Loading state
  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <Skeleton className="h-8 w-64 mb-6" />
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // No store state
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  {t('orders.noStore.title', 'Boutique non configurée')}
                </CardTitle>
                <CardDescription>
                  {t('orders.noStore.description', 'Veuillez d\'abord créer votre boutique pour gérer vos commandes.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.href = '/dashboard/store'}>
                  {t('orders.noStore.createStore', 'Créer une boutique')}
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {t('orders.error.title', 'Erreur')}
                </CardTitle>
                <CardDescription className="text-red-700 dark:text-red-300">
                  {error}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('orders.retry', 'Réessayer')}
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
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto" role="main" aria-labelledby="orders-title">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div 
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
              role="banner"
            >
              <div>
                <h1 
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-1 sm:mb-2 flex items-center gap-2"
                  id="orders-title"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20 animate-in zoom-in duration-500">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {t('orders.title', 'Commandes')}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('orders.subtitle', 'Gérez toutes vos commandes et suivez leurs statuts')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleExportCSV} 
                  disabled={!orders || orders.length === 0}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                  aria-label={t('orders.export', 'Exporter')}
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('orders.export', 'Exporter')}</span>
                  <span className="sm:hidden">{t('orders.exportShort', 'Export')}</span>
                </Button>
                <Button 
                  onClick={() => {
                    setIsCreateDialogOpen(true);
                    logger.info('Ouverture dialog création commande');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-9 sm:h-10 text-xs sm:text-sm"
                  aria-label={t('orders.new', 'Nouvelle commande')}
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('orders.new', 'Nouvelle commande')}</span>
                  <span className="sm:hidden">{t('orders.newShort', 'Nouveau')}</span>
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘N
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Stats Cards - Responsive */}
            <div 
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                { 
                  label: t('orders.stats.total', 'Total'), 
                  value: stats.total, 
                  icon: Package, 
                  color: "from-blue-600 to-cyan-600" 
                },
                { 
                  label: t('orders.stats.pending', 'En attente'), 
                  value: stats.pending, 
                  icon: Clock, 
                  color: "from-orange-600 to-amber-600" 
                },
                { 
                  label: t('orders.stats.completed', 'Terminées'), 
                  value: stats.completed, 
                  icon: CheckCircle2, 
                  color: "from-green-600 to-emerald-600" 
                },
                { 
                  label: t('orders.stats.revenue', 'Chiffre d\'affaires'), 
                  value: `${stats.totalRevenue.toLocaleString()} XOF`, 
                  icon: DollarSign, 
                  color: "from-purple-600 to-pink-600" 
                },
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

            {/* Search, Filters & View Toggle - Responsive */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('orders.searchPlaceholder', 'Rechercher par numéro, client...')}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                      aria-label={t('orders.search', 'Rechercher')}
                    />
                    {searchInput && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                        onClick={handleClearSearch}
                        aria-label={t('common.clear', 'Effacer')}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                    {/* Keyboard shortcut indicator */}
                    <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        ⌘K
                      </Badge>
                    </div>
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted/50 backdrop-blur-sm rounded-md p-1">
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          setViewMode('list');
                          logger.info('Mode d\'affichage: liste');
                        }}
                        className="h-8 w-8 p-0"
                        aria-label={t('orders.viewList', 'Vue liste')}
                      >
                        <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          setViewMode('grid');
                          logger.info('Mode d\'affichage: grille');
                        }}
                        className="h-8 w-8 p-0"
                        aria-label={t('orders.viewGrid', 'Vue grille')}
                      >
                        <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>

                    {/* Refresh */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      className="h-9 sm:h-10"
                      aria-label={t('orders.refresh', 'Rafraîchir')}
                    >
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div 
              ref={filtersRef} 
              role="region" 
              aria-label={t('orders.filters.ariaLabel', 'Filtres de recherche des commandes')}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <OrderFilters
                searchQuery={searchInput}
                onSearchChange={setSearchInput}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                paymentStatusFilter={paymentStatusFilter}
                onPaymentStatusChange={setPaymentStatusFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>

            {/* Orders Content */}
            {ordersLoading ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6" role="status" aria-live="polite">
                  <div className="flex items-center justify-center gap-3 py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {t('orders.loading', 'Chargement des commandes...')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              <div 
                ref={ordersRef} 
                role="region" 
                aria-label={t('orders.list.ariaLabel', 'Liste des commandes')}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                <OrdersList 
                  orders={filteredOrders} 
                  onUpdate={refetch} 
                  storeId={store.id}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                {totalCount > 10 && (
                  <OrdersPagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalCount}
                    onPageChange={setPage}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize);
                      setPage(0);
                    }}
                  />
                )}
              </div>
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16" role="status" aria-live="polite">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" aria-hidden="true" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{t('orders.empty.title', 'Aucune commande')}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md">
                    {searchInput || statusFilter !== "all" || paymentStatusFilter !== "all" || dateRange?.from
                      ? t('orders.empty.noResults', 'Aucune commande ne correspond à vos critères de recherche')
                      : t('orders.empty.description', 'Commencez par créer votre première commande')}
                  </p>
                  {!searchInput && statusFilter === "all" && paymentStatusFilter === "all" && !dateRange?.from && (
                    <Button 
                      onClick={() => {
                        setIsCreateDialogOpen(true);
                        logger.info('Ouverture dialog création depuis état vide');
                      }}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      aria-label={t('orders.empty.createFirst', 'Créer votre première commande')}
                    >
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                      {t('orders.empty.createFirst', 'Créer votre première commande')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Keyboard Shortcuts Help - Desktop Only */}
            <div className="hidden lg:flex items-center justify-center gap-4 p-3 border-t border-border/50 bg-muted/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3" aria-hidden="true" />
                <span>{t('common.shortcuts', 'Raccourcis')}:</span>
                <Badge variant="outline" className="text-[10px] font-mono">⌘K</Badge>
                <span className="text-muted-foreground">{t('orders.shortcuts.search', 'Rechercher')}</span>
                <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘N</Badge>
                <span className="text-muted-foreground">{t('orders.shortcuts.newOrder', 'Nouvelle commande')}</span>
                <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘G</Badge>
                <span className="text-muted-foreground">{t('orders.shortcuts.toggleView', 'Basculer vue')}</span>
                <Badge variant="outline" className="text-[10px] font-mono ml-2">Esc</Badge>
                <span className="text-muted-foreground">{t('orders.shortcuts.clear', 'Effacer')}</span>
              </div>
            </div>
          </div>

          {/* Create Order Dialog */}
          <CreateOrderDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={() => {
              refetch();
              logger.info('Commande créée avec succès');
            }}
            storeId={store.id}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Orders;
