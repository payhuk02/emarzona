import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminActions } from '@/hooks/useAdminActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
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
  Package,
  Search,
  Trash2,
  AlertTriangle,
  Eye,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ProtectedAction } from '@/components/admin/ProtectedAction';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_PRODUCT_PAGE_SIZES,
  DEFAULT_ADMIN_PRODUCT_PAGE_SIZE,
} from '@/lib/admin/admin-products-query';
import { useAdminProductsList } from '@/hooks/useAdminProducts';

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_ADMIN_PRODUCT_PAGE_SIZE);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { deleteProduct, toggleProductStatus } = useAdminActions();
  const navigate = useNavigate();
  const { isAAL2 } = useAdminMFA();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const { data: pageData, isLoading } = useAdminProductsList({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const products = pageData?.rows ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const refreshProducts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  if (isLoading && !pageData) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>

        <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          <Admin2FABanner />
          <div
            ref={headerRef}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            role="banner"
          >
            <div>
              <h1
                className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"
                id="admin-products-title"
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                  <Package
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-purple-500 dark:text-purple-400"
                    aria-hidden="true"
                  />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Gestion des produits
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                {totalCount} produit{totalCount > 1 ? 's' : ''} sur la plateforme
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
                Liste des produits
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                Gérer tous les produits de la plateforme (pagination serveur)
              </CardDescription>
              <div className="relative mt-3 sm:mt-4">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou boutique (min. 2 caractères)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 min-h-[44px] text-xs sm:text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div ref={tableRef} role="region" aria-label="Tableau des produits">
                {isMobile ? (
                  <MobileTableCard
                    data={products.map(product => ({
                      ...product,
                      store_name: product.stores?.name ?? 'Inconnu',
                    }))}
                    columns={[
                      { key: 'name', label: 'Nom', priority: 'high' },
                      { key: 'store_name', label: 'Boutique', priority: 'high' },
                      {
                        key: 'price',
                        label: 'Prix',
                        priority: 'high',
                        render: value => formatCurrency(value),
                      },
                      {
                        key: 'is_active',
                        label: 'Statut',
                        priority: 'high',
                        render: value => (
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? 'Actif' : 'Inactif'}
                          </Badge>
                        ),
                      },
                      {
                        key: 'created_at',
                        label: 'Date de création',
                        priority: 'medium',
                        render: value => new Date(value).toLocaleDateString('fr-FR'),
                      },
                    ]}
                    actions={product => (
                      <div className="flex flex-wrap gap-2">
                        <ProtectedAction permission="products.manage">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isAAL2}
                            onClick={async () => {
                              if (!isAAL2) return;
                              const success = await toggleProductStatus(
                                product.id,
                                product.is_active
                              );
                              if (success) await refreshProducts();
                            }}
                            className="w-full sm:w-auto"
                          >
                            {product.is_active ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-1" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-1" />
                                Activer
                              </>
                            )}
                          </Button>
                        </ProtectedAction>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/products/${product.id}`)}
                          className="w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <ProtectedAction permission="products.delete">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={!isAAL2}
                            onClick={() => {
                              if (!isAAL2) return;
                              setSelectedProduct(product.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </ProtectedAction>
                      </div>
                    )}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-[720px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Boutique</TableHead>
                          <TableHead>Prix</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date de création</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map(product => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.stores?.name ?? 'Inconnu'}</TableCell>
                            <TableCell>{formatCurrency(product.price, product.currency)}</TableCell>
                            <TableCell>
                              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                {product.is_active ? 'Actif' : 'Inactif'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(product.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <ProtectedAction permission="products.manage">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!isAAL2}
                                            onClick={async () => {
                                              if (!isAAL2) return;
                                              const success = await toggleProductStatus(
                                                product.id,
                                                product.is_active
                                              );
                                              if (success) await refreshProducts();
                                            }}
                                          >
                                            {product.is_active ? (
                                              <>
                                                <PowerOff className="h-4 w-4 mr-1" />
                                                Désactiver
                                              </>
                                            ) : (
                                              <>
                                                <Power className="h-4 w-4 mr-1" />
                                                Activer
                                              </>
                                            )}
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      {!isAAL2 && (
                                        <TooltipContent>
                                          Activez la 2FA pour utiliser cette action
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </ProtectedAction>
                                <ProtectedAction permission="products.manage">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={!isAAL2}
                                            onClick={() => {
                                              if (!isAAL2) return;
                                              setSelectedProduct(product.id);
                                              setDeleteDialogOpen(true);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      {!isAAL2 && (
                                        <TooltipContent>
                                          Activez la 2FA pour utiliser cette action
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </ProtectedAction>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {products.length === 0 && !isLoading && (
                  <div
                    className="text-center py-12 text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    Aucun produit trouvé
                  </div>
                )}

                {totalCount > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {from}–{to} sur {totalCount} produits
                    </p>
                    <div className="flex items-center gap-2">
                      <Select
                        value={pageSize.toString()}
                        onValueChange={value => {
                          setPageSize(Number(value));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIN_PRODUCT_PAGE_SIZES.map(size => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} / page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page <= 1}
                        onClick={() => setPage(1)}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm px-2">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page >= totalPages}
                        onClick={() => setPage(totalPages)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirmer la suppression
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le produit sera définitivement supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (selectedProduct) {
                      const success = await deleteProduct(selectedProduct);
                      if (success) {
                        setDeleteDialogOpen(false);
                        setSelectedProduct(null);
                        await refreshProducts();
                      }
                    }
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Supprimer définitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

    </AdminLayout>
  );
};

export default AdminProducts;
