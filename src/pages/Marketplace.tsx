import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import AdvancedFilters from "@/components/marketplace/AdvancedFilters";
import ProductComparison from "@/components/marketplace/ProductComparison";
import FavoritesManager from "@/components/marketplace/FavoritesManager";
import { logger } from '@/lib/logger';

// Types pour les données
interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  promotional_price: number | null;
  currency: string;
  image_url: string | null;
  images: string[];
  category: string | null;
  product_type: string | null;
  rating: number;
  reviews_count: number;
  sales_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  stores?: {
    name: string;
    slug: string;
    logo_url: string | null;
    verified: boolean;
  } | null;
}

interface FilterState {
  search: string;
  category: string;
  productType: string;
  priceRange: string;
  rating: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

const Marketplace = () => {
  const { toast } = useToast();
  
  // États principaux
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
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
    viewMode: "grid"
  });
  
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
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  // Constantes pour les filtres
  const PRICE_RANGES = [
    { value: "all", label: "Tous les prix" },
    { value: "0-5000", label: "0 - 5,000 XOF" },
    { value: "5000-15000", label: "5,000 - 15,000 XOF" },
    { value: "15000-50000", label: "15,000 - 50,000 XOF" },
    { value: "50000+", label: "50,000+ XOF" }
  ];

  const SORT_OPTIONS = [
    { value: "created_at", label: "Plus récents" },
    { value: "price", label: "Prix" },
    { value: "rating", label: "Note" },
    { value: "sales_count", label: "Ventes" },
    { value: "name", label: "Nom" }
  ];

  // Chargement des produits
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("products")
        .select(`
          *,
          stores!inner (
            name,
            slug,
            logo_url,
            verified
          )
        `)
        .eq("is_active", true);

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
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === "asc" });

      const { data, error } = await query;
      
      if (error) throw error;
      
      setProducts(data || []);
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
          console.log("🔁 Changement détecté sur products :", payload);

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

  // Filtrage et recherche des produits
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.stores?.name.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [products, filters.search]);

  // Pagination des produits
  const paginatedProducts = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, pagination]);

  // Catégories uniques
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [products]);

  // Types de produits uniques
  const productTypes = useMemo(() => {
    const types = Array.from(new Set(products.map(p => p.product_type).filter(Boolean))) as string[];
    return types.sort();
  }, [products]);

  // Gestion des filtres
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      productType: "all",
      priceRange: "all",
      rating: "all",
      sortBy: "created_at",
      sortOrder: "desc",
      viewMode: "grid"
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Gestion des favoris
  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  // Gestion de la comparaison
  const addToComparison = (product: Product) => {
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
  };

  const removeFromComparison = (productId: string) => {
    setComparisonProducts(prev => prev.filter(p => p.id !== productId));
  };

  const clearComparison = () => {
    setComparisonProducts([]);
  };

  // Obtenir les produits favoris
  const favoriteProducts = products.filter(p => favorites.has(p.id));

  // Fonction d'achat
  const handlePurchase = async (product: Product) => {
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

      const price = product.promotional_price || product.price;
      
      const result = await initiateMonerooPayment({
        storeId: product.store_id,
        productId: product.id,
        amount: price,
        currency: product.currency,
        description: `Achat de ${product.name}`,
        customerEmail: "client@example.com",
        metadata: { 
          productName: product.name, 
          storeSlug: product.stores?.slug || "" 
        },
      });

      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (error: any) {
      console.error("Erreur Moneroo:", error);
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
  };

  // Partage de produit
  const handleShare = async (product: Product) => {
    const url = `${window.location.origin}/${product.stores?.slug}/${product.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || "",
          url: url,
        });
      } catch (error) {
        console.log("Partage annulé");
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié",
        description: "Le lien du produit a été copié dans le presse-papiers",
      });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pagination.itemsPerPage);
  const canGoPrevious = pagination.currentPage > 1;
  const canGoNext = pagination.currentPage < totalPages;

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <MarketplaceHeader />

      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Marketplace Payhuk
          </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Découvrez des milliers de produits digitaux : formations, ebooks, templates, logiciels et plus encore.
            </p>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
                type="text"
              placeholder="Rechercher un produit ou un vendeur..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
                {(filters.category !== "all" || filters.productType !== "all" || filters.priceRange !== "all") && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Recherche avancée
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowFavorites(true)}
                className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              >
                <Heart className="h-4 w-4 mr-2" />
                Favoris
                {favorites.size > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-600 text-white">
                    {favorites.size}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowComparison(true)}
                className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Comparer
                {comparisonProducts.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-green-600 text-white">
                    {comparisonProducts.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={clearFilters}
                className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              >
                <X className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres avancés */}
      {showFilters && (
        <section className="py-8 px-4 bg-slate-800/50">
          <div className="container mx-auto max-w-6xl">
            <Card className="bg-slate-800 border-slate-600">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Catégorie */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Catégorie</label>
                    <select
                      value={filters.category}
                      onChange={(e) => updateFilter("category", e.target.value)}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md"
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
                      onChange={(e) => updateFilter("productType", e.target.value)}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md"
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
                      onChange={(e) => updateFilter("priceRange", e.target.value)}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md"
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
                      onChange={(e) => updateFilter("rating", e.target.value)}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md"
                    >
                      <option value="all">Toutes les notes</option>
                      <option value="4">4+ étoiles</option>
                      <option value="3">3+ étoiles</option>
                      <option value="2">2+ étoiles</option>
                      <option value="1">1+ étoiles</option>
                    </select>
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
                  onChange={(e) => updateFilter("sortBy", e.target.value)}
                  className="p-2 bg-slate-700 border-slate-600 text-white rounded-md text-sm"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  {filters.sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>

              {/* Mode de vue */}
              <div className="flex items-center gap-1">
                <Button
                  variant={filters.viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter("viewMode", "grid")}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={filters.viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter("viewMode", "list")}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
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
            <div className={`grid gap-6 ${filters.viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {Array.from({ length: pagination.itemsPerPage }).map((_, i) => (
                <Skeleton key={i} className={`rounded-lg ${filters.viewMode === "grid" ? "h-[480px]" : "h-[200px]"}`} />
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <div className={`grid gap-6 ${filters.viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                {paginatedProducts.map((product) => (
                  <ProductCardAdvanced
                  key={product.id}
                  product={product}
                    viewMode={filters.viewMode}
                    isFavorite={favorites.has(product.id)}
                    isPurchasing={purchasing.has(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                    onPurchase={() => handlePurchase(product)}
                    onShare={() => handleShare(product)}
                    onAddToComparison={() => addToComparison(product)}
                    isInComparison={comparisonProducts.some(p => p.id === product.id)}
                />
              ))}
            </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={!canGoPrevious}
                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    const isActive = page === pagination.currentPage;
                    
                    return (
                      <Button
                        key={page}
                        variant={isActive ? "default" : "outline"}
                        onClick={() => goToPage(page)}
                        className={isActive ? "bg-blue-600 text-white" : "bg-slate-800 border-slate-600 text-white hover:bg-slate-700"}
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    disabled={!canGoNext}
                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
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
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold h-12 px-8 hover:from-blue-700 hover:to-purple-700">
                  Créer ma boutique gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez des centaines d'entrepreneurs qui développent leur business avec Payhuk.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-blue-600 font-semibold h-14 px-8 hover:bg-blue-50">
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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
        onClearAll={() => setFavorites(new Set())}
        onClose={() => setShowFavorites(false)}
      />
    </div>
  );
};

// Composant ProductCard avancé
interface ProductCardAdvancedProps {
  product: Product;
  viewMode: 'grid' | 'list';
  isFavorite: boolean;
  isPurchasing: boolean;
  onToggleFavorite: () => void;
  onPurchase: () => void;
  onShare: () => void;
  onAddToComparison: () => void;
  isInComparison: boolean;
}

const ProductCardAdvanced = ({
  product,
  viewMode,
  isFavorite,
  isPurchasing,
  onToggleFavorite,
  onPurchase,
  onShare,
  onAddToComparison,
  isInComparison
}: ProductCardAdvancedProps) => {
  const price = product.promotional_price || product.price;
  const hasPromo = product.promotional_price && product.promotional_price < product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promotional_price!) / product.price) * 100)
    : 0;

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-400"
          }`}
        />
      ))}
      <span className="text-sm text-slate-400 ml-1">({product.reviews_count})</span>
    </div>
  );

  if (viewMode === "list") {
    return (
      <Card className="bg-slate-800 border-slate-600 hover:border-slate-500 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Image */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-slate-700">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                {hasPromo && (
                  <Badge className="absolute top-2 left-2 bg-red-600 text-white">
                    -{discountPercent}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {product.category && (
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {product.category}
                      </Badge>
                    )}
                    {product.stores?.verified && (
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                    {product.short_description || product.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {renderStars(product.rating)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {product.sales_count} vente{product.sales_count !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    {hasPromo && (
                      <div className="text-sm text-slate-400 line-through">
                        {product.price.toLocaleString()} {product.currency}
                      </div>
                    )}
                    <div className="text-lg font-bold text-white">
                      {price.toLocaleString()} {product.currency}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={onPurchase}
                  disabled={isPurchasing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPurchasing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Achat...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Acheter
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleFavorite}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mode grille
  return (
    <Card className="group relative bg-slate-800 border-slate-600 hover:border-slate-500 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-700">
              <ShoppingCart className="h-12 w-12 text-slate-400" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasPromo && (
              <Badge className="bg-red-600 text-white">
                -{discountPercent}%
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-yellow-600 text-white">
                <TrendingUp className="h-3 w-3 mr-1" />
                Populaire
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFavorite}
              className="bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700 h-8 w-8 p-0"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700 h-8 w-8 p-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddToComparison}
              disabled={isInComparison}
              className={`bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700 h-8 w-8 p-0 ${isInComparison ? "opacity-50" : ""}`}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {product.category && (
              <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                {product.category}
              </Badge>
            )}
            {product.stores?.verified && (
              <Badge className="bg-green-600 text-white text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Vérifié
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-white mb-2 line-clamp-2">
            {product.name}
          </h3>

          <div className="flex items-center gap-1 mb-3">
            {renderStars(product.rating)}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-400">
              {product.sales_count} vente{product.sales_count !== 1 ? "s" : ""}
            </div>
            <div className="text-right">
              {hasPromo && (
                <div className="text-xs text-slate-400 line-through">
                  {product.price.toLocaleString()} {product.currency}
                </div>
              )}
              <div className="font-bold text-white">
                {price.toLocaleString()} {product.currency}
              </div>
            </div>
          </div>

          <Button
            onClick={onPurchase}
            disabled={isPurchasing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPurchasing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Achat...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Acheter
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Marketplace;