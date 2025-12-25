/**
 * Page de Gestion des Fournisseurs
 * Date: 31 Janvier 2025
 *
 * Interface complète pour gérer :
 * - Les fournisseurs
 * - Les commandes aux fournisseurs
 * - Les coûts et paiements
 * - Les statistiques et performances
 */

import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Star,
  DollarSign,
  Package,
  Calendar,
  Phone,
  Mail,
  Globe,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStore';
import SupplierOrders from '@/components/physical/suppliers/SupplierOrders';
import { useIsMobile } from '@/hooks/use-mobile';

interface Supplier {
  id: string;
  store_id: string;
  name: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  payment_terms?: string;
  currency: string;
  tax_id?: string;
  notes?: string;
  tags: string[];
  is_active: boolean;
  is_preferred: boolean;
  total_orders: number;
  total_spent: number;
  average_delivery_days?: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export default function SuppliersManagement() {
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // State
  const [selectedTab, setSelectedTab] = useState<'suppliers' | 'orders' | 'analytics'>('suppliers');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'SN',
    payment_terms: 'net_30',
    currency: 'XOF',
    tax_id: '',
    notes: '',
    tags: [] as string[],
    is_active: true,
    is_preferred: false,
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers', store?.id, statusFilter],
    queryFn: async (): Promise<Supplier[]> => {
      if (!store?.id) return [];

      let query = supabase.from('suppliers').select('*').eq('store_id', store.id);

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      } else if (statusFilter === 'preferred') {
        query = query.eq('is_preferred', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching suppliers', { error });
        throw error;
      }

      return (data || []) as Supplier[];
    },
    enabled: !!store?.id,
  });

  // Create supplier mutation
  const createSupplier = useMutation({
    mutationFn: async (data: typeof supplierForm) => {
      if (!store?.id) throw new Error('Store ID manquant');

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .insert({
          store_id: store.id,
          ...data,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating supplier', { error });
        throw error;
      }

      return supplier as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: '✅ Fournisseur créé',
        description: 'Le fournisseur a été créé avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer le fournisseur',
        variant: 'destructive',
      });
    },
  });

  // Update supplier mutation
  const updateSupplier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof supplierForm> }) => {
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating supplier', { error });
        throw error;
      }

      return supplier as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsEditDialogOpen(false);
      setSelectedSupplier(null);
      resetForm();
      toast({
        title: '✅ Fournisseur mis à jour',
        description: 'Le fournisseur a été mis à jour avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de mettre à jour le fournisseur',
        variant: 'destructive',
      });
    },
  });

  // Delete supplier mutation
  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting supplier', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: '✅ Fournisseur supprimé',
        description: 'Le fournisseur a été supprimé avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer le fournisseur',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setSupplierForm({
      name: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      website: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'SN',
      payment_terms: 'net_30',
      currency: 'XOF',
      tax_id: '',
      notes: '',
      tags: [],
      is_active: true,
      is_preferred: false,
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      company_name: supplier.company_name || '',
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      website: supplier.website || '',
      address_line1: supplier.address_line1 || '',
      address_line2: supplier.address_line2 || '',
      city: supplier.city || '',
      state: supplier.state || '',
      postal_code: supplier.postal_code || '',
      country: supplier.country,
      payment_terms: supplier.payment_terms || 'net_30',
      currency: supplier.currency,
      tax_id: supplier.tax_id || '',
      notes: supplier.notes || '',
      tags: supplier.tags || [],
      is_active: supplier.is_active,
      is_preferred: supplier.is_preferred,
    });
    setIsEditDialogOpen(true);
  };

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.company_name?.toLowerCase().includes(query) ||
          s.contact_person?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [suppliers, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: suppliers.length,
      active: suppliers.filter(s => s.is_active).length,
      preferred: suppliers.filter(s => s.is_preferred).length,
      totalSpent: suppliers.reduce((sum, s) => sum + s.total_spent, 0),
      totalOrders: suppliers.reduce((sum, s) => sum + s.total_orders, 0),
      averageRating:
        suppliers.length > 0
          ? suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length
          : 0,
    };
  }, [suppliers]);

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  if (storeLoading || suppliersLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
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
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-sm border border-blue-500/20">
                    <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Gestion des Fournisseurs
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gérez vos fournisseurs et commandes
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau fournisseur
              </Button>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
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
                  <CardTitle className="text-xs sm:text-sm font-medium">Préférés</CardTitle>
                  <Star className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {stats.preferred}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total dépensé</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {stats.totalSpent.toLocaleString('fr-FR')} XOF
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Commandes</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Note moyenne</CardTitle>
                  <Star className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {stats.averageRating.toFixed(1)}/5
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={v => setSelectedTab(v as typeof selectedTab)}>
              <TabsList>
                <TabsTrigger value="suppliers">
                  <Truck className="h-4 w-4 mr-2" />
                  Fournisseurs ({suppliers.length})
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <Package className="h-4 w-4 mr-2" />
                  Commandes
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="suppliers" className="space-y-4">
                {/* Filtres */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Rechercher par nom, entreprise, contact..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="active">Actifs</SelectItem>
                          <SelectItem value="inactive">Inactifs</SelectItem>
                          <SelectItem value="preferred">Préférés</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Suppliers Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des Fournisseurs</CardTitle>
                    <CardDescription>
                      {filteredSuppliers.length} fournisseur
                      {filteredSuppliers.length > 1 ? 's' : ''} trouvé
                      {filteredSuppliers.length > 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredSuppliers.length === 0 ? (
                      <div className="text-center py-12">
                        <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">Aucun fournisseur trouvé</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Créer un fournisseur
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Mobile: Cards (lisible et tactile) */}
                        {isMobile ? (
                          <div className="space-y-3">
                            {filteredSuppliers.map(supplier => (
                              <div key={supplier.id} className="rounded-lg border p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="font-semibold truncate">{supplier.name}</div>
                                      {supplier.is_preferred && (
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                                      )}
                                    </div>
                                    {supplier.company_name && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {supplier.company_name}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {supplier.is_active ? (
                                      <Badge variant="default" className="bg-green-600">
                                        Actif
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">Inactif</Badge>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(supplier)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            'Êtes-vous sûr de vouloir supprimer ce fournisseur ?'
                                          )
                                        ) {
                                          deleteSupplier.mutate(supplier.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Package className="h-3.5 w-3.5" />
                                    <span className="font-medium text-foreground">
                                      {supplier.total_orders}
                                    </span>
                                    <span>commandes</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span className="font-medium text-foreground">
                                      {supplier.total_spent.toLocaleString('fr-FR')}{' '}
                                      {supplier.currency}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium text-foreground">
                                      {supplier.rating.toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span className="truncate text-foreground">
                                      {supplier.email || '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span className="truncate text-foreground">
                                      {supplier.phone || '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Desktop: Table */
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nom</TableHead>
                                  <TableHead>Entreprise</TableHead>
                                  <TableHead>Contact</TableHead>
                                  <TableHead>Commandes</TableHead>
                                  <TableHead>Total dépensé</TableHead>
                                  <TableHead>Note</TableHead>
                                  <TableHead>Statut</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredSuppliers.map(supplier => (
                                  <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        {supplier.name}
                                        {supplier.is_preferred && (
                                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{supplier.company_name || '-'}</TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        {supplier.email && (
                                          <div className="flex items-center gap-1 text-sm">
                                            <Mail className="h-3 w-3" />
                                            {supplier.email}
                                          </div>
                                        )}
                                        {supplier.phone && (
                                          <div className="flex items-center gap-1 text-sm">
                                            <Phone className="h-3 w-3" />
                                            {supplier.phone}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{supplier.total_orders}</TableCell>
                                    <TableCell>
                                      {supplier.total_spent.toLocaleString('fr-FR')}{' '}
                                      {supplier.currency}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        {supplier.rating.toFixed(1)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {supplier.is_active ? (
                                        <Badge variant="default" className="bg-green-600">
                                          Actif
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary">Inactif</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEdit(supplier)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (
                                              confirm(
                                                'Êtes-vous sûr de vouloir supprimer ce fournisseur ?'
                                              )
                                            ) {
                                              deleteSupplier.mutate(supplier.id);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                <SupplierOrders />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics Fournisseurs</CardTitle>
                    <CardDescription>Analysez les performances de vos fournisseurs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Les analytics détaillés seront disponibles prochainement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog
              open={isCreateDialogOpen || isEditDialogOpen}
              onOpenChange={open => {
                if (!open) {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedSupplier(null);
                  resetForm();
                }
              }}
            >
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {isEditDialogOpen ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditDialogOpen
                      ? 'Modifiez les informations du fournisseur'
                      : 'Ajoutez un nouveau fournisseur à votre liste'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom *</Label>
                      <Input
                        id="name"
                        value={supplierForm.name}
                        onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                        placeholder="Nom du fournisseur"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_name">Nom de l'entreprise</Label>
                      <Input
                        id="company_name"
                        value={supplierForm.company_name}
                        onChange={e =>
                          setSupplierForm({ ...supplierForm, company_name: e.target.value })
                        }
                        placeholder="Nom de l'entreprise"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_person">Personne de contact</Label>
                      <Input
                        id="contact_person"
                        value={supplierForm.contact_person}
                        onChange={e =>
                          setSupplierForm({ ...supplierForm, contact_person: e.target.value })
                        }
                        placeholder="Nom du contact"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={supplierForm.email}
                        onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={supplierForm.phone}
                        onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                        placeholder="+221 XX XXX XX XX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Site web</Label>
                      <Input
                        id="website"
                        value={supplierForm.website}
                        onChange={e =>
                          setSupplierForm({ ...supplierForm, website: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="address_line1">Adresse ligne 1</Label>
                      <Input
                        id="address_line1"
                        value={supplierForm.address_line1}
                        onChange={e =>
                          setSupplierForm({ ...supplierForm, address_line1: e.target.value })
                        }
                        placeholder="Adresse"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address_line2">Adresse ligne 2</Label>
                      <Input
                        id="address_line2"
                        value={supplierForm.address_line2}
                        onChange={e =>
                          setSupplierForm({ ...supplierForm, address_line2: e.target.value })
                        }
                        placeholder="Complément d'adresse"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={supplierForm.city}
                        onChange={e => setSupplierForm({ ...supplierForm, city: e.target.value })}
                        placeholder="Ville"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">État/Région</Label>
                      <Input
                        id="state"
                        value={supplierForm.state}
                        onChange={e => setSupplierForm({ ...supplierForm, state: e.target.value })}
                        placeholder="État/Région"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postal_code">Code postal</Label>
                      <Input
                        id="postal_code"
                        value={supplierForm.postal_code}
                        onChange={e =>
                          setSupplierForm({ ...supplierForm, postal_code: e.target.value })
                        }
                        placeholder="Code postal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Pays</Label>
                      <Input
                        id="country"
                        value={supplierForm.country}
                        onChange={e =>
                          setSupplierForm({ ...supplierForm, country: e.target.value })
                        }
                        placeholder="Pays"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_terms">Conditions de paiement</Label>
                      <Select
                        value={supplierForm.payment_terms}
                        onValueChange={v => setSupplierForm({ ...supplierForm, payment_terms: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prepaid">Prépayé</SelectItem>
                          <SelectItem value="net_15">Net 15</SelectItem>
                          <SelectItem value="net_30">Net 30</SelectItem>
                          <SelectItem value="net_60">Net 60</SelectItem>
                          <SelectItem value="net_90">Net 90</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency">Devise</Label>
                      <Select
                        value={supplierForm.currency}
                        onValueChange={v => setSupplierForm({ ...supplierForm, currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="XOF">XOF</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={supplierForm.notes}
                      onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                      rows={3}
                      placeholder="Notes supplémentaires..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setIsEditDialogOpen(false);
                        setSelectedSupplier(null);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => {
                        if (isEditDialogOpen && selectedSupplier) {
                          updateSupplier.mutate({ id: selectedSupplier.id, data: supplierForm });
                        } else {
                          createSupplier.mutate(supplierForm);
                        }
                      }}
                      disabled={
                        !supplierForm.name || createSupplier.isPending || updateSupplier.isPending
                      }
                      className="flex-1"
                    >
                      {createSupplier.isPending || updateSupplier.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isEditDialogOpen ? 'Mise à jour...' : 'Création...'}
                        </>
                      ) : (
                        <>{isEditDialogOpen ? 'Mettre à jour' : 'Créer'}</>
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
