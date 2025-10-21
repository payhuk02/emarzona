import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, RefreshCw, Download, Upload } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const Products = () => {
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const { products, loading: productsLoading, refetch } = useProducts(store?.id);
  const { deleteProduct, updateProduct } = useProductManagement(store?.id || "");
  const { toast } = useToast();
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingProductIds, setDeletingProductIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [productType, setProductType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

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
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [products, searchQuery, category, productType, status, sortBy]);

  const activeProducts = products.filter(p => p.is_active).length;

  const handleDelete = async () => {
    if (deletingProductId) {
      await deleteProduct(deletingProductId);
      setDeletingProductId(null);
      refetch();
    }
  };

  const handleBulkDelete = async (productIds: string[]) => {
    try {
      await Promise.all(productIds.map(id => deleteProduct(id)));
      setDeletingProductIds([]);
      setSelectedProducts([]);
      refetch();
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
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Actualisation",
      description: "Liste des produits mise à jour",
    });
  };

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
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
          <header className="sticky top-0 z-10 border-b bg-card shadow-soft">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold">Produits</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button onClick={() => navigate("/dashboard/products/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau produit
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 bg-gradient-hero">
            <div className="max-w-7xl mx-auto space-y-6">
              {productsLoading ? (
                <Card className="shadow-medium">
                  <CardContent className="py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-muted-foreground">Chargement des produits...</p>
                  </CardContent>
                </Card>
              ) : products.length === 0 ? (
                <Card className="shadow-medium">
                  <CardHeader className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                    </div>
                    <CardTitle>Aucun produit pour le moment</CardTitle>
                    <CardDescription className="mt-2">
                      Créez votre premier produit digital ou service pour commencer à vendre
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-12">
                    <div className="space-y-4">
                      <Button onClick={() => navigate("/dashboard/products/new")} size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Créer mon premier produit
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        <p>Ou importez vos produits depuis un fichier CSV</p>
                        <Button variant="outline" size="sm" className="mt-2">
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
                        }}>
                          Effacer les filtres
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
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
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exporter
                          </Button>
                        </div>
                      </div>

                      {viewMode === "grid" ? (
                        <div className="products-grid-mobile sm:products-grid-tablet lg:products-grid-desktop gap-4 sm:gap-6">
                          {filteredProducts.map((product) => (
                            <ProductCardDashboard
                              key={product.id}
                              product={product}
                              storeSlug={store.slug}
                              onEdit={() => setEditingProduct(product)}
                              onDelete={() => setDeletingProductId(product.id)}
                              onToggleStatus={() => handleToggleStatus(product.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredProducts.map((product) => (
                            <ProductListView
                              key={product.id}
                              product={product}
                              storeSlug={store.slug}
                              onEdit={() => setEditingProduct(product)}
                              onDelete={() => setDeletingProductId(product.id)}
                              onToggleStatus={() => handleToggleStatus(product.id)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          storeSlug={store.slug}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onProductUpdated={refetch}
        />
      )}

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
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default Products;