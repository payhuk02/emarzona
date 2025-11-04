/**
 * Warehouses Management Component
 * Date: 27 Janvier 2025
 * 
 * Gestion complète des entrepôts (liste, création, édition, suppression)
 */

import { useState } from 'react';
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
import { Plus, Edit, Trash2, Warehouse as WarehouseIcon, MapPin, Package, DollarSign, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function WarehousesManagement() {
  const { store } = useStore();
  const { data: warehouses, isLoading } = useWarehouses(store?.id);
  const createWarehouse = useCreateWarehouse();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue',
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
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer l\'entrepôt',
        variant: 'destructive',
      });
    }
  };

  const filteredWarehouses = warehouses?.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.city?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Entrepôts</h2>
          <p className="text-muted-foreground">
            Gérez vos entrepôts et leurs configurations
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un entrepôt
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des entrepôts</CardTitle>
          <CardDescription>
            {filteredWarehouses.length} entrepôt{filteredWarehouses.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Rechercher un entrepôt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entrepôt</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Capacité</TableHead>
                  <TableHead>Statistiques</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Aucun entrepôt trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{warehouse.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {warehouse.code}
                            </div>
                          </div>
                          {warehouse.is_primary && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {warehouse.city}
                          {warehouse.country && `, ${warehouse.country}`}
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
                            <Package className="h-3 w-3" />
                            {warehouse.total_products} produit{warehouse.total_products > 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(warehouse.total_value)}
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
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(warehouse.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex items-center gap-4">
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

