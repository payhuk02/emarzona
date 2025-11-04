/**
 * Auto Reorder Rules Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des règles de réapprovisionnement automatique
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
import { useAutoReorderRules, useSuppliers, AutoReorderRule } from '@/hooks/physical/useSuppliers';
import { useStore } from '@/hooks/useStore';
import { Plus, Edit, Trash2, AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function AutoReorderRules() {
  const { store } = useStore();
  const { data: rules, isLoading } = useAutoReorderRules(store?.id);
  const { data: suppliers } = useSuppliers(store?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReorderRule | null>(null);
  const [formData, setFormData] = useState<Partial<AutoReorderRule>>({
    product_id: '',
    variant_id: '',
    supplier_id: '',
    reorder_point: 10,
    reorder_quantity: 50,
    max_stock_level: 100,
    is_active: true,
    auto_create_order: true,
    require_approval: false,
    notify_on_reorder: true,
    notify_email: [],
    notes: '',
  });

  const handleOpenDialog = (rule?: AutoReorderRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData(rule);
    } else {
      setEditingRule(null);
      setFormData({
        product_id: '',
        variant_id: '',
        supplier_id: '',
        reorder_point: 10,
        reorder_quantity: 50,
        max_stock_level: 100,
        is_active: true,
        auto_create_order: true,
        require_approval: false,
        notify_on_reorder: true,
        notify_email: [],
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      if (editingRule) {
        // Update
        const { error } = await supabase
          .from('auto_reorder_rules')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRule.id);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['auto-reorder-rules', store.id] });
        toast({
          title: '✅ Règle mise à jour',
          description: 'La règle de réapprovisionnement a été mise à jour',
        });
      } else {
        // Create
        const { error } = await supabase
          .from('auto_reorder_rules')
          .insert({
            ...formData,
            store_id: store.id,
          })
          .select()
          .single();

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['auto-reorder-rules', store.id] });
        toast({
          title: '✅ Règle créée',
          description: 'La règle de réapprovisionnement a été créée',
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

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) return;

    try {
      const { error } = await supabase
        .from('auto_reorder_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['auto-reorder-rules', store?.id] });
      toast({
        title: '✅ Règle supprimée',
        description: 'La règle a été supprimée avec succès',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer la règle',
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
          <h2 className="text-2xl font-bold tracking-tight">Règles de Réapprovisionnement</h2>
          <p className="text-muted-foreground">
            Configurez les règles de réapprovisionnement automatique
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle règle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Règles actives</CardTitle>
          <CardDescription>
            {rules?.length || 0} règle{(rules?.length || 0) > 1 ? 's' : ''} configurée{(rules?.length || 0) > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Seuil</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Stock max</TableHead>
                  <TableHead>Paramètres</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!rules || rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Aucune règle configurée
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        {(rule.product as any)?.name || rule.product_id || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {(rule.supplier as any)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {rule.reorder_point}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Package className="mr-1 h-3 w-3" />
                          {rule.reorder_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.max_stock_level || '∞'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {rule.auto_create_order && (
                            <Badge variant="outline" className="w-fit">Auto-création</Badge>
                          )}
                          {rule.require_approval && (
                            <Badge variant="outline" className="w-fit">Approbation requise</Badge>
                          )}
                          {rule.notify_on_reorder && (
                            <Badge variant="outline" className="w-fit">Notifications</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Modifier la règle' : 'Nouvelle règle de réapprovisionnement'}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? 'Modifiez les paramètres de la règle'
                : 'Configurez une nouvelle règle de réapprovisionnement automatique'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id">ID Produit</Label>
                  <Input
                    id="product_id"
                    value={formData.product_id || ''}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    placeholder="UUID du produit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant_id">ID Variante (optionnel)</Label>
                  <Input
                    id="variant_id"
                    value={formData.variant_id || ''}
                    onChange={(e) => setFormData({ ...formData, variant_id: e.target.value })}
                    placeholder="UUID de la variante"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_id">Fournisseur *</Label>
                <Select
                  value={formData.supplier_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reorder_point">Seuil de réapprovisionnement *</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    min="0"
                    value={formData.reorder_point || 10}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_quantity">Quantité à commander *</Label>
                  <Input
                    id="reorder_quantity"
                    type="number"
                    min="1"
                    value={formData.reorder_quantity || 50}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_stock_level">Stock maximum</Label>
                  <Input
                    id="max_stock_level"
                    type="number"
                    min="0"
                    value={formData.max_stock_level || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, max_stock_level: parseInt(e.target.value) || undefined })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Règle active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_create_order"
                    checked={formData.auto_create_order ?? true}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_create_order: checked })
                    }
                  />
                  <Label htmlFor="auto_create_order">Créer automatiquement la commande</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_approval"
                    checked={formData.require_approval ?? false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, require_approval: checked })
                    }
                  />
                  <Label htmlFor="require_approval">Approbation requise</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify_on_reorder"
                    checked={formData.notify_on_reorder ?? true}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, notify_on_reorder: checked })
                    }
                  />
                  <Label htmlFor="notify_on_reorder">Notifier lors du réapprovisionnement</Label>
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">
                {editingRule ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

