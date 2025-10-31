import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminActions } from '@/hooks/useAdminActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { Package, Search, Trash2, AlertTriangle, Eye, Power, PowerOff } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ProtectedAction } from '@/components/admin/ProtectedAction';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RequireAAL2 } from '@/components/admin/RequireAAL2';

interface ProductData {
  id: string;
  name: string;
  price: number;
  currency: string;
  is_active: boolean;
  store_id: string;
  created_at: string;
  store_name?: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { deleteProduct, toggleProductStatus } = useAdminActions();
  const navigate = useNavigate();
  const { isAAL2 } = useAdminMFA();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  const fetchProducts = useCallback(async () => {
    logger.info('Chargement des produits admin');
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          stores!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productsWithStore = (data || []).map(product => ({
        ...product,
        store_name: product.stores?.[0]?.name || 'Inconnu',
      }));

      setProducts(productsWithStore);
      logger.info(`${productsWithStore.length} produits chargés`);
    } catch (error: any) {
      logger.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.store_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [products, searchTerm]);

  if (loading) {
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
      <RequireAAL2>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <Admin2FABanner />
        <div ref={headerRef} className="flex items-center justify-between" role="banner">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent" id="admin-products-title">
              Gestion des produits
            </h1>
            <p className="text-muted-foreground mt-2">
              {products.length} produit{products.length > 1 ? 's' : ''} sur la plateforme
            </p>
          </div>
          <Package className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des produits</CardTitle>
            <CardDescription>Gérer tous les produits de la plateforme</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou boutique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div ref={tableRef} role="region" aria-label="Tableau des produits">
              <Table>
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
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.store_name}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
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
                                      await toggleProductStatus(product.id, product.is_active);
                                      fetchProducts();
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
                                <TooltipContent>Activez la 2FA pour utiliser cette action</TooltipContent>
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
                                <TooltipContent>Activez la 2FA pour utiliser cette action</TooltipContent>
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
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">
                Aucun produit trouvé
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
                    await deleteProduct(selectedProduct);
                    fetchProducts();
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
      </RequireAAL2>
    </AdminLayout>
  );
};

export default AdminProducts;
