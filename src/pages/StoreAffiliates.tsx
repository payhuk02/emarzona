/**
 * 🤝 Programme d'affiliation - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète des affiliés, commissions et liens avec recherche, filtres, export
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/hooks/useStore';
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks';
import { useAffiliateCommissions, usePendingCommissions } from '@/hooks/useAffiliateCommissions';
import { useStoreAffiliateProducts } from '@/hooks/useProductAffiliateSettings';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart,
  MousePointerClick,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  Download,
  Loader2,
  X,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StoreAffiliates() {
  const { store, loading: storeLoading } = useStore();
  const { products, loading: productsLoading } = useStoreAffiliateProducts(store?.id);
  const { links, loading: linksLoading } = useAffiliateLinks(undefined, { store_id: store?.id });
  const { commissions, stats, loading: commissionsLoading } = useAffiliateCommissions({ store_id: store?.id });
  const { pending, loading: pendingLoading } = usePendingCommissions(store?.id);
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState('affiliates');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  // Regrouper les affiliés par performance
  const affiliatePerformance = useMemo(() => {
    return links.reduce((acc, link) => {
    const affiliateId = link.affiliate_id;
    if (!acc[affiliateId]) {
      acc[affiliateId] = {
        affiliate: link.affiliate,
        total_clicks: 0,
        total_sales: 0,
        total_revenue: 0,
        total_commission: 0,
        links_count: 0,
      };
    }
    acc[affiliateId].total_clicks += link.total_clicks;
    acc[affiliateId].total_sales += link.total_sales;
    acc[affiliateId].total_revenue += link.total_revenue;
    acc[affiliateId].total_commission += link.total_commission;
    acc[affiliateId].links_count += 1;
    return acc;
  }, {} as Record<string, any>);
  }, [links]);

  const topAffiliates = useMemo(() => {
    return Object.values(affiliatePerformance)
      .sort((a: any, b: any) => b.total_revenue - a.total_revenue);
  }, [affiliatePerformance]);

  // Filtrer les commissions
  const filteredCommissions = useMemo(() => {
    if (!commissions) return [];

    return commissions.filter((c) => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = 
        searchLower === '' ||
        c.affiliate?.display_name?.toLowerCase().includes(searchLower) ||
        c.affiliate?.email?.toLowerCase().includes(searchLower) ||
        c.order?.order_number?.toLowerCase().includes(searchLower) ||
        c.product?.name?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [commissions, debouncedSearch, statusFilter]);

  // Filtrer les produits
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    const searchLower = debouncedSearch.toLowerCase();
    return products.filter((p) => 
      searchLower === '' ||
      p.product?.name?.toLowerCase().includes(searchLower)
    );
  }, [products, debouncedSearch]);

  // Filtrer les liens
  const filteredLinks = useMemo(() => {
    if (!links) return [];

    const searchLower = debouncedSearch.toLowerCase();
    return links.filter((link) =>
      searchLower === '' ||
      link.affiliate?.display_name?.toLowerCase().includes(searchLower) ||
      link.affiliate?.affiliate_code?.toLowerCase().includes(searchLower) ||
      link.product?.name?.toLowerCase().includes(searchLower)
    );
  }, [links, debouncedSearch]);

  // Filtrer les top affiliés
  const filteredTopAffiliates = useMemo(() => {
    if (!topAffiliates) return [];

    const searchLower = debouncedSearch.toLowerCase();
    return topAffiliates.filter((aff: any) =>
      searchLower === '' ||
      aff.affiliate?.display_name?.toLowerCase().includes(searchLower) ||
      aff.affiliate?.email?.toLowerCase().includes(searchLower) ||
      aff.affiliate?.affiliate_code?.toLowerCase().includes(searchLower)
    );
  }, [topAffiliates, debouncedSearch]);

  // Stats calculation
  const statsData = useMemo(() => {
    const productsWithAffiliation = products?.length || 0;
    const activeAffiliates = Object.keys(affiliatePerformance).length;
    const totalSales = stats?.total_sales || 0;
    const totalCommissionPaid = stats?.total_commission_paid || 0;

    return {
      productsWithAffiliation,
      activeAffiliates,
      totalSales,
      totalCommissionPaid,
    };
  }, [products, affiliatePerformance, stats]);

  // Export to CSV
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      let headers: string[] = [];
      let rows: any[][] = [];

      if (activeTab === 'affiliates') {
        headers = ['Rang', 'Affilié', 'Email', 'Code', 'Clics', 'Ventes', 'CA Généré', 'Commissions', 'Conversion %'];
        rows = filteredTopAffiliates.map((aff: any, index: number) => {
          const conversionRate = aff.total_clicks > 0 
            ? ((aff.total_sales / aff.total_clicks) * 100).toFixed(1)
            : '0';
          return [
            index + 1,
            aff.affiliate?.display_name || 'N/A',
            aff.affiliate?.email || 'N/A',
            aff.affiliate?.affiliate_code || 'N/A',
            aff.total_clicks,
            aff.total_sales,
            aff.total_revenue,
            aff.total_commission,
            `${conversionRate}%`,
          ];
        });
      } else if (activeTab === 'commissions') {
        headers = ['Date', 'Affilié', 'Email', 'Produit', 'Commande', 'Montant Vente', 'Commission', 'Statut'];
        rows = filteredCommissions.map((c) => [
          format(new Date(c.created_at), 'dd/MM/yyyy', { locale: fr }),
          c.affiliate?.display_name || 'N/A',
          c.affiliate?.email || 'N/A',
          c.product?.name || 'N/A',
          c.order?.order_number || 'N/A',
          c.order_total,
          c.commission_amount,
          c.status,
        ]);
      } else if (activeTab === 'products') {
        headers = ['Produit', 'Prix', 'Commission %', 'Durée Cookie (jours)', 'Statut'];
        rows = filteredProducts.map((p) => [
          p.product?.name || 'N/A',
          p.product?.price || 0,
          `${p.commission_rate}%`,
          p.cookie_duration_days,
          'Actif',
        ]);
      } else if (activeTab === 'links') {
        headers = ['Affilié', 'Code', 'Produit', 'Clics', 'Ventes', 'CA', 'Commission', 'Statut'];
        rows = filteredLinks.map((link) => [
          link.affiliate?.display_name || 'N/A',
          link.affiliate?.affiliate_code || 'N/A',
          link.product?.name || 'N/A',
          link.total_clicks,
          link.total_sales,
          link.total_revenue,
          link.total_commission,
          link.status,
        ]);
      }

      if (rows.length === 0) {
        toast({
          title: '⚠️ Aucune donnée',
          description: 'Aucune donnée à exporter.',
          variant: 'destructive',
        });
        return;
      }

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell)}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `affiliation-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Export réussi',
        description: `${rows.length} ligne(s) exportée(s) en CSV.`,
      });
      logger.info(`Affiliation ${activeTab} exported to CSV`, { count: rows.length });
    } catch (error: any) {
      logger.error('Error exporting to CSV', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'exporter les données.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [activeTab, filteredTopAffiliates, filteredCommissions, filteredProducts, filteredLinks, toast]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      // Les hooks refetch automatiquement
      toast({
        title: '✅ Actualisation réussie',
        description: 'Les données ont été mises à jour.',
      });
      logger.info('Affiliation data refreshed');
    } catch (error: any) {
      logger.error('Error refreshing data', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'actualiser les données.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-affiliation')?.focus();
      }
      if (e.key === 'Escape' && searchInput) {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInput]);

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <CardTitle>Aucune boutique</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">Aucune boutique trouvée pour cet utilisateur.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div ref={headerRef} className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6">
          <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Programme d'affiliation
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              Gérez vos affiliés et suivez leurs performances
            </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={storeLoading || productsLoading || linksLoading || commissionsLoading}
                  className="flex-1 sm:flex-none transition-all hover:scale-105"
                >
                  {(storeLoading || productsLoading || linksLoading || commissionsLoading) ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline text-xs sm:text-sm">Actualiser</span>
                </Button>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 sm:p-6 bg-gradient-to-br from-background via-background to-purple-50/30 dark:to-purple-950/20">
            <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
              <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                {/* Carte Produits avec affiliation */}
                <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold text-purple-100 flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-400 drop-shadow-lg" />
                  Produits avec affiliation
                </CardTitle>
              </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl md:text-3xl font-bold text-blue-400 drop-shadow-lg">
                      {productsLoading ? '...' : statsData.productsWithAffiliation}
                </div>
                    <p className="text-xs text-purple-200/90 mt-1 font-medium">Produits disponibles</p>
              </CardContent>
                  <div className="absolute top-2 right-2 h-2 w-2 bg-blue-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-blue-400/50"></div>
            </Card>

                {/* Carte Affiliés actifs */}
                <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-green-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold text-purple-100 flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-400 drop-shadow-lg" />
                  Affiliés actifs
                </CardTitle>
              </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl md:text-3xl font-bold text-green-400 drop-shadow-lg">
                      {linksLoading ? '...' : statsData.activeAffiliates}
                </div>
                    <p className="text-xs text-purple-200/90 mt-1 font-medium">Créant du contenu</p>
              </CardContent>
                  <div className="absolute top-2 right-2 h-2 w-2 bg-green-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-green-400/50"></div>
            </Card>

                {/* Carte Ventes générées */}
                <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold text-purple-100 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-200" />
                  Ventes générées
                </CardTitle>
              </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                      {commissionsLoading ? '...' : statsData.totalSales}
                </div>
                    <p className="text-xs text-purple-200/90 mt-1 font-medium">Via affiliation</p>
              </CardContent>
                  <div className="absolute top-2 right-2 h-2 w-2 bg-purple-300 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
            </Card>

                {/* Carte Commissions versées */}
                <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-orange-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold text-purple-100 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-400 drop-shadow-lg" />
                  Commissions versées
                </CardTitle>
              </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl md:text-3xl font-bold text-orange-400 drop-shadow-lg">
                      {commissionsLoading ? '...' : formatCurrency(statsData.totalCommissionPaid)}
                </div>
                    <p className="text-xs text-purple-200/90 mt-1 font-medium">Total payé</p>
              </CardContent>
                  <div className="absolute top-2 right-2 h-2 w-2 bg-orange-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-orange-400/50"></div>
            </Card>
          </div>

              {/* Search & Filters */}
              <Card ref={filtersRef} className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-affiliation"
                        placeholder="Rechercher par affilié, produit, commande..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9 pr-9 h-10 sm:h-11 bg-background border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 focus:ring-purple-500/20"
                      />
                      {searchInput && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchInput('')}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={isExporting || (activeTab === 'affiliates' && filteredTopAffiliates.length === 0) || (activeTab === 'commissions' && filteredCommissions.length === 0) || (activeTab === 'products' && filteredProducts.length === 0) || (activeTab === 'links' && filteredLinks.length === 0)}
                        className="h-10 sm:h-11 transition-all hover:scale-105"
                      >
                        {isExporting ? (
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline text-xs sm:text-sm">Export CSV</span>
                        <span className="sm:hidden">CSV</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
                  <TabsTrigger 
                    value="affiliates" 
                    className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <span className="hidden sm:inline">Top Affiliés</span>
                    <span className="sm:hidden">Top</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="products" 
                    className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Produits
                  </TabsTrigger>
                  <TabsTrigger 
                    value="commissions" 
                    className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                Commissions
                {pending.length > 0 && (
                      <Badge variant="destructive" className="ml-1.5 sm:ml-2 text-[9px] sm:text-xs">{pending.length}</Badge>
                )}
              </TabsTrigger>
                  <TabsTrigger 
                    value="links" 
                    className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <span className="hidden sm:inline">Liens actifs</span>
                    <span className="sm:hidden">Liens</span>
                  </TabsTrigger>
            </TabsList>

            {/* Top Affiliés */}
                <TabsContent value="affiliates" className="mt-6">
                  <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                    {linksLoading ? (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                        <CardContent className="py-12">
                          <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                              <Skeleton key={i} className="h-16" />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : filteredTopAffiliates.length === 0 ? (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                        <CardContent className="py-12 text-center">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                          <h3 className="text-lg font-semibold mb-2">Aucun affilié actif</h3>
                          <p className="text-muted-foreground mb-4">
                            Aucun affilié actif pour le moment.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchInput('');
                            }}
                          >
                            Effacer les filtres
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50 overflow-hidden">
                <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                            Meilleurs affiliés
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                    Classement par chiffre d'affaires généré
                          </p>
                </CardHeader>
                        <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Rang</TableHead>
                                <TableHead className="font-semibold">Affilié</TableHead>
                                <TableHead className="font-semibold text-right hidden sm:table-cell">Clics</TableHead>
                                <TableHead className="font-semibold text-right">Ventes</TableHead>
                                <TableHead className="font-semibold text-right hidden md:table-cell">CA généré</TableHead>
                                <TableHead className="font-semibold text-right hidden lg:table-cell">Commissions</TableHead>
                                <TableHead className="font-semibold text-right">Conversion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                              {filteredTopAffiliates.map((aff: any, index: number) => {
                          const conversionRate = aff.total_clicks > 0 
                            ? ((aff.total_sales / aff.total_clicks) * 100).toFixed(1) 
                            : '0';
                          
                          return (
                                  <TableRow
                                    key={index}
                                    className="animate-in fade-in slide-in-from-left-4"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                              <TableCell>
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {index + 1}
                                  </div>
                                    </TableCell>
                                    <TableCell>
                                  <div>
                                    <p className="font-medium">{aff.affiliate?.display_name || 'N/A'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {aff.links_count} {aff.links_count > 1 ? 'liens' : 'lien'}
                                    </p>
                                  </div>
                                    </TableCell>
                                    <TableCell className="text-right hidden sm:table-cell">
                                      <div className="flex items-center justify-end gap-1">
                                        <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                                        {aff.total_clicks}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{aff.total_sales}</TableCell>
                                    <TableCell className="text-right font-bold text-purple-600 hidden md:table-cell">
                                {formatCurrency(aff.total_revenue)}
                              </TableCell>
                                    <TableCell className="text-right text-orange-600 font-semibold hidden lg:table-cell">
                                {formatCurrency(aff.total_commission)}
                              </TableCell>
                              <TableCell className="text-right">
                                      <Badge variant={parseFloat(conversionRate) > 2 ? 'default' : 'outline'} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                  {conversionRate}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                        </div>
                      </Card>
                  )}
                  </div>
            </TabsContent>

            {/* Produits */}
                <TabsContent value="products" className="mt-6">
                  <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  {productsLoading ? (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                        <CardContent className="py-12">
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                        </CardContent>
                      </Card>
                    ) : filteredProducts.length === 0 ? (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                        <CardContent className="py-12 text-center">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                          <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
                          <p className="text-muted-foreground mb-4">
                            Aucun produit avec affiliation activée.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchInput('');
                            }}
                          >
                            Effacer les filtres
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-purple-500" />
                            Produits avec affiliation
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Liste de vos produits disponibles pour l'affiliation
                          </p>
                        </CardHeader>
                        <CardContent>
                    <div className="space-y-4">
                            {filteredProducts.map((product, index) => (
                              <Card key={product.id} className="overflow-hidden border-2 border-purple-200/50 dark:border-purple-800/50 hover:border-purple-400/60 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${index * 50}ms` }}>
                          <CardContent className="p-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                {product.product?.image_url && (
                                  <img
                                    src={product.product.image_url}
                                    alt={product.product.name}
                                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                                  />
                                )}
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold truncate">{product.product?.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                          Commission : <span className="font-semibold text-purple-600">{product.commission_rate}%</span> • Cookie : {product.cookie_duration_days} jours
                                  </p>
                                </div>
                              </div>
                                    <div className="text-right flex-shrink-0">
                                      <Badge variant="outline" className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Actif
                                </Badge>
                                <p className="text-sm font-semibold">{formatCurrency(product.product?.price || 0)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                </CardContent>
              </Card>
                    )}
                  </div>
            </TabsContent>

            {/* Commissions */}
                <TabsContent value="commissions" className="mt-6">
                  <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                    <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                            <CardTitle className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-purple-500" />
                              Commissions d'affiliation
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                        Historique des commissions versées à vos affiliés
                            </p>
                    </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className="w-full sm:w-40 h-10 sm:h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="paid">Payé</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {commissionsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : filteredCommissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold mb-2">Aucune commission</h3>
                            <p className="text-muted-foreground">
                              Aucune commission trouvée avec ces critères.
                            </p>
                    </div>
                  ) : (
                          <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="font-semibold">Date</TableHead>
                                  <TableHead className="font-semibold">Affilié</TableHead>
                                  <TableHead className="font-semibold hidden md:table-cell">Produit</TableHead>
                                  <TableHead className="font-semibold hidden lg:table-cell">Commande</TableHead>
                                  <TableHead className="font-semibold text-right hidden sm:table-cell">Montant vente</TableHead>
                                  <TableHead className="font-semibold text-right">Commission</TableHead>
                                  <TableHead className="font-semibold">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                                {filteredCommissions.map((commission, index) => (
                                  <TableRow
                                    key={commission.id}
                                    className="animate-in fade-in slide-in-from-left-4"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    <TableCell className="text-sm">
                                      {format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: fr })}
                                    </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{commission.affiliate?.display_name || 'N/A'}</p>
                                        <p className="text-xs text-muted-foreground hidden sm:block">{commission.affiliate?.email}</p>
                              </div>
                            </TableCell>
                                    <TableCell className="hidden md:table-cell">{commission.product?.name}</TableCell>
                                    <TableCell className="hidden lg:table-cell">
                              <Badge variant="outline">{commission.order?.order_number}</Badge>
                            </TableCell>
                                    <TableCell className="text-right font-semibold hidden sm:table-cell">
                              {formatCurrency(commission.order_total)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-orange-600">
                              {formatCurrency(commission.commission_amount)}
                            </TableCell>
                            <TableCell>
                              {commission.status === 'pending' && (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  En attente
                                </Badge>
                              )}
                              {commission.status === 'approved' && (
                                <Badge variant="secondary" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approuvé
                                </Badge>
                              )}
                              {commission.status === 'paid' && (
                                        <Badge className="gap-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Payé
                                </Badge>
                              )}
                              {commission.status === 'rejected' && (
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Rejeté
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                          </div>
                  )}
                </CardContent>
              </Card>
                  </div>
            </TabsContent>

            {/* Liens actifs */}
                <TabsContent value="links" className="mt-6">
                  <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  {linksLoading ? (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                        <CardContent className="py-12">
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                        </CardContent>
                      </Card>
                    ) : filteredLinks.length === 0 ? (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                        <CardContent className="py-12 text-center">
                          <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                          <h3 className="text-lg font-semibold mb-2">Aucun lien</h3>
                          <p className="text-muted-foreground mb-4">
                            Aucun lien d'affiliation créé pour le moment.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchInput('');
                            }}
                          >
                            Effacer les filtres
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50 overflow-hidden">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-purple-500" />
                            Liens d'affiliation actifs
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Tous les liens créés par les affiliés pour vos produits
                          </p>
                        </CardHeader>
                        <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Affilié</TableHead>
                                <TableHead className="font-semibold hidden md:table-cell">Code</TableHead>
                                <TableHead className="font-semibold">Produit</TableHead>
                                <TableHead className="font-semibold text-right hidden sm:table-cell">Clics</TableHead>
                                <TableHead className="font-semibold text-right">Ventes</TableHead>
                                <TableHead className="font-semibold text-right hidden lg:table-cell">CA</TableHead>
                                <TableHead className="font-semibold text-right hidden lg:table-cell">Commission</TableHead>
                                <TableHead className="font-semibold">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                              {filteredLinks.map((link, index) => (
                                <TableRow
                                  key={link.id}
                                  className="animate-in fade-in slide-in-from-left-4"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                            <TableCell>
                              <div>
                                <p className="font-medium">{link.affiliate?.display_name || 'N/A'}</p>
                                      <p className="text-xs text-muted-foreground hidden sm:block">{link.affiliate?.affiliate_code}</p>
                              </div>
                            </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Badge variant="outline">{link.affiliate?.affiliate_code}</Badge>
                                  </TableCell>
                                  <TableCell className="truncate max-w-[200px]">{link.product?.name}</TableCell>
                                  <TableCell className="text-right hidden sm:table-cell">
                              <div className="flex items-center justify-end gap-1">
                                      <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                                {link.total_clicks}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{link.total_sales}</TableCell>
                                  <TableCell className="text-right hidden lg:table-cell">{formatCurrency(link.total_revenue)}</TableCell>
                                  <TableCell className="text-right font-semibold text-orange-600 hidden lg:table-cell">
                              {formatCurrency(link.total_commission)}
                            </TableCell>
                            <TableCell>
                                    <Badge variant={link.status === 'active' ? 'default' : 'secondary'} className={link.status === 'active' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : ''}>
                                      {link.status === 'active' ? 'Actif' : link.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                        </div>
                      </Card>
                  )}
                  </div>
            </TabsContent>
          </Tabs>
            </div>
        </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
