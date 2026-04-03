/**
 * Page de Gestion des Lots et Expiration
 * Date: 31 Janvier 2025
 * 
 * Interface complète pour gérer :
 * - Les lots de produits physiques
 * - Les dates d'expiration
 * - Les alertes d'expiration
 * - La rotation des stocks (FIFO/LIFO/FEFO)
 * - Les mouvements de lots
 */

import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  PackageX,
  Calendar,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStore';
import type { ProductLot, LotMovement } from '@/hooks/physical/useLotsExpiration';

export default function PhysicalProductsLotsManagement() {
  const { productId } = useParams<{ productId?: string }>();
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedTab, setSelectedTab] = useState<'lots' | 'alerts' | 'movements'>('lots');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<ProductLot | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lotForm, setLotForm] = useState({
    physical_product_id: productId || '',
    variant_id: '',
    warehouse_id: '',
    lot_number: '',
    batch_number: '',
    serial_number: '',
    manufacturing_date: '',
    expiration_date: '',
    best_before_date: '',
    initial_quantity: '',
    unit_cost: '',
    rotation_method: 'FIFO' as 'FIFO' | 'LIFO' | 'FEFO' | 'manual',
    quality_status: 'good' as 'good' | 'acceptable' | 'poor' | 'rejected',
    bin_location: '',
    shelf_location: '',
    supplier_batch_number: '',
    notes: '',
  });

  // Fetch product lots
  const { data: lots = [], isLoading: lotsLoading } = useQuery({
    queryKey: ['product-lots', store?.id, productId, statusFilter],
    queryFn: async (): Promise<ProductLot[]> => {
      if (!store?.id) return [];

      let  query= supabase
        .from('product_lots')
        .select(`
          *,
          physical_products!inner (
            id,
            name,
            store_id
          )
        `)
        .eq('physical_products.store_id', store.id);

      if (productId) {
        query = query.eq('physical_product_id', productId);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('expiration_date', { ascending: true });

      if (error) {
        logger.error('Error fetching product lots', { error });
        throw error;
      }

      return (data || []) as ProductLot[];
    },
    enabled: !!store?.id,
  });

  // Fetch expiration alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['expiration-alerts', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      const { data, error } = await supabase
        .from('expiration_alerts')
        .select(`
          *,
          product_lots!inner (
            id,
            lot_number,
            expiration_date,
            current_quantity,
            physical_products!inner (
              id,
              name,
              store_id
            )
          )
        `)
        .eq('product_lots.physical_products.store_id', store.id)
        .eq('is_active', true)
        .order('days_until_expiration', { ascending: true });

      if (error) {
        logger.error('Error fetching expiration alerts', { error });
        return [];
      }

      return data || [];
    },
    enabled: !!store?.id,
  });

  // Fetch lot movements
  const { data: movements = [] } = useQuery({
    queryKey: ['lot-movements', selectedLot?.id],
    queryFn: async (): Promise<LotMovement[]> => {
      if (!selectedLot?.id) return [];

      const { data, error } = await supabase
        .from('lot_movements')
        .select('*')
        .eq('lot_id', selectedLot.id)
        .order('movement_date', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching lot movements', { error });
        return [];
      }

      return (data || []) as LotMovement[];
    },
    enabled: !!selectedLot?.id,
  });

  // Create lot mutation
  const createLot = useMutation({
    mutationFn: async (data: typeof lotForm) => {
      if (!store?.id) throw new Error('Store ID manquant');

      const { data: lot, error } = await supabase
        .from('product_lots')
        .insert({
          physical_product_id: data.physical_product_id,
          variant_id: data.variant_id || null,
          warehouse_id: data.warehouse_id || null,
          lot_number: data.lot_number || `LOT-${Date.now()}`,
          batch_number: data.batch_number || null,
          serial_number: data.serial_number || null,
          manufacturing_date: data.manufacturing_date || null,
          expiration_date: data.expiration_date || null,
          best_before_date: data.best_before_date || null,
          initial_quantity: parseInt(data.initial_quantity) || 0,
          current_quantity: parseInt(data.initial_quantity) || 0,
          unit_cost: data.unit_cost ? parseFloat(data.unit_cost) : null,
          rotation_method: data.rotation_method,
          quality_status: data.quality_status,
          bin_location: data.bin_location || null,
          shelf_location: data.shelf_location || null,
          supplier_batch_number: data.supplier_batch_number || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating lot', { error });
        throw error;
      }

      return lot as ProductLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lots'] });
      setIsCreateDialogOpen(false);
      setLotForm({
        physical_product_id: productId || '',
        variant_id: '',
        warehouse_id: '',
        lot_number: '',
        batch_number: '',
        serial_number: '',
        manufacturing_date: '',
        expiration_date: '',
        best_before_date: '',
        initial_quantity: '',
        unit_cost: '',
        rotation_method: 'FIFO',
        quality_status: 'good',
        bin_location: '',
        shelf_location: '',
        supplier_batch_number: '',
        notes: '',
      });
      toast({
        title: '✅ Lot créé',
        description: 'Le lot a été créé avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer le lot',
        variant: 'destructive',
      });
    },
  });

  // Filtered lots
  const filteredLots = useMemo(() => {
    let  filtered= lots;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lot) =>
          lot.lot_number.toLowerCase().includes(query) ||
          lot.batch_number?.toLowerCase().includes(query) ||
          lot.serial_number?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [lots, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: lots.length,
      active: lots.filter((l) => l.status === 'active').length,
      expired: lots.filter((l) => l.status === 'expired').length,
      expiringSoon: lots.filter((l) => l.status === 'expiring_soon').length,
      totalQuantity: lots.reduce((sum, l) => sum + l.current_quantity, 0),
      expiredQuantity: lots
        .filter((l) => l.status === 'expired')
        .reduce((sum, l) => sum + l.current_quantity, 0),
      expiringSoonQuantity: lots
        .filter((l) => l.status === 'expiring_soon')
        .reduce((sum, l) => sum + l.current_quantity, 0),
    };
  }, [lots]);

  // Get status badge
  const getStatusBadge = (lot: ProductLot) => {
    type IconComponent = React.ComponentType<{ className?: string }>;
    const  statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: IconComponent }> = {
      active: { label: 'Actif', variant: 'default', icon: CheckCircle2 },
      expired: { label: 'Expiré', variant: 'destructive', icon: XCircle },
      expiring_soon: { label: 'Expire bientôt', variant: 'secondary', icon: AlertTriangle },
      depleted: { label: 'Épuisé', variant: 'secondary', icon: PackageX },
      damaged: { label: 'Endommagé', variant: 'destructive', icon: XCircle },
      quarantined: { label: 'En quarantaine', variant: 'secondary', icon: AlertTriangle },
    };

    const config = statusConfig[lot.status] || { label: lot.status, variant: 'secondary' as const, icon: Package };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Get days until expiration
  const getDaysUntilExpiration = (expirationDate?: string) => {
    if (!expirationDate) return null;
    const expDate = new Date(expirationDate);
    const days = differenceInDays(expDate, new Date());
    return days;
  };

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  if (storeLoading || lotsLoading) {
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
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 backdrop-blur-sm border border-orange-500/20">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Gestion des Lots et Expiration
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gérez les lots de produits et les dates d'expiration
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau lot
              </Button>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Lots</CardTitle>
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
                  <CardTitle className="text-xs sm:text-sm font-medium">Expirés</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.expired}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Expirent bientôt</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Quantité Totale</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalQuantity.toLocaleString('fr-FR')}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Quantité Expirée</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-red-600">
                    {stats.expiredQuantity.toLocaleString('fr-FR')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Alertes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">{alerts.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {alerts.length} alerte{alerts.length > 1 ? 's' : ''} d'expiration active{alerts.length > 1 ? 's' : ''}
                  . Vérifiez les lots qui expirent bientôt.
                </AlertDescription>
              </Alert>
            )}

            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Rechercher par numéro de lot, batch, série..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="expired">Expirés</SelectItem>
                      <SelectItem value="expiring_soon">Expirent bientôt</SelectItem>
                      <SelectItem value="depleted">Épuisés</SelectItem>
                      <SelectItem value="damaged">Endommagés</SelectItem>
                      <SelectItem value="quarantined">En quarantaine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
              <TabsList>
                <TabsTrigger value="lots">
                  <Package className="h-4 w-4 mr-2" />
                  Lots ({filteredLots.length})
                </TabsTrigger>
                <TabsTrigger value="alerts">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Alertes ({alerts.length})
                </TabsTrigger>
                <TabsTrigger value="movements" disabled={!selectedLot}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Mouvements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lots" className="space-y-4">
                {filteredLots.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Aucun lot trouvé</p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un lot
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Liste des Lots</CardTitle>
                      <CardDescription>{filteredLots.length} lot{filteredLots.length > 1 ? 's' : ''} trouvé{filteredLots.length > 1 ? 's' : ''}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Numéro de lot</TableHead>
                              <TableHead>Produit</TableHead>
                              <TableHead>Quantité</TableHead>
                              <TableHead>Date expiration</TableHead>
                              <TableHead>Jours restants</TableHead>
                              <TableHead>Rotation</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLots.map((lot) => {
                              const daysUntilExp = getDaysUntilExpiration(lot.expiration_date);
                              return (
                                <TableRow key={lot.id}>
                                  <TableCell className="font-medium">{lot.lot_number}</TableCell>
                                  <TableCell>
                                    {(lot as any).physical_products?.name || 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {lot.current_quantity} / {lot.initial_quantity}
                                  </TableCell>
                                  <TableCell>
                                    {lot.expiration_date
                                      ? format(new Date(lot.expiration_date), 'dd MMM yyyy', { locale: fr })
                                      : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {daysUntilExp !== null ? (
                                      <span
                                        className={cn(
                                          daysUntilExp < 0 && 'text-red-600 font-semibold',
                                          daysUntilExp >= 0 && daysUntilExp <= 7 && 'text-yellow-600 font-semibold',
                                          daysUntilExp > 7 && 'text-muted-foreground'
                                        )}
                                      >
                                        {daysUntilExp < 0 ? `Expiré (${Math.abs(daysUntilExp)}j)` : `${daysUntilExp}j`}
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{lot.rotation_method}</Badge>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(lot)}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedLot(lot);
                                          setSelectedTab('movements');
                                        }}
                                      >
                                        <RefreshCw className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedLot(lot);
                                          setIsEditDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                {alerts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                      <p className="text-muted-foreground">Aucune alerte d'expiration</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert: { id: string; product_lots?: { physical_products?: { name?: string } }; alert_type?: string; days_until_expiration?: number }) => (
                      <Card key={alert.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {alert.product_lots?.physical_products?.name || 'Produit'}
                              </CardTitle>
                              <CardDescription>
                                Lot {alert.product_lots?.lot_number} -{' '}
                                {format(new Date(alert.product_lots?.expiration_date), 'dd MMM yyyy', { locale: fr })}
                              </CardDescription>
                            </div>
                            <Badge variant="destructive">
                              {alert.days_until_expiration} jour{alert.days_until_expiration > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-muted-foreground">Quantité</Label>
                              <p className="font-medium">{alert.product_lots?.current_quantity}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Type d'alerte</Label>
                              <p className="font-medium capitalize">{alert.alert_type.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Date d'expiration</Label>
                              <p className="font-medium">
                                {format(new Date(alert.product_lots?.expiration_date), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="movements" className="space-y-4">
                {selectedLot ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Mouvements - Lot {selectedLot.lot_number}</CardTitle>
                      <CardDescription>Historique des mouvements de ce lot</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {movements.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Aucun mouvement</p>
                      ) : (
                        <div className="space-y-2">
                          {movements.map((movement) => (
                            <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium capitalize">{movement.movement_type.replace('_', ' ')}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(movement.movement_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={cn('font-medium', movement.quantity > 0 ? 'text-green-600' : 'text-red-600')}>
                                  {movement.quantity > 0 ? '+' : ''}
                                  {movement.quantity}
                                </p>
                                {movement.reason && (
                                  <p className="text-xs text-muted-foreground">{movement.reason}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Sélectionnez un lot pour voir ses mouvements</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Create Lot Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau lot</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau lot de produits avec ses informations d'expiration
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lot_number">Numéro de lot *</Label>
                      <Input
                        id="lot_number"
                        value={lotForm.lot_number}
                        onChange={(e) => setLotForm({ ...lotForm, lot_number: e.target.value })}
                        placeholder="LOT-2025-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="batch_number">Numéro de batch</Label>
                      <Input
                        id="batch_number"
                        value={lotForm.batch_number}
                        onChange={(e) => setLotForm({ ...lotForm, batch_number: e.target.value })}
                        placeholder="BATCH-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="initial_quantity">Quantité initiale *</Label>
                      <Input
                        id="initial_quantity"
                        type="number"
                        value={lotForm.initial_quantity}
                        onChange={(e) => setLotForm({ ...lotForm, initial_quantity: e.target.value })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit_cost">Coût unitaire (XOF)</Label>
                      <Input
                        id="unit_cost"
                        type="number"
                        value={lotForm.unit_cost}
                        onChange={(e) => setLotForm({ ...lotForm, unit_cost: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manufacturing_date">Date de fabrication</Label>
                      <Input
                        id="manufacturing_date"
                        type="date"
                        value={lotForm.manufacturing_date}
                        onChange={(e) => setLotForm({ ...lotForm, manufacturing_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiration_date">Date d'expiration</Label>
                      <Input
                        id="expiration_date"
                        type="date"
                        value={lotForm.expiration_date}
                        onChange={(e) => setLotForm({ ...lotForm, expiration_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rotation_method">Méthode de rotation</Label>
                      <Select
                        value={lotForm.rotation_method}
                        onValueChange={(v) => setLotForm({ ...lotForm, rotation_method: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIFO">FIFO (First In First Out)</SelectItem>
                          <SelectItem value="LIFO">LIFO (Last In First Out)</SelectItem>
                          <SelectItem value="FEFO">FEFO (First Expired First Out)</SelectItem>
                          <SelectItem value="manual">Manuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quality_status">Statut qualité</Label>
                      <Select
                        value={lotForm.quality_status}
                        onValueChange={(v) => setLotForm({ ...lotForm, quality_status: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Bon</SelectItem>
                          <SelectItem value="acceptable">Acceptable</SelectItem>
                          <SelectItem value="poor">Médiocre</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={lotForm.notes}
                      onChange={(e) => setLotForm({ ...lotForm, notes: e.target.value })}
                      rows={3}
                      placeholder="Notes supplémentaires..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => createLot.mutate(lotForm)}
                      disabled={!lotForm.physical_product_id || !lotForm.lot_number || createLot.isPending}
                      className="flex-1"
                    >
                      {createLot.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Créer le lot
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







