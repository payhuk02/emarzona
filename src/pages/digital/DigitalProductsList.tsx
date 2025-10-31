/**
 * Digital Products List Page - Professional & Optimized
 * Date: 2025-01-01
 * 
 * Page de gestion des produits digitaux avec fonctionnalités avancées
 * Version optimisée avec design professionnel, responsive et fonctionnalités complètes
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Filter,
  Grid3X3,
  List,
  X,
  RefreshCw,
  Loader2,
  Eye,
  Edit,
  MoreVertical,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  FileCode,
  FileText,
  Palette,
  Music,
  Video,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useDigitalProducts } from '@/hooks/digital/useDigitalProducts';
import { DigitalProductsGrid } from '@/components/digital';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 12;
const PAGINATION_OPTIONS = [12, 24, 36, 48];

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'active' | 'draft';

export const DigitalProductsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store } = useStore();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Animation hooks - useScrollAnimation retourne un ref
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const productsRef = useScrollAnimation<HTMLDivElement>();

  // Data fetching avec jointure sur products
  // Si pas de store, le hook récupérera tous les produits de tous les stores de l'utilisateur
  const { data: productsData, isLoading, error, refetch } = useDigitalProducts(store?.id);
  
  // Log pour débogage
  useEffect(() => {
    if (error) {
      console.error('Erreur dans DigitalProductsList:', {
        error,
        storeId: store?.id,
        hasStore: !!store,
      });
    }
  }, [error, store?.id]);

  /**
   * Utiliser directement les données avec la structure product incluse
   */
  const products = useMemo(() => {
    if (!productsData) return [];
    return productsData as any[];
  }, [productsData]);

  /**
   * Filter and sort products with useMemo for performance
   */
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter((p) => {
      const product = 'product' in p ? p.product : p;
      
      // Search filter
      const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = filterType === 'all' || p.digital_type === filterType;
      
      // Status filter
      const isActive = product.is_active !== undefined 
        ? product.is_active 
        : (p.status === 'active' || p.status === 'published');
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'draft' && !isActive);
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      const productA = 'product' in a ? a.product : a;
      const productB = 'product' in b ? b.product : b;
      
      switch (sortBy) {
        case 'recent':
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        case 'downloads':
          return (b.total_downloads || b.totalDownloads || 0) - (a.total_downloads || a.totalDownloads || 0);
        case 'price-desc':
          return (productB.price || 0) - (productA.price || 0);
        case 'price-asc':
          return (productA.price || 0) - (productB.price || 0);
        case 'name':
          return (productA.name || '').localeCompare(productB.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, filterType, sortBy, statusFilter]);

  /**
   * Pagination
   */
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  /**
   * Calculate stats with useMemo
   */
  const stats = useMemo(() => {
    if (!products) {
      return {
        totalProducts: 0,
        totalDownloads: 0,
        totalRevenue: 0,
        uniqueCustomers: 0,
      };
    }

    return {
      totalProducts: products.length,
      totalDownloads: products.reduce((sum, p) => sum + (p.total_downloads || p.totalDownloads || 0), 0),
      totalRevenue: products.reduce((sum, p) => {
        const product = 'product' in p ? p.product : p;
        const price = product.price || 0;
        const downloads = p.total_downloads || p.totalDownloads || 0;
        return sum + (price * downloads);
      }, 0),
      uniqueCustomers: new Set(products.flatMap(p => [p.user_id || p.userId || ''])).size,
    };
  }, [products]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K pour focus sur la recherche
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        logger.info('Raccourci clavier: Focus recherche');
      }
      
      // G pour toggle vue grille/liste
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
        logger.info(`Raccourci clavier: Changement de vue (${viewMode === 'grid' ? 'liste' : 'grille'})`);
      }
      
      // Cmd/Ctrl + N pour nouveau produit
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        navigate('/dashboard/products/new?type=digital');
        logger.info('Raccourci clavier: Nouveau produit digital');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, viewMode]);

  /**
   * Handlers avec useCallback
   */
  const handleRefresh = useCallback(() => {
    refetch();
    logger.info('Rafraîchissement des produits digitaux');
    toast({
      title: 'Rafraîchissement',
      description: 'Les produits digitaux sont en cours de rafraîchissement...',
    });
  }, [refetch, toast]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset à la première page lors de la recherche
    logger.info(`Recherche produits digitaux: ${value}`);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    logger.info(`Tri des produits digitaux: ${value}`);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setFilterType(value);
    setCurrentPage(1);
    logger.info(`Filtre type produit: ${value}`);
  }, []);

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
    logger.info(`Filtre statut: ${value}`);
  }, []);

  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => {
      const newMode = prev === 'grid' ? 'list' : 'grid';
      logger.info(`Changement de vue: ${newMode}`);
      return newMode;
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    logger.info(`Changement de page: ${page}`);
  }, []);

  const handleItemsPerPageChange = useCallback((value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    logger.info(`Items par page: ${value}`);
  }, []);

  /**
   * Logging on mount
   */
  useEffect(() => {
    logger.info('Page Produits Digitaux chargée', {
      productsCount: products?.length || 0,
      storeId: store?.id,
    });
  }, [products?.length, store?.id]);

  /**
   * Error handling avec détails
   */
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Erreur lors du chargement des produits digitaux', {
        error,
        message: errorMessage,
        storeId: store?.id,
        hasStore: !!store,
      });
      toast({
        title: 'Erreur',
        description: errorMessage.includes('Erreur') 
          ? errorMessage 
          : `Impossible de charger les produits digitaux: ${errorMessage}. Veuillez réessayer.`,
        variant: 'destructive',
      });
    }
  }, [error, toast, store?.id]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
            {/* Hero Header */}
            <div 
              ref={headerRef}
              className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-top-4 duration-700 shadow-lg shadow-blue-900/20"
            >
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat',
                }}
              ></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-white/10 backdrop-blur-sm animate-in zoom-in duration-500">
                      <Download className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2">
                        {t('digitalProducts.title', 'Produits Digitaux')}
                      </h1>
                      <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-blue-100 max-w-2xl">
                        {t('digitalProducts.subtitle', 'Gérez vos produits digitaux, téléchargements et licenses')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={handleRefresh}
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20"
                      disabled={isLoading}
                    >
                      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                    <Button 
                      onClick={() => navigate('/dashboard/products/new?type=digital')}
                      className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">{t('digitalProducts.newProduct', 'Nouveau produit')}</span>
                      <span className="sm:hidden">{t('digitalProducts.new', 'Nouveau')}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div 
              ref={statsRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
              role="region"
              aria-label={t('digitalProducts.stats', 'Statistiques des produits digitaux')}
            >
              <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-border/50 hover:border-blue-500/30 bg-gradient-to-br from-card/50 to-card backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                    {t('digitalProducts.stats.products', 'Produits')}
                  </CardTitle>
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-1">
                    {isLoading ? (
                      <Skeleton className="h-6 w-12" />
                    ) : (
                      stats.totalProducts.toLocaleString()
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                    {t('digitalProducts.stats.activeProducts', 'Produits digitaux actifs')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-border/50 hover:border-green-500/30 bg-gradient-to-br from-card/50 to-card backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                    {t('digitalProducts.stats.downloads', 'Téléchargements')}
                  </CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-1">
                    {isLoading ? (
                      <Skeleton className="h-6 w-12" />
                    ) : (
                      stats.totalDownloads.toLocaleString()
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                    {t('digitalProducts.stats.totalDownloads', 'Total téléchargements')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-border/50 hover:border-yellow-500/30 bg-gradient-to-br from-card/50 to-card backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                    {t('digitalProducts.stats.revenue', 'Revenus')}
                  </CardTitle>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-1">
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      `${stats.totalRevenue.toLocaleString()} XOF`
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                    {t('digitalProducts.stats.revenueGenerated', 'Revenus générés')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-border/50 hover:border-purple-500/30 bg-gradient-to-br from-card/50 to-card backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                    {t('digitalProducts.stats.customers', 'Clients')}
                  </CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-1">
                    {isLoading ? (
                      <Skeleton className="h-6 w-12" />
                    ) : (
                      stats.uniqueCustomers.toLocaleString()
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                    {t('digitalProducts.stats.uniqueCustomers', 'Clients uniques')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Search */}
            <Card 
              ref={filtersRef}
              className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-left-2 duration-700"
            >
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Filter className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    {t('digitalProducts.filter', 'Filtrer & Rechercher')}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewModeToggle}
                      className="gap-2"
                      aria-label={viewMode === 'grid' ? t('digitalProducts.switchToList', 'Passer en vue liste') : t('digitalProducts.switchToGrid', 'Passer en vue grille')}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <List className="h-4 w-4" />
                          <span className="hidden sm:inline">{t('digitalProducts.listView', 'Liste')}</span>
                        </>
                      ) : (
                        <>
                          <Grid3X3 className="h-4 w-4" />
                          <span className="hidden sm:inline">{t('digitalProducts.gridView', 'Grille')}</span>
                        </>
                      )}
                      <Badge variant="secondary" className="ml-1 hidden sm:flex">
                        G
                      </Badge>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      ref={searchInputRef}
                      placeholder={t('digitalProducts.searchPlaceholder', 'Rechercher un produit...')}
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 pr-10"
                      aria-label={t('digitalProducts.searchLabel', 'Rechercher un produit digital')}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSearchChange('')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        aria-label={t('digitalProducts.clearSearch', 'Effacer la recherche')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {!searchQuery && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Badge variant="secondary" className="text-[10px] font-mono hidden sm:flex">
                          ⌘K
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Type filter */}
                  <Select value={filterType} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                      <SelectValue placeholder={t('digitalProducts.allTypes', 'Tous les types')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('digitalProducts.allTypes', 'Tous les types')}</SelectItem>
                      <SelectItem value="software">{t('digitalProducts.types.software', 'Logiciels')}</SelectItem>
                      <SelectItem value="ebook">{t('digitalProducts.types.ebook', 'Ebooks')}</SelectItem>
                      <SelectItem value="template">{t('digitalProducts.types.template', 'Templates')}</SelectItem>
                      <SelectItem value="plugin">{t('digitalProducts.types.plugin', 'Plugins')}</SelectItem>
                      <SelectItem value="music">{t('digitalProducts.types.music', 'Musique')}</SelectItem>
                      <SelectItem value="video">{t('digitalProducts.types.video', 'Vidéos')}</SelectItem>
                      <SelectItem value="graphic">{t('digitalProducts.types.graphic', 'Graphisme')}</SelectItem>
                      <SelectItem value="other">{t('digitalProducts.types.other', 'Autre')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" aria-hidden="true" />
                      <SelectValue placeholder={t('digitalProducts.sort', 'Trier par')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">{t('digitalProducts.sort.recent', 'Plus récents')}</SelectItem>
                      <SelectItem value="downloads">{t('digitalProducts.sort.downloads', 'Plus téléchargés')}</SelectItem>
                      <SelectItem value="price-desc">{t('digitalProducts.sort.priceDesc', 'Prix (élevé → bas)')}</SelectItem>
                      <SelectItem value="price-asc">{t('digitalProducts.sort.priceAsc', 'Prix (bas → élevé)')}</SelectItem>
                      <SelectItem value="name">{t('digitalProducts.sort.name', 'Nom (A → Z)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid/List */}
            <div ref={productsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Tabs value={statusFilter} onValueChange={(v) => handleStatusChange(v as StatusFilter)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="gap-2">
                    {t('digitalProducts.tabs.all', 'Tous')} ({filteredProducts.length})
                  </TabsTrigger>
                  <TabsTrigger value="active" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('digitalProducts.tabs.active', 'Actifs')}
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="gap-2">
                    <Clock className="h-4 w-4" />
                    {t('digitalProducts.tabs.draft', 'Brouillons')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4 sm:mt-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Card key={i} className="overflow-hidden">
                          <Skeleton className="h-48 w-full" />
                          <CardContent className="p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-2/3" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : paginatedProducts.length === 0 ? (
                    <Card className="p-8 sm:p-12 lg:p-16">
                      <div className="text-center animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 sm:mb-6">
                          <Download className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-500" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3">
                          {t('digitalProducts.empty.title', 'Aucun produit digital')}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                          {t('digitalProducts.empty.description', 'Créez votre premier produit digital pour commencer à vendre')}
                        </p>
                        <Button 
                          onClick={() => navigate('/dashboard/products/new?type=digital')}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          {t('digitalProducts.empty.create', 'Créer un produit digital')}
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <>
                      {viewMode === 'grid' ? (
                        <DigitalProductsGrid
                          products={paginatedProducts
                            .filter(dp => {
                              const product = 'product' in dp ? dp.product : dp;
                              return product && product.id; // Filtrer les produits invalides
                            })
                            .map(dp => {
                              const product = 'product' in dp ? dp.product : dp;
                              return {
                                id: dp.id,
                                name: product?.name || 'Produit sans nom',
                                slug: product?.slug || dp.id,
                                description: product?.description,
                                price: product?.price || 0,
                                currency: product?.currency || 'XOF',
                                image_url: product?.image_url,
                                digital_type: dp.digital_type || 'other',
                                total_downloads: dp.total_downloads || dp.totalDownloads || 0,
                                license_type: dp.license_type || 'single',
                                average_rating: dp.average_rating || 0,
                                total_reviews: dp.total_reviews || 0,
                                version: dp.version,
                              };
                            })}
                          loading={false}
                        />
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {paginatedProducts
                            .filter(dp => {
                              const product = 'product' in dp ? dp.product : dp;
                              return product && product.id; // Filtrer les produits invalides
                            })
                            .map((dp) => {
                              const product = 'product' in dp ? dp.product : dp;
                              if (!product) return null;
                              return (
                              <Card 
                                key={dp.id}
                                className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-left-2"
                              >
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                  <div className="relative w-full sm:w-32 lg:w-40 h-40 sm:h-full min-h-[160px] overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
                                    {product.image_url ? (
                                      <img
                                        src={product.image_url}
                                        alt={product.name || 'Produit digital'}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                        onError={(e) => {
                                          // Fallback si l'image échoue à charger
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="h-12 w-12 text-white/70" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 p-3 sm:p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 line-clamp-2">
                                          {product.name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                                          <Badge variant="secondary">{dp.digital_type}</Badge>
                                          <Badge variant="outline">
                                            {dp.total_downloads || dp.totalDownloads || 0} {t('digitalProducts.downloads', 'téléchargements')}
                                          </Badge>
                                          <Badge variant="outline" className="font-semibold">
                                            {product.price?.toLocaleString() || 0} XOF
                                          </Badge>
                                        </div>
                                        {product.description && (
                                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
                                            {product.description}
                                          </p>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => navigate(`/products/${product.slug || dp.id}`)}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          <span className="hidden sm:inline">{t('digitalProducts.view', 'Voir')}</span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => navigate(`/products/${product.slug || dp.id}/edit`)}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          <span className="hidden sm:inline">{t('digitalProducts.edit', 'Modifier')}</span>
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })
                          .filter(Boolean)}
                        </div>
                      )}
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {t('digitalProducts.itemsPerPage', 'Par page')}:
                            </span>
                            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAGINATION_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option.toString()}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(1)}
                              disabled={currentPage === 1}
                              className="hidden sm:flex"
                              aria-label={t('digitalProducts.firstPage', 'Première page')}
                            >
                              <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              aria-label={t('digitalProducts.previousPage', 'Page précédente')}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            
                            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                              <span className="text-sm">
                                {t('digitalProducts.page', 'Page')} {currentPage} {t('digitalProducts.of', 'sur')} {totalPages}
                              </span>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              aria-label={t('digitalProducts.nextPage', 'Page suivante')}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(totalPages)}
                              disabled={currentPage === totalPages}
                              className="hidden sm:flex"
                              aria-label={t('digitalProducts.lastPage', 'Dernière page')}
                            >
                              <ChevronsRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="active" className="mt-4 sm:mt-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="overflow-hidden">
                          <Skeleton className="h-48 w-full" />
                          <CardContent className="p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredProducts.filter(dp => {
                    const product = 'product' in dp ? dp.product : dp;
                    return product.is_active !== undefined ? product.is_active : (dp.status === 'active' || dp.status === 'published');
                  }).length === 0 ? (
                    <Card className="p-8 sm:p-12">
                      <div className="text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          {t('digitalProducts.empty.active', 'Aucun produit actif')}
                        </h3>
                        <p className="text-muted-foreground">
                          {t('digitalProducts.empty.activeDescription', 'Aucun produit digital actif pour le moment')}
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <>
                      <DigitalProductsGrid
                        products={filteredProducts
                          .filter(dp => {
                            const product = 'product' in dp ? dp.product : dp;
                            return product.is_active !== undefined ? product.is_active : (dp.status === 'active' || dp.status === 'published');
                          })
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map(dp => {
                            const product = 'product' in dp ? dp.product : dp;
                            return {
                              id: dp.id,
                              ...product,
                              digital_type: dp.digital_type || 'other',
                              total_downloads: dp.total_downloads || dp.totalDownloads || 0,
                              license_type: dp.license_type || 'single',
                            };
                          })}
                        loading={false}
                      />
                      {/* Pagination pour les produits actifs */}
                      {(() => {
                        const activeProducts = filteredProducts.filter(dp => {
                          const product = 'product' in dp ? dp.product : dp;
                          return product.is_active !== undefined ? product.is_active : (dp.status === 'active' || dp.status === 'published');
                        });
                        const activeTotalPages = Math.ceil(activeProducts.length / itemsPerPage);
                        return activeTotalPages > 1 && (
                          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {t('digitalProducts.itemsPerPage', 'Par page')}:
                              </span>
                              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAGINATION_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option.toString()}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="hidden sm:flex"
                                aria-label={t('digitalProducts.firstPage', 'Première page')}
                              >
                                <ChevronsLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                aria-label={t('digitalProducts.previousPage', 'Page précédente')}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              
                              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                                <span className="text-sm">
                                  {t('digitalProducts.page', 'Page')} {currentPage} {t('digitalProducts.of', 'sur')} {activeTotalPages}
                                </span>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === activeTotalPages}
                                aria-label={t('digitalProducts.nextPage', 'Page suivante')}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(activeTotalPages)}
                                disabled={currentPage === activeTotalPages}
                                className="hidden sm:flex"
                                aria-label={t('digitalProducts.lastPage', 'Dernière page')}
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="draft" className="mt-4 sm:mt-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="overflow-hidden">
                          <Skeleton className="h-48 w-full" />
                          <CardContent className="p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredProducts.filter(dp => {
                    const product = 'product' in dp ? dp.product : dp;
                    return !(product.is_active !== undefined ? product.is_active : (dp.status === 'active' || dp.status === 'published'));
                  }).length === 0 ? (
                    <Card className="p-8 sm:p-12">
                      <div className="text-center">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          {t('digitalProducts.empty.draft', 'Aucun brouillon')}
                        </h3>
                        <p className="text-muted-foreground">
                          {t('digitalProducts.empty.draftDescription', 'Aucun produit digital en brouillon pour le moment')}
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <>
                      <DigitalProductsGrid
                        products={filteredProducts
                          .filter(dp => {
                            const product = 'product' in dp ? dp.product : dp;
                            return !(product.is_active !== undefined ? product.is_active : (dp.status === 'active' || dp.status === 'published'));
                          })
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map(dp => {
                            const product = 'product' in dp ? dp.product : dp;
                            return {
                              id: dp.id,
                              ...product,
                              digital_type: dp.digital_type || 'other',
                              total_downloads: dp.total_downloads || dp.totalDownloads || 0,
                              license_type: dp.license_type || 'single',
                            };
                          })}
                        loading={false}
                      />
                      {/* Pagination pour les brouillons */}
                      {(() => {
                        const draftProducts = filteredProducts.filter(dp => {
                          const product = 'product' in dp ? dp.product : dp;
                          return !(product.is_active !== undefined ? product.is_active : (dp.status === 'active' || dp.status === 'published'));
                        });
                        const draftTotalPages = Math.ceil(draftProducts.length / itemsPerPage);
                        return draftTotalPages > 1 && (
                          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {t('digitalProducts.itemsPerPage', 'Par page')}:
                              </span>
                              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAGINATION_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option.toString()}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="hidden sm:flex"
                                aria-label={t('digitalProducts.firstPage', 'Première page')}
                              >
                                <ChevronsLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                aria-label={t('digitalProducts.previousPage', 'Page précédente')}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              
                              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                                <span className="text-sm">
                                  {t('digitalProducts.page', 'Page')} {currentPage} {t('digitalProducts.of', 'sur')} {draftTotalPages}
                                </span>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === draftTotalPages}
                                aria-label={t('digitalProducts.nextPage', 'Page suivante')}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(draftTotalPages)}
                                disabled={currentPage === draftTotalPages}
                                className="hidden sm:flex"
                                aria-label={t('digitalProducts.lastPage', 'Dernière page')}
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DigitalProductsList;
