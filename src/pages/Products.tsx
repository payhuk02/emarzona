import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Import optimisé depuis l'index centralisé
import {
  Package,
  Plus,
  RefreshCw,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Upload,
  SlidersHorizontal,
} from '@/components/icons';
import { AlertCircle } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useProductsOptimized } from '@/hooks/useProductsOptimized';
import { useProductManagement } from '@/hooks/useProductManagement';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import ProductListView from '@/components/products/ProductListView';
import ProductFiltersDashboard from '@/components/products/ProductFiltersDashboard';
import ProductStats from '@/components/products/ProductStats';
import ProductBulkActions from '@/components/products/ProductBulkActions';
import { ImportCSVDialog } from '@/components/products/ImportCSVDialog';
import { Product } from '@/hooks/useProducts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { ProductGrid } from '@/components/ui/ProductGrid';
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { sanitizeProductDescription } from '@/lib/html-sanitizer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';

// Constantes pour la pagination
const ITEMS_PER_PAGE = 12;
const PAGINATION_OPTIONS = [12, 24, 36, 48];

const Products = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const { deleteProduct, updateProduct, createProduct } = useProductManagement(store?.id || '');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // États
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  // Filtres avec debouncing pour optimiser les performances
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [category, setCategory] = useState('all');
  const debouncedCategory = useDebounce(category, 300);
  const [productType, setProductType] = useState('all');
  const debouncedProductType = useDebounce(productType, 300);
  const [status, setStatus] = useState('all');
  const debouncedStatus = useDebounce(status, 300);
  const [stockStatus, setStockStatus] = useState('all');
  const debouncedStockStatus = useDebounce(stockStatus, 300);
  const [sortBy, setSortBy] = useState('recent');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const debouncedPriceRange = useDebounce(priceRange, 300);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // Ref pour l'input de recherche (pour les raccourcis clavier)
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Utiliser le hook optimisé avec pagination serveur
  const {
    products,
    totalPages,
    isLoading: productsLoading,
    error: productsError,
    refetch,
  } = useProductsOptimized(store?.id, {
    page: currentPage,
    itemsPerPage,
    sortBy: sortBy as
      | 'recent'
      | 'oldest'
      | 'name-asc'
      | 'name-desc'
      | 'price-asc'
      | 'price-desc'
      | 'popular'
      | 'rating',
    sortOrder:
      sortBy.includes('desc') || sortBy === 'popular' || sortBy === 'rating' ? 'desc' : 'asc',
    searchQuery: debouncedSearchQuery,
    category: debouncedCategory === 'all' ? undefined : debouncedCategory,
    productType: debouncedProductType === 'all' ? undefined : debouncedProductType,
    status: debouncedStatus === 'all' ? undefined : (debouncedStatus as 'active' | 'inactive'),
    stockStatus:
      debouncedStockStatus === 'all'
        ? undefined
        : (debouncedStockStatus as 'in_stock' | 'low_stock' | 'out_of_stock' | 'needs_restock'),
    priceRange: debouncedPriceRange,
  });

  // Utiliser uniquement le hook optimisé (pas de fallback sur l'ancien hook)
  const productsLoadingState = productsLoading;

  // Extract unique categories and types (pour les filtres)
  // Note: Pour obtenir toutes les catégories/types, on doit charger tous les produits une fois
  // Pour l'instant, on utilise les produits paginés (peut être amélioré avec une requête séparée)
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  }, [products]);

  const productTypes = useMemo(() => {
    return Array.from(new Set(products.map(p => p.product_type).filter(Boolean))) as string[];
  }, [products]);

  // Avec pagination serveur, les produits sont déjà filtrés et paginés
  // On applique seulement le filtre dateRange côté client (trop complexe pour SQL)
  const filteredProducts = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) {
      return products; // Pas de filtre date, utiliser directement les produits paginés
    }

    return products.filter(product => {
      const productDate = new Date(product.created_at);
      return productDate >= dateRange[0]! && productDate <= dateRange[1]!;
    });
  }, [products, dateRange]);

  // Pagination déjà gérée côté serveur, utiliser directement les produits
  const paginatedProducts = filteredProducts;

  // Utiliser totalPages depuis le hook optimisé
  const activeProducts = products.filter(p => p.is_active).length;

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const productsRef = useScrollAnimation<HTMLDivElement>();

  // Réinitialiser la sélection quand les filtres changent
  useEffect(() => {
    setSelectedProducts([]);
    setCurrentPage(1); // Réinitialiser aussi la page à 1
  }, [
    debouncedSearchQuery,
    debouncedCategory,
    debouncedProductType,
    debouncedStatus,
    debouncedStockStatus,
    debouncedPriceRange,
  ]);

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
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }

      // Cmd/Ctrl + N : Nouveau produit
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/dashboard/products/new');
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

      // / : Focus sur la recherche
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
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
        logger.info('Suppression du produit', { productId: deletingProductId });
        await deleteProduct(deletingProductId);
        setDeletingProductId(null);
        await refetch();
        logger.info('Produit supprimé avec succès', { productId: deletingProductId });
        toast({
          title: 'Produit supprimé',
          description: 'Le produit a été supprimé avec succès',
        });
      } catch (_error: unknown) {
        const errorMessage = _error instanceof Error ? _error.message : 'Erreur inconnue';
        logger.error(
          _error instanceof Error ? _error : 'Erreur lors de la suppression du produit',
          {
            error: _error,
            productId: deletingProductId,
          }
        );
        toast({
          title: 'Erreur',
          description: errorMessage || 'Impossible de supprimer le produit',
          variant: 'destructive',
        });
      }
    }
  }, [deletingProductId, deleteProduct, refetch, toast]);

  const handleBulkDelete = useCallback(
    async (productIds: string[]) => {
      try {
        logger.info('Suppression en lot de produits', { count: productIds.length, productIds });
        await Promise.all(productIds.map(id => deleteProduct(id)));
        setSelectedProducts([]);
        await refetch();
        logger.info('Produits supprimés avec succès', { count: productIds.length });
        toast({
          title: 'Produits supprimés',
          description: `${productIds.length} produit(s) supprimé(s) avec succès`,
        });
      } catch (_error: unknown) {
        const errorMessage = _error instanceof Error ? _error.message : 'Erreur inconnue';
        logger.error(_error instanceof Error ? _error : 'Erreur lors de la suppression en lot', {
          error: _error,
          productIds,
        });
        toast({
          title: 'Erreur',
          description: errorMessage || 'Impossible de supprimer tous les produits',
          variant: 'destructive',
        });
      }
    },
    [deleteProduct, refetch, toast]
  );

  const handleBulkAction = useCallback(
    async (action: string, productIds: string[]) => {
      try {
        logger.info('Action en lot sur produits', { action, count: productIds.length, productIds });
        const updates = action === 'activate' ? { is_active: true } : { is_active: false };
        await Promise.all(productIds.map(id => updateProduct(id, updates)));
        setSelectedProducts([]);
        await refetch();
        logger.info('Action en lot appliquée avec succès', { action, count: productIds.length });
        toast({
          title: 'Action appliquée',
          description: `${productIds.length} produit(s) ${action === 'activate' ? 'activé(s)' : 'désactivé(s)'}`,
        });
      } catch (_error: unknown) {
        const errorMessage = _error instanceof Error ? _error.message : 'Erreur inconnue';
        logger.error(
          _error instanceof Error ? _error : `Erreur lors de l'action en lot ${action}`,
          {
            error: _error,
            action,
            productIds,
          }
        );
        toast({
          title: 'Erreur',
          description:
            errorMessage ||
            `Impossible de ${action === 'activate' ? 'activer' : 'désactiver'} les produits`,
          variant: 'destructive',
        });
      }
    },
    [updateProduct, refetch, toast]
  );

  const handleToggleStatus = useCallback(
    async (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        try {
          const newStatus = !product.is_active;
          logger.info('Changement de statut du produit', {
            productId,
            oldStatus: product.is_active,
            newStatus,
          });
          await updateProduct(productId, { is_active: newStatus });
          await refetch();
          logger.info('Statut du produit modifié avec succès', { productId, newStatus });
          toast({
            title: product.is_active ? 'Produit désactivé' : 'Produit activé',
            description: `Le produit a été ${product.is_active ? 'désactivé' : 'activé'} avec succès`,
          });
        } catch (_error: unknown) {
          const errorMessage = _error instanceof Error ? _error.message : 'Erreur inconnue';
          logger.error(_error instanceof Error ? _error : 'Erreur lors du changement de statut', {
            error: _error,
            productId,
          });
          toast({
            title: 'Erreur',
            description: errorMessage || 'Impossible de modifier le statut du produit',
            variant: 'destructive',
          });
        }
      }
    },
    [products, updateProduct, refetch, toast]
  );

  const handleRefresh = useCallback(() => {
    logger.info('Actualisation de la liste des produits', {});
    refetch();
    toast({
      title: 'Actualisation',
      description: 'Liste des produits mise à jour',
    });
  }, [refetch, toast]);

  // Handlers génériques mémorisés pour les actions sur produits (utilisés dans map)
  const handleProductEdit = useCallback(
    (product: Product) => {
      // Navigate to edit page for all product types
      navigate(`/dashboard/products/${product.id}/edit`);
    },
    [navigate]
  );

  const handleDuplicateProduct = useCallback(
    async (productId: string) => {
      try {
        logger.info('Duplication du produit', { productId });
        const product = products.find(p => p.id === productId);
        if (!product) {
          logger.warn('Produit introuvable pour duplication', { productId });
          toast({
            title: t('common.error', 'Erreur'),
            description: t('products.notFound', 'Produit introuvable'),
            variant: 'destructive',
          });
          return;
        }

        // Créer le nouveau produit dupliqué
        const timestamp = Date.now();
        const newSlug = `${product.slug}-copie-${timestamp}`;

        const { data: duplicatedProduct, error } = await supabase
          .from('products')
          .insert({
            store_id: product.store_id,
            name: `${product.name} (copie)`,
            slug: newSlug,
            description: product.description,
            price: product.price,
            image_url: product.image_url,
            product_type: product.product_type,
            category: product.category,
            is_active: false, // Désactivé par défaut pour éviter les conflits
            stock_quantity: product.stock_quantity,
            sku: product.sku ? `${product.sku}-COPY-${timestamp}` : null,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        await refetch();
        logger.info('Produit dupliqué avec succès', {
          originalId: productId,
          newId: duplicatedProduct?.id,
        });

        toast({
          title: t('products.duplicate.success', '✅ Produit dupliqué'),
          description: t(
            'products.duplicate.successDescription',
            '"{{name}}" a été dupliqué. Le nouveau produit est désactivé par défaut.',
            { name: product.name }
          ),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error(
          error instanceof Error ? error : new Error('Erreur lors de la duplication du produit'),
          {
            error: errorMessage,
            productId,
          }
        );
        toast({
          title: t('common.error', '❌ Erreur'),
          description:
            errorMessage || t('products.duplicate.error', 'Impossible de dupliquer le produit'),
          variant: 'destructive',
        });
      }
    },
    [products, toast, refetch]
  );

  // Import CSV avec validation et batch processing optimisé
  const handleImportConfirmed = useCallback(
    async (
      validatedProducts: Product[],
      options?: { 
        onProgress?: (progress: { imported: number; total: number; percentage: number }) => void;
        onCancel?: () => boolean;
      }
    ) => {
      if (!store?.id) {
        toast({
          title: t('products.import.error', "Erreur d'import"),
          description: t('products.import.noStore', 'Aucun magasin disponible'),
          variant: 'destructive',
        });
        return;
      }

      const BATCH_SIZE = 20; // Nombre de produits par batch
      let successful = 0;
      let failed = 0;
      const total = validatedProducts.length;

      try {
        logger.info('Import CSV de produits avec batch processing', {
          count: validatedProducts.length,
          storeId: store.id,
          batchSize: BATCH_SIZE,
        });

        // Import par batch pour performance optimale
        for (let i = 0; i < validatedProducts.length; i += BATCH_SIZE) {
          // Vérifier si l'import a été annulé
          if (options?.onCancel && options.onCancel()) {
            logger.info('Import annulé par l\'utilisateur', { imported: successful, failed, total });
            break;
          }

          const batch = validatedProducts.slice(i, i + BATCH_SIZE);
          
          // Traiter le batch en parallèle
          const batchResults = await Promise.allSettled(
            batch.map(product =>
              createProduct({
                name: product.name,
                slug: product.slug,
                description: product.description || undefined,
                price: product.price,
                currency: product.currency || 'XOF',
                category: product.category || undefined,
                product_type: product.product_type || 'digital',
                image_url: product.image_url || undefined,
              })
            )
          );

          // Compter les succès et échecs
          batchResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
              successful++;
            } else {
              failed++;
            }
          });

          // Mettre à jour la progression
          if (options?.onProgress && (!options?.onCancel || !options.onCancel())) {
            options.onProgress({
              imported: successful,
              total,
              percentage: Math.round((successful / total) * 100),
            });
          }

          // Petit délai entre batches pour éviter surcharge DB
          if (i + BATCH_SIZE < validatedProducts.length && (!options?.onCancel || !options.onCancel())) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Rafraîchir la liste
        await refetch();

        if (failed > 0) {
          toast({
            title: t('products.import.partialSuccess', 'Import partiel'),
            description: t(
              'products.import.partialSuccessDescription',
              '{{successful}} produit(s) importé(s), {{failed}} échec(s)',
              { successful, failed }
            ),
            variant: 'default',
          });
        } else {
          toast({
            title: t('products.import.success', 'Import réussi'),
            description: t(
              'products.import.successDescription',
              '{{count}} produit(s) importé(s) avec succès',
              { count: successful }
            ),
          });
        }

        logger.info('Import CSV terminé', { successful, failed, total: validatedProducts.length });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error(error instanceof Error ? error : new Error("Erreur lors de l'import CSV"), {
          error: errorMessage,
          count: validatedProducts.length,
        });
        toast({
          title: t('products.import.error', "Erreur d'import"),
          description: t(
            'products.import.errorDescription',
            "Impossible d'importer les produits dans la base de données: {{error}}",
            { error: errorMessage }
          ),
          variant: 'destructive',
        });
        throw error; // Re-throw pour que le dialog puisse gérer l'erreur
      }
    },
    [store?.id, createProduct, refetch, toast, t]
  );

  // Export CSV
  const handleExportCSV = useCallback(() => {
    setExportingCSV(true);

    try {
      logger.info('Export CSV de produits', { count: filteredProducts.length });
      const headers = [
        'id',
        'name',
        'slug',
        'description',
        'price',
        'currency',
        'category',
        'product_type',
        'licensing_type',
        'license_terms',
        'is_active',
        'rating',
        'reviews_count',
        'created_at',
        'updated_at',
      ];

      // OPTIMISATION: Éviter .map().map() en utilisant une seule boucle
      const csvRows: string[] = [headers.join(',')];

      for (const product of filteredProducts) {
        const row: string[] = [];
        for (const header of headers) {
          const value = product[header as keyof Product];
          // Échapper les virgules et guillemets
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            row.push(`"${value.replace(/"/g, '""')}"`);
          } else {
            row.push(String(value ?? ''));
          }
        }
        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\n');

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

      logger.info('Export CSV réussi', { count: filteredProducts.length });
      toast({
        title: t('products.export.success', 'Export réussi'),
        description: t('products.export.successDescription', '{{count}} produit(s) exporté(s)', {
          count: filteredProducts.length,
        }),
      });
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : 'Erreur inconnue';
      logger.error(_error instanceof Error ? _error : "Erreur lors de l'export CSV", {
        error: _error,
        count: filteredProducts.length,
      });
      toast({
        title: t('products.export.error', "Erreur d'export"),
        description:
          errorMessage ||
          t('products.export.errorDescription', "Impossible d'exporter les produits"),
        variant: 'destructive',
      });
    } finally {
      setExportingCSV(false);
    }
  }, [filteredProducts, toast]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Réinitialiser la sélection lors du changement de page
    setSelectedProducts([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  }, []);

  if (storeLoading) {
    return (
      <MainLayout layoutType="products">
        <div 
          className="flex items-center justify-center min-h-[60vh]"
          role="status"
          aria-live="polite"
          aria-label={t('products.loadingProducts', 'Chargement des produits...')}
        >
          <div className="text-center">
            <Loader2 
              className="inline-block h-8 w-8 animate-spin text-primary" 
              aria-hidden="true"
            />
            <p className="mt-2 text-muted-foreground">{t('products.loadingProducts')}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!store) {
    return (
      <MainLayout layoutType="products">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <CardTitle>{t('products.createStoreFirst')}</CardTitle>
              <CardDescription>{t('products.createStoreDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/dashboard/store')}>
                {t('products.createMyStore')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout layoutType="products">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header avec animation - Style Inventaire et Mes Cours */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                  <Package
                    className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                    aria-hidden="true"
                  />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('products.title')}
                </span>
              </h1>
              <p className="text-sm sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                {t('products.subtitle', 'Gérez vos produits et vendez plus efficacement')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              className="min-h-[44px] h-11 sm:h-10 transition-all hover:scale-105 text-sm touch-manipulation"
              disabled={productsLoadingState}
              title="Actualiser (F5)"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${productsLoadingState ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">{t('products.refresh')}</span>
              <span className="sm:hidden">{t('products.refreshShort', 'Raf.')}</span>
            </Button>
            <Button
              onClick={() => navigate('/dashboard/products/new')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200 group hover:scale-105 active:scale-95 touch-manipulation min-h-[44px] text-xs sm:text-sm px-3 sm:px-4"
              aria-label={t('products.addNew')}
              size="sm"
              title="Nouveau produit (Cmd/Ctrl+N)"
            >
              <Plus
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 group-hover:rotate-90 transition-transform duration-200 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{t('products.addNew')}</span>
              <span className="sm:hidden">{t('products.addNewShort', '+ Ajouter')}</span>
            </Button>
          </div>
        </div>
        {/* États de chargement */}
        {productsLoadingState ? (
          <div 
            className="space-y-4"
            role="status"
            aria-live="polite"
            aria-label={t('products.loading', 'Chargement des produits...')}
          >
            <div className="sr-only">
              {t('products.loading', 'Chargement des produits...')}
            </div>
            <ProductGrid className="gap-3 sm:gap-4 lg:gap-6">
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </ProductGrid>
          </div>
        ) : products.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12 text-center">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 animate-in zoom-in duration-500" />
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold mb-1.5 sm:mb-2">
                {t('products.empty.title')}
              </h3>
              <p className="text-sm sm:text-xs md:text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4">
                {t('products.empty.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={() => navigate('/dashboard/products/new')}
                  size="lg"
                  className="min-h-[44px] touch-manipulation bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 group"
                >
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                  {t('products.add')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setImportDialogOpen(true)}
                  className="min-h-[44px] touch-manipulation hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('products.import')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Affichage des erreurs */}
            {productsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {productsError instanceof Error
                    ? productsError.message
                    : t('products.loadError', 'Erreur lors du chargement des produits')}
                </AlertDescription>
              </Alert>
            )}

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

            {/* Filtres avec animations - Desktop visible, Mobile dans drawer */}
            {/* Desktop: Filtres visibles */}
            <div
              ref={filtersRef}
              role="region"
              aria-label={t('products.filters.ariaLabel', 'Filtres de recherche')}
              className="hidden lg:block animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <ProductFiltersDashboard
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchInputRef={searchInputRef}
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
                totalProducts={products.length}
                activeProducts={activeProducts}
              />
            </div>

            {/* Mobile/Tablet: Bouton pour ouvrir drawer */}
            <div className="lg:hidden">
              <Sheet open={filtersDrawerOpen} onOpenChange={setFiltersDrawerOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px] touch-manipulation"
                    aria-label={t('products.filters.open', 'Ouvrir les filtres')}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    {t('products.filters.title', 'Filtres')}
                    {(category !== 'all' ||
                      productType !== 'all' ||
                      status !== 'all' ||
                      stockStatus !== 'all' ||
                      searchQuery) && (
                      <Badge variant="default" className="ml-2">
                        {
                          [
                            category !== 'all',
                            productType !== 'all',
                            status !== 'all',
                            stockStatus !== 'all',
                            searchQuery,
                          ].filter(Boolean).length
                        }
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{t('products.filters.title', 'Filtres de recherche')}</SheetTitle>
                    <SheetDescription>
                      {t(
                        'products.filters.description',
                        'Utilisez les filtres ci-dessous pour affiner votre recherche de produits'
                      )}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <ProductFiltersDashboard
                      searchQuery={searchQuery}
                      onSearchChange={value => {
                        setSearchQuery(value);
                        // Fermer le drawer après un court délai si recherche effectuée
                        if (value) {
                          setTimeout(() => setFiltersDrawerOpen(false), 500);
                        }
                      }}
                      searchInputRef={searchInputRef}
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
                      totalProducts={products.length}
                      activeProducts={activeProducts}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {filteredProducts.length === 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 animate-in zoom-in duration-500" />
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold mb-1.5 sm:mb-2">
                    {t('products.empty.noResults')}
                  </h3>
                  <p className="text-sm sm:text-xs md:text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4">
                    {t('products.empty.noResultsDescription')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setCategory('all');
                      setProductType('all');
                      setStatus('all');
                      setStockStatus('all');
                      setPriceRange([0, 1000000]);
                      setDateRange([null, null]);
                    }}
                    className="min-h-[44px] touch-manipulation hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {t('common.clearFilters', 'Effacer les filtres')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Barre d'actions avec design amélioré pour mobile */}
                <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 w-full sm:w-auto">
                      {paginatedProducts.length > 0 && (
                        <Checkbox
                          checked={
                            selectedProducts.length === paginatedProducts.length &&
                            paginatedProducts.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label={t('products.selectAll', 'Sélectionner tous les produits')}
                          className="transition-all duration-200 flex-shrink-0 min-h-[44px] min-w-[44px] touch-manipulation"
                        />
                      )}
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-medium text-foreground break-words">
                          {t('products.found', '{{count}} produit trouvé', {
                            count: filteredProducts.length,
                          })}
                        </p>
                        {selectedProducts.length > 0 && (
                          <Badge
                            variant="default"
                            className="animate-in zoom-in-95 duration-200 shadow-sm text-xs sm:text-sm flex-shrink-0 px-2 sm:px-3 py-1"
                          >
                            {t('products.selected', '{{count}} sélectionné', {
                              count: selectedProducts.length,
                            })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImportDialogOpen(true)}
                      className="flex-1 sm:flex-initial hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[44px] text-xs sm:text-sm"
                    >
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="hidden sm:inline">{t('products.import', 'Importer')}</span>
                      <span className="sm:hidden">{t('products.importShort', 'Import')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      disabled={exportingCSV || filteredProducts.length === 0}
                      className="flex-1 sm:flex-initial hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] text-xs sm:text-sm"
                    >
                      {exportingCSV ? (
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin flex-shrink-0" />
                      ) : (
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      )}
                      <span className="hidden sm:inline">{t('products.export', 'Exporter')}</span>
                      <span className="sm:hidden">{t('products.exportShort', 'Export')}</span>
                    </Button>
                  </div>
                </div>

                <div
                  ref={productsRef}
                  role="region"
                  aria-label={t('products.list.ariaLabel', 'Liste des produits')}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  {/* Utiliser VirtualizedList pour les grandes listes (20+ produits) */}
                  {paginatedProducts.length >= 20 ? (
                    <VirtualizedList
                      count={paginatedProducts.length}
                      renderItem={index => {
                        const product = paginatedProducts[index];
                        if (!product) return null;

                        return (
                          <ProductListView
                            key={product.id}
                            product={product}
                            storeSlug={store.slug}
                            onEdit={() => handleProductEdit(product)}
                            onDelete={() => setDeletingProductId(product.id)}
                            onToggleStatus={() => handleToggleStatus(product.id)}
                            onDuplicate={() => handleDuplicateProduct(product.id)}
                            onQuickView={() => setQuickViewProduct(product)}
                            isSelected={selectedProducts.includes(product.id)}
                            onSelect={selected => {
                              if (selected) {
                                setSelectedProducts([...selectedProducts, product.id]);
                              } else {
                                setSelectedProducts(
                                  selectedProducts.filter(id => id !== product.id)
                                );
                              }
                            }}
                          />
                        );
                      }}
                      loading={productsLoadingState}
                      loadingCount={itemsPerPage}
                      estimateSize={isMobile ? 150 : 180}
                      itemClassName="space-y-3 sm:space-y-4"
                      emptyMessage={t('products.noProducts', 'Aucun produit trouvé')}
                    />
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {paginatedProducts.map((product, index) => (
                        <div
                          key={product.id}
                          className="animate-in fade-in slide-in-from-left-2"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <ProductListView
                            product={product}
                            storeSlug={store.slug}
                            onEdit={() => handleProductEdit(product)}
                            onDelete={() => setDeletingProductId(product.id)}
                            onToggleStatus={() => handleToggleStatus(product.id)}
                            onDuplicate={() => handleDuplicateProduct(product.id)}
                            onQuickView={() => setQuickViewProduct(product)}
                            isSelected={selectedProducts.includes(product.id)}
                            onSelect={selected => {
                              if (selected) {
                                setSelectedProducts([...selectedProducts, product.id]);
                              } else {
                                setSelectedProducts(
                                  selectedProducts.filter(id => id !== product.id)
                                );
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination avec design amélioré */}
                {totalPages > 1 && (
                  <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <CardContent className="p-3 sm:p-4">
                      <nav
                        className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4"
                        role="navigation"
                        aria-label={t('products.pagination.ariaLabel', 'Navigation des pages')}
                      >
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap justify-center sm:justify-start">
                          <label htmlFor="items-per-page" className="sr-only">
                            {t('products.pagination.itemsPerPage')}
                          </label>
                          <span className="hidden sm:inline">
                            {t('products.pagination.displaying', 'Affichage de')}
                          </span>
                          <select
                            id="items-per-page"
                            value={itemsPerPage}
                            onChange={e => handleItemsPerPageChange(Number(e.target.value))}
                            className="px-3 py-2.5 min-h-[44px] border rounded-md bg-background text-sm hover:bg-accent/50 transition-colors duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-1 touch-manipulation"
                            aria-label={t('products.pagination.selectItemsPerPage')}
                          >
                            {PAGINATION_OPTIONS.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <span className="hidden sm:inline">
                            {t('products.pagination.perPage', 'produits par page')}
                          </span>
                          <span className="sm:hidden">/ page</span>
                        </div>

                        <div
                          className="flex items-center gap-1 sm:gap-2"
                          role="group"
                          aria-label={t('products.pagination.controls')}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            aria-label={t('products.pagination.firstPage', 'Première page')}
                            className="min-h-[44px] min-w-[44px] h-11 w-11 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40"
                          >
                            <ChevronsLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label={t('products.pagination.previousPage', 'Page précédente')}
                            className="min-h-[44px] min-w-[44px] h-11 w-11 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40"
                          >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                          </Button>

                          <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 flex-wrap justify-center">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNumber: number;
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
                                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNumber)}
                                  className="min-h-[44px] min-w-[44px] h-10 w-10 sm:h-11 sm:w-11 transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm"
                                  aria-label={t(
                                    'products.pagination.goToPage',
                                    'Aller à la page {{page}}',
                                    { page: pageNumber }
                                  )}
                                  aria-current={currentPage === pageNumber ? 'page' : undefined}
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
                            className="min-h-[44px] min-w-[44px] h-11 w-11 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40"
                          >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            aria-label={t('products.pagination.lastPage', 'Dernière page')}
                            className="min-h-[44px] min-w-[44px] h-11 w-11 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40"
                          >
                            <ChevronsRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                          </Button>
                        </div>

                        <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                          {t('products.pagination.pageInfo', 'Page {{current}} sur {{total}}', {
                            current: currentPage,
                            total: totalPages,
                          })}
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

      {/* Delete Product Dialog */}
      <AlertDialog
        open={!!deletingProductId}
        onOpenChange={open => !open && setDeletingProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('products.delete.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('products.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
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
        <Dialog open={!!quickViewProduct} onOpenChange={open => !open && setQuickViewProduct(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
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
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1.5 sm:mb-2">
                  {quickViewProduct.name}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={quickViewProduct.is_active ? 'default' : 'secondary'}>
                    {quickViewProduct.is_active
                      ? t('products.status.active', 'Actif')
                      : t('products.status.inactive', 'Inactif')}
                  </Badge>
                  <Badge variant="outline">{quickViewProduct.product_type}</Badge>
                  {quickViewProduct.category && (
                    <Badge variant="secondary">{quickViewProduct.category}</Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">{t('products.price', 'Prix')}</h4>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                  {quickViewProduct.price.toLocaleString()} {quickViewProduct.currency || 'FCFA'}
                </p>
              </div>

              {quickViewProduct.description && (
                <div>
                  <h4 className="font-semibold mb-2">{t('products.description', 'Description')}</h4>
                  <div
                    className="prose prose-sm max-w-none 
                      text-foreground 
                      prose-headings:text-foreground 
                      prose-p:text-foreground 
                      prose-li:text-foreground
                      prose-strong:text-foreground 
                      prose-em:text-foreground
                      prose-a:text-primary 
                      prose-code:text-foreground
                      [&_*]:text-foreground"
                    style={{ color: 'inherit' }}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeProductDescription(quickViewProduct.description),
                    }}
                  />
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {t('products.averageRating', 'Note moyenne')}
                  </span>
                  <p className="font-medium">{quickViewProduct.rating}/5</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('products.reviews', 'Avis')}</span>
                  <p className="font-medium">
                    {t('products.reviewsCount', '{{count}} avis', {
                      count: quickViewProduct.reviews_count,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t('products.createdAt', 'Créé le')}
                  </span>
                  <p className="font-medium">
                    {new Date(quickViewProduct.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t('products.updatedAt', 'Modifié le')}
                  </span>
                  <p className="font-medium">
                    {new Date(quickViewProduct.updated_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setQuickViewProduct(null)}>
                {t('common.close', 'Fermer')}
              </Button>
              <Button
                onClick={() => {
                  setQuickViewProduct(null);
                  handleProductEdit(quickViewProduct);
                }}
              >
                {t('products.edit.title', 'Modifier le produit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
};

export default Products;
