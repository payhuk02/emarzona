/**
 * Warehouses Management Component
 * Date: 27 Janvier 2025
 * 
 * Gestion complète des entrepôts (liste, création, édition, suppression)
 * Design responsive avec le même style que Mes Templates
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useWarehouses, useCreateWarehouse, Warehouse } from '@/hooks/physical/useWarehouses';
import { useStore } from '@/hooks/useStore';
import { Plus, Edit, Trash2, Warehouse as WarehouseIcon, MapPin, Package, DollarSign, Star, Search, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { cn } from '@/lib/utils';

export default function WarehousesManagement() {
  const { store } = useStore();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const { data: warehouses, isLoading } = useWarehouses(store?.id);
  const createWarehouse = useCreateWarehouse();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const warehousesRef = useScrollAnimation<HTMLDivElement>();

  const [formData, setFormData] = useState<Partial<Warehouse>>({
    name: '',
    code: '',
    description: '',
    contact_person: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'SN',
    latitude: undefined,
    longitude: undefined,
    is_active: true,
    is_primary: false,
    is_fulfillment_center: true,
    is_receiving_center: true,
    max_capacity: undefined,
    capacity_unit: 'units',
    timezone: 'Africa/Dakar',
    notes: '',
    tags: [],
  });

  // Stats calculées
  const stats = useMemo(() => {
    const total = warehouses?.length || 0;
    const active = warehouses?.filter(w => w.is_active).length || 0;
    const primary = warehouses?.filter(w => w.is_primary).length || 0;
    const totalProducts = warehouses?.reduce((sum, w) => sum + (w.total_products || 0), 0) || 0;
    return { total, active, primary, totalProducts };
  }, [warehouses]);

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData(warehouse);
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        contact_person: '',
        email: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'SN',
        latitude: undefined,
        longitude: undefined,
        is_active: true,
        is_primary: false,
        is_fulfillment_center: true,
        is_receiving_center: true,
        max_capacity: undefined,
        capacity_unit: 'units',
        timezone: 'Africa/Dakar',
        notes: '',
        tags: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingWarehouse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      if (editingWarehouse) {
        // Update
        const { error } = await supabase
          .from('warehouses')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingWarehouse.id);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['warehouses', store.id] });
        toast({
          title: '✅ Entrepôt mis à jour',
          description: 'L\'entrepôt a été mis à jour avec succès',
        });
      } else {
        // Create
        await createWarehouse.mutateAsync({
          ...formData,
          store_id: store.id,
        });
      }
      handleCloseDialog();
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (warehouseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet entrepôt ?')) return;

    try {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', warehouseId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['warehouses', store?.id] });
      toast({
        title: '✅ Entrepôt supprimé',
        description: 'L\'entrepôt a été supprimé avec succès',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer l\'entrepôt',
        variant: 'destructive',
      });
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['warehouses', store?.id] });
    toast({
      title: 'Actualisé',
      description: 'Les entrepôts ont été actualisés',
    });
  };

  const filteredWarehouses = useMemo(() => {
    if (!warehouses) return [];
    return warehouses.filter(warehouse => {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        warehouse.name.toLowerCase().includes(searchLower) ||
        warehouse.code.toLowerCase().includes(searchLower) ||
        warehouse.city?.toLowerCase().includes(searchLower)
      );
    });
  }, [warehouses, debouncedSearch]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Gestion des Entrepôts</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gérez vos entrepôts et leurs configurations
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          size="sm"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Ajouter un entrepôt</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Stats Cards - Responsive */}
      <div 
        ref={statsRef}
        className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {[
          { label: 'Total Entrepôts', value: stats.total, icon: WarehouseIcon, color: 'from-purple-600 to-pink-600' },
          { label: 'Actifs', value: stats.active, icon: Package, color: 'from-green-600 to-emerald-600' },
          { label: 'Principaux', value: stats.primary, icon: Star, color: 'from-yellow-600 to-orange-600' },
          { label: 'Total Produits', value: stats.totalProducts, icon: DollarSign, color: 'from-blue-600 to-cyan-600' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Actions - Responsive */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un entrepôt..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                aria-label="Rechercher"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                  onClick={handleClearSearch}
                  aria-label="Effacer"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-9 sm:h-10"
              aria-label="Rafraîchir"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Warehouses List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Liste des entrepôts</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredWarehouses.length} entrepôt{filteredWarehouses.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWarehouses.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <WarehouseIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {searchInput ? 'Aucun entrepôt trouvé' : 'Aucun entrepôt configuré. Créez votre premier entrepôt pour commencer.'}
              </p>
              {!searchInput && (
                <Button
                  onClick={() => handleOpenDialog()}
                  variant="outline"
                  className="mt-4"
                >
                  Créer un entrepôt
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {filteredWarehouses.map((warehouse, index) => (
                  <WarehouseCard
                    key={warehouse.id}
                    warehouse={warehouse}
                    onEdit={() => handleOpenDialog(warehouse)}
                    onDelete={() => handleDelete(warehouse.id)}
                    animationDelay={index * 50}
                  />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Entrepôt</TableHead>
                      <TableHead className="min-w-[150px]">Localisation</TableHead>
                      <TableHead className="min-w-[120px]">Capacité</TableHead>
                      <TableHead className="min-w-[150px]">Statistiques</TableHead>
                      <TableHead className="min-w-[130px]">Configuration</TableHead>
                      <TableHead className="min-w-[100px]">Statut</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <WarehouseIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{warehouse.name}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {warehouse.code}
                              </div>
                            </div>
                            {warehouse.is_primary && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {warehouse.city}
                              {warehouse.country && `, ${warehouse.country}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {warehouse.current_capacity} / {warehouse.max_capacity || '∞'}
                            <div className="text-muted-foreground text-xs">
                              {warehouse.capacity_unit}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 flex-shrink-0" />
                              <span>{warehouse.total_products} produit{warehouse.total_products > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'XOF',
                                }).format(warehouse.total_value)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {warehouse.is_fulfillment_center && (
                              <Badge variant="outline" className="w-fit text-xs">Expédition</Badge>
                            )}
                            {warehouse.is_receiving_center && (
                              <Badge variant="outline" className="w-fit text-xs">Réception</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                            {warehouse.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(warehouse)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(warehouse.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse
                ? 'Modifiez les informations de l\'entrepôt'
                : 'Ajoutez un nouvel entrepôt à votre système'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="WH-001"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Personne de contact</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person || ''}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1">Adresse ligne 1 *</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1 || ''}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2">Adresse ligne 2</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2 || ''}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">État/Région</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country || 'SN'}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_capacity">Capacité maximale</Label>
                  <Input
                    id="max_capacity"
                    type="number"
                    min="0"
                    value={formData.max_capacity || ''}
                    onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Actif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_primary"
                    checked={formData.is_primary ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
                  />
                  <Label htmlFor="is_primary">Entrepôt principal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_fulfillment_center"
                    checked={formData.is_fulfillment_center ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_fulfillment_center: checked })}
                  />
                  <Label htmlFor="is_fulfillment_center">Centre d'expédition</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_receiving_center"
                    checked={formData.is_receiving_center ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_receiving_center: checked })}
                  />
                  <Label htmlFor="is_receiving_center">Centre de réception</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={createWarehouse.isPending}>
                {editingWarehouse ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Warehouse Card Component for Mobile View
interface WarehouseCardProps {
  warehouse: Warehouse;
  onEdit: () => void;
  onDelete: () => void;
  animationDelay?: number;
}

function WarehouseCard({ warehouse, onEdit, onDelete, animationDelay = 0 }: WarehouseCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <WarehouseIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1 flex items-center gap-2">
                {warehouse.name}
                {warehouse.is_primary && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                )}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{warehouse.code}</CardDescription>
            </div>
          </div>
          <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
            {warehouse.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">
              {warehouse.city}
              {warehouse.country && `, ${warehouse.country}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>
              Capacité: {warehouse.current_capacity} / {warehouse.max_capacity || '∞'} {warehouse.capacity_unit}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>
              {warehouse.total_products} produit{warehouse.total_products > 1 ? 's' : ''} • {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
              }).format(warehouse.total_value)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {warehouse.is_fulfillment_center && (
            <Badge variant="outline" className="text-xs">Expédition</Badge>
          )}
          {warehouse.is_receiving_center && (
            <Badge variant="outline" className="text-xs">Réception</Badge>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onEdit}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Modifier</span>
          </Button>
          <Button
            onClick={onDelete}
            size="sm"
            variant="destructive"
            className="flex-1"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Supprimer</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}






