/**
 * Supplier Products Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des produits fournisseurs (catalogue, coûts, disponibilité)
 */

import { useState, useRef, useMemo, useCallback } from 'react';
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
import { useSupplierProducts, useSuppliers, SupplierProduct } from '@/hooks/physical/useSuppliers';
import { useStore } from '@/hooks/useStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Plus, Edit, Trash2, Package, Search, DollarSign, Clock, X, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export default function SupplierProducts() {
  const { store } = useStore();
  const { data: suppliers } = useSuppliers(store?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const { data: products, isLoading } = useSupplierProducts(selectedSupplier);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<SupplierProduct | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

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

  // Animations
  const actionsRef = useScrollAnimation<HTMLDivElement>();
  const productsRef = useScrollAnimation<HTMLDivElement>();

  // Filtrer les produits
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!debouncedSearch) return products;

    const query = debouncedSearch.toLowerCase();
    return products.filter(product =>
      product.supplier_product_name?.toLowerCase().includes(query) ||
      product.supplier_sku?.toLowerCase().includes(query) ||
      (product.product as any)?.name?.toLowerCase().includes(query)
    );
  }, [products, debouncedSearch]);

  // Gestion du clavier pour la recherche
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInputRef.current?.focus();
    } else if (e.key === 'Escape') {
      setSearchInput('');
      searchInputRef.current?.blur();
    }
  }, []);

  const handleOpenDialog = useCallback((product?: SupplierProduct, supplierId?: string) => {
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
  }, [selectedSupplier]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  }, [formData, editingProduct, queryClient, toast, handleCloseDialog]);

  const handleDeleteClick = useCallback((product: SupplierProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!productToDelete || !selectedSupplier) return;

    try {
      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['supplier-products', selectedSupplier] });
      toast({
        title: '✅ Produit supprimé',
        description: 'Le produit a été supprimé avec succès',
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer le produit',
        variant: 'destructive',
      });
    }
  }, [productToDelete, selectedSupplier, queryClient, toast]);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-auto" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Actions */}
      <div
        ref={actionsRef}
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier} className="flex-1 sm:flex-none sm:w-64">
          <SelectTrigger className="h-10 sm:h-11 text-sm">
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
          <>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher par nom, SKU ou produit..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-9 h-10 sm:h-11 text-sm"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchInput('')}
                  aria-label="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center gap-1.5 pointer-events-none">
                <Badge variant="outline" className="text-xs font-mono">
                  ⌘K
                </Badge>
              </div>
            </div>
            <Button 
              onClick={() => handleOpenDialog(undefined, selectedSupplier)}
              className="h-10 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Ajouter un produit</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </>
        )}
      </div>

      {/* Products List */}
      <div
        ref={productsRef}
        className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {!selectedSupplier ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                Sélectionnez un fournisseur
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Choisissez un fournisseur pour voir ses produits
              </p>
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                {searchInput ? 'Aucun produit trouvé' : 'Aucun produit'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {searchInput
                  ? 'Essayez de modifier votre recherche'
                  : 'Ajoutez un produit pour commencer'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Produit</TableHead>
                    <TableHead className="text-xs sm:text-sm">SKU Fournisseur</TableHead>
                    <TableHead className="text-xs sm:text-sm">Coût unitaire</TableHead>
                    <TableHead className="text-xs sm:text-sm">Quantité min</TableHead>
                    <TableHead className="text-xs sm:text-sm">Délai</TableHead>
                    <TableHead className="text-xs sm:text-sm">Disponibilité</TableHead>
                    <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {product.supplier_product_name || (product.product as any)?.name || 'N/A'}
                            </div>
                          </div>
                          {product.is_preferred && (
                            <Badge variant="outline" className="text-xs shrink-0">Préféré</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {product.supplier_sku || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: product.currency || 'XOF',
                          }).format(product.unit_cost)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="outline" className="text-xs">{product.minimum_order_quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {product.lead_time_days} jour{product.lead_time_days > 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex flex-col gap-1">
                          <Badge variant={product.is_available ? 'default' : 'secondary'} className="text-xs w-fit">
                            {product.is_available ? 'Disponible' : 'Indisponible'}
                          </Badge>
                          {product.stock_available !== undefined && (
                            <Badge variant={product.stock_available ? 'outline' : 'destructive'} className="text-xs w-fit">
                              {product.stock_available ? 'En stock' : 'Rupture'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-xs">
                          {product.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select>
                          <SelectTrigger
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions pour le produit ${product.name || product.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="edit" onSelect onSelect={() => handleOpenDialog(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </SelectItem>
                            <SelectItem value="delete" onSelect
                              onSelect={() => handleDeleteClick(product)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                            <h3 className="font-medium text-sm sm:text-base truncate">
                              {product.supplier_product_name || (product.product as any)?.name || 'N/A'}
                            </h3>
                            {product.is_preferred && (
                              <Badge variant="outline" className="text-xs shrink-0">Préféré</Badge>
                            )}
                          </div>
                          {product.supplier_sku && (
                            <p className="text-xs text-muted-foreground truncate">
                              SKU: {product.supplier_sku}
                            </p>
                          )}
                        </div>
                        <Select>
                          <SelectTrigger
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions pour le produit ${product.name || product.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="copy" onSelect onSelect={() => handleOpenDialog(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </SelectItem>
                            <SelectItem value="view" onSelect
                              onSelect={() => handleDeleteClick(product)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: product.currency || 'XOF',
                          }).format(product.unit_cost)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">
                          Délai: {product.lead_time_days} jour{product.lead_time_days > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                        <Badge variant="outline" className="text-xs">
                          Min: {product.minimum_order_quantity}
                        </Badge>
                        <Badge variant={product.is_available ? 'default' : 'secondary'} className="text-xs">
                          {product.is_available ? 'Disponible' : 'Indisponible'}
                        </Badge>
                        {product.stock_available !== undefined && (
                          <Badge variant={product.stock_available ? 'outline' : 'destructive'} className="text-xs">
                            {product.stock_available ? 'En stock' : 'Rupture'}
                          </Badge>
                        )}
                        <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-xs ml-auto">
                          {product.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit fournisseur'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingProduct
                ? 'Modifiez les informations du produit'
                : 'Ajoutez un nouveau produit au catalogue fournisseur'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id" className="text-xs sm:text-sm">Fournisseur *</Label>
                <Select
                  value={formData.supplier_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  required
                  disabled={!!editingProduct}
                >
                  <SelectTrigger className="text-sm">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id" className="text-xs sm:text-sm">ID Produit (optionnel)</Label>
                  <Input
                    id="product_id"
                    value={formData.product_id || ''}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    placeholder="UUID du produit"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant_id" className="text-xs sm:text-sm">ID Variante (optionnel)</Label>
                  <Input
                    id="variant_id"
                    value={formData.variant_id || ''}
                    onChange={(e) => setFormData({ ...formData, variant_id: e.target.value })}
                    placeholder="UUID de la variante"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_sku" className="text-xs sm:text-sm">SKU Fournisseur</Label>
                  <Input
                    id="supplier_sku"
                    value={formData.supplier_sku || ''}
                    onChange={(e) => setFormData({ ...formData, supplier_sku: e.target.value })}
                    placeholder="Référence produit fournisseur"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_product_name" className="text-xs sm:text-sm">Nom produit fournisseur</Label>
                  <Input
                    id="supplier_product_name"
                    value={formData.supplier_product_name || ''}
                    onChange={(e) => setFormData({ ...formData, supplier_product_name: e.target.value })}
                    placeholder="Nom du produit chez le fournisseur"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_cost" className="text-xs sm:text-sm">Coût unitaire *</Label>
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
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-xs sm:text-sm">Devise</Label>
                  <Select
                    value={formData.currency || 'XOF'}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="text-sm">
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
                  <Label htmlFor="minimum_order_quantity" className="text-xs sm:text-sm">Quantité minimum *</Label>
                  <Input
                    id="minimum_order_quantity"
                    type="number"
                    min="1"
                    value={formData.minimum_order_quantity || 1}
                    onChange={(e) =>
                      setFormData({ ...formData, minimum_order_quantity: parseInt(e.target.value) || 1 })
                    }
                    required
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_time_days" className="text-xs sm:text-sm">Délai de livraison (jours) *</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    min="0"
                    value={formData.lead_time_days || 7}
                    onChange={(e) =>
                      setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })
                    }
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_delivery_days" className="text-xs sm:text-sm">Délai estimé (jours)</Label>
                  <Input
                    id="estimated_delivery_days"
                    type="number"
                    min="0"
                    value={formData.estimated_delivery_days || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_delivery_days: parseInt(e.target.value) || undefined })
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="catalog_url" className="text-xs sm:text-sm">URL Catalogue</Label>
                <Input
                  id="catalog_url"
                  type="url"
                  value={formData.catalog_url || ''}
                  onChange={(e) => setFormData({ ...formData, catalog_url: e.target.value })}
                  placeholder="https://..."
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs sm:text-sm">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="text-xs sm:text-sm">Actif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                  <Label htmlFor="is_available" className="text-xs sm:text-sm">Disponible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stock_available"
                    checked={formData.stock_available ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, stock_available: checked })}
                  />
                  <Label htmlFor="stock_available" className="text-xs sm:text-sm">En stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_preferred"
                    checked={formData.is_preferred ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_preferred: checked })}
                  />
                  <Label htmlFor="is_preferred" className="text-xs sm:text-sm">Fournisseur préféré</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto text-sm">
                Annuler
              </Button>
              <Button type="submit" className="w-full sm:w-auto text-sm">
                {editingProduct ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Supprimer le produit</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto text-sm">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onSelect={handleDelete}
              className="w-full sm:w-auto text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}






