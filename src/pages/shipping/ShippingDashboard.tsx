/**
 * 🚚 Gestion des Expéditions - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète des expéditions avec recherche, filtres, tri, export et suivi en temps réel
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Search,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Download,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useShipments, useUpdateShipmentTracking } from '@/hooks/shipping/useFedexShipping';
import { useStore } from '@/hooks/useStore';
import { ShipmentCard } from '@/components/shipping/ShipmentCard';
import { CreateShipmentDialog } from '@/components/shipping/CreateShipmentDialog';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ShippingDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store, loading: storeLoading } = useStore();
  const { data: shipments, isLoading, error: shipmentsError, refetch } = useShipments(store?.id || '');
  const updateTracking = useUpdateShipmentTracking();

  // State management
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const shipmentsRef = useScrollAnimation<HTMLDivElement>();

  // Filter shipments
  const filteredShipments = useMemo(() => {
    if (!shipments) return [];

    return shipments.filter((shipment) => {
      // Search filter
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        shipment.tracking_number?.toLowerCase().includes(searchLower) ||
        shipment.order?.order_number?.toLowerCase().includes(searchLower) ||
        shipment.order?.id?.toLowerCase().includes(searchLower) ||
        shipment.service_type?.toLowerCase().includes(searchLower);

      // Tab filter
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && ['pending', 'label_created'].includes(shipment.status)) ||
        (activeTab === 'transit' && ['picked_up', 'in_transit', 'out_for_delivery'].includes(shipment.status)) ||
        (activeTab === 'delivered' && shipment.status === 'delivered') ||
        (activeTab === 'issues' && ['failed', 'returned', 'cancelled'].includes(shipment.status));

      return matchesSearch && matchesTab;
    });
  }, [shipments, debouncedSearch, activeTab]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!shipments) return { total: 0, pending: 0, transit: 0, delivered: 0, issues: 0 };

    const total = shipments.length;
    const pending = shipments.filter((s) => ['pending', 'label_created'].includes(s.status)).length;
    const transit = shipments.filter((s) => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length;
    const delivered = shipments.filter((s) => s.status === 'delivered').length;
    const issues = shipments.filter((s) => ['failed', 'returned', 'cancelled'].includes(s.status)).length;

    return { total, pending, transit, delivered, issues };
  }, [shipments]);

  // Handle refresh tracking
  const handleRefreshTracking = useCallback(async (shipmentId: string) => {
    try {
      await updateTracking.mutateAsync(shipmentId);
      toast({
        title: '✅ Suivi mis à jour',
        description: 'Les informations de suivi ont été actualisées.',
      });
      logger.info('Tracking refreshed', { shipmentId });
    } catch (error: any) {
      logger.error('Error refreshing tracking', { shipmentId, error: error.message });
      toast({
        title: '❌ Erreur',
        description: 'Impossible de mettre à jour le suivi.',
        variant: 'destructive',
      });
    }
  }, [updateTracking, toast]);

  // Handle refresh all
  const handleRefreshAll = useCallback(async () => {
    try {
      if (!filteredShipments || filteredShipments.length === 0) {
        toast({
          title: '⚠️ Aucune expédition',
          description: 'Aucune expédition à actualiser.',
        });
        return;
      }

      for (const shipment of filteredShipments) {
        await handleRefreshTracking(shipment.id);
      }

      toast({
        title: '✅ Mise à jour terminée',
        description: `${filteredShipments.length} expédition(s) actualisée(s).`,
      });
      logger.info('All tracking refreshed', { count: filteredShipments.length });
    } catch (error: any) {
      logger.error('Error refreshing all tracking', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: 'Erreur lors de la mise à jour des suivis.',
        variant: 'destructive',
      });
    }
  }, [filteredShipments, handleRefreshTracking, toast]);

  // Export to CSV
  const handleExportCSV = useCallback(async () => {
    if (!filteredShipments || filteredShipments.length === 0) {
      toast({
        title: '⚠️ Aucune donnée',
        description: 'Aucune expédition à exporter.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const headers = ['ID', 'Numéro de tracking', 'Commande', 'Statut', 'Type service', 'Coût', 'Date création', 'Date livraison estimée'];
      const rows = filteredShipments.map((shipment: any) => [
        shipment.id,
        shipment.tracking_number || '',
        shipment.order?.order_number || '',
        shipment.status || '',
        shipment.service_type || '',
        shipment.shipping_cost || 0,
        format(new Date(shipment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
        shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), 'dd/MM/yyyy', { locale: fr }) : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expeditions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Export réussi',
        description: `${filteredShipments.length} expédition(s) exportée(s) en CSV.`,
      });
      logger.info('Shipments exported to CSV', { count: filteredShipments.length });
    } catch (error: any) {
      logger.error('Error exporting shipments', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'exporter les expéditions.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredShipments, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K pour recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-shipments')?.focus();
      }
      // Esc pour effacer recherche
      if (e.key === 'Escape' && document.activeElement?.id === 'search-shipments') {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Error handling
  useEffect(() => {
    if (shipmentsError) {
      setError('Erreur lors du chargement des expéditions');
      logger.error('Shipments fetch error', { error: shipmentsError });
    } else {
      setError(null);
    }
  }, [shipmentsError]);

  if (isLoading || storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement des expéditions...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // No store found
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="animate-in fade-in slide-in-from-top-4">
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Aucune boutique trouvée</h2>
                  <p className="text-muted-foreground mb-6">
                    Vous devez créer une boutique avant de pouvoir gérer les expéditions.
                  </p>
                  <Button onClick={() => navigate('/store')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Créer ma boutique
                  </Button>
                </CardContent>
              </Card>
            </div>
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
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Truck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Expéditions FedEx
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Gérez vos envois et suivez vos colis en temps réel
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  size="sm"
                  className="h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Nouvelle expédition</span>
                  <span className="sm:hidden text-xs">Nouvelle</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards - Style MyTemplates (Purple-Pink Gradient) */}
            <div 
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                { label: 'Total', value: stats.total, icon: Package, color: "from-purple-600 to-pink-600" },
                { label: 'En attente', value: stats.pending, icon: Clock, color: "from-yellow-600 to-orange-600" },
                { label: 'En transit', value: stats.transit, icon: Truck, color: "from-blue-600 to-cyan-600" },
                { label: 'Livrés', value: stats.delivered, icon: CheckCircle2, color: "from-green-600 to-emerald-600" },
                { label: 'Problèmes', value: stats.issues, icon: AlertTriangle, color: "from-red-600 to-rose-600" },
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

            {/* Search & Filters - Style MyTemplates */}
            <Card ref={filtersRef} className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <Input
                      id="search-shipments"
                      placeholder="Rechercher par numéro de tracking ou commande..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-8 sm:pl-10 pr-8 sm:pr-20 h-9 sm:h-10 text-xs sm:text-sm"
                      aria-label="Rechercher"
                    />
                    {searchInput && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => setSearchInput('')}
                        aria-label="Effacer"
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

                  {/* Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshAll}
                    disabled={updateTracking.isPending || !filteredShipments || filteredShipments.length === 0}
                    className="h-9 sm:h-10 transition-all hover:scale-105"
                  >
                    {updateTracking.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline text-xs sm:text-sm">Rafraîchir</span>
                  </Button>

                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    size="sm"
                    disabled={isExporting || !filteredShipments || filteredShipments.length === 0}
                    className="h-9 sm:h-10 transition-all hover:scale-105"
                  >
                    {isExporting ? (
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline text-xs sm:text-sm">Export CSV</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Tabs - Style MyTemplates */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto">
                <TabsTrigger 
                  value="all" 
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  Tous ({stats.total})
                </TabsTrigger>
                <TabsTrigger 
                  value="pending" 
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  En attente ({stats.pending})
                </TabsTrigger>
                <TabsTrigger 
                  value="transit" 
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  En transit ({stats.transit})
                </TabsTrigger>
                <TabsTrigger 
                  value="delivered" 
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  Livrés ({stats.delivered})
                </TabsTrigger>
                <TabsTrigger 
                  value="issues" 
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  Problèmes ({stats.issues})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div ref={shipmentsRef} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  {filteredShipments && filteredShipments.length > 0 ? (
                    filteredShipments.map((shipment, index) => (
                      <div
                        key={shipment.id}
                        className="animate-in fade-in slide-in-from-left-4"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <ShipmentCard
                          shipment={shipment}
                          onRefresh={() => handleRefreshTracking(shipment.id)}
                        />
                      </div>
                    ))
                  ) : (
                    <Card className="animate-in fade-in slide-in-from-bottom-4">
                      <CardContent className="p-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Aucune expédition trouvée</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {searchInput || activeTab !== 'all'
                            ? 'Aucune expédition ne correspond aux filtres sélectionnés.'
                            : 'Créez votre première expédition pour commencer'}
                        </p>
                        {!searchInput && activeTab === 'all' && (
                          <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Créer une expédition
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Create Shipment Dialog */}
            <CreateShipmentDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              storeId={store?.id || ''}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
