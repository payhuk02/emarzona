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
import type { Affiliate } from '@/types/affiliate';

// Type pour les performances d'affiliés
type AffiliatePerformance = {
  affiliate?: Affiliate;
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission: number;
};

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
  type AffiliatePerformanceWithCount = AffiliatePerformance & { links_count: number };
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
  }, {} as Record<string, AffiliatePerformanceWithCount>);
  }, [links]);

  const topAffiliates = useMemo(() => {
    return Object.values(affiliatePerformance)
      .sort((a: AffiliatePerformance, b: AffiliatePerformance) => b.total_revenue - a.total_revenue);
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
    return topAffiliates.filter((aff: AffiliatePerformance) =>
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
      let rows: Array<Array<string | number>> = [];

      if (activeTab === 'affiliates') {
        headers = ['Rang', 'Affilié', 'Email', 'Code', 'Clics', 'Ventes', 'CA Généré', 'Commissions', 'Conversion %'];
        rows = filteredTopAffiliates.map((aff: AffiliatePerformance, index: number) => {
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
        ...rows.map((row: Array<string | number>) => row.map((cell: string | number) => `"${String(cell)}"`).join(','))
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error exporting to CSV', { error: errorMessage });
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error refreshing data', { error: errorMessage });
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

        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={storeLoading || productsLoading || linksLoading || commissionsLoading}
                  className="h-9 sm:h-10 transition-all hover:scale-105"
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
            {/* Stats Cards - Responsive */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {/* Carte Produits avec affiliation */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Produits avec affiliation</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {productsLoading ? '...' : statsData.productsWithAffiliation}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Produits disponibles</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carte Affiliés actifs */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Affiliés actifs</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {linksLoading ? '...' : statsData.activeAffiliates}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Créant du contenu</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carte Ventes générées */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Ventes générées</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {commissionsLoading ? '...' : statsData.totalSales}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Via affiliation</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carte Commissions versées */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Commissions versées</p>
                      <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {commissionsLoading ? '...' : formatCurrency(statsData.totalCommissionPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Total payé</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search & Filters */}
            <Card ref={filtersRef} className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="search-affiliation"
                      placeholder="Rechercher par affilié, produit, commande..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9 pr-9 h-9 sm:h-10 text-xs sm:text-sm border-border focus:border-purple-500 focus:ring-purple-500/20"
                    />
                    {searchInput && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchInput('')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted"
                        aria-label="Effacer la recherche"
                      >
                        <X className="h-3.5 w-3.5" />
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
                      className="h-9 sm:h-10 transition-all hover:scale-105"
                    >
                      {isExporting ? (
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline text-xs sm:text-sm">Export CSV</span>
                      <span className="sm:hidden text-xs">CSV</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto overflow-x-auto">
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
                      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="py-12">
                          <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                              <Skeleton key={i} className="h-16" />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : filteredTopAffiliates.length === 0 ? (
                      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="py-12 sm:py-16 text-center">
                          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucun affilié actif</h3>
                          <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md mx-auto">
                            Aucun affilié actif pour le moment.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchInput('');
                            }}
                            className="h-9 sm:h-10"
                          >
                            Effacer les filtres
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                            Meilleurs affiliés
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Classement par chiffre d'affaires généré
                          </p>
                        </CardHeader>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block">
                          <div className="overflow-x-auto">
                            <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="text-xs sm:text-sm font-semibold">Rang</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">Affilié</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold text-right">Clics</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold text-right">Ventes</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold text-right">CA généré</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold text-right">Commissions</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold text-right">Conversion</TableHead>
                              </TableRow>
                            </TableHeader>
                      <TableBody>
                              {filteredTopAffiliates.map((aff: AffiliatePerformance, index: number) => {
                          const conversionRate = aff.total_clicks > 0 
                            ? ((aff.total_sales / aff.total_clicks) * 100).toFixed(1) 
                            : '0';
                          
                          return (
                                  <TableRow
                                    key={index}
                                    className="hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-left-4"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    <TableCell className="text-xs sm:text-sm">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                        {index + 1}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm">
                                      <div>
                                        <p className="font-medium">{aff.affiliate?.display_name || 'N/A'}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {aff.links_count} {aff.links_count > 1 ? 'liens' : 'lien'}
                                        </p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm">
                                      <div className="flex items-center justify-end gap-1">
                                        <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                                        {aff.total_clicks}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm font-semibold">{aff.total_sales}</TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm font-bold text-purple-600">
                                      {formatCurrency(aff.total_revenue)}
                                    </TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm text-orange-600 font-semibold">
                                      {formatCurrency(aff.total_commission)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant={parseFloat(conversionRate) > 2 ? 'default' : 'outline'} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                                        {conversionRate}%
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                        </div>
                      </div>

                      {/* Mobile Card View */}
                      <div className="lg:hidden space-y-3 sm:space-y-4 p-4 sm:p-5">
                        {filteredTopAffiliates.map((aff: AffiliatePerformance, index: number) => {
                          const conversionRate = aff.total_clicks > 0 
                            ? ((aff.total_sales / aff.total_clicks) * 100).toFixed(1) 
                            : '0';
                          
                          return (
                            <Card
                              key={index}
                              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-base sm:text-lg">{aff.affiliate?.display_name || 'N/A'}</h3>
                                      <p className="text-xs text-muted-foreground">
                                        {aff.links_count} {aff.links_count > 1 ? 'liens' : 'lien'}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant={parseFloat(conversionRate) > 2 ? 'default' : 'outline'} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                                    {conversionRate}%
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <MousePointerClick className="h-4 w-4 text-blue-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Clics</p>
                                      <p className="text-sm font-semibold">{aff.total_clicks}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Ventes</p>
                                      <p className="text-sm font-semibold">{aff.total_sales}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <DollarSign className="h-4 w-4 text-purple-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">CA généré</p>
                                      <p className="text-sm font-semibold text-purple-600">{formatCurrency(aff.total_revenue)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <DollarSign className="h-4 w-4 text-orange-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Commissions</p>
                                      <p className="text-sm font-semibold text-orange-600">{formatCurrency(aff.total_commission)}</p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                  </div>
            </TabsContent>

            {/* Produits */}
                <TabsContent value="products" className="mt-6">
                  <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  {productsLoading ? (
                      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="py-12">
                          <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                              <Skeleton key={i} className="h-20" />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : filteredProducts.length === 0 ? (
                      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="py-12 sm:py-16 text-center">
                          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                            <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucun produit</h3>
                          <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md mx-auto">
                            Aucun produit avec affiliation activée.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchInput('');
                            }}
                            className="h-9 sm:h-10"
                          >
                            Effacer les filtres
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                            Produits avec affiliation
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Liste de vos produits disponibles pour l'affiliation
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 sm:space-y-4">
                            {filteredProducts.map((product, index) => (
                              <Card key={product.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${index * 50}ms` }}>
                                <CardContent className="p-4 sm:p-5">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                      {product.product?.image_url && (
                                        <img
                                          src={product.product.image_url}
                                          alt={product.product.name}
                                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                                          loading="lazy"
                                          decoding="async"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm sm:text-base truncate">{product.product?.name}</h4>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                          Commission : <span className="font-semibold text-purple-600">{product.commission_rate}%</span> • Cookie : {product.cookie_duration_days} jours
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <Badge variant="outline" className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Actif
                                      </Badge>
                                      <p className="text-xs sm:text-sm font-semibold">{formatCurrency(product.product?.price || 0)}</p>
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
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                              Commissions d'affiliation
                            </CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
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
                    <div className="text-center py-12 sm:py-16 text-muted-foreground">
                      <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                        <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 opacity-20" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucune commission</h3>
                      <p className="text-sm sm:text-base max-w-md mx-auto">
                        Aucune commission trouvée avec ces critères.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden lg:block">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="text-xs sm:text-sm font-semibold">Date</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">Affilié</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">Produit</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">Commande</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold text-right">Montant vente</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold text-right">Commission</TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">Statut</TableHead>
                              </TableRow>
                            </TableHeader>
                      <TableBody>
                                {filteredCommissions.map((commission, index) => (
                                  <TableRow
                                    key={commission.id}
                                    className="hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-left-4"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    <TableCell className="text-xs sm:text-sm font-medium">
                                      {format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: fr })}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm">
                                      <div>
                                        <p className="font-medium">{commission.affiliate?.display_name || 'N/A'}</p>
                                        <p className="text-xs text-muted-foreground">{commission.affiliate?.email}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm">{commission.product?.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">{commission.order?.order_number}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm font-semibold">
                                      {formatCurrency(commission.order_total)}
                                    </TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm font-bold text-orange-600">
                                      {formatCurrency(commission.commission_amount)}
                                    </TableCell>
                                    <TableCell>
                                      {commission.status === 'pending' && (
                                        <Badge variant="outline" className="gap-1 text-xs">
                                          <Clock className="h-3 w-3" />
                                          En attente
                                        </Badge>
                                      )}
                                      {commission.status === 'approved' && (
                                        <Badge variant="secondary" className="gap-1 text-xs">
                                          <CheckCircle2 className="h-3 w-3" />
                                          Approuvé
                                        </Badge>
                                      )}
                                      {commission.status === 'paid' && (
                                        <Badge className="gap-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs">
                                          <CheckCircle2 className="h-3 w-3" />
                                          Payé
                                        </Badge>
                                      )}
                                      {commission.status === 'rejected' && (
                                        <Badge variant="destructive" className="gap-1 text-xs">
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
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3 sm:space-y-4">
                      {filteredCommissions.map((commission, index) => (
                        <Card
                          key={commission.id}
                          className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-base sm:text-lg">
                                    {commission.affiliate?.display_name || 'N/A'}
                                  </h3>
                                  {commission.status === 'pending' && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Clock className="h-3 w-3" />
                                      En attente
                                    </Badge>
                                  )}
                                  {commission.status === 'approved' && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Approuvé
                                    </Badge>
                                  )}
                                  {commission.status === 'paid' && (
                                    <Badge className="text-xs gap-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Payé
                                    </Badge>
                                  )}
                                  {commission.status === 'rejected' && (
                                    <Badge variant="destructive" className="text-xs gap-1">
                                      <Ban className="h-3 w-3" />
                                      Rejeté
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                                  {commission.affiliate?.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(commission.created_at), 'dd/MM/yyyy', { locale: fr })}
                                </p>
                                {commission.product?.name && (
                                  <p className="text-xs sm:text-sm font-medium mt-1">{commission.product.name}</p>
                                )}
                                {commission.order?.order_number && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Commande: {commission.order.order_number}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <DollarSign className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Montant vente</p>
                                  <p className="text-sm font-semibold">{formatCurrency(commission.order_total)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <DollarSign className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Commission</p>
                                  <p className="text-sm font-semibold text-orange-600">{formatCurrency(commission.commission_amount)}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                  )}
                </CardContent>
              </Card>
                  </div>
            </TabsContent>

            {/* Liens actifs */}
                <TabsContent value="links" className="mt-6">
                  <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  {linksLoading ? (
                      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="py-12">
                          <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                              <Skeleton key={i} className="h-20" />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : filteredLinks.length === 0 ? (
                      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="py-12 sm:py-16 text-center">
                          <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                            <LinkIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucun lien</h3>
                          <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md mx-auto">
                            Aucun lien d'affiliation créé pour le moment.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchInput('');
                            }}
                            className="h-9 sm:h-10"
                          >
                            Effacer les filtres
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                            Liens d'affiliation actifs
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Tous les liens créés par les affiliés pour vos produits
                          </p>
                        </CardHeader>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="text-xs sm:text-sm font-semibold">Affilié</TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold">Code</TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold">Produit</TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Clics</TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Ventes</TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold text-right">CA</TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Commission</TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold">Statut</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredLinks.map((link, index) => (
                                  <TableRow
                                    key={link.id}
                                    className="hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-left-4"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    <TableCell className="text-xs sm:text-sm">
                                      <div>
                                        <p className="font-medium">{link.affiliate?.display_name || 'N/A'}</p>
                                        <p className="text-xs text-muted-foreground">{link.affiliate?.affiliate_code}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">{link.affiliate?.affiliate_code}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm truncate max-w-[200px]">{link.product?.name}</TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm">
                                      <div className="flex items-center justify-end gap-1">
                                        <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                                        {link.total_clicks}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm font-semibold">{link.total_sales}</TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(link.total_revenue)}</TableCell>
                                    <TableCell className="text-right text-xs sm:text-sm font-semibold text-orange-600">
                                      {formatCurrency(link.total_commission)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={link.status === 'active' ? 'default' : 'secondary'} className={link.status === 'active' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs' : 'text-xs'}>
                                        {link.status === 'active' ? 'Actif' : link.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3 sm:space-y-4 p-4 sm:p-5">
                          {filteredLinks.map((link, index) => (
                            <Card
                              key={link.id}
                              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-base sm:text-lg mb-1">{link.affiliate?.display_name || 'N/A'}</h3>
                                    <p className="text-xs text-muted-foreground mb-2">
                                      Code: <span className="font-mono">{link.affiliate?.affiliate_code}</span>
                                    </p>
                                    <p className="text-xs sm:text-sm font-medium">{link.product?.name}</p>
                                  </div>
                                  <Badge variant={link.status === 'active' ? 'default' : 'secondary'} className={link.status === 'active' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs' : 'text-xs'}>
                                    {link.status === 'active' ? 'Actif' : link.status}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <MousePointerClick className="h-4 w-4 text-blue-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Clics</p>
                                      <p className="text-sm font-semibold">{link.total_clicks}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Ventes</p>
                                      <p className="text-sm font-semibold">{link.total_sales}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <DollarSign className="h-4 w-4 text-purple-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">CA</p>
                                      <p className="text-sm font-semibold text-purple-600">{formatCurrency(link.total_revenue)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <DollarSign className="h-4 w-4 text-orange-500" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Commission</p>
                                      <p className="text-sm font-semibold text-orange-600">{formatCurrency(link.total_commission)}</p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
            </TabsContent>
          </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
