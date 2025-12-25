import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStats } from '@/hooks/useAdminStats';
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

interface StoreData {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  created_at: string;
  owner_name?: string;
  products_count?: number;
}

const AdminStores = () => {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { deleteStore } = useAdminActions();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  const fetchStores = useCallback(async () => {
    logger.info('Chargement des boutiques admin');
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const storesWithDetails = await Promise.all(
        (data || []).map(async store => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', store.user_id)
            .limit(1);

          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id);

          return {
            ...store,
            owner_name:
              profileData && profileData.length > 0
                ? profileData[0].display_name || 'Inconnu'
                : 'Inconnu',
            products_count: count || 0,
          };
        })
      );

      setStores(storesWithDetails);
      logger.info(`${storesWithDetails.length} boutiques chargées`);
    } catch (error: unknown) {
      logger.error('Erreur lors du chargement des boutiques:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const filteredStores = useMemo(
    () =>
      stores.filter(
        store =>
          store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [stores, searchTerm]
  );

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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
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
              {stores.length} boutique{stores.length > 1 ? 's' : ''} créée
              {stores.length > 1 ? 's' : ''}
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
            {filteredStores.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Aucune boutique trouvée</div>
            ) : isMobile ? (
              <MobileTableCard
                data={filteredStores}
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
                        {new Date(value).toLocaleDateString('fr-FR')}
                      </span>
                    ),
                  },
                ]}
                actions={row => (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/stores/${row.slug}`)}
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
                  {filteredStores.map(store => (
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
                            onClick={() => navigate(`/stores/${store.slug}`)}
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
