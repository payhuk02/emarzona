/**
 * Kit Components Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des composants d'un kit
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
import { useKitComponents, KitComponent } from '@/hooks/physical/useProductKits';
import { useStore } from '@/hooks/useStore';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function KitComponents() {
  const { store } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const { data: components, isLoading } = useKitComponents(selectedKitId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<KitComponent | null>(null);
  const [formData, setFormData] = useState<Partial<KitComponent>>({
    component_product_id: '',
    component_variant_id: '',
    quantity: 1,
    is_required: true,
    is_option: false,
    price_override: undefined,
    use_component_price: true,
    display_order: 0,
    notes: '',
  });

  const handleOpenDialog = (component?: KitComponent) => {
    if (component) {
      setEditingComponent(component);
      setFormData(component);
    } else {
      setEditingComponent(null);
      setFormData({
        component_product_id: '',
        component_variant_id: '',
        quantity: 1,
        is_required: true,
        is_option: false,
        price_override: undefined,
        use_component_price: true,
        display_order: 0,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingComponent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKitId || !formData.component_product_id) return;

    try {
      if (editingComponent) {
        // Update
        const { error } = await supabase
          .from('kit_components')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingComponent.id);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['kit-components', selectedKitId] });
        toast({
          title: '✅ Composant mis à jour',
          description: 'Le composant a été mis à jour',
        });
      } else {
        // Create
        const { error } = await supabase
          .from('kit_components')
          .insert({
            ...formData,
            kit_id: selectedKitId,
          })
          .select()
          .single();

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['kit-components', selectedKitId] });
        toast({
          title: '✅ Composant ajouté',
          description: 'Le composant a été ajouté au kit',
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

  const handleDelete = async (componentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce composant ?')) return;

    try {
      const { error } = await supabase
        .from('kit_components')
        .delete()
        .eq('id', componentId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['kit-components', selectedKitId] });
      toast({
        title: '✅ Composant supprimé',
        description: 'Le composant a été supprimé',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer le composant',
        variant: 'destructive',
      });
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Composants de Kit</h2>
          <p className="text-muted-foreground">
            Gérez les produits composants d'un kit
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            placeholder="ID du kit"
            value={selectedKitId}
            onChange={(e) => setSelectedKitId(e.target.value)}
            className="w-64"
          />
          {selectedKitId && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un composant
            </Button>
          )}
        </div>
      </div>

      {!selectedKitId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Entrez l'ID d'un kit pour voir ses composants
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Composants du kit</CardTitle>
            <CardDescription>
              {components?.length || 0} composant{(components?.length || 0) > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!components || components.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucun composant
                      </TableCell>
                    </TableRow>
                  ) : (
                    components.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {(component.component_product as any)?.name || 'N/A'}
                              </div>
                              {component.component_variant_id && (
                                <div className="text-sm text-muted-foreground">
                                  {(component.component_variant as any)?.option1_value || 'Variante'}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{component.quantity}</Badge>
                        </TableCell>
                        <TableCell>
                          {component.price_override ? (
                            <span className="font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                              }).format(component.price_override)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Prix produit</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {component.is_required && (
                              <Badge variant="default" className="w-fit text-xs">Obligatoire</Badge>
                            )}
                            {component.is_option && (
                              <Badge variant="outline" className="w-fit text-xs">Option</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(component)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(component.id)}
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
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingComponent ? 'Modifier le composant' : 'Ajouter un composant'}
            </DialogTitle>
            <DialogDescription>
              {editingComponent
                ? 'Modifiez les informations du composant'
                : 'Ajoutez un produit au kit'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="component_product_id">ID Produit composant *</Label>
                  <Input
                    id="component_product_id"
                    value={formData.component_product_id || ''}
                    onChange={(e) => setFormData({ ...formData, component_product_id: e.target.value })}
                    placeholder="UUID du produit"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="component_variant_id">ID Variante (optionnel)</Label>
                  <Input
                    id="component_variant_id"
                    value={formData.component_variant_id || ''}
                    onChange={(e) => setFormData({ ...formData, component_variant_id: e.target.value || undefined })}
                    placeholder="UUID de la variante"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity || 1}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_override">Prix override (optionnel)</Label>
                  <Input
                    id="price_override"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_override || ''}
                    onChange={(e) => setFormData({ ...formData, price_override: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_required"
                    checked={formData.is_required ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                  />
                  <Label htmlFor="is_required">Obligatoire</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_option"
                    checked={formData.is_option ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_option: checked })}
                  />
                  <Label htmlFor="is_option">Option</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">
                {editingComponent ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

