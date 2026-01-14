/**
 * Page de Gestion Complète des Bundles de Produits Digitaux
 * Date: 31 Janvier 2025
 * 
 * Interface complète pour gérer les bundles avec création, édition, suppression
 * et gestion des licences multiples
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Download,
  Sparkles,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import {
  useDigitalBundles,
  useDeleteBundle,
  useDigitalBundle,
  useCreateBundle,
  useUpdateBundle,
  type DigitalProductBundle,
} from '@/hooks/digital/useDigitalBundles';
import { DigitalBundleManager } from '@/components/digital/DigitalBundleManager';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

export default function DigitalBundlesManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const { data: bundles = [], isLoading: bundlesLoading } = useDigitalBundles(store?.id);
  const deleteBundle = useDeleteBundle();
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [deletingBundleId, setDeletingBundleId] = useState<string | null>(null);

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les produits digitaux pour le formulaire
  const { data: digitalProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['store-digital-products-for-bundles', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, currency, image_url, category, is_active, is_draft')
        .eq('store_id', store.id)
        .eq('product_type', 'digital')
        .eq('is_active', true)
        .eq('is_draft', false)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching digital products', { error, storeId: store.id });
        throw error;
      }

      interface ProductData {
        id: string;
        name?: string;
        description?: string;
        price?: number;
        currency?: string;
        category?: string;
        image_url?: string;
        is_active?: boolean;
        is_draft?: boolean;
      }
      return (data || []).map((p: ProductData) => ({
        id: p.id,
        name: p.name || 'Produit sans nom',
        description: p.description,
        price: p.price || 0,
        currency: p.currency || 'XOF',
        category: p.category || 'Autre',
        thumbnail: p.image_url,
        isAvailable: p.is_active !== false && p.is_draft !== true,
      }));
    },
    enabled: !!store?.id,
  });

  // Bundle en cours d'édition
  const { data: editingBundle } = useDigitalBundle(editingBundleId || undefined);

  // Filtrer les bundles
  const filteredBundles = useMemo(() => {
    let  filtered= bundles;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter((bundle) => {
        if (statusFilter === 'active') return bundle.is_active && !bundle.is_draft;
        if (statusFilter === 'inactive') return !bundle.is_active;
        if (statusFilter === 'draft') return bundle.is_draft;
        return true;
      });
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bundle) =>
          bundle.name.toLowerCase().includes(query) ||
          bundle.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [bundles, statusFilter, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: bundles.length,
      active: bundles.filter((b) => b.is_active && !b.is_draft).length,
      inactive: bundles.filter((b) => !b.is_active).length,
      draft: bundles.filter((b) => b.is_draft).length,
      totalSales: bundles.reduce((sum, b) => sum + b.total_sales, 0),
      totalRevenue: bundles.reduce((sum, b) => sum + b.total_revenue, 0),
      featured: bundles.filter((b) => b.is_featured).length,
    };
  }, [bundles]);

  // Handlers
  const handleCreateBundle = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditBundle = (bundleId: string) => {
    setEditingBundleId(bundleId);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteBundle = async (bundleId: string) => {
    try {
      await deleteBundle.mutateAsync(bundleId);
      setDeletingBundleId(null);
      toast({
        title: '✅ Bundle supprimé',
        description: 'Le bundle a été supprimé avec succès',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer le bundle',
        variant: 'destructive',
      });
    }
  };

  const handleViewBundle = (bundleId: string) => {
    const bundle = bundles.find((b) => b.id === bundleId);
    if (bundle?.slug) {
      navigate(`/bundles/${bundle.slug}`);
    }
  };

  const handleSaveBundle = async (bundleData: { name: string; description: string; productIds: string[]; discountType: string; discountValue: number; originalTotalPrice?: number; discountedPrice?: number }) => {
    if (!store?.id) {
      toast({
        title: 'Erreur',
        description: 'Boutique non trouvée',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingBundleId && editingBundle) {
        // Mise à jour
        await updateBundle.mutateAsync({
          bundleId: editingBundleId,
          updates: {
            name: bundleData.name,
            description: bundleData.description,
            short_description: bundleData.description?.substring(0, 200),
            bundle_price: bundleData.discountedPrice || bundleData.bundle_price || 0,
            discount_percentage:
              bundleData.discountType === 'percentage' ? bundleData.discountValue : null,
            digital_product_ids: bundleData.productIds || [],
            is_active: bundleData.isActive,
            is_draft: !bundleData.isActive,
          },
        });
      } else {
        // Création
        const { generateSlug } = await import('@/lib/store-utils');
        const slug = generateSlug(bundleData.name);

        await createBundle.mutateAsync({
          store_id: store.id,
          name: bundleData.name,
          slug,
          description: bundleData.description,
          short_description: bundleData.description?.substring(0, 200),
          bundle_price: bundleData.discountedPrice || 0,
          currency: 'XOF',
          digital_product_ids: bundleData.productIds || [],
        });
      }

      setIsCreateDialogOpen(false);
      setEditingBundleId(null);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Les erreurs sont gérées par les hooks
      logger.error('Error saving bundle', { error, bundleData });
    }
  };

  const handleCancelEdit = () => {
    setIsCreateDialogOpen(false);
    setEditingBundleId(null);
  };

  // Formatage
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (storeLoading || bundlesLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion des Bundles
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Créez et gérez vos packs de produits digitaux
                </p>
              </div>
              <Button onClick={handleCreateBundle} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Bundle
              </Button>
            </div>

            {/* Statistiques */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Actifs</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Ventes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalSales}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Revenus</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {formatPrice(stats.totalRevenue)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtres */}
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrer & Rechercher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un bundle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="active">Actifs</TabsTrigger>
                      <TabsTrigger value="inactive">Inactifs</TabsTrigger>
                      <TabsTrigger value="draft">Brouillons</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Liste des bundles */}
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CardHeader>
                <CardTitle>Bundles ({filteredBundles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredBundles.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Aucun bundle ne correspond à vos critères'
                        : 'Aucun bundle créé'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button onClick={handleCreateBundle}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer votre premier bundle
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bundle</TableHead>
                          <TableHead>Produits</TableHead>
                          <TableHead>Prix</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Ventes</TableHead>
                          <TableHead>Revenus</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBundles.map((bundle) => (
                          <TableRow key={bundle.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {bundle.image_url ? (
                                  <img
                                    src={bundle.image_url}
                                    alt={bundle.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{bundle.name}</div>
                                  {bundle.description && (
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {bundle.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {bundle.digital_product_ids?.length || 0} produits
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">{formatPrice(bundle.bundle_price)}</div>
                              {bundle.promotional_price && (
                                <div className="text-xs text-muted-foreground line-through">
                                  {formatPrice(bundle.promotional_price)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {bundle.is_draft ? (
                                  <Badge variant="outline">Brouillon</Badge>
                                ) : bundle.is_active ? (
                                  <Badge variant="default" className="bg-green-600">
                                    Actif
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Inactif</Badge>
                                )}
                                {bundle.is_featured && (
                                  <Badge variant="outline" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Vedette
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span>{bundle.total_sales || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                {formatPrice(bundle.total_revenue || 0)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Select>
                                <SelectTrigger
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </SelectTrigger>
                                <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                  <SelectItem value="edit" onSelect onSelect={() => handleViewBundle(bundle.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir
                                  </SelectItem>
                                  <SelectItem value="delete" onSelect onSelect={() => handleEditBundle(bundle.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Éditer
                                  </SelectItem>
                                  <SelectItem value="copy" onSelect
                                    onSelect={() => setDeletingBundleId(bundle.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dialog Création/Édition */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBundleId ? 'Éditer le Bundle' : 'Créer un Bundle'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBundleId
                      ? 'Modifiez les informations du bundle'
                      : 'Créez un nouveau bundle de produits digitaux'}
                  </DialogDescription>
                </DialogHeader>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Skeleton className="h-96 w-full" />
                  </div>
                ) : (
                  <DigitalBundleManager
                    bundle={
                      editingBundle
                        ? {
                            id: editingBundle.id,
                            name: editingBundle.name,
                            description: editingBundle.description || '',
                            productIds: editingBundle.digital_product_ids || [],
                            discountType:
                              editingBundle.discount_percentage && editingBundle.discount_percentage > 0
                                ? 'percentage'
                                : 'none',
                            discountValue: editingBundle.discount_percentage || 0,
                            isActive: editingBundle.is_active,
                            thumbnail: editingBundle.image_url,
                          }
                        : undefined
                    }
                    availableProducts={digitalProducts}
                    onSave={handleSaveBundle}
                    onCancel={handleCancelEdit}
                    mode={editingBundleId ? 'edit' : 'create'}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Dialog Suppression */}
            <AlertDialog
              open={!!deletingBundleId}
              onOpenChange={(open) => !open && setDeletingBundleId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce bundle ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le bundle sera définitivement supprimé ainsi que
                    toutes ses statistiques.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onSelect={() => deletingBundleId && handleDeleteBundle(deletingBundleId)}
                    className="bg-red-600 hover:bg-red-700"
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
}







