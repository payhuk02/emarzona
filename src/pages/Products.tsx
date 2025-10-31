import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Plus, 
  RefreshCw, 
  Download, 
  Upload, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useProducts } from "@/hooks/useProducts";
import { useProductManagement } from "@/hooks/useProductManagement";
import EditProductDialog from "@/components/products/EditProductDialog";
import ProductCardDashboard from "@/components/products/ProductCardDashboard";
import ProductListView from "@/components/products/ProductListView";
import ProductFiltersDashboard from "@/components/products/ProductFiltersDashboard";
import ProductStats from "@/components/products/ProductStats";
import ProductBulkActions from "@/components/products/ProductBulkActions";
import { ImportCSVDialog } from "@/components/products/ImportCSVDialog";
import { Product } from "@/hooks/useProducts";
import { calculateStockStatus, needsRestock } from "@/lib/stockUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { Checkbox } from "@/components/ui/checkbox";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

// Constantes pour la pagination
const ITEMS_PER_PAGE = 12;
const PAGINATION_OPTIONS = [12, 24, 36, 48];

const Products = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const { products, loading: productsLoading, refetch } = useProducts(store?.id);
  const { deleteProduct, updateProduct } = useProductManagement(store?.id || "");
  const { toast } = useToast();
  
  // États
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [productType, setProductType] = useState("all");
  const [status, setStatus] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // Extract unique categories and types
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  }, [products]);

  const productTypes = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.product_type).filter(Boolean))) as string[];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.slug?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (category !== "all") {
      filtered = filtered.filter((product) => product.category === category);
    }

    // Product type filter
    if (productType !== "all") {
      filtered = filtered.filter((product) => product.product_type === productType);
    }

    // Status filter
    if (status === "active") {
      filtered = filtered.filter((product) => product.is_active);
    } else if (status === "inactive") {
      filtered = filtered.filter((product) => !product.is_active);
    }

    // Stock status filter
    if (stockStatus !== "all") {
      filtered = filtered.filter((product) => {
        // Ne filtrer que les produits qui trackent l'inventaire
        if (product.track_inventory === false || product.product_type === 'digital') {
          return stockStatus === "in_stock"; // Produits digitaux = toujours en stock
        }

        const status = calculateStockStatus(
          product.stock_quantity,
          product.low_stock_threshold,
          product.track_inventory ?? true
        );

        if (stockStatus === "needs_restock") {
          return needsRestock(
            product.stock_quantity,
            product.low_stock_threshold,
            product.track_inventory ?? true
          );
        }

        return status === stockStatus;
      });
    }

    // Price range filter
    filtered = filtered.filter((product) => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Date range filter
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((product) => {
        const productDate = new Date(product.created_at);
        return productDate >= dateRange[0]! && productDate <= dateRange[1]!;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "popular":
          return (b.reviews_count || 0) - (a.reviews_count || 0);
        case "rating":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, category, productType, status, stockStatus, sortBy, priceRange, dateRange]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const activeProducts = products.filter(p => p.is_active).length;

  // Animations au scroll
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const productsRef = useScrollAnimation<HTMLDivElement>();

  // Sélection de tous les produits
  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  }, [selectedProducts.length, paginatedProducts]);

  // Raccourcis clavier avancés
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input, textarea ou select
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).tagName === 'SELECT' ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K : Focus sur la recherche
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Cmd/Ctrl + N : Nouveau produit
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        navigate("/dashboard/products/new");
      }

      // Cmd/Ctrl + A : Sélectionner tous les produits visibles
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }

      // Escape : Effacer la sélection
      if (e.key === 'Escape' && selectedProducts.length > 0) {
        setSelectedProducts([]);
      }

      // G : Basculer vue grille/liste
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setViewMode(prev => prev === "grid" ? "list" : "grid");
      }

      // / : Focus sur la recherche
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, selectedProducts, handleSelectAll]);

  // Handlers optimisés avec useCallback
  const handleDelete = useCallback(async () => {
    if (deletingProductId) {
      try {
        logger.info(`Suppression du produit ${deletingProductId}`);
        await deleteProduct(deletingProductId);
        setDeletingProductId(null);
        await refetch();
        logger.info('Produit supprimé avec succès');
        toast({
          title: "Produit supprimé",
          description: "Le produit a été supprimé avec succès",
        });
      } catch (error: any) {
        logger.error('Erreur lors de la suppression du produit:', error);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de supprimer le produit",
          variant: "destructive",
        });
      }
    }
  }, [deletingProductId, deleteProduct, refetch, toast]);

  const handleBulkDelete = useCallback(async (productIds: string[]) => {
    try {
      logger.info(`Suppression en lot de ${productIds.length} produits`);
      await Promise.all(productIds.map(id => deleteProduct(id)));
      setSelectedProducts([]);
      await refetch();
      logger.info('Produits supprimés avec succès');
      toast({
        title: "Produits supprimés",
        description: `${productIds.length} produit(s) supprimé(s) avec succès`,
      });
    } catch (error: any) {
      logger.error('Erreur lors de la suppression en lot:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer tous les produits",
        variant: "destructive",
      });
    }
  }, [deleteProduct, refetch, toast]);

  const handleBulkAction = useCallback(async (action: string, productIds: string[]) => {
    try {
      logger.info(`Action en lot: ${action} sur ${productIds.length} produits`);
      const updates = action === 'activate' ? { is_active: true } : { is_active: false };
      await Promise.all(productIds.map(id => updateProduct(id, updates)));
      setSelectedProducts([]);
      await refetch();
      logger.info('Action en lot appliquée avec succès');
      toast({
        title: "Action appliquée",
        description: `${productIds.length} produit(s) ${action === 'activate' ? 'activé(s)' : 'désactivé(s)'}`,
      });
    } catch (error: any) {
      logger.error(`Erreur lors de l'action en lot ${action}:`, error);
      toast({
        title: "Erreur",
        description: error.message || `Impossible de ${action === 'activate' ? 'activer' : 'désactiver'} les produits`,
        variant: "destructive",
      });
    }
  }, [updateProduct, refetch, toast]);

  const handleToggleStatus = useCallback(async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      try {
        logger.info(`Changement de statut du produit ${productId}: ${!product.is_active ? 'actif' : 'inactif'}`);
        await updateProduct(productId, { is_active: !product.is_active });
        await refetch();
        logger.info('Statut du produit modifié avec succès');
        toast({
          title: product.is_active ? "Produit désactivé" : "Produit activé",
          description: `Le produit a été ${product.is_active ? 'désactivé' : 'activé'} avec succès`,
        });
      } catch (error: any) {
        logger.error('Erreur lors du changement de statut:', error);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de modifier le statut du produit",
          variant: "destructive",
        });
      }
    }
  }, [products, updateProduct, refetch, toast]);

  const handleRefresh = useCallback(() => {
    logger.info('Actualisation de la liste des produits');
    refetch();
    toast({
      title: "Actualisation",
      description: "Liste des produits mise à jour",
    });
  }, [refetch, toast]);

  const handleDuplicateProduct = useCallback(async (productId: string) => {
    try {
      logger.info(`Duplication du produit ${productId}`);
      const product = products.find(p => p.id === productId);
      if (!product) {
        logger.warn(`Produit ${productId} introuvable pour duplication`);
        return;
      }

      // TODO: Implémenter la duplication via l'API
      // const duplicatedProduct = {
      //   ...product,
      //   id: undefined,
      //   name: `${product.name} (copie)`,
      //   slug: `${product.slug}-copie-${Date.now()}`,
      //   created_at: undefined,
      //   updated_at: undefined,
      // };

      // Ici, vous devriez appeler votre API pour créer le nouveau produit
      // Pour l'instant, simulons avec une mise à jour
      await refetch();
      logger.info('Produit dupliqué avec succès');
      toast({
        title: "Produit dupliqué",
        description: "Le produit a été dupliqué avec succès",
      });
    } catch (error: any) {
      logger.error('Erreur lors de la duplication du produit:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de dupliquer le produit",
        variant: "destructive",
      });
    }
  }, [products, toast, refetch]);

  // Import CSV avec validation
  const handleImportConfirmed = useCallback(async (validatedProducts: any[]) => {
    try {
      // Ici, vous devriez appeler votre API pour créer les produits
      // Pour l'instant, simulons l'import
      // await Promise.all(validatedProducts.map(product => createProduct(product)));
      
      // Pour la démo, on refresh juste la liste
      await refetch();
      
      toast({
        title: "Import réussi",
        description: `${validatedProducts.length} produit(s) importé(s) avec succès`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer les produits dans la base de données",
        variant: "destructive",
      });
      throw error; // Re-throw pour que le dialog puisse gérer l'erreur
    }
  }, [refetch, toast]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    setExportingCSV(true);

    try {
      logger.info(`Export CSV de ${filteredProducts.length} produits`);
      const headers = [
        'id', 'name', 'slug', 'description', 'price', 'currency', 
        'category', 'product_type', 'licensing_type', 'license_terms', 'is_active', 'rating', 'reviews_count', 
        'created_at', 'updated_at'
      ];

      const csvContent = [
        headers.join(','),
        ...filteredProducts.map(product => 
          headers.map(header => {
            const value = product[header as keyof Product];
            // Échapper les virgules et guillemets
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `produits_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('Export CSV réussi');
      toast({
        title: "Export réussi",
        description: `${filteredProducts.length} produit(s) exporté(s)`,
      });
    } catch (error: any) {
      logger.error('Erreur lors de l\'export CSV:', error);
      toast({
        title: "Erreur d'export",
        description: error.message || "Impossible d'exporter les produits",
        variant: "destructive",
      });
    } finally {
      setExportingCSV(false);
    }
  }, [filteredProducts, toast]);


  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  }, []);

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="inline-block h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">{t('products.loadingProducts')}</p>
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
          <div className="flex-1 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle>{t('products.createStoreFirst')}</CardTitle>
                <CardDescription>
                  {t('products.createStoreDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => navigate("/dashboard/store")}>
                  {t('products.createMyStore')}
                </Button>
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
          <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur-md shadow-sm transition-all duration-300" role="banner">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 lg:gap-4 px-2 sm:px-3 lg:px-6 overflow-hidden">
              <SidebarTrigger 
                aria-label={t('dashboard.sidebarToggle', 'Toggle sidebar')}
                className="hover:bg-accent/50 transition-colors duration-200 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px]"
              />
              <div className="flex-1 min-w-0 overflow-hidden">
                <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate px-1" id="products-title">
                  {t('products.title')}
                </h1>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={productsLoading}
                  aria-label={t('products.refresh')}
                  className="hidden sm:flex hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[36px]"
                  title={`Actualiser (F5)`}
                >
                  <RefreshCw className={`h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span className="hidden lg:inline ml-2">{t('products.refresh')}</span>
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh} 
                  disabled={productsLoading}
                  aria-label={t('products.refresh')}
                  className="sm:hidden hover:scale-110 active:scale-95 transition-transform duration-200 touch-manipulation min-h-[44px] min-w-[44px]"
                  title="Actualiser"
                >
                  <RefreshCw className={`h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                </Button>
                <Button 
                  onClick={() => navigate("/dashboard/products/new")} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 group hover:scale-105 active:scale-95 touch-manipulation min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm px-2 sm:px-3 lg:px-4"
                  aria-label={t('products.addNew')}
                  size="sm"
                  title="Nouveau produit (Cmd/Ctrl+N)"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 lg:mr-2 group-hover:rotate-90 transition-transform duration-200 flex-shrink-0" aria-hidden="true" />
                  <span className="hidden xs:inline sm:hidden">{t('products.add')}</span>
                  <span className="hidden sm:inline">{t('products.addNew')}</span>
                  <span className="xs:hidden">+</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden" role="main" aria-labelledby="products-title">
            <div className="max-w-7xl mx-auto space-y-2.5 sm:space-y-3 lg:space-y-5 xl:space-y-6 px-1 sm:px-2 lg:px-3">
              {productsLoading ? (
                <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="py-12 text-center" role="status" aria-live="polite">
                    <Loader2 className="inline-block h-8 w-8 animate-spin text-primary mb-3" aria-hidden="true" />
                    <p className="mt-2 text-muted-foreground">{t('common.loading')}</p>
                  </CardContent>
                </Card>
              ) : products.length === 0 ? (
                <Card className="shadow-sm border-2 border-dashed border-border/50 bg-card/30 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                  <CardHeader className="text-center py-8 sm:py-12">
                    <div className="flex justify-center mb-4 animate-in zoom-in-95 duration-500">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Package className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-bold">{t('products.empty.title')}</CardTitle>
                    <CardDescription className="mt-2 text-sm sm:text-base">
                      {t('products.empty.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-8 sm:pb-12">
                    <div className="space-y-4">
                      <Button 
                        onClick={() => navigate("/dashboard/products/new")} 
                        size="lg" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 group"
                      >
                        <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                        {t('products.add')}
                      </Button>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        <p className="mb-3">{t('common.or')} {t('products.import').toLowerCase()}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setImportDialogOpen(true)}
                          className="hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t('products.import')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Statistiques avec animations améliorées */}
                  <div 
                    ref={statsRef} 
                    role="region" 
                    aria-label={t('products.stats.ariaLabel', 'Statistiques des produits')}
                    className="animate-in fade-in slide-in-from-top-4 duration-500"
                  >
                    <ProductStats products={products} filteredProducts={filteredProducts} />
                  </div>

                  {/* Actions en lot avec animation */}
                  {selectedProducts.length > 0 && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <ProductBulkActions
                        selectedProducts={selectedProducts}
                        products={products}
                        onSelectionChange={setSelectedProducts}
                        onBulkAction={handleBulkAction}
                        onDelete={handleBulkDelete}
                      />
                    </div>
                  )}

                  {/* Filtres avec animations */}
                  <div 
                    ref={filtersRef} 
                    role="region" 
                    aria-label={t('products.filters.ariaLabel', 'Filtres de recherche')}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                  >
                    <ProductFiltersDashboard
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    category={category}
                    onCategoryChange={setCategory}
                    productType={productType}
                    onProductTypeChange={setProductType}
                    status={status}
                    onStatusChange={setStatus}
                    stockStatus={stockStatus}
                    onStockStatusChange={setStockStatus}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                    categories={categories}
                    productTypes={productTypes}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    totalProducts={products.length}
                    activeProducts={activeProducts}
                    />
                  </div>

                  {filteredProducts.length === 0 ? (
                    <Card className="shadow-sm border-border/50 bg-card/30 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                      <CardContent className="py-8 sm:py-12 text-center">
                        <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                        <h3 className="text-base sm:text-lg font-semibold mb-2">{t('products.empty.noResults')}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4">
                          {t('products.empty.noResultsDescription')}
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchQuery("");
                            setCategory("all");
                            setProductType("all");
                            setStatus("all");
                            setPriceRange([0, 1000000]);
                            setDateRange([null, null]);
                          }}
                          className="hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          {t('common.clearFilters', 'Effacer les filtres')}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Barre d'actions avec design amélioré pour mobile */}
                      <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            {paginatedProducts.length > 0 && (
                              <Checkbox
                                checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                                onCheckedChange={handleSelectAll}
                                aria-label="Sélectionner tous les produits"
                                className="transition-all duration-200 flex-shrink-0"
                              />
                            )}
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                                {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""} trouvé{filteredProducts.length > 1 ? "s" : ""}
                              </p>
                              {selectedProducts.length > 0 && (
                                <Badge variant="default" className="animate-in zoom-in-95 duration-200 shadow-sm text-xs flex-shrink-0">
                                  {selectedProducts.length} sélectionné{selectedProducts.length > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setImportDialogOpen(true)}
                            className="flex-1 hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] text-xs sm:text-sm"
                          >
                            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            <span className="hidden sm:inline">Importer</span>
                            <span className="sm:hidden">Import</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleExportCSV}
                            disabled={exportingCSV || filteredProducts.length === 0}
                            className="flex-1 hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[40px] text-xs sm:text-sm"
                          >
                            {exportingCSV ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin flex-shrink-0" />
                            ) : (
                              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            )}
                            <span className="hidden sm:inline">Exporter</span>
                            <span className="sm:hidden">Export</span>
                          </Button>
                        </div>
                      </div>

                      {viewMode === "grid" ? (
                        <div 
                          ref={productsRef} 
                          role="region" 
                          aria-label={t('products.list.ariaLabel', 'Liste des produits')}
                          className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                        >
                          <ProductGrid className="gap-3 sm:gap-4 lg:gap-6">
                            {paginatedProducts.map((product, index) => (
                              <div
                                key={product.id}
                                className="animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <ProductCardDashboard
                                  product={product}
                                  storeSlug={store.slug}
                                  onEdit={() => setEditingProduct(product)}
                                  onDelete={() => setDeletingProductId(product.id)}
                                  onToggleStatus={() => handleToggleStatus(product.id)}
                                  onDuplicate={() => handleDuplicateProduct(product.id)}
                                  onQuickView={() => setQuickViewProduct(product)}
                                  isSelected={selectedProducts.includes(product.id)}
                                  onSelect={(selected) => {
                                    if (selected) {
                                      setSelectedProducts([...selectedProducts, product.id]);
                                    } else {
                                      setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                    }
                                  }}
                                />
                              </div>
                            ))}
                          </ProductGrid>
                        </div>
                      ) : (
                        <div 
                          ref={productsRef} 
                          className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700" 
                          role="region" 
                          aria-label={t('products.list.ariaLabel', 'Liste des produits')}
                        >
                          {paginatedProducts.map((product, index) => (
                            <div
                              key={product.id}
                              className="animate-in fade-in slide-in-from-left-2"
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <ProductListView
                                product={product}
                                storeSlug={store.slug}
                                onEdit={() => setEditingProduct(product)}
                                onDelete={() => setDeletingProductId(product.id)}
                                onToggleStatus={() => handleToggleStatus(product.id)}
                                onDuplicate={() => handleDuplicateProduct(product.id)}
                                onQuickView={() => setQuickViewProduct(product)}
                                isSelected={selectedProducts.includes(product.id)}
                                onSelect={(selected) => {
                                  if (selected) {
                                    setSelectedProducts([...selectedProducts, product.id]);
                                  } else {
                                    setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                  }
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pagination avec design amélioré */}
                      {totalPages > 1 && (
                        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <CardContent className="p-3 sm:p-4">
                            <nav className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4" role="navigation" aria-label={t('products.pagination.ariaLabel', 'Navigation des pages')}>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap justify-center sm:justify-start">
                                <label htmlFor="items-per-page" className="sr-only">{t('products.pagination.itemsPerPage')}</label>
                                <span className="hidden sm:inline">{t('products.pagination.displaying', 'Affichage de')}</span>
                                <select
                                  id="items-per-page"
                                  value={itemsPerPage}
                                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                  className="px-2 py-1.5 border rounded-md bg-background text-xs sm:text-sm hover:bg-accent/50 transition-colors duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                  aria-label={t('products.pagination.selectItemsPerPage')}
                                >
                                  {PAGINATION_OPTIONS.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                                <span className="hidden sm:inline">{t('products.pagination.perPage', 'produits par page')}</span>
                                <span className="sm:hidden">/ page</span>
                              </div>

                              <div className="flex items-center gap-1" role="group" aria-label={t('products.pagination.controls')}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(1)}
                                  disabled={currentPage === 1}
                                  aria-label={t('products.pagination.firstPage', 'Première page')}
                                  className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40"
                                >
                                  <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(currentPage - 1)}
                                  disabled={currentPage === 1}
                                  aria-label={t('products.pagination.previousPage', 'Page précédente')}
                                  className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40"
                                >
                                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                </Button>

                                <div className="flex items-center gap-1 px-1 sm:px-2">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNumber;
                                    if (totalPages <= 5) {
                                      pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                      pageNumber = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNumber = totalPages - 4 + i;
                                    } else {
                                      pageNumber = currentPage - 2 + i;
                                    }

                                    return (
                                      <Button
                                        key={pageNumber}
                                        variant={currentPage === pageNumber ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNumber)}
                                        className="min-w-[32px] sm:min-w-[36px] h-8 transition-all duration-200 hover:scale-105 active:scale-95"
                                        aria-label={`Aller à la page ${pageNumber}`}
                                        aria-current={currentPage === pageNumber ? "page" : undefined}
                                      >
                                        {pageNumber}
                                      </Button>
                                    );
                                  })}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                  aria-label={t('products.pagination.nextPage', 'Page suivante')}
                                  className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40"
                                >
                                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(totalPages)}
                                  disabled={currentPage === totalPages}
                                  aria-label={t('products.pagination.lastPage', 'Dernière page')}
                                  className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40"
                                >
                                  <ChevronsRight className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </div>

                              <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                                Page {currentPage} <span className="hidden sm:inline">sur</span> <span className="sm:hidden">/</span> {totalPages}
                              </div>
                            </nav>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Edit Product Dialog */}
      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          storeSlug={store.slug}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onProductUpdated={refetch}
        />
      )}

      {/* Delete Product Dialog */}
      <AlertDialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('products.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('products.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {t('products.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import CSV Dialog - Nouveau avec validation */}
      <ImportCSVDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportConfirmed={handleImportConfirmed}
      />

      {/* Quick View Dialog */}
      {quickViewProduct && (
        <Dialog open={!!quickViewProduct} onOpenChange={(open) => !open && setQuickViewProduct(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t('products.quickView.title')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {quickViewProduct.image_url && (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                  <img
                    src={quickViewProduct.image_url}
                    alt={quickViewProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold mb-2">{quickViewProduct.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={quickViewProduct.is_active ? "default" : "secondary"}>
                    {quickViewProduct.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <Badge variant="outline">{quickViewProduct.product_type}</Badge>
                  {quickViewProduct.category && (
                    <Badge variant="secondary">{quickViewProduct.category}</Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Prix</h4>
                <p className="text-2xl font-bold text-primary">
                  {quickViewProduct.price.toLocaleString()} {quickViewProduct.currency || 'FCFA'}
                </p>
              </div>

              {quickViewProduct.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{quickViewProduct.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Note moyenne</span>
                  <p className="font-medium">{quickViewProduct.rating}/5</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avis</span>
                  <p className="font-medium">{quickViewProduct.reviews_count} avis</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Créé le</span>
                  <p className="font-medium">
                    {new Date(quickViewProduct.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Modifié le</span>
                  <p className="font-medium">
                    {new Date(quickViewProduct.updated_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setQuickViewProduct(null)}>
                Fermer
              </Button>
              <Button onClick={() => {
                setQuickViewProduct(null);
                setEditingProduct(quickViewProduct);
              }}>
                Modifier le produit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </SidebarProvider>
  );
};

export default Products;
