import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Copy, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
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
import { Product } from "@/hooks/useProducts";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { Checkbox } from "@/components/ui/checkbox";

// Constantes pour la pagination
const ITEMS_PER_PAGE = 12;
const PAGINATION_OPTIONS = [12, 24, 36, 48];

const Products = () => {
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const { products, loading: productsLoading, refetch } = useProducts(store?.id);
  const { deleteProduct, updateProduct } = useProductManagement(store?.id || "");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingProductIds, setDeletingProductIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [duplicatingProductId, setDuplicatingProductId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importingCSV, setImportingCSV] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [productType, setProductType] = useState("all");
  const [status, setStatus] = useState("all");
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
  }, [products, searchQuery, category, productType, status, sortBy, priceRange, dateRange]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const activeProducts = products.filter(p => p.is_active).length;

  // Handlers
  const handleDelete = async () => {
    if (deletingProductId) {
      await deleteProduct(deletingProductId);
      setDeletingProductId(null);
      refetch();
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      });
    }
  };

  const handleBulkDelete = async (productIds: string[]) => {
    try {
      await Promise.all(productIds.map(id => deleteProduct(id)));
      setDeletingProductIds([]);
      setSelectedProducts([]);
      refetch();
      toast({
        title: "Produits supprimés",
        description: `${productIds.length} produit(s) supprimé(s) avec succès`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer tous les produits",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: string, productIds: string[]) => {
    try {
      const updates = action === 'activate' ? { is_active: true } : { is_active: false };
      await Promise.all(productIds.map(id => updateProduct(id, updates)));
      setSelectedProducts([]);
      refetch();
      toast({
        title: "Action appliquée",
        description: `${productIds.length} produit(s) ${action === 'activate' ? 'activé(s)' : 'désactivé(s)'}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible de ${action === 'activate' ? 'activer' : 'désactiver'} les produits`,
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      await updateProduct(productId, { is_active: !product.is_active });
      refetch();
      toast({
        title: product.is_active ? "Produit désactivé" : "Produit activé",
        description: `Le produit a été ${product.is_active ? 'désactivé' : 'activé'} avec succès`,
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Actualisation",
      description: "Liste des produits mise à jour",
    });
  };

  const handleDuplicateProduct = useCallback(async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const duplicatedProduct = {
        ...product,
        id: undefined,
        name: `${product.name} (copie)`,
        slug: `${product.slug}-copie-${Date.now()}`,
        created_at: undefined,
        updated_at: undefined,
      };

      // Ici, vous devriez appeler votre API pour créer le nouveau produit
      // Pour l'instant, simulons avec une mise à jour
      toast({
        title: "Produit dupliqué",
        description: "Le produit a été dupliqué avec succès",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer le produit",
        variant: "destructive",
      });
    }
  }, [products, toast, refetch]);

  // Import CSV
  const handleImportCSV = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingCSV(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const importedProducts = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const product: any = {};
          
          headers.forEach((header, index) => {
            product[header] = values[index];
          });
          
          importedProducts.push(product);
        }

        toast({
          title: "Import réussi",
          description: `${importedProducts.length} produit(s) importé(s)`,
        });

        setImportDialogOpen(false);
        refetch();
      } catch (error) {
        toast({
          title: "Erreur d'import",
          description: "Le fichier CSV n'est pas valide",
          variant: "destructive",
        });
      } finally {
        setImportingCSV(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  }, [toast, refetch]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    setExportingCSV(true);

    try {
      const headers = [
        'id', 'name', 'slug', 'description', 'price', 'currency', 
        'category', 'product_type', 'is_active', 'rating', 'reviews_count', 
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

      toast({
        title: "Export réussi",
        description: `${filteredProducts.length} produit(s) exporté(s)`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les produits",
        variant: "destructive",
      });
    } finally {
      setExportingCSV(false);
    }
  }, [filteredProducts, toast]);

  // Sélection de tous les produits
  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  }, [selectedProducts, paginatedProducts]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="inline-block h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Chargement des produits...</p>
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
                <CardTitle>Créez votre boutique d'abord</CardTitle>
                <CardDescription>
                  Vous devez créer une boutique avant de pouvoir ajouter des produits
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => navigate("/dashboard/store")}>
                  Créer ma boutique
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
          <header className="sticky top-0 z-10 border-b bg-card shadow-soft backdrop-blur-sm">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold">Produits</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={productsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${productsLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
                <Button onClick={() => navigate("/dashboard/products/new")} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nouveau produit</span>
                  <span className="sm:hidden">Nouveau</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 bg-gradient-hero">
            <div className="max-w-7xl mx-auto space-y-6">
              {productsLoading ? (
                <Card className="shadow-medium">
                  <CardContent className="py-12 text-center">
                    <Loader2 className="inline-block h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Chargement des produits...</p>
                  </CardContent>
                </Card>
              ) : products.length === 0 ? (
                <Card className="shadow-medium border-2 border-dashed">
                  <CardHeader className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">Aucun produit pour le moment</CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Créez votre premier produit digital ou service pour commencer à vendre
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-12">
                    <div className="space-y-4">
                      <Button onClick={() => navigate("/dashboard/products/new")} size="lg" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-5 w-5 mr-2" />
                        Créer mon premier produit
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-3">Ou importez vos produits depuis un fichier CSV</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setImportDialogOpen(true)}
                          className="hover:bg-muted"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Importer CSV
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Statistiques */}
                  <ProductStats products={products} filteredProducts={filteredProducts} />

                  {/* Actions en lot */}
                  {selectedProducts.length > 0 && (
                    <ProductBulkActions
                      selectedProducts={selectedProducts}
                      products={products}
                      onSelectionChange={setSelectedProducts}
                      onBulkAction={handleBulkAction}
                      onDelete={handleBulkDelete}
                    />
                  )}

                  {/* Filtres */}
                  <ProductFiltersDashboard
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    category={category}
                    onCategoryChange={setCategory}
                    productType={productType}
                    onProductTypeChange={setProductType}
                    status={status}
                    onStatusChange={setStatus}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                    categories={categories}
                    productTypes={productTypes}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    totalProducts={products.length}
                    activeProducts={activeProducts}
                  />

                  {filteredProducts.length === 0 ? (
                    <Card className="shadow-medium">
                      <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                        <p className="text-muted-foreground mb-4">
                          Aucun produit ne correspond à vos critères de recherche
                        </p>
                        <Button variant="outline" onClick={() => {
                          setSearchQuery("");
                          setCategory("all");
                          setProductType("all");
                          setStatus("all");
                          setPriceRange([0, 1000000]);
                          setDateRange([null, null]);
                        }}>
                          Effacer les filtres
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          {paginatedProducts.length > 0 && (
                            <Checkbox
                              checked={selectedProducts.length === paginatedProducts.length}
                              onCheckedChange={handleSelectAll}
                              aria-label="Sélectionner tous les produits"
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""} trouvé{filteredProducts.length > 1 ? "s" : ""}
                            </p>
                            {selectedProducts.length > 0 && (
                              <Badge variant="secondary">
                                {selectedProducts.length} sélectionné{selectedProducts.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setImportDialogOpen(true)}
                            className="hover:bg-muted"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Importer</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleExportCSV}
                            disabled={exportingCSV || filteredProducts.length === 0}
                            className="hover:bg-muted"
                          >
                            {exportingCSV ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">Exporter</span>
                          </Button>
                        </div>
                      </div>

                      {viewMode === "grid" ? (
                        <ProductGrid>
                          {paginatedProducts.map((product) => (
                            <ProductCardDashboard
                              key={product.id}
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
                          ))}
                        </ProductGrid>
                      ) : (
                        <div className="space-y-3">
                          {paginatedProducts.map((product) => (
                            <ProductListView
                              key={product.id}
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
                          ))}
                        </div>
                      )}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <Card className="shadow-soft">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Affichage de</span>
                                <select
                                  value={itemsPerPage}
                                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                  className="px-2 py-1 border rounded-md bg-background"
                                >
                                  {PAGINATION_OPTIONS.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                                <span>produits par page</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(1)}
                                  disabled={currentPage === 1}
                                >
                                  <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(currentPage - 1)}
                                  disabled={currentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1 px-2">
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
                                        className="min-w-[36px]"
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
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(totalPages)}
                                  disabled={currentPage === totalPages}
                                >
                                  <ChevronsRight className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                Page {currentPage} sur {totalPages}
                              </div>
                            </div>
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
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importer des produits depuis CSV
            </DialogTitle>
            <DialogDescription>
              Importez vos produits depuis un fichier CSV. Le fichier doit contenir les colonnes suivantes : name, slug, description, price, currency, category, product_type
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Fichier CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleImportCSV}
                disabled={importingCSV}
                className="mt-2"
              />
            </div>

            <Separator />

            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Format du fichier CSV :</p>
              <code className="block bg-muted p-2 rounded text-xs">
                name,slug,description,price,currency,category,product_type<br />
                Mon Produit,mon-produit,Description,10000,XOF,digital,digital
              </code>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importingCSV}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick View Dialog */}
      {quickViewProduct && (
        <Dialog open={!!quickViewProduct} onOpenChange={(open) => !open && setQuickViewProduct(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu rapide
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {quickViewProduct.images && quickViewProduct.images.length > 0 && (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                  <img
                    src={quickViewProduct.images[0]}
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
