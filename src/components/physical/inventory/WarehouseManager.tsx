/**
 * Warehouse Manager Component
 * Date: 2025-01-28
 * 
 * Component for managing warehouses
 * Design responsive avec le même style que Mes Templates
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MoreVertical, Edit, Trash2, MapPin, Check, Search, X, RefreshCw, Warehouse as WarehouseIcon, Star, Package } from 'lucide-react';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '@/hooks/physical/useAdvancedInventory';
import { useStore } from '@/hooks/useStore';
import { Warehouse } from '@/hooks/physical/useAdvancedInventory';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export const WarehouseManager : React.FC = () => {
  const { store } = useStore();
  const { data: warehouses = [], isLoading } = useWarehouses(store?.id);
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteWarehouseId, setDeleteWarehouseId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const warehousesRef = useScrollAnimation<HTMLDivElement>();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'BF',
    phone: '',
    email: '',
    is_active: true,
    is_default: false,
    priority: 0,
  });

  // Stats calculées
  const stats = useMemo(() => {
    const total = warehouses.length;
    const active = warehouses.filter(w => w.is_active).length;
    const defaultWarehouses = warehouses.filter(w => w.is_default).length;
    const inactive = warehouses.filter(w => !w.is_active).length;
    return { total, active, defaultWarehouses, inactive };
  }, [warehouses]);

  // Filtrage
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

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        description: warehouse.description || '',
        address_line1: warehouse.address_line1,
        address_line2: warehouse.address_line2 || '',
        city: warehouse.city,
        state: warehouse.state || '',
        postal_code: warehouse.postal_code || '',
        country: warehouse.country,
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        is_active: warehouse.is_active,
        is_default: warehouse.is_default,
        priority: warehouse.priority,
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'BF',
        phone: '',
        email: '',
        is_active: true,
        is_default: false,
        priority: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    const warehouseData = {
      ...formData,
      store_id: store.id,
    };

    try {
      if (editingWarehouse) {
        await updateMutation.mutateAsync({
          id: editingWarehouse.id,
          ...warehouseData,
        });
      } else {
        await createMutation.mutateAsync(warehouseData);
      }
      setIsDialogOpen(false);
      setEditingWarehouse(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteWarehouseId) return;
    try {
      await deleteMutation.mutateAsync(deleteWarehouseId);
      setDeleteWarehouseId(null);
    } catch (error) {
      // Error handled by mutation
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Entrepôts</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gérez vos entrepôts et emplacements de stockage
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
      {warehouses.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total Entrepôts', value: stats.total, icon: WarehouseIcon, color: 'from-purple-600 to-pink-600' },
            { label: 'Actifs', value: stats.active, icon: Package, color: 'from-green-600 to-emerald-600' },
            { label: 'Par défaut', value: stats.defaultWarehouses, icon: Star, color: 'from-yellow-600 to-orange-600' },
            { label: 'Inactifs', value: stats.inactive, icon: MapPin, color: 'from-gray-600 to-slate-600' },
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
      )}

      {/* Search & Actions - Responsive */}
      {warehouses.length > 0 && (
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
      )}

      {/* Warehouses List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Liste des entrepôts</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredWarehouses.length} entrepôt{filteredWarehouses.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <WarehouseIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Aucun entrepôt configuré. Créez votre premier entrepôt pour commencer.
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                variant="outline"
                className="mt-4"
              >
                Créer un entrepôt
              </Button>
            </div>
          ) : filteredWarehouses.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Search className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Aucun entrepôt trouvé
              </p>
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
                    onDelete={() => setDeleteWarehouseId(warehouse.id)}
                    animationDelay={index * 50}
                  />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nom</TableHead>
                      <TableHead className="min-w-[120px]">Code</TableHead>
                      <TableHead className="min-w-[200px]">Adresse</TableHead>
                      <TableHead className="min-w-[150px]">Statut</TableHead>
                      <TableHead className="min-w-[100px]">Priorité</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {warehouse.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {warehouse.city}, {warehouse.country}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            {warehouse.is_default && (
                              <Badge variant="default" className="gap-1">
                                <Check className="h-3 w-3" />
                                Par défaut
                              </Badge>
                            )}
                            {warehouse.is_active ? (
                              <Badge variant="outline" className="text-green-600">
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{warehouse.priority}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions pour l'entrepôt ${warehouse.name || warehouse.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog(warehouse)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteWarehouseId(warehouse.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'entrepôt
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Adresse ligne 1 *</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Adresse ligne 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">État/Région</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked as boolean })
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Actif
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_default: checked as boolean })
                  }
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Par défaut
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingWarehouse ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteWarehouseId}
        onOpenChange={(open) => !open && setDeleteWarehouseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'entrepôt</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet entrepôt ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

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
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">
                {warehouse.name}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                <code className="text-xs bg-muted px-2 py-0.5 rounded">{warehouse.code}</code>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {warehouse.is_default && (
              <Badge variant="default" className="gap-1 text-xs">
                <Check className="h-3 w-3" />
                Défaut
              </Badge>
            )}
            {warehouse.is_active ? (
              <Badge variant="outline" className="text-green-600 text-xs">
                Actif
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500 text-xs">
                Inactif
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">
              {warehouse.city}, {warehouse.country}
            </span>
          </div>
          {warehouse.description && (
            <p className="text-muted-foreground line-clamp-2">{warehouse.description}</p>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Priorité: {warehouse.priority}</span>
          </div>
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







