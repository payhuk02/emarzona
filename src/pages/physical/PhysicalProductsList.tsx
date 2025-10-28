/**
 * Physical Products List Page
 * Date: 28 octobre 2025
 * 
 * Page de gestion des produits physiques (vendeurs)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { usePhysicalProducts, useDeletePhysicalProduct } from '@/hooks/physical/usePhysicalProducts';
import { useLowStockAlerts, useInventoryValue } from '@/hooks/physical/useInventory';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus,
  Search,
  Package,
  TrendingUp,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { PhysicalProductsGrid, InventoryStats, LowStockAlert } from '@/components/physical';
import { useToast } from '@/hooks/use-toast';

export const PhysicalProductsList = () => {
  const navigate = useNavigate();
  const { store } = useStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const { data: products, isLoading } = usePhysicalProducts(store?.id);
  const { data: lowStockAlerts } = useLowStockAlerts(store?.id || '');
  const { data: inventoryValue } = useInventoryValue(store?.id || '');
  const deleteProduct = useDeletePhysicalProduct();

  /**
   * Filter products
   */
  const filteredProducts = products?.filter((p) => {
    const matchesSearch = p.product?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && p.product?.is_active) ||
      (filterStatus === 'inactive' && !p.product?.is_active);

    return matchesSearch && matchesStatus;
  });

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    if (!deleteProductId) return;

    try {
      await deleteProduct.mutateAsync(deleteProductId);
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès',
      });
      setDeleteProductId(null);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
        variant: 'destructive',
      });
    }
  };

  /**
   * Calculate stats
   */
  const lowStockCount = lowStockAlerts?.filter((a) => a.alert_type === 'low_stock').length || 0;
  const outOfStockCount = lowStockAlerts?.filter((a) => a.alert_type === 'out_of_stock').length || 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Produits Physiques</h1>
                <p className="text-muted-foreground mt-1">
                  Gérez votre inventaire et vos expéditions
                </p>
              </div>

              <Button onClick={() => navigate('/products/create?type=physical')}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau produit
              </Button>
            </div>

            {/* Stats Cards */}
            <InventoryStats
              totalItems={inventoryValue?.total_items || 0}
              totalValue={inventoryValue?.total_value || 0}
              lowStockCount={lowStockCount}
              outOfStockCount={outOfStockCount}
            />

            {/* Low Stock Alerts */}
            {lowStockAlerts && lowStockAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Alertes de stock ({lowStockAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lowStockAlerts.slice(0, 5).map((alert, index) => (
                    <LowStockAlert
                      key={index}
                      productName={alert.product_name}
                      sku={alert.sku}
                      quantity={alert.quantity_available}
                      reorderPoint={alert.reorder_point}
                    />
                  ))}
                  {lowStockAlerts.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      + {lowStockAlerts.length - 5} autres alertes
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtrer & Rechercher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Status filter */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">
                  Tous ({filteredProducts?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="low-stock">
                  Stock faible ({lowStockCount})
                </TabsTrigger>
                <TabsTrigger value="out-of-stock">
                  Rupture ({outOfStockCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <PhysicalProductsGrid
                  products={filteredProducts || []}
                  loading={isLoading}
                  onEdit={(id) => navigate(`/dashboard/products/${id}/edit`)}
                  onDelete={(id) => setDeleteProductId(id)}
                />
              </TabsContent>

              <TabsContent value="low-stock" className="mt-6">
                <div className="space-y-4">
                  {lowStockAlerts
                    ?.filter((a) => a.alert_type === 'low_stock')
                    .map((alert, index) => (
                      <LowStockAlert
                        key={index}
                        productName={alert.product_name}
                        sku={alert.sku}
                        quantity={alert.quantity_available}
                        reorderPoint={alert.reorder_point}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="out-of-stock" className="mt-6">
                <div className="space-y-4">
                  {lowStockAlerts
                    ?.filter((a) => a.alert_type === 'out_of_stock')
                    .map((alert, index) => (
                      <LowStockAlert
                        key={index}
                        productName={alert.product_name}
                        sku={alert.sku}
                        quantity={alert.quantity_available}
                        reorderPoint={alert.reorder_point}
                      />
                    ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est
                    irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PhysicalProductsList;

