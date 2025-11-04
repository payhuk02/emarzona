/**
 * Product Kits Management Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des kits produits (création, édition, gestion composants)
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useProductKits, useCreateProductKit, ProductKit } from '@/hooks/physical/useProductKits';
import { useStore } from '@/hooks/useStore';
import { Plus, Edit, Trash2, Package, Search, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function ProductKitsManagement() {
  const { store } = useStore();
  const { data: kits, isLoading } = useProductKits(store?.id);
  const createKit = useCreateProductKit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<ProductKit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<ProductKit>>({
    kit_product_id: '',
    kit_name: '',
    kit_description: '',
    kit_type: 'fixed',
    min_items: 1,
    max_items: undefined,
    kit_price: undefined,
    discount_percentage: 0,
    discount_amount: 0,
    track_kit_inventory: true,
    track_components_inventory: true,
    auto_allocate: false,
    requires_assembly: false,
    assembly_time_minutes: undefined,
    assembly_instructions: '',
    assembly_required: false,
    is_active: true,
    display_order: 0,
  });

  const handleOpenDialog = (kit?: ProductKit) => {
    if (kit) {
      setEditingKit(kit);
      setFormData(kit);
    } else {
      setEditingKit(null);
      setFormData({
        kit_product_id: '',
        kit_name: '',
        kit_description: '',
        kit_type: 'fixed',
        min_items: 1,
        max_items: undefined,
        kit_price: undefined,
        discount_percentage: 0,
        discount_amount: 0,
        track_kit_inventory: true,
        track_components_inventory: true,
        auto_allocate: false,
        requires_assembly: false,
        assembly_time_minutes: undefined,
        assembly_instructions: '',
        assembly_required: false,
        is_active: true,
        display_order: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      if (editingKit) {
        // Update
        const { error } = await supabase
          .from('product_kits')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingKit.id);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['product-kits', store.id] });
        toast({
          title: '✅ Kit mis à jour',
          description: 'Le kit a été mis à jour avec succès',
        });
      } else {
        // Create
        await createKit.mutateAsync({
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

  const handleDelete = async (kitId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce kit ?')) return;

    try {
      const { error } = await supabase
        .from('product_kits')
        .delete()
        .eq('id', kitId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['product-kits', store?.id] });
      toast({
        title: '✅ Kit supprimé',
        description: 'Le kit a été supprimé avec succès',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer le kit',
        variant: 'destructive',
      });
    }
  };

  const filteredKits = kits?.filter(kit =>
    kit.kit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (kit.kit_product as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Kits Produits</h2>
          <p className="text-muted-foreground">
            Créez et gérez des kits composés de plusieurs produits
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un kit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des kits</CardTitle>
              <CardDescription>
                {filteredKits.length} kit{filteredKits.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Input
              placeholder="Rechercher un kit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucun kit trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKits.map((kit) => (
                    <TableRow key={kit.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{kit.kit_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {(kit.kit_product as any)?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{kit.kit_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {kit.kit_price ? (
                          <span className="font-medium">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(kit.kit_price)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Calculé automatiquement</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {kit.requires_assembly && (
                            <Badge variant="outline" className="w-fit">Assemblage requis</Badge>
                          )}
                          {kit.track_kit_inventory && (
                            <Badge variant="outline" className="w-fit">Suivi inventaire</Badge>
                          )}
                          {kit.auto_allocate && (
                            <Badge variant="outline" className="w-fit">Allocation auto</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={kit.is_active ? 'default' : 'secondary'}>
                          {kit.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(kit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(kit.id)}
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
              {editingKit ? 'Modifier le kit' : 'Nouveau kit produit'}
            </DialogTitle>
            <DialogDescription>
              {editingKit
                ? 'Modifiez les informations du kit'
                : 'Créez un nouveau kit composé de plusieurs produits'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kit_product_id">ID Produit principal *</Label>
                  <Input
                    id="kit_product_id"
                    value={formData.kit_product_id || ''}
                    onChange={(e) => setFormData({ ...formData, kit_product_id: e.target.value })}
                    placeholder="UUID du produit"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kit_name">Nom du kit *</Label>
                  <Input
                    id="kit_name"
                    value={formData.kit_name || ''}
                    onChange={(e) => setFormData({ ...formData, kit_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kit_type">Type de kit *</Label>
                <Select
                  value={formData.kit_type || 'fixed'}
                  onValueChange={(value: any) => setFormData({ ...formData, kit_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixe (produits prédéfinis)</SelectItem>
                    <SelectItem value="flexible">Flexible (choix parmi options)</SelectItem>
                    <SelectItem value="bundle">Bundle (produits groupés)</SelectItem>
                    <SelectItem value="assembly">Assemblage (produit final assemblé)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kit_description">Description</Label>
                <Textarea
                  id="kit_description"
                  value={formData.kit_description || ''}
                  onChange={(e) => setFormData({ ...formData, kit_description: e.target.value })}
                  rows={3}
                />
              </div>

              {formData.kit_type === 'flexible' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_items">Minimum d'items</Label>
                    <Input
                      id="min_items"
                      type="number"
                      min="1"
                      value={formData.min_items || 1}
                      onChange={(e) => setFormData({ ...formData, min_items: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_items">Maximum d'items</Label>
                    <Input
                      id="max_items"
                      type="number"
                      min="1"
                      value={formData.max_items || ''}
                      onChange={(e) => setFormData({ ...formData, max_items: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kit_price">Prix du kit (optionnel)</Label>
                  <Input
                    id="kit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.kit_price || ''}
                    onChange={(e) => setFormData({ ...formData, kit_price: parseFloat(e.target.value) || undefined })}
                    placeholder="Auto si vide"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">Réduction (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discount_percentage || 0}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Réduction (montant)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount || 0}
                    onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {formData.requires_assembly && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assembly_time_minutes">Temps d'assemblage (minutes)</Label>
                      <Input
                        id="assembly_time_minutes"
                        type="number"
                        min="0"
                        value={formData.assembly_time_minutes || ''}
                        onChange={(e) => setFormData({ ...formData, assembly_time_minutes: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assembly_instructions">Instructions d'assemblage</Label>
                      <Input
                        id="assembly_instructions"
                        value={formData.assembly_instructions || ''}
                        onChange={(e) => setFormData({ ...formData, assembly_instructions: e.target.value })}
                        placeholder="URL ou référence"
                      />
                    </div>
                  </div>
                </>
              )}

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
                    id="requires_assembly"
                    checked={formData.requires_assembly ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_assembly: checked })}
                  />
                  <Label htmlFor="requires_assembly">Nécessite assemblage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="track_kit_inventory"
                    checked={formData.track_kit_inventory ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, track_kit_inventory: checked })}
                  />
                  <Label htmlFor="track_kit_inventory">Suivre inventaire kit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_allocate"
                    checked={formData.auto_allocate ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_allocate: checked })}
                  />
                  <Label htmlFor="auto_allocate">Allocation automatique</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={createKit.isPending}>
                {editingKit ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

