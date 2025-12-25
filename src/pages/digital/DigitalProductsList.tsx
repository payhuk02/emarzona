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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Eye,
  Edit,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useDigitalProducts } from '@/hooks/digital/useDigitalProducts';
import { DigitalProductsGrid } from '@/components/digital';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
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
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [filterType, setFilterType] = useState('all');
  const debouncedFilterType = useDebounce(filterType, 300); // Debounce pour éviter trop de requêtes
  const [sortBy, setSortBy] = useState('recent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const debouncedStatusFilter = useDebounce(statusFilter, 300); // Debounce pour éviter trop de requêtes
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Animation hooks - useScrollAnimation retourne un ref
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const productsRef = useScrollAnimation<HTMLDivElement>();

  // Data fetching avec jointure sur products et pagination côté serveur
  // Si pas de store, le hook récupérera tous les produits de tous les stores de l'utilisateur
  const {
    data: productsResponse,
    isLoading,
    error,
    refetch,
  } = useDigitalProducts(store?.id, {
    page: currentPage,
    itemsPerPage,
    sortBy: sortBy as 'recent' | 'downloads' | 'price-asc' | 'price-desc' | 'name',
    sortOrder:
      sortBy.includes('desc') || sortBy === 'downloads' || sortBy === 'recent' ? 'desc' : 'asc',
  });

  // Extraire les données et métadonnées de pagination
  const productsData = productsResponse?.data || productsResponse || [];

  // Log pour débogage
  useEffect(() => {
    if (error) {
      logger.error(error instanceof Error ? error : 'Erreur dans DigitalProductsList', {
        error,
        storeId: store?.id,
        hasStore: !!store,
      });
    }
  }, [error, store?.id]);

  /**
   * Utiliser directement les données avec la structure product incluse
   */
  type DigitalProductRow = {
    product?: {
      name?: string;
      description?: string;
      is_active?: boolean;
    };
    digital_type?: string;
    status?: string;
  } & Record<string, unknown>;

  const products = useMemo<DigitalProductRow[]>(() => {
    if (!productsData) return [];
    return productsData as DigitalProductRow[];
  }, [productsData]);

  /**
   * Filter and sort products with useMemo for performance
   * Note: Avec pagination côté serveur, le filtrage de base est fait côté serveur
   * Ici on fait seulement le filtrage par recherche et type
   */
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    // Si on a une réponse paginée, les produits sont déjà filtrés côté serveur
    // On applique seulement les filtres locaux (recherche, type, statut)
    const filtered = products.filter(p => {
      const product = 'product' in p ? p.product : p;

      // Search filter
      const matchesSearch =
        !debouncedSearch.trim() ||
        product.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.description?.toLowerCase().includes(debouncedSearch.toLowerCase());

      // Type filter (utiliser debounced)
      const matchesType = debouncedFilterType === 'all' || p.digital_type === debouncedFilterType;

      // Status filter (utiliser debounced)
      const isActive =
        product.is_active !== undefined
          ? product.is_active
          : p.status === 'active' || p.status === 'published';
      const matchesStatus =
        debouncedStatusFilter === 'all' ||
        (debouncedStatusFilter === 'active' && isActive) ||
        (debouncedStatusFilter === 'draft' && !isActive);

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      const productA = 'product' in a ? a.product : a;
      const productB = 'product' in b ? b.product : b;

      switch (sortBy) {
        case 'recent': {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        case 'downloads':
          return (
            (b.total_downloads || b.totalDownloads || 0) -
            (a.total_downloads || a.totalDownloads || 0)
          );
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
  }, [products, debouncedSearch, debouncedFilterType, sortBy, debouncedStatusFilter]);

  /**
   * Pagination - Maintenant gérée côté serveur
   * Les produits sont déjà paginés, on utilise directement productsData
   */
  const paginatedProducts = useMemo(() => {
    // Si la pagination est côté serveur, utiliser directement les données
    if (productsResponse && 'data' in productsResponse) {
      return productsResponse.data || [];
    }
    // Fallback: pagination côté client si nécessaire
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [productsResponse, filteredProducts, currentPage, itemsPerPage]);

  // Utiliser totalPages depuis le serveur ou calculer côté client
  const totalPages = useMemo(() => {
    return productsResponse?.totalPages || Math.ceil(filteredProducts.length / itemsPerPage);
  }, [productsResponse?.totalPages, filteredProducts.length, itemsPerPage]);

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
      totalDownloads: products.reduce(
        (sum, p) => sum + (p.total_downloads || p.totalDownloads || 0),
        0
      ),
      totalRevenue: products.reduce((sum, p) => {
        const product = 'product' in p ? p.product : p;
        const price = product.price || 0;
        const downloads = p.total_downloads || p.totalDownloads || 0;
        return sum + price * downloads;
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
        logger.info('Raccourci clavier: Focus recherche', {});
      }

      // G pour toggle vue grille/liste
      if (
        e.key === 'g' &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        setViewMode(prev => {
          const newMode = prev === 'grid' ? 'list' : 'grid';
          logger.info('Raccourci clavier: Changement de vue', { viewMode: newMode });
          return newMode;
        });
      }

      // Cmd/Ctrl + N pour nouveau produit digital
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        navigate('/dashboard/products/new/digital');
        logger.info('Raccourci clavier: Nouveau produit digital', {});
      }

      // Esc pour effacer recherche
      if (e.key === 'Escape' && document.activeElement?.id === 'search-digital-products') {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  /**
   * Handlers avec useCallback
   */
  const handleRefresh = useCallback(() => {
    refetch();
    logger.info('Rafraîchissement des produits digitaux', {});
    toast({
      title: 'Actualisé',
      description: 'Les produits digitaux ont été actualisés.',
    });
  }, [refetch, toast]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setCurrentPage(1); // Reset à la première page lors de la recherche
    logger.info('Recherche produits digitaux', { searchQuery: value });
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    logger.info('Tri des produits digitaux', { sortBy: value });
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setFilterType(value);
    setCurrentPage(1);
    logger.info('Filtre type produit', { filterType: value });
  }, []);

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
    logger.info('Filtre statut', { statusFilter: value });
  }, []);

  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => {
      const newMode = prev === 'grid' ? 'list' : 'grid';
      logger.info('Changement de vue', { viewMode: newMode });
      return newMode;
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    logger.info('Changement de page', { page });
  }, []);

  const handleItemsPerPageChange = useCallback((value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    logger.info('Items par page', { itemsPerPage: value });
  }, []);

  /**
   * Logging on mount
   */
  useEffect(() => {
    logger.info('Page Produits Digitaux chargée', {
      productsCount: products?.length || 0,
      storeId: store?.id,
      hasStore: !!store,
    });
  }, [products?.length, store?.id, store]);

  /**
   * Error handling avec détails
   */
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error(
        error instanceof Error ? error : 'Erreur lors du chargement des produits digitaux',
        {
          error,
          message: errorMessage,
          storeId: store?.id,
          hasStore: !!store,
        }
      );
      // Ne pas afficher de toast automatiquement pour éviter les spams
      // Le toast sera affiché uniquement si nécessaire
    }
  }, [error, store?.id, store]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header avec animation - Style Inventaire et Mes Cours */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <SidebarTrigger className="mr-1 sm:mr-2" />
                <div>
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                      <Download
                        className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {t('digitalProducts.title', 'Produits Digitaux')}
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                    {t(
                      'digitalProducts.subtitle',
                      'Gérez vos produits digitaux, téléchargements et licenses'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  variant="outline"
                  className="h-9 sm:h-10 transition-all hover:scale-105 text-xs sm:text-sm"
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={cn(
                      'h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2',
                      isLoading && 'animate-spin'
                    )}
                  />
                  <span className="hidden sm:inline">Rafraîchir</span>
                </Button>
                <Button
                  onClick={() => navigate('/dashboard/products/new/digital')}
                  size="sm"
                  className="h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm min-h-[44px] touch-manipulation"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {t('digitalProducts.newProduct', 'Nouveau produit')}
                  </span>
                  <span className="sm:hidden">{t('digitalProducts.new', 'Nouveau')}</span>
                </Button>
              </div>
            </div>

            {/* Error Alert - Style Inventaire */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error instanceof Error
                    ? error.message
                    : 'Erreur lors du chargement des produits digitaux'}
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Cards - Style Inventaire (Gradients) */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: t('digitalProducts.stats.products', 'Produits'),
                  value: stats.totalProducts,
                  icon: Download,
                  color: 'from-purple-600 to-pink-600',
                  subtitle: t('digitalProducts.stats.activeProducts', 'Produits digitaux actifs'),
                },
                {
                  label: t('digitalProducts.stats.downloads', 'Téléchargements'),
                  value: stats.totalDownloads,
                  icon: TrendingUp,
                  color: 'from-blue-600 to-cyan-600',
                  subtitle: t('digitalProducts.stats.totalDownloads', 'Total téléchargements'),
                },
                {
                  label: t('digitalProducts.stats.revenue', 'Revenus'),
                  value: `${stats.totalRevenue.toLocaleString()} XOF`,
                  icon: DollarSign,
                  color: 'from-green-600 to-emerald-600',
                  subtitle: t('digitalProducts.stats.revenueGenerated', 'Revenus générés'),
                },
                {
                  label: t('digitalProducts.stats.customers', 'Clients'),
                  value: stats.uniqueCustomers,
                  icon: Users,
                  color: 'from-yellow-600 to-orange-600',
                  subtitle: t('digitalProducts.stats.uniqueCustomers', 'Clients uniques'),
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div
                        className={`text-base sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                      >
                        {isLoading ? <Skeleton className="h-6 w-16" /> : stat.value}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {stat.subtitle}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Search & Filters - Style Inventaire */}
            <Card
              ref={filtersRef}
              className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <Input
                      id="search-digital-products"
                      ref={searchInputRef}
                      placeholder={t(
                        'digitalProducts.searchPlaceholder',
                        'Rechercher un produit...'
                      )}
                      value={searchInput}
                      onChange={e => handleSearchChange(e.target.value)}
                      className="pl-8 sm:pl-10 pr-8 sm:pr-20 h-9 sm:h-10 text-xs sm:text-sm"
                      aria-label={t('digitalProducts.searchLabel', 'Rechercher un produit digital')}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {searchInput && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handleSearchChange('')}
                          aria-label={t('digitalProducts.clearSearch', 'Effacer la recherche')}
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                    {/* Keyboard shortcut indicator */}
                    <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        ⌘K
                      </Badge>
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewModeToggle}
                    className="h-9 sm:h-10 text-xs sm:text-sm min-h-[44px] touch-manipulation"
                    aria-label={
                      viewMode === 'grid'
                        ? t('digitalProducts.switchToList', 'Passer en vue liste')
                        : t('digitalProducts.switchToGrid', 'Passer en vue grille')
                    }
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {t('digitalProducts.listView', 'Liste')}
                        </span>
                      </>
                    ) : (
                      <>
                        <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {t('digitalProducts.gridView', 'Grille')}
                        </span>
                      </>
                    )}
                  </Button>

                  {/* Type filter */}
                  <Select value={filterType} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-xs sm:text-sm">
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" aria-hidden="true" />
                      <SelectValue placeholder={t('digitalProducts.allTypes', 'Tous les types')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('digitalProducts.allTypes', 'Tous les types')}
                      </SelectItem>
                      <SelectItem value="software">
                        {t('digitalProducts.types.software', 'Logiciels')}
                      </SelectItem>
                      <SelectItem value="ebook">
                        {t('digitalProducts.types.ebook', 'Ebooks')}
                      </SelectItem>
                      <SelectItem value="template">
                        {t('digitalProducts.types.template', 'Templates')}
                      </SelectItem>
                      <SelectItem value="plugin">
                        {t('digitalProducts.types.plugin', 'Plugins')}
                      </SelectItem>
                      <SelectItem value="music">
                        {t('digitalProducts.types.music', 'Musique')}
                      </SelectItem>
                      <SelectItem value="video">
                        {t('digitalProducts.types.video', 'Vidéos')}
                      </SelectItem>
                      <SelectItem value="graphic">
                        {t('digitalProducts.types.graphic', 'Graphisme')}
                      </SelectItem>
                      <SelectItem value="other">
                        {t('digitalProducts.types.other', 'Autre')}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10 text-xs sm:text-sm">
                      <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" aria-hidden="true" />
                      <SelectValue placeholder={t('digitalProducts.sort', 'Trier par')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">
                        {t('digitalProducts.sort.recent', 'Plus récents')}
                      </SelectItem>
                      <SelectItem value="downloads">
                        {t('digitalProducts.sort.downloads', 'Plus téléchargés')}
                      </SelectItem>
                      <SelectItem value="price-desc">
                        {t('digitalProducts.sort.priceDesc', 'Prix (élevé → bas)')}
                      </SelectItem>
                      <SelectItem value="price-asc">
                        {t('digitalProducts.sort.priceAsc', 'Prix (bas → élevé)')}
                      </SelectItem>
                      <SelectItem value="name">
                        {t('digitalProducts.sort.name', 'Nom (A → Z)')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabs - Style Inventaire */}
            <Tabs
              value={statusFilter}
              onValueChange={v => handleStatusChange(v as StatusFilter)}
              className="w-full"
            >
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto">
                <TabsTrigger
                  value="all"
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  {t('digitalProducts.tabs.all', 'Tous')} ({filteredProducts.length})
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {t('digitalProducts.tabs.active', 'Actifs')}
                </TabsTrigger>
                <TabsTrigger
                  value="draft"
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {t('digitalProducts.tabs.draft', 'Brouillons')}
                </TabsTrigger>
              </TabsList>

              {/* Products Grid/List */}
              <TabsContent value="all" className="mt-4 sm:mt-6">
                <div
                  ref={productsRef}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <Card key={i} className="overflow-hidden animate-pulse">
                          <div className="relative">
                            <Skeleton className="h-48 w-full" />
                            <div className="absolute top-2 right-2">
                              <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <div className="space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-3 w-full" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <Skeleton className="h-6 w-20" />
                              <Skeleton className="h-8 w-24 rounded" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : paginatedProducts.length === 0 ? (
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                        <div className="max-w-md mx-auto">
                          <div className="p-4 rounded-full bg-muted/50 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                            <Download className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                          </div>
                          <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                            {t('digitalProducts.empty.title', 'Aucun produit digital')}
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                            {t(
                              'digitalProducts.empty.description',
                              'Créez votre premier produit digital pour commencer à vendre'
                            )}
                          </p>
                          <Button
                            onClick={() => navigate('/dashboard/products/new?type=digital')}
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] px-6 sm:px-8 touch-manipulation"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('digitalProducts.empty.create', 'Créer un produit digital')}
                          </Button>
                        </div>
                      </CardContent>
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
                            .map(dp => {
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
                                          onError={e => {
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
                                              {dp.total_downloads || dp.totalDownloads || 0}{' '}
                                              {t('digitalProducts.downloads', 'téléchargements')}
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
                                            onClick={() =>
                                              navigate(`/products/${product.slug || dp.id}`)
                                            }
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">
                                              {t('digitalProducts.view', 'Voir')}
                                            </span>
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              navigate(`/products/${product.slug || dp.id}/edit`)
                                            }
                                          >
                                            <Edit className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">
                                              {t('digitalProducts.edit', 'Modifier')}
                                            </span>
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
                            <Select
                              value={itemsPerPage.toString()}
                              onValueChange={handleItemsPerPageChange}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAGINATION_OPTIONS.map(option => (
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
                                {t('digitalProducts.page', 'Page')} {currentPage}{' '}
                                {t('digitalProducts.of', 'sur')} {totalPages}
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
                </div>
              </TabsContent>

              <TabsContent value="active" className="mt-4 sm:mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {[1, 2, 3, 4].map(i => (
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
                    return product.is_active !== undefined
                      ? product.is_active
                      : dp.status === 'active' || dp.status === 'published';
                  }).length === 0 ? (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="p-4 rounded-full bg-muted/50 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                          <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                          {t('digitalProducts.empty.active', 'Aucun produit actif')}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                          {t(
                            'digitalProducts.empty.activeDescription',
                            'Aucun produit digital actif pour le moment'
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <DigitalProductsGrid
                      products={filteredProducts
                        .filter(dp => {
                          const product = 'product' in dp ? dp.product : dp;
                          return product.is_active !== undefined
                            ? product.is_active
                            : dp.status === 'active' || dp.status === 'published';
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
                        return product.is_active !== undefined
                          ? product.is_active
                          : dp.status === 'active' || dp.status === 'published';
                      });
                      const activeTotalPages = Math.ceil(activeProducts.length / itemsPerPage);
                      return (
                        activeTotalPages > 1 && (
                          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {t('digitalProducts.itemsPerPage', 'Par page')}:
                              </span>
                              <Select
                                value={itemsPerPage.toString()}
                                onValueChange={handleItemsPerPageChange}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAGINATION_OPTIONS.map(option => (
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
                                  {t('digitalProducts.page', 'Page')} {currentPage}{' '}
                                  {t('digitalProducts.of', 'sur')} {activeTotalPages}
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
                        )
                      );
                    })()}
                  </>
                )}
              </TabsContent>

              <TabsContent value="draft" className="mt-4 sm:mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {[1, 2, 3, 4].map(i => (
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
                    return !(product.is_active !== undefined
                      ? product.is_active
                      : dp.status === 'active' || dp.status === 'published');
                  }).length === 0 ? (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="p-4 rounded-full bg-muted/50 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                          <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                          {t('digitalProducts.empty.draft', 'Aucun brouillon')}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                          {t(
                            'digitalProducts.empty.draftDescription',
                            'Aucun produit digital en brouillon pour le moment'
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <DigitalProductsGrid
                      products={filteredProducts
                        .filter(dp => {
                          const product = 'product' in dp ? dp.product : dp;
                          return !(product.is_active !== undefined
                            ? product.is_active
                            : dp.status === 'active' || dp.status === 'published');
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
                        return !(product.is_active !== undefined
                          ? product.is_active
                          : dp.status === 'active' || dp.status === 'published');
                      });
                      const draftTotalPages = Math.ceil(draftProducts.length / itemsPerPage);
                      return (
                        draftTotalPages > 1 && (
                          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {t('digitalProducts.itemsPerPage', 'Par page')}:
                              </span>
                              <Select
                                value={itemsPerPage.toString()}
                                onValueChange={handleItemsPerPageChange}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAGINATION_OPTIONS.map(option => (
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
                                  {t('digitalProducts.page', 'Page')} {currentPage}{' '}
                                  {t('digitalProducts.of', 'sur')} {draftTotalPages}
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
                        )
                      );
                    })()}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DigitalProductsList;
