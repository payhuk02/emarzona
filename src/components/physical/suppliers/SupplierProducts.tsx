/**
 * Supplier Products Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des produits fournisseurs (catalogue, coûts, disponibilité)
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
import { useSupplierProducts, useSuppliers, SupplierProduct } from '@/hooks/physical/useSuppliers';
import { useStore } from '@/hooks/useStore';
import { Plus, Edit, Trash2, Package, Search, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function SupplierProducts() {
  const { store } = useStore();
  const { data: suppliers } = useSuppliers(store?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const { data: products, isLoading } = useSupplierProducts(selectedSupplier);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<SupplierProduct>>({
    supplier_id: '',
    product_id: '',
    variant_id: '',
    supplier_sku: '',
    supplier_product_name: '',
    unit_cost: 0,
    currency: 'XOF',
    minimum_order_quantity: 1,
    bulk_pricing: [],
    lead_time_days: 7,
    estimated_delivery_days: 7,
    is_available: true,
    stock_available: true,
    notes: '',
    catalog_url: '',
    is_active: true,
    is_preferred: false,
  });

  const handleOpenDialog = (product?: SupplierProduct, supplierId?: string) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        supplier_id: supplierId || selectedSupplier || '',
        product_id: '',
        variant_id: '',
        supplier_sku: '',
        supplier_product_name: '',
        unit_cost: 0,
        currency: 'XOF',
        minimum_order_quantity: 1,
        bulk_pricing: [],
        lead_time_days: 7,
        estimated_delivery_days: 7,
        is_available: true,
        stock_available: true,
        notes: '',
        catalog_url: '',
        is_active: true,
        is_preferred: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      toast({
        title: '❌ Erreur',
        description: 'Veuillez sélectionner un fournisseur',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingProduct) {
        // Update
        const { error } = await supabase
          .from('supplier_products')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProduct.id);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['supplier-products', formData.supplier_id] });
        toast({
          title: '✅ Produit mis à jour',
          description: 'Le produit fournisseur a été mis à jour',
        });
      } else {
        // Create
        const { error } = await supabase
          .from('supplier_products')
          .insert({
            ...formData,
          })
          .select()
          .single();

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['supplier-products', formData.supplier_id] });
        toast({
          title: '✅ Produit créé',
          description: 'Le produit fournisseur a été créé',
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

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['supplier-products', selectedSupplier] });
      toast({
        title: '✅ Produit supprimé',
        description: 'Le produit a été supprimé avec succès',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer le produit',
        variant: 'destructive',
      });
    }
  };

  const filteredProducts = products?.filter(product =>
    product.supplier_product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.supplier_sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.product as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h2 className="text-2xl font-bold tracking-tight">Produits Fournisseurs</h2>
          <p className="text-muted-foreground">
            Gérez le catalogue et les coûts des produits de vos fournisseurs
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-64">
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
          {selectedSupplier && (
            <Button onClick={() => handleOpenDialog(undefined, selectedSupplier)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          )}
        </div>
      </div>

      {!selectedSupplier ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Sélectionnez un fournisseur pour voir ses produits
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Catalogue produits</CardTitle>
                <CardDescription>
                  {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Input
                placeholder="Rechercher un produit..."
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
                    <TableHead>Produit</TableHead>
                    <TableHead>SKU Fournisseur</TableHead>
                    <TableHead>Coût unitaire</TableHead>
                    <TableHead>Quantité min</TableHead>
                    <TableHead>Délai</TableHead>
                    <TableHead>Disponibilité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {product.supplier_product_name || (product.product as any)?.name || 'N/A'}
                              </div>
                            </div>
                            {product.is_preferred && (
                              <Badge variant="outline" className="text-xs">Préféré</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {product.supplier_sku || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: product.currency || 'XOF',
                            }).format(product.unit_cost)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.minimum_order_quantity}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {product.lead_time_days} jour{product.lead_time_days > 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={product.is_available ? 'default' : 'secondary'}>
                              {product.is_available ? 'Disponible' : 'Indisponible'}
                            </Badge>
                            {product.stock_available !== undefined && (
                              <Badge variant={product.stock_available ? 'outline' : 'destructive'}>
                                {product.stock_available ? 'En stock' : 'Rupture'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit fournisseur'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Modifiez les informations du produit'
                : 'Ajoutez un nouveau produit au catalogue fournisseur'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Fournisseur *</Label>
                <Select
                  value={formData.supplier_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  required
                  disabled={!!editingProduct}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id">ID Produit (optionnel)</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_sku">SKU Fournisseur</Label>
                  <Input
                    id="supplier_sku"
                    value={formData.supplier_sku || ''}
                    onChange={(e) => setFormData({ ...formData, supplier_sku: e.target.value })}
                    placeholder="Référence produit fournisseur"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_product_name">Nom produit fournisseur</Label>
                  <Input
                    id="supplier_product_name"
                    value={formData.supplier_product_name || ''}
                    onChange={(e) => setFormData({ ...formData, supplier_product_name: e.target.value })}
                    placeholder="Nom du produit chez le fournisseur"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Coût unitaire *</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_cost || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    value={formData.currency || 'XOF'}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
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
                <div className="space-y-2">
                  <Label htmlFor="minimum_order_quantity">Quantité minimum *</Label>
                  <Input
                    id="minimum_order_quantity"
                    type="number"
                    min="1"
                    value={formData.minimum_order_quantity || 1}
                    onChange={(e) =>
                      setFormData({ ...formData, minimum_order_quantity: parseInt(e.target.value) || 1 })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_time_days">Délai de livraison (jours) *</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    min="0"
                    value={formData.lead_time_days || 7}
                    onChange={(e) =>
                      setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_delivery_days">Délai estimé (jours)</Label>
                  <Input
                    id="estimated_delivery_days"
                    type="number"
                    min="0"
                    value={formData.estimated_delivery_days || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_delivery_days: parseInt(e.target.value) || undefined })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="catalog_url">URL Catalogue</Label>
                <Input
                  id="catalog_url"
                  type="url"
                  value={formData.catalog_url || ''}
                  onChange={(e) => setFormData({ ...formData, catalog_url: e.target.value })}
                  placeholder="https://..."
                />
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
                    id="is_available"
                    checked={formData.is_available ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                  <Label htmlFor="is_available">Disponible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stock_available"
                    checked={formData.stock_available ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, stock_available: checked })}
                  />
                  <Label htmlFor="stock_available">En stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_preferred"
                    checked={formData.is_preferred ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_preferred: checked })}
                  />
                  <Label htmlFor="is_preferred">Fournisseur préféré</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">
                {editingProduct ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

