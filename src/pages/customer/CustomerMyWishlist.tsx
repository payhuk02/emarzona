/**
 * Page Ma Wishlist - Liste complète des favoris
 * Date: 26 Janvier 2025
 *
 * Fonctionnalités:
 * - Affichage de tous les produits favoris avec détails
 * - Filtres par type de produit
 * - Recherche dans les favoris
 * - Actions: ajouter au panier, retirer des favoris
 * - Statistiques de la wishlist
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { useCart } from '@/hooks/cart/useCart';
import {
  usePriceDrops,
  useUpdatePriceAlertSettings,
  useMarkPriceAlertAsRead,
} from '@/hooks/wishlist/useWishlistPriceAlerts';
import { WishlistShareDialog } from '@/components/wishlist/WishlistShareDialog';
import { PriceAlertBadge } from '@/components/wishlist/PriceAlertBadge';
import {
  Heart,
  ShoppingBag,
  Search,
  Package,
  Download,
  BookOpen,
  Calendar,
  AlertCircle,
  X,
  ShoppingCart,
  Share2,
  Bell,
  BellOff,
  TrendingDown,
  Loader2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { logger } from '@/lib/logger';
import { ProductType } from '@/types/cart';

interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  promotional_price?: number | null;
  currency: string;
  image_url: string | null;
  product_type: string;
  category: string | null;
  store_id: string;
  stores?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  created_at: string;
  price_alert_enabled?: boolean;
  price_when_added?: number;
}

export default function CustomerMyWishlist() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { favorites, toggleFavorite, loading: favoritesLoading } = useMarketplaceFavorites();
  const { addItem } = useCart();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState<'all' | 'digital' | 'physical' | 'service' | 'course'>(
    'all'
  );
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const productsRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les baisses de prix
  const { data: priceDropsData } = usePriceDrops();
  const priceDrops: Array<{
    product_id: string;
    old_price: number;
    new_price: number;
    currency?: string;
  }> = Array.isArray(priceDropsData) ? priceDropsData : [];
  const updatePriceAlert = useUpdatePriceAlertSettings();
  const markAsRead = useMarkPriceAlertAsRead();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Convertir le Set en array pour les requêtes
  const favoriteIds = Array.from(favorites);

  // Fetch favorite products with details and price alert settings - Style Inventaire
  const {
    data: favoriteProducts,
    isLoading,
    error: itemsError,
    refetch,
  } = useQuery({
    queryKey: ['favorite-products', favoriteIds],
    queryFn: async (): Promise<FavoriteProduct[]> => {
      if (favoriteIds.length === 0) return [];

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Récupérer les produits avec leurs paramètres d'alerte
      const { data: favoritesData, error: favoritesError } = (await supabase
        .from('user_favorites')
        .select(
          `
          product_id,
          price_drop_alert_enabled,
          price_when_added,
          products!inner (
            id,
            name,
            slug,
            description,
            price,
            promotional_price,
            currency,
            image_url,
            product_type,
            category,
            store_id,
            created_at,
            stores!inner (
              id,
              name,
              slug,
              logo_url
            )
          )
        `
        )
        .eq('user_id', user.id)
        .in('product_id', favoriteIds)
        .order('created_at', { ascending: false })) as {
        data: Array<{
          products: FavoriteProduct;
          price_drop_alert_enabled?: boolean;
          price_when_added?: number;
        }> | null;
        error: unknown;
      };

      if (favoritesError) {
        logger.error(
          favoritesError instanceof Error
            ? favoritesError
            : 'Erreur lors de la récupération des favoris',
          { error: favoritesError }
        );
        throw favoritesError;
      }

      interface FavoriteItemData {
        products: FavoriteProduct;
        price_drop_alert_enabled?: boolean;
        price_when_added?: number;
      }
      return ((favoritesData as FavoriteItemData[]) || []).map((item: FavoriteItemData) => ({
        ...item.products,
        price_alert_enabled: item.price_drop_alert_enabled,
        price_when_added: item.price_when_added,
      })) as FavoriteProduct[];
    },
    enabled: favoriteIds.length > 0 && !favoritesLoading,
  });

  // Filtrer les produits selon la recherche et le filtre de type - Style Inventaire
  const filteredProducts = useMemo(() => {
    if (!favoriteProducts) return [];

    let filtered = favoriteProducts;

    // Filtre par type (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.product_type === activeTab);
    }

    // Recherche
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.stores?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [favoriteProducts, activeTab, debouncedSearch]);

  // Statistiques
  const stats = useMemo(() => {
    if (!favoriteProducts) {
      return { total: 0, byType: {} };
    }

    const byType: Record<string, number> = {};
    favoriteProducts.forEach(p => {
      byType[p.product_type] = (byType[p.product_type] || 0) + 1;
    });

    return {
      total: favoriteProducts.length,
      byType,
    };
  }, [favoriteProducts]);

  // Gérer l'ajout au panier - Style Inventaire
  const handleAddToCart = useCallback(
    async (product: FavoriteProduct) => {
      setIsAddingToCart(true);
      try {
        await addItem({
          product_id: product.id,
          product_type: product.product_type as ProductType,
          quantity: 1,
        });

        toast({
          title: 'Ajouté au panier',
          description: `${product.name} a été ajouté à votre panier`,
        });
        logger.info('Produit ajouté au panier depuis wishlist', { productId: product.id });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: 'Erreur',
          description: errorMessage || "Impossible d'ajouter au panier",
          variant: 'destructive',
        });
        logger.error(error instanceof Error ? error : 'Erreur ajout au panier depuis wishlist', {
          error,
          productId: product.id,
        });
      } finally {
        setIsAddingToCart(false);
      }
    },
    [addItem, toast]
  );

  // Gérer la suppression des favoris - Style Inventaire
  const handleRemoveFavorite = useCallback(
    async (productId: string, productName: string) => {
      await toggleFavorite(productId);
      await refetch();

      toast({
        title: 'Retiré des favoris',
        description: `${productName} a été retiré de votre wishlist`,
      });
      logger.info('Produit retiré de la wishlist', { productId });
    },
    [toggleFavorite, refetch, toast]
  );

  // Handle refresh - Style Inventaire
  const handleRefresh = useCallback(() => {
    setError(null);
    refetch();
    logger.info('Wishlist refreshed', {});
    toast({
      title: 'Actualisé',
      description: 'La wishlist a été actualisée.',
    });
  }, [refetch, toast]);

  // Keyboard shortcuts - Style Inventaire
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K pour recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-wishlist')?.focus();
      }
      // Esc pour effacer recherche
      if (e.key === 'Escape' && document.activeElement?.id === 'search-wishlist') {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Error handling - Style Inventaire
  useEffect(() => {
    if (itemsError) {
      const errorMessage = itemsError?.message || 'Erreur lors du chargement de la wishlist';
      setError(errorMessage);
      logger.error(itemsError instanceof Error ? itemsError : 'Wishlist fetch error', {
        error: itemsError,
      });
    } else {
      setError(null);
    }
  }, [itemsError]);

  // Navigation vers le détail du produit - Style Inventaire
  const handleViewProduct = useCallback(
    (product: FavoriteProduct) => {
      const productType = product.product_type;
      const storeSlug = product.stores?.slug;

      if (!storeSlug) {
        toast({
          title: 'Erreur',
          description: 'Boutique introuvable',
          variant: 'destructive',
        });
        logger.error('Boutique introuvable pour produit', {
          productId: product.id,
          storeSlug: product.stores?.slug,
        });
        return;
      }

      // Navigation selon le type de produit
      switch (productType) {
        case 'digital':
          navigate(`/marketplace/${storeSlug}/${product.slug}`);
          break;
        case 'physical':
          navigate(`/products/physical/${product.id}`);
          break;
        case 'service':
          navigate(`/services/${product.id}`);
          break;
        case 'course':
          navigate(`/courses/${product.id}`);
          break;
        default:
          navigate(`/marketplace/${storeSlug}/${product.slug}`);
      }
      logger.info('Navigation vers produit depuis wishlist', {
        productId: product.id,
        productType,
        storeSlug,
      });
    },
    [navigate, toast]
  );

  // Obtenir l'icône selon le type de produit
  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'digital':
        return <Download className="h-4 w-4" />;
      case 'physical':
        return <Package className="h-4 w-4" />;
      case 'service':
        return <Calendar className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Obtenir le label du type
  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'digital':
        return 'Produit Digital';
      case 'physical':
        return 'Produit Physique';
      case 'service':
        return 'Service';
      case 'course':
        return 'Cours en Ligne';
      default:
        return type;
    }
  };

  if (favoritesLoading || isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement de la wishlist...</p>
              </div>
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
            {/* Header avec animation - Style Inventaire et Mes Cours */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Heart
                      className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400 fill-purple-500 dark:fill-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Ma Wishlist
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {stats.total > 0
                    ? `${stats.total} produit${stats.total > 1 ? 's' : ''} dans votre wishlist`
                    : 'Aucun produit dans votre wishlist'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {stats.total > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowShareDialog(true)}
                    size="sm"
                    className="h-9 sm:h-10 transition-all hover:scale-105 text-xs sm:text-sm"
                  >
                    <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Partager</span>
                    <span className="sm:hidden">Partager</span>
                  </Button>
                )}
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  className="h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Rafraîchir</span>
                </Button>
              </div>
            </div>

            {/* Alertes prix - Style Inventaire */}
            {priceDrops.length > 0 && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20 animate-in fade-in slide-in-from-top-4">
                <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                    <span className="text-sm sm:text-base">
                      <strong>{priceDrops.length}</strong> produit{priceDrops.length > 1 ? 's' : ''}{' '}
                      {priceDrops.length > 1 ? 'ont' : 'a'} baissé de prix !
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        priceDrops.forEach(
                          (drop: {
                            product_id: string;
                            old_price: number;
                            new_price: number;
                            currency?: string;
                          }) => {
                            markAsRead.mutate(drop.product_id);
                          }
                        );
                      }}
                      className="min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                    >
                      Marquer comme lu
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Alert - Style Inventaire */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Stats Cards - Style Inventaire (Purple-Pink Gradient) */}
            {stats.total > 0 && (
              <div
                ref={statsRef}
                className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                {[
                  {
                    label: 'Total',
                    value: stats.total,
                    icon: Heart,
                    color: 'from-purple-600 to-pink-600',
                  },
                  {
                    label: 'Digitaux',
                    value: stats.byType.digital || 0,
                    icon: Download,
                    color: 'from-blue-600 to-cyan-600',
                  },
                  {
                    label: 'Physiques',
                    value: stats.byType.physical || 0,
                    icon: Package,
                    color: 'from-green-600 to-emerald-600',
                  },
                  {
                    label: 'Services',
                    value: stats.byType.service || 0,
                    icon: Calendar,
                    color: 'from-yellow-600 to-orange-600',
                  },
                  {
                    label: 'Cours',
                    value: stats.byType.course || 0,
                    icon: BookOpen,
                    color: 'from-purple-600 to-pink-600',
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
                          {stat.value}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Search & Filters - Style Inventaire */}
            {stats.total > 0 && (
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
                        id="search-wishlist"
                        placeholder="Rechercher par nom de produit..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        className="pl-8 sm:pl-10 pr-12 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                        aria-label="Rechercher"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {searchInput && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-[44px] min-w-[44px] h-11 w-11"
                            onClick={() => setSearchInput('')}
                            aria-label="Effacer"
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs - Style Inventaire */}
            {stats.total > 0 && (
              <Tabs
                value={activeTab}
                onValueChange={v =>
                  setActiveTab(v as 'all' | 'digital' | 'physical' | 'service' | 'course')
                }
              >
                <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto">
                  <TabsTrigger
                    value="all"
                    className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Tous ({stats.total})
                  </TabsTrigger>
                  {stats.byType.digital > 0 && (
                    <TabsTrigger
                      value="digital"
                      className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                    >
                      Digitaux ({stats.byType.digital})
                    </TabsTrigger>
                  )}
                  {stats.byType.physical > 0 && (
                    <TabsTrigger
                      value="physical"
                      className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                    >
                      Physiques ({stats.byType.physical})
                    </TabsTrigger>
                  )}
                  {stats.byType.service > 0 && (
                    <TabsTrigger
                      value="service"
                      className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                    >
                      Services ({stats.byType.service})
                    </TabsTrigger>
                  )}
                  {stats.byType.course > 0 && (
                    <TabsTrigger
                      value="course"
                      className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                    >
                      Cours ({stats.byType.course})
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            )}

            {/* Liste vide - Style Inventaire */}
            {!favoritesLoading && !isLoading && stats.total === 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="p-4 rounded-full bg-muted/50 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                      <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground fill-muted-foreground/20" />
                    </div>
                    <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                      Votre wishlist est vide
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                      Commencez à ajouter des produits favoris depuis le marketplace !
                    </p>
                    <Button
                      onClick={() => navigate('/marketplace')}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] px-6 sm:px-8"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Découvrir le marketplace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Résultats de recherche vides - Style Inventaire */}
            {stats.total > 0 && filteredProducts.length === 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="p-4 rounded-full bg-muted/50 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                      <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3">
                      Aucun produit trouvé
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                      Aucun produit ne correspond à votre recherche. Essayez de modifier vos
                      filtres.
                    </p>
                    {(searchInput || activeTab !== 'all') && (
                      <Button
                        onClick={() => {
                          setSearchInput('');
                          setActiveTab('all');
                        }}
                        size="lg"
                        variant="outline"
                        className="min-h-[44px] px-6 sm:px-8"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste des produits favoris - Style Inventaire */}
            {filteredProducts.length > 0 && (
              <div
                ref={productsRef}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredProducts.map(product => (
                    <Card
                      key={product.id}
                      className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm hover:scale-[1.02] overflow-hidden"
                    >
                      <div className="relative h-40 sm:h-48 lg:h-52 overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600">
                        <img
                          src={product.image_url || '/placeholder-product.png'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.png';
                          }}
                          loading="lazy"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-md h-8 w-8 sm:h-9 sm:w-9 touch-manipulation"
                          onClick={() => handleRemoveFavorite(product.id, product.name)}
                          aria-label="Retirer des favoris"
                        >
                          <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 fill-red-500" />
                        </Button>
                        <Badge className="absolute top-2 left-2 shadow-lg" variant="secondary">
                          <span className="hidden sm:inline mr-1">
                            {getProductTypeIcon(product.product_type)}
                          </span>
                          <span className="text-xs sm:text-sm">
                            {getProductTypeLabel(product.product_type)}
                          </span>
                        </Badge>
                        {priceDrops.length > 0 &&
                          priceDrops.some(drop => drop.product_id === product.id) &&
                          (() => {
                            const priceDrop = priceDrops.find(
                              drop => drop.product_id === product.id
                            );
                            return priceDrop ? (
                              <div className="absolute bottom-2 left-2">
                                <PriceAlertBadge
                                  oldPrice={priceDrop.old_price || product.price}
                                  newPrice={priceDrop.new_price || product.price}
                                  currency={priceDrop.currency || product.currency}
                                />
                              </div>
                            ) : null;
                          })()}
                      </div>
                      <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg lg:text-xl font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
                          {product.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                          {product.description || 'Aucune description'}
                        </CardDescription>
                        {product.stores && (
                          <p className="text-xs text-muted-foreground mt-1 sm:mt-2 flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{product.stores.name}</span>
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                        {/* Prix */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex flex-col gap-1">
                            {product.promotional_price ? (
                              <>
                                <span className="text-xl sm:text-2xl font-bold text-primary">
                                  {product.promotional_price.toLocaleString('fr-FR')}{' '}
                                  {product.currency}
                                </span>
                                <span className="text-xs sm:text-sm line-through text-muted-foreground">
                                  {product.price.toLocaleString('fr-FR')} {product.currency}
                                </span>
                              </>
                            ) : (
                              <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                                {product.price.toLocaleString('fr-FR')} {product.currency}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProduct(product)}
                            className="flex-1 h-9 sm:h-10 text-xs sm:text-sm min-h-[44px] touch-manipulation"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            disabled={isAddingToCart}
                            className="flex-1 h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm min-h-[44px] touch-manipulation"
                          >
                            {isAddingToCart ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                            ) : (
                              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            )}
                            Ajouter
                          </Button>
                        </div>

                        {/* Alerte prix */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const isEnabled = product.price_alert_enabled ?? true;
                            updatePriceAlert.mutate({
                              productId: product.id,
                              enabled: !isEnabled,
                            });
                          }}
                          className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                        >
                          {product.price_alert_enabled !== false ? (
                            <>
                              <BellOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                              Désactiver alerte
                            </>
                          ) : (
                            <>
                              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                              Activer alerte
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialog de partage */}
      <WishlistShareDialog open={showShareDialog} onOpenChange={setShowShareDialog} />
    </SidebarProvider>
  );
}
