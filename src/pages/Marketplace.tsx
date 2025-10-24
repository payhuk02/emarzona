import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { 
  Search, 
  ShoppingCart, 
  ArrowRight, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Heart, 
  Share2, 
  Eye,
  Star,
  TrendingUp,
  Clock,
  Users,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap,
  Sparkles,
  Crown,
  DollarSign,
  Loader2,
  Rocket
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import AdvancedFilters from "@/components/marketplace/AdvancedFilters";
import ProductComparison from "@/components/marketplace/ProductComparison";
import FavoritesManager from "@/components/marketplace/FavoritesManager";
import ProductCardProfessional from "@/components/marketplace/ProductCardProfessional";
import { logger } from '@/lib/logger';
import { Product, FilterState, PaginationState } from '@/types/marketplace';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { useDebounce } from '@/hooks/useDebounce';
import '@/styles/marketplace-professional.css';

const Marketplace = () => {
  const { toast } = useToast();
  
  // Hook personnalisé pour favoris synchronisés
  const {
    favorites,
    favoritesCount,
    loading: favoritesLoading,
    toggleFavorite,
    clearAllFavorites,
    isFavorite,
  } = useMarketplaceFavorites();
  
  // États principaux
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<Set<string>>(new Set());
  
  // États des filtres
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    productType: "all",
    priceRange: "all",
    rating: "all",
    sortBy: "created_at",
    sortOrder: "desc",
    viewMode: "grid",
    tags: [],
    verifiedOnly: false,
    featuredOnly: false,
    inStock: true
  });

  // État local pour l'input de recherche (non debounced)
  const [searchInput, setSearchInput] = useState("");
  
  // Valeur debounced pour éviter trop d'appels API
  const debouncedSearch = useDebounce(searchInput, 500);
  
  // État de pagination
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0
  });
  
  // États des modales et UI
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>(() => {
    // Charger la comparaison depuis localStorage
    const saved = localStorage.getItem('marketplace-comparison');
    return saved ? JSON.parse(saved) : [];
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  // Constantes pour les filtres
  const PRICE_RANGES = [
    { value: "all", label: "Tous les prix" },
    { value: "0-5000", label: "0 - 5,000 XOF" },
    { value: "5000-15000", label: "5,000 - 15,000 XOF" },
    { value: "15000-50000", label: "15,000 - 50,000 XOF" },
    { value: "50000-100000", label: "50,000 - 100,000 XOF" },
    { value: "100000+", label: "100,000+ XOF" }
  ];

  const SORT_OPTIONS = [
    { value: "created_at", label: "Plus récents", icon: Clock },
    { value: "price", label: "Prix", icon: DollarSign },
    { value: "rating", label: "Note", icon: Star },
    { value: "sales_count", label: "Ventes", icon: TrendingUp },
    { value: "name", label: "Nom", icon: Eye },
    { value: "popularity", label: "Popularité", icon: Zap }
  ];

  const PRODUCT_TAGS = [
    "Nouveau", "Populaire", "En promotion", "Recommandé", "Tendance",
    "Qualité premium", "Livraison rapide", "Support 24/7", "Garantie",
    "Formation incluse", "Mise à jour gratuite", "Communauté active"
  ];

  // Synchroniser debouncedSearch avec filters.search
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // Chargement des produits
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("products")
        .select(`
          *,
          stores!inner (
            id,
            name,
            slug,
            logo_url,
            created_at
          )
        `)
        .eq("is_active", true)
        .eq("is_draft", false); // Seulement les produits publiés

      // Appliquer les filtres
      if (filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      
      if (filters.productType !== "all") {
        query = query.eq("product_type", filters.productType);
      }
      
      if (filters.priceRange !== "all") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        if (max) {
          query = query.gte("price", min).lte("price", max);
        } else {
          query = query.gte("price", min);
        }
      }
      
      if (filters.rating !== "all") {
        query = query.gte("rating", Number(filters.rating));
      }

      // Appliquer le tri
      if (filters.sortBy === "sales_count") {
        // Tri par nombre de ventes (approximatif avec reviews_count)
        query = query.order("reviews_count", { ascending: filters.sortOrder === "asc" });
      } else {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === "asc" });
      }

      const { data, error } = await query;
      
      if (error) {
        logger.error("Erreur Supabase lors du chargement des produits:", error);
        throw error;
      }
      
      logger.info(`${data?.length || 0} produits chargés avec succès`);
      setProducts((data || []) as unknown as Product[]);
      setPagination(prev => ({ ...prev, totalItems: data?.length || 0 }));
      
    } catch (error) {
      logger.error("❌ Erreur lors du chargement des produits :", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Abonnement temps réel
  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("realtime:products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          logger.debug("🔁 Changement temps réel détecté sur products:", payload.eventType);

          if (payload.eventType === "INSERT") {
            setProducts((prev) => [payload.new as Product, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Product) : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            setProducts((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const descMatch = product.description?.toLowerCase().includes(searchLower);
        const storeMatch = product.stores?.name.toLowerCase().includes(searchLower);
        const categoryMatch = product.category?.toLowerCase().includes(searchLower);
        const tagsMatch = product.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        return nameMatch || descMatch || storeMatch || categoryMatch || tagsMatch;
      });
    }

    // Filtrage par tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(product => 
        filters.tags.some(tag => product.tags?.includes(tag))
      );
    }

    return filtered;
  }, [products, filters.search, filters.tags]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, pagination]);

  // Catégories et types dynamiques
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [products]);

  const productTypes = useMemo(() => {
    const types = Array.from(new Set(products.map(p => p.product_type).filter(Boolean))) as string[];
    return types.sort();
  }, [products]);

  // Gestion des filtres
  const updateFilter = useCallback((filters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...filters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      category: "all",
      productType: "all",
      priceRange: "all",
      rating: "all",
      sortBy: "created_at",
      sortOrder: "desc",
      viewMode: "grid",
      tags: [],
      verifiedOnly: false,
      featuredOnly: false,
      inStock: true
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Persister la comparaison dans localStorage
  useEffect(() => {
    localStorage.setItem('marketplace-comparison', JSON.stringify(comparisonProducts));
  }, [comparisonProducts]);

  // Gestion de la comparaison
  const addToComparison = useCallback((product: Product) => {
    if (comparisonProducts.length >= 4) {
      toast({
        title: "Limite atteinte",
        description: "Vous pouvez comparer maximum 4 produits",
        variant: "destructive",
      });
      return;
    }
    
    if (comparisonProducts.find(p => p.id === product.id)) {
      toast({
        title: "Produit déjà ajouté",
        description: "Ce produit est déjà dans la comparaison",
        variant: "destructive",
      });
      return;
    }
    
    setComparisonProducts(prev => [...prev, product]);
    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté à la comparaison`,
    });
  }, [comparisonProducts, toast]);

  const removeFromComparison = useCallback((productId: string) => {
    setComparisonProducts(prev => prev.filter(p => p.id !== productId));
    toast({
      title: "Produit retiré",
      description: "Le produit a été retiré de la comparaison",
    });
  }, [toast]);

  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
    localStorage.removeItem('marketplace-comparison');
    toast({
      title: "Comparaison effacée",
      description: "Tous les produits ont été retirés de la comparaison",
    });
  }, [toast]);

  // Obtenir les produits favoris
  const favoriteProducts = useMemo(() => {
    if (!favorites || favorites.size === 0) return [];
    const favoriteIds = Array.from(favorites);
    return products.filter(p => favoriteIds.includes(p.id));
  }, [products, favorites]);

  // Fonction d'achat
  const handlePurchase = useCallback(async (product: Product) => {
    if (!product.store_id) {
      toast({
        title: "Erreur",
        description: "Boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      setPurchasing(prev => new Set(prev).add(product.id));

      // Récupérer l'utilisateur authentifié
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast({
          title: "Authentification requise",
          description: "Veuillez vous connecter pour effectuer un achat",
          variant: "destructive",
        });
        setPurchasing(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
        return;
      }

      const price = product.promotional_price || product.price;
      
      const result = await initiateMonerooPayment({
        storeId: product.store_id,
        productId: product.id,
        amount: price,
        currency: product.currency,
        description: `Achat de ${product.name}`,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email.split('@')[0],
        metadata: { 
          productName: product.name, 
          storeSlug: product.stores?.slug || "",
          userId: user.id
        },
      });

      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (error: any) {
      logger.error("Erreur lors de l'achat:", error);
      toast({
        title: "Erreur de paiement",
        description: error.message || "Impossible d'initialiser le paiement",
        variant: "destructive",
      });
    } finally {
      setPurchasing(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  }, [toast]);

  // Partage de produit
  const handleShare = useCallback(async (product: Product) => {
    const url = `${window.location.origin}/${product.stores?.slug}/${product.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description || product.description || "",
          url: url,
        });
        toast({
          title: "Partagé avec succès",
          description: "Le lien a été partagé",
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          logger.error("Erreur lors du partage:", error);
          toast({
            title: "Erreur de partage",
            description: "Impossible de partager le lien",
            variant: "destructive",
          });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Lien copié",
          description: "Le lien du produit a été copié dans le presse-papiers",
        });
      } catch (error) {
        logger.error("Erreur lors de la copie:", error);
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien. Vérifiez les permissions.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pagination.itemsPerPage);
  const canGoPrevious = pagination.currentPage > 1;
  const canGoNext = pagination.currentPage < totalPages;

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Statistiques
  const stats = useMemo(() => ({
    totalProducts: products.length,
    totalStores: new Set(products.map(p => p.store_id)).size,
    averageRating: products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length || 0,
    totalSales: products.reduce((sum, p) => sum + (p.reviews_count || 0), 0), // Approximation avec reviews_count
    categoriesCount: categories.length,
    featuredProducts: products.filter(p => p.promotional_price && p.promotional_price < p.price).length // Produits en promo
  }), [products, categories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <MarketplaceHeader />

      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
              <h1 className="text-4xl md:text-6xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Marketplace Payhuk
          </h1>
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Découvrez des milliers de produits digitaux : formations, ebooks, templates, logiciels et plus encore.
              <br />
              <span className="text-blue-400 font-semibold">Rejoignez la révolution du commerce digital en Afrique</span>
            </p>
            
            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
                <div className="text-2xl font-bold text-blue-400">{stats.totalProducts}</div>
                <div className="text-sm text-slate-400">Produits</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
                <div className="text-2xl font-bold text-green-400">{stats.totalStores}</div>
                <div className="text-sm text-slate-400">Boutiques</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
                <div className="text-2xl font-bold text-yellow-400">{stats.averageRating.toFixed(1)}</div>
                <div className="text-sm text-slate-400">Note moyenne</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
                <div className="text-2xl font-bold text-purple-400">{stats.totalSales}</div>
                <div className="text-sm text-slate-400">Ventes</div>
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" aria-hidden="true" />
            <Input
                type="search"
                placeholder="Rechercher un produit, une boutique ou une catégorie..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                aria-label="Rechercher des produits dans le marketplace"
              />
              {searchInput && searchInput !== debouncedSearch && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Recherche...</span>
                  </div>
                </div>
              )}
          </div>

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres avancés
                {(filters.category !== "all" || filters.productType !== "all" || filters.priceRange !== "all" || filters.tags.length > 0) && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse">
                    !
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105"
              >
                <Zap className="h-4 w-4 mr-2" />
                Recherche intelligente
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowFavorites(true)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105"
                aria-label={`Voir mes favoris (${favoritesCount} produits)`}
              >
                <Heart className="h-4 w-4 mr-2" aria-hidden="true" />
                Mes favoris
                {favoritesCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-red-600 text-white animate-bounce">
                    {favoritesCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowComparison(true)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Comparer
                {comparisonProducts.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-green-600 text-white animate-bounce">
                    {comparisonProducts.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={clearFilters}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105"
              >
                <X className="h-4 w-4 mr-2" />
                Effacer tout
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres avancés */}
      {showFilters && (
        <section className="py-8 px-4 bg-slate-800/30 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Catégorie */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Catégorie</label>
                    <select
                      value={filters.category}
                      onChange={(e) => updateFilter({ category: e.target.value })}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">Toutes les catégories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type de produit */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Type</label>
                    <select
                      value={filters.productType}
                      onChange={(e) => updateFilter({ productType: e.target.value })}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">Tous les types</option>
                      {productTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Prix */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Prix</label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) => updateFilter({ priceRange: e.target.value })}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      {PRICE_RANGES.map(range => (
                        <option key={range.value} value={range.value}>{range.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Note minimum</label>
                    <select
                      value={filters.rating}
                      onChange={(e) => updateFilter({ rating: e.target.value })}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">Toutes les notes</option>
                      <option value="4">4+ étoiles</option>
                      <option value="3">3+ étoiles</option>
                      <option value="2">2+ étoiles</option>
                      <option value="1">1+ étoiles</option>
                    </select>
                  </div>
                </div>

                {/* Filtres supplémentaires */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="verifiedOnly"
                      checked={filters.verifiedOnly}
                      onChange={(e) => updateFilter({ verifiedOnly: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="verifiedOnly" className="text-sm text-slate-300">
                      Boutiques vérifiées uniquement
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featuredOnly"
                      checked={filters.featuredOnly}
                      onChange={(e) => updateFilter({ featuredOnly: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="featuredOnly" className="text-sm text-slate-300">
                      Produits en vedette uniquement
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="inStock"
                      checked={filters.inStock}
                      onChange={(e) => updateFilter({ inStock: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="inStock" className="text-sm text-slate-300">
                      En stock uniquement
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Tags populaires</label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const newTags = filters.tags.includes(tag)
                            ? filters.tags.filter(t => t !== tag)
                            : [...filters.tags, tag];
                          updateFilter({ tags: newTags });
                        }}
                        className={`px-3 py-1 rounded-full text-xs transition-all duration-300 ${
                          filters.tags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Contrôles de tri et vue */}
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">
                Tous les produits
              </h2>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* Tri */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-300">Trier par:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter({ sortBy: e.target.value })}
                  className="p-2 bg-slate-700 border-slate-600 text-white rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300"
                >
                  {filters.sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>

              {/* Mode de vue */}
              <div className="flex items-center gap-1">
                <Button
                  variant={filters.viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter({ viewMode: "grid" })}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={filters.viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter({ viewMode: "list" })}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Liste des produits */}
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <ProductGrid loading={true} skeletonCount={pagination.itemsPerPage} />
          ) : paginatedProducts.length > 0 ? (
            <>
              <ProductGrid>
                {paginatedProducts.map((product) => (
                  <ProductCardProfessional
                    key={product.id}
                    product={product}
                    storeSlug={product.stores?.slug || 'default'}
                  />
                ))}
              </ProductGrid>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={!canGoPrevious}
                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 transition-all duration-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (pagination.currentPage <= 4) {
                      page = i + 1;
                    } else if (pagination.currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = pagination.currentPage - 3 + i;
                    }
                    
                    const isActive = page === pagination.currentPage;
                    
                    return (
                      <Button
                        key={page}
                        variant={isActive ? "default" : "outline"}
                        onClick={() => goToPage(page)}
                        className={isActive ? "bg-blue-600 text-white" : "bg-slate-800 border-slate-600 text-white hover:bg-slate-700 transition-all duration-300"}
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    disabled={!canGoNext}
                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 transition-all duration-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-full bg-slate-700 mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                Aucun produit disponible
              </h3>
              <p className="text-slate-400 mb-6">
                {filters.search
                  ? "Essayez d'autres mots-clés ou filtres"
                  : "Soyez le premier à vendre vos produits sur notre marketplace !"}
              </p>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold h-12 px-8 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105">
                  Créer ma boutique gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-white animate-bounce" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
            Prêt à lancer votre boutique ?
          </h2>
            <Rocket className="h-8 w-8 text-white animate-bounce" />
          </div>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez des centaines d'entrepreneurs qui développent leur business avec Payhuk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
              <Button size="lg" className="bg-white text-blue-600 font-semibold h-14 px-8 hover:bg-blue-50 transition-all duration-300 hover:scale-105">
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 h-14 px-8 transition-all duration-300 hover:scale-105">
              <Users className="mr-2 h-5 w-5" />
              Rejoindre la communauté
            </Button>
          </div>
        </div>
      </section>

      <MarketplaceFooter />

      {/* Modales */}
      <AdvancedFilters
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        filters={filters}
        onFiltersChange={updateFilter}
        categories={categories}
        productTypes={productTypes}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
      />

      <ProductComparison
        products={comparisonProducts}
        onRemoveProduct={removeFromComparison}
        onClearAll={clearComparison}
        onClose={() => setShowComparison(false)}
      />

      <FavoritesManager
        favorites={favoriteProducts}
        onRemoveFavorite={(productId) => toggleFavorite(productId)}
        onClearAll={clearAllFavorites}
        onClose={() => setShowFavorites(false)}
      />
    </div>
  );
};

export default Marketplace;