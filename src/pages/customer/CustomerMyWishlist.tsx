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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { useCart } from '@/hooks/cart/useCart';
import { usePagination } from '@/hooks/usePagination';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
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
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Filter,
  Trash2,
  FileDown,
  CheckSquare,
  Square,
  DollarSign,
  Palette,
  CreditCard,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { logger } from '@/lib/logger';
import { ProductType } from '@/types/cart';
import { htmlToPlainText } from '@/lib/html-sanitizer';

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
  const queryClient = useQueryClient();
  const { favorites, toggleFavorite, loading: favoritesLoading } = useMarketplaceFavorites();
  const { addItem } = useCart();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState<
    'all' | 'digital' | 'physical' | 'service' | 'course' | 'artist'
  >('all');
  const [sortBy, setSortBy] = useState<'date' | 'price_asc' | 'price_desc' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const productsRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les baisses de prix
  const { data: priceDropsData } = usePriceDrops();
  const  priceDrops: Array<{
    product_id: string;
    old_price: number;
    new_price: number;
    currency?: string;
  }> = Array.isArray(priceDropsData) ? priceDropsData : [];
  const updatePriceAlert = useUpdatePriceAlertSettings();
  const markAsRead = useMarkPriceAlertAsRead();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Convertir le Set en array pour les requêtes (trié pour stabilité de la clé)
  const favoriteIds = useMemo(() => {
    return Array.from(favorites).sort();
  }, [favorites]);

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
    retry: 3, // Retry automatique en cas d'erreur réseau
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponentiel
    staleTime: 30 * 1000, // Cache réduit à 30 secondes pour détecter rapidement les changements
    refetchOnWindowFocus: true, // Refetch quand la fenêtre reprend le focus
    refetchOnMount: true, // Refetch au montage du composant
  });

  // Refetch automatique quand favorites change (ajout/suppression depuis marketplace)
  // Utiliser une clé de requête basée sur le contenu pour détecter les changements
  const favoriteIdsKey = useMemo(() => favoriteIds.join(','), [favoriteIds]);

  useEffect(() => {
    if (!favoritesLoading && favoriteIds.length > 0) {
      // Invalider et refetch la requête quand les favoris changent
      queryClient.invalidateQueries({ queryKey: ['favorite-products'] });
      logger.info('Favoris mis à jour, refetch de la wishlist', {
        count: favoriteIds.length,
        favoriteIdsKey,
      });
    }
  }, [favoriteIdsKey, favoritesLoading, queryClient]); // Utiliser favoriteIdsKey pour détecter les changements de contenu

  // Extraire les boutiques uniques pour le filtre
  const uniqueStores = useMemo(() => {
    if (!favoriteProducts) return [];
    const storesMap = new Map<string, { id: string; name: string }>();
    favoriteProducts.forEach(product => {
      if (product.stores?.id && product.stores?.name) {
        storesMap.set(product.stores.id, {
          id: product.stores.id,
          name: product.stores.name,
        });
      }
    });
    return Array.from(storesMap.values());
  }, [favoriteProducts]);

  // Calculer la plage de prix pour le filtre
  const priceRangeData = useMemo(() => {
    if (!favoriteProducts || favoriteProducts.length === 0) {
      return { min: 0, max: 0 };
    }
    const prices = favoriteProducts.map(p => p.promotional_price ?? p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [favoriteProducts]);

  // Filtrer et trier les produits selon la recherche et le filtre de type - Style Inventaire
  const filteredAndSortedProducts = useMemo(() => {
    if (!favoriteProducts) return [];

    let  filtered= [...favoriteProducts];

    // Filtre par type (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.product_type === activeTab);
    }

    // Filtre par boutique
    if (storeFilter !== 'all') {
      filtered = filtered.filter(p => p.stores?.id === storeFilter);
    }

    // Filtre par prix
    if (priceRange[0] > 0 || priceRange[1] < Infinity) {
      filtered = filtered.filter(p => {
        const price = p.promotional_price ?? p.price;
        return price >= priceRange[0] && price <= priceRange[1];
      });
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

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.promotional_price ?? a.price) - (b.promotional_price ?? b.price);
        case 'price_desc':
          return (b.promotional_price ?? b.price) - (a.promotional_price ?? a.price);
        case 'name':
          return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [favoriteProducts, activeTab, debouncedSearch, sortBy, storeFilter, priceRange]);

  // Pagination
  const pagination = usePagination({
    total: filteredAndSortedProducts.length,
    initialPage: 1,
    initialPageSize: 12,
    pageSizeOptions: [12, 24, 48, 96],
  });

  // Produits paginés
  const paginatedProducts = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredAndSortedProducts.slice(start, end);
  }, [filteredAndSortedProducts, pagination.page, pagination.pageSize]);

  // Statistiques (basées sur les produits filtrés)
  const stats = useMemo(() => {
    if (!favoriteProducts) {
      return { total: 0, byType: {} };
    }

    const  byType: Record<string, number> = {};
    favoriteProducts.forEach(p => {
      byType[p.product_type] = (byType[p.product_type] || 0) + 1;
    });

    return {
      total: favoriteProducts.length,
      byType,
      filtered: filteredAndSortedProducts.length,
    };
  }, [favoriteProducts, filteredAndSortedProducts]);

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
          description: `${htmlToPlainText(product.name)} a été ajouté à votre panier`,
        });
        logger.info('Produit ajouté au panier depuis wishlist', { productId: product.id });
      } catch ( _error: unknown) {
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

  // Gérer l'achat direct - Ajoute au panier et redirige vers checkout
  const handleBuyProduct = useCallback(
    async (product: FavoriteProduct) => {
      setIsAddingToCart(true);
      try {
        // Vérifier l'authentification
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
          toast({
            title: 'Authentification requise',
            description: 'Veuillez vous connecter pour effectuer un achat',
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        // Ajouter le produit au panier
        await addItem({
          product_id: product.id,
          product_type: product.product_type as ProductType,
          quantity: 1,
        });

        // Rediriger vers le checkout avec les paramètres du produit
        const checkoutParams = new URLSearchParams({
          productId: product.id,
          storeId: product.store_id,
        });

        navigate(`/checkout?${checkoutParams.toString()}`);
        logger.info('Redirection vers checkout depuis wishlist', {
          productId: product.id,
          storeId: product.store_id,
        });
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: 'Erreur',
          description: errorMessage || "Impossible de procéder à l'achat",
          variant: 'destructive',
        });
        logger.error(error instanceof Error ? error : 'Erreur achat depuis wishlist', {
          error,
          productId: product.id,
        });
      } finally {
        setIsAddingToCart(false);
      }
    },
    [addItem, navigate, toast]
  );

  // Gérer la suppression des favoris - Style Inventaire
  const handleRemoveFavorite = useCallback(
    async (productId: string, productName: string) => {
      await toggleFavorite(productId);
      // Invalider le cache pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['favorite-products'] });
      setSelectedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });

      toast({
        title: 'Retiré des favoris',
        description: `${htmlToPlainText(productName)} a été retiré de votre wishlist`,
      });
      logger.info('Produit retiré de la wishlist', { productId });
    },
    [toggleFavorite, queryClient, toast]
  );

  // Actions en masse
  const handleBulkAddToCart = useCallback(async () => {
    if (selectedProducts.size === 0) return;
    setIsAddingToCart(true);
    try {
      const productsToAdd = filteredAndSortedProducts.filter(p => selectedProducts.has(p.id));
      for (const product of productsToAdd) {
        await addItem({
          product_id: product.id,
          product_type: product.product_type as ProductType,
          quantity: 1,
        });
      }
      toast({
        title: 'Ajouté au panier',
        description: `${selectedProducts.size} produit(s) ajouté(s) à votre panier`,
      });
      setSelectedProducts(new Set());
      logger.info('Produits ajoutés au panier en masse', { count: selectedProducts.size });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || "Impossible d'ajouter au panier",
        variant: 'destructive',
      });
    } finally {
      setIsAddingToCart(false);
    }
  }, [selectedProducts, filteredAndSortedProducts, addItem, toast]);

  const handleBulkRemove = useCallback(async () => {
    if (selectedProducts.size === 0) return;
    try {
      for (const productId of selectedProducts) {
        await toggleFavorite(productId);
      }
      await refetch();
      toast({
        title: 'Retiré des favoris',
        description: `${selectedProducts.size} produit(s) retiré(s) de votre wishlist`,
      });
      setSelectedProducts(new Set());
      logger.info('Produits retirés de la wishlist en masse', { count: selectedProducts.size });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de retirer des favoris',
        variant: 'destructive',
      });
    }
  }, [selectedProducts, toggleFavorite, refetch, toast]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    setIsExporting(true);
    try {
      const headers = [
        'Nom',
        'Type',
        'Boutique',
        'Prix',
        'Prix promotionnel',
        'Devise',
        'Catégorie',
        'Description',
        "Date d'ajout",
      ];
      const  csvRows: string[] = [headers.join(',')];

      const productsToExport =
        selectedProducts.size > 0
          ? filteredAndSortedProducts.filter(p => selectedProducts.has(p.id))
          : filteredAndSortedProducts;

      for (const product of productsToExport) {
        const row = [
          `"${product.name.replace(/"/g, '""')}"`,
          product.product_type,
          `"${product.stores?.name || ''}"`,
          product.price,
          product.promotional_price || '',
          product.currency,
          product.category || '',
          `"${(product.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          new Date(product.created_at).toLocaleDateString('fr-FR'),
        ];
        csvRows.push(row.join(','));
      }

      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `wishlist_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export réussi',
        description: `${productsToExport.length} produit(s) exporté(s) en CSV`,
      });
      logger.info('Wishlist exportée en CSV', { count: productsToExport.length });
    } catch ( _error: unknown) {
      logger.error("Erreur lors de l'export CSV", { error });
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter la wishlist",
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [selectedProducts, filteredAndSortedProducts, toast]);

  // Toggle sélection produit
  const handleToggleSelection = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  // Sélectionner/désélectionner tout
  const handleSelectAll = useCallback(() => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    }
  }, [selectedProducts.size, paginatedProducts]);

  // Handle refresh - Style Inventaire
  const handleRefresh = useCallback(() => {
    setError(null);
    // Invalider toutes les requêtes liées aux favoris
    queryClient.invalidateQueries({ queryKey: ['favorite-products'] });
    queryClient.invalidateQueries({ queryKey: ['price-drops'] });
    logger.info('Wishlist refreshed', {});
    toast({
      title: 'Actualisé',
      description: 'La wishlist a été actualisée.',
    });
  }, [queryClient, toast]);

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
          // Route correcte pour produits digitaux : /stores/:slug/products/:productSlug
          navigate(`/stores/${storeSlug}/products/${product.slug}`);
          break;
        case 'physical':
          navigate(`/physical/${product.id}`);
          break;
        case 'service':
          navigate(`/service/${product.id}`);
          break;
        case 'course':
          // Route correcte pour cours : /courses/:slug (utilise slug, pas id)
          navigate(`/courses/${product.slug}`);
          break;
        case 'artist':
          // Route pour œuvres d'artiste : /artist/:id
          navigate(`/artist/${product.id}`);
          break;
        default:
          // Fallback vers la route des produits digitaux
          navigate(`/stores/${storeSlug}/products/${product.slug}`);
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
      case 'artist':
        return <Palette className="h-4 w-4" />;
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
      case 'artist':
        return "Oeuvre d'artiste";
      default:
        return type;
    }
  };

  // Skeleton loading amélioré
  if (favoritesLoading || isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              {/* Header Skeleton */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
              {/* Stats Skeleton */}
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Card key={i} className="border-border/50">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-20" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-12" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Products Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="border-border/50">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 w-24 mb-4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 flex-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              <div className="flex items-center gap-2 flex-wrap">
                {stats.total > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onSelect={() => setShowShareDialog(true)}
                      size="sm"
                      className="h-9 sm:h-10 transition-all hover:scale-105 text-xs sm:text-sm"
                    >
                      <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Partager</span>
                      <span className="sm:hidden">Partager</span>
                    </Button>
                    <Select>
                      <SelectTrigger
                        className="h-9 sm:h-10 transition-all hover:scale-105 text-xs sm:text-sm"
                        disabled={isExporting}
                      >
                        <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Exporter</span>
                        <span className="sm:hidden">Export</span>
                      </SelectTrigger>
                      <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                        <SelectItem value="csv" onSelect={handleExportCSV} disabled={isExporting}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Exporter en CSV
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onSelect={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="h-9 sm:h-10 transition-all hover:scale-105 text-xs sm:text-sm"
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">Liste</span>
                        </>
                      ) : (
                        <>
                          <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          <span className="hidden sm:inline">Grille</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
                <Button
                  onSelect={handleRefresh}
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
                      onSelect={() => {
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
                  {
                    label: "Oeuvres d'artiste",
                    value: stats.byType.artist || 0,
                    icon: Palette,
                    color: 'from-pink-600 to-rose-600',
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
                            onSelect={() => setSearchInput('')}
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
                    {/* Sort */}
                    <div className="w-full sm:w-auto">
                      <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
                        <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm">
                          <SelectValue placeholder="Trier par..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Plus récent</SelectItem>
                          <SelectItem value="price_asc">Prix croissant</SelectItem>
                          <SelectItem value="price_desc">Prix décroissant</SelectItem>
                          <SelectItem value="name">Nom A-Z</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Store Filter */}
                    {uniqueStores.length > 1 && (
                      <div className="w-full sm:w-auto">
                        <Select value={storeFilter} onValueChange={setStoreFilter}>
                          <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm">
                            <SelectValue placeholder="Toutes les boutiques" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les boutiques</SelectItem>
                            {uniqueStores.map(store => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {/* Price Filter */}
                    {priceRangeData.max > 0 && (
                      <div className="w-full sm:w-auto flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Input
                          type="number"
                          placeholder="Min"
                          value={priceRange[0] === 0 ? '' : priceRange[0]}
                          onChange={e =>
                            setPriceRange([Number(e.target.value) || 0, priceRange[1]])
                          }
                          className="w-24 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                          min={0}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={priceRange[1] === Infinity ? '' : priceRange[1]}
                          onChange={e =>
                            setPriceRange([priceRange[0], Number(e.target.value) || Infinity])
                          }
                          className="w-24 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                          min={priceRange[0]}
                        />
                        {(priceRange[0] > 0 || priceRange[1] < Infinity) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onSelect={() => setPriceRange([0, Infinity])}
                            className="min-h-[44px] min-w-[44px]"
                            aria-label="Réinitialiser le filtre de prix"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs - Style Inventaire */}
            {stats.total > 0 && (
              <Tabs
                value={activeTab}
                onValueChange={v =>
                  setActiveTab(
                    v as 'all' | 'digital' | 'physical' | 'service' | 'course' | 'artist'
                  )
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
                  {stats.byType.artist > 0 && (
                    <TabsTrigger
                      value="artist"
                      className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 min-h-[44px] text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                    >
                      Oeuvres d'artiste ({stats.byType.artist})
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
                      onSelect={() => navigate('/marketplace')}
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
            {stats.total > 0 && filteredAndSortedProducts.length === 0 && (
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
                        onSelect={() => {
                          setSearchInput('');
                          setActiveTab('all');
                          setStoreFilter('all');
                          setPriceRange([0, Infinity]);
                          setSortBy('date');
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

            {/* Actions en masse */}
            {selectedProducts.size > 0 && (
              <Card className="border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20 animate-in fade-in slide-in-from-bottom-4">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">
                      {selectedProducts.size} produit{selectedProducts.size > 1 ? 's' : ''}{' '}
                      sélectionné{selectedProducts.size > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onSelect={handleBulkAddToCart}
                      disabled={isAddingToCart}
                      className="min-h-[44px]"
                    >
                      {isAddingToCart ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 mr-2" />
                      )}
                      Ajouter au panier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onSelect={handleBulkRemove}
                      className="min-h-[44px]"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Retirer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onSelect={() => setSelectedProducts(new Set())}
                      className="min-h-[44px]"
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste des produits favoris - Style Inventaire */}
            {paginatedProducts.length > 0 && (
              <div
                ref={productsRef}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
              >
                {/* Sélectionner tout */}
                {paginatedProducts.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onSelect={handleSelectAll}
                      className="text-xs sm:text-sm"
                    >
                      {selectedProducts.size === paginatedProducts.length ? (
                        <>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Tout désélectionner
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Tout sélectionner
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
                      : 'space-y-4'
                  }
                >
                  {paginatedProducts.map(product => (
                    <Card
                      key={product.id}
                      className={`group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm hover:scale-[1.02] overflow-hidden relative ${
                        selectedProducts.has(product.id) ? 'ring-2 ring-purple-500' : ''
                      } ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''}`}
                    >
                      {/* Checkbox de sélection */}
                      <div className="absolute top-2 left-2 z-10">
                        <button
                          onSelect={() => handleToggleSelection(product.id)}
                          className="p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          aria-label={
                            selectedProducts.has(product.id) ? 'Désélectionner' : 'Sélectionner'
                          }
                        >
                          {selectedProducts.has(product.id) ? (
                            <CheckSquare className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          )}
                        </button>
                      </div>
                      <div
                        className={`relative ${viewMode === 'grid' ? 'h-40 sm:h-48 lg:h-52' : 'h-32 sm:h-40 w-full sm:w-48 flex-shrink-0'} overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600`}
                      >
                        {product.image_url && product.image_url.trim() !== '' ? (
                          <OptimizedImage
                            src={product.image_url}
                            alt={product.name ? htmlToPlainText(product.name) : 'Produit'}
                            width={viewMode === 'grid' ? 800 : 600}
                            height={viewMode === 'grid' ? 600 : 450}
                            quality={90}
                            containerClassName="absolute inset-0 w-full h-full"
                            className="!w-full !h-full"
                            imageClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            showPlaceholder={false}
                            showSkeleton={true}
                            priority={true}
                            sizes={
                              viewMode === 'grid'
                                ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                                : '(max-width: 640px) 100vw, 300px'
                            }
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-600/20">
                            <Package className="h-12 w-12 sm:h-16 sm:w-16 text-purple-300 dark:text-purple-400" />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-md h-8 w-8 sm:h-9 sm:w-9 touch-manipulation"
                          onSelect={() =>
                            handleRemoveFavorite(product.id, htmlToPlainText(product.name))
                          }
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
                          {product.name ? htmlToPlainText(product.name) : 'Produit sans nom'}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                          {product.description
                            ? htmlToPlainText(product.description)
                            : 'Aucune description'}
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
                            onSelect={() => handleViewProduct(product)}
                            className="flex-1 h-9 sm:h-10 text-xs sm:text-sm min-h-[44px] touch-manipulation"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            onSelect={() => handleBuyProduct(product)}
                            disabled={isAddingToCart}
                            className="flex-1 h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm min-h-[44px] touch-manipulation"
                          >
                            {isAddingToCart ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                            ) : (
                              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            )}
                            Acheter
                          </Button>
                        </div>

                        {/* Alerte prix */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onSelect={() => {
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
                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-8 pt-6 border-t border-border">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Affichage de {pagination.range.start} à {pagination.range.end} sur{' '}
                      {filteredAndSortedProducts.length} produit
                      {filteredAndSortedProducts.length > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onSelect={pagination.previousPage}
                        disabled={!pagination.hasPreviousPage}
                        className="min-h-[44px] text-xs sm:text-sm"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Précédent
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let  pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onSelect={() => pagination.goToPage(pageNum)}
                              className={`min-h-[44px] min-w-[44px] text-xs sm:text-sm ${
                                pagination.page === pageNum
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                  : ''
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onSelect={pagination.nextPage}
                        disabled={!pagination.hasNextPage}
                        className="min-h-[44px] text-xs sm:text-sm"
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
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






