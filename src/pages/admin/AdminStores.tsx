import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAdminActions } from '@/hooks/useAdminActions';
import { generateStoreUrl } from '@/lib/store-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Store, Search, Trash2, AlertTriangle, Eye } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import { useAdminStores, type StoreProfile } from '@/hooks/useAdminStores';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

const ADMIN_STORE_PAGE_SIZES = [10, 20, 50, 100];


const AdminStores = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { headerRef } = useScrollAnimation();
  const isMobile = useIsMobile();
  const { deleteStore } = useAdminActions();

  const { stores, totalCount, loading, refetch: fetchStores } = useAdminStores({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header avec animation - Style Inventory */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div>
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                <Store
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                  aria-hidden="true"
                />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Gestion des boutiques
              </span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              {totalCount} boutique{totalCount > 1 ? 's' : ''} créée{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des boutiques</CardTitle>
            <CardDescription>Gérer toutes les boutiques de la plateforme</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou propriétaire..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 min-h-[44px]"
              />
            </div>
          </CardHeader>
          <CardContent>
            {stores.length === 0 && !loading ? (
              <div className="text-center py-12 text-muted-foreground">Aucune boutique trouvée</div>
            ) : isMobile ? (
              <MobileTableCard
                data={stores}
                columns={[
                  {
                    key: 'name',
                    header: 'Nom',
                    priority: 'high',
                    className: 'font-medium',
                  },
                  {
                    key: 'owner_name',
                    header: 'Propriétaire',
                    priority: 'high',
                  },
                  {
                    key: 'products_count',
                    header: 'Produits',
                    priority: 'medium',
                  },
                  {
                    key: 'created_at',
                    header: 'Date de création',
                    priority: 'medium',
                    render: value => (
                      <span className="text-muted-foreground">
                        {new Date(value as string).toLocaleDateString('fr-FR')}
                      </span>
                    ),
                  },
                ]}
                actions={row => (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generateStoreUrl(row.slug, row.slug), '_blank')}
                      className="min-h-[44px] min-w-[44px]"
                      aria-label="Voir la boutique"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedStore(row.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="min-h-[44px] min-w-[44px]"
                      aria-label="Supprimer la boutique"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map(store => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>{store.owner_name}</TableCell>
                      <TableCell>{store.products_count}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(store.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(generateStoreUrl(store.slug, store.slug), '_blank')}
                            className="min-h-[44px] min-w-[44px] sm:min-w-auto"
                            aria-label="Voir la boutique"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Voir</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedStore(store.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="min-h-[44px] min-w-[44px]"
                            aria-label="Supprimer la boutique"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {from}–{to} sur {totalCount} boutiques
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
                      {ADMIN_STORE_PAGE_SIZES.map(size => (
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
                Cette action est irréversible. Tous les produits et données de cette boutique seront
                supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (selectedStore) {
                    const success = await deleteStore(selectedStore);
                    if (success) {
                      setDeleteDialogOpen(false);
                      setSelectedStore(null);
                      await fetchStores();
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

export default AdminStores;
