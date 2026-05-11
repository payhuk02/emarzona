/**
 * Product Kits Management Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des kits produits (création, édition, gestion composants)
 * Design responsive avec cards sur mobile et table sur desktop
 */

import { useState, useMemo, useRef, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Package, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

export default function ProductKitsManagement() {
  const { store } = useStore();
  const { data: kits = [], isLoading } = useProductKits(store?.id);
  const createKit = useCreateProductKit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<ProductKit | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchInput, 300);
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
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Une erreur est survenue',
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
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer le kit',
        variant: 'destructive',
      });
    }
  };

  // Filtrer les kits par recherche
  const filteredKits = useMemo(() => {
    return kits.filter((kit) => {
      const matchesSearch = !debouncedSearch || 
        kit.kit_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (kit.kit_product as any)?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        kit.kit_description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    });
  }, [kits, debouncedSearch]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchInput) {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInput]);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Bar and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher par nom, description ou produit..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9 h-10 sm:h-11 text-sm"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchInput('')}
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
          onClick={() => handleOpenDialog()}
          className="h-10 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Créer un kit</span>
          <span className="sm:hidden">Créer</span>
        </Button>
      </div>

      {/* Kits List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Liste des kits</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredKits.length} kit{filteredKits.length > 1 ? 's' : ''}
            {debouncedSearch && ` trouvé${filteredKits.length > 1 ? 's' : ''} pour "${debouncedSearch}"`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {filteredKits.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                {debouncedSearch ? 'Aucun kit trouvé' : 'Aucun kit trouvé'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {debouncedSearch
                  ? `Aucun résultat pour "${debouncedSearch}". Essayez un autre terme de recherche.`
                  : 'Créez votre premier kit produit pour commencer'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
                    {filteredKits.map((kit) => (
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
                          <div className="flex flex-wrap gap-1 text-xs">
                            {kit.requires_assembly && (
                              <Badge variant="outline" className="w-fit">Assemblage</Badge>
                            )}
                            {kit.track_kit_inventory && (
                              <Badge variant="outline" className="w-fit">Inventaire</Badge>
                            )}
                            {kit.auto_allocate && (
                              <Badge variant="outline" className="w-fit">Auto</Badge>
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredKits.map((kit) => (
                  <Card
                    key={kit.id}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                              <h3 className="font-medium text-sm sm:text-base truncate">
                                {kit.kit_name}
                              </h3>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(kit.kit_product as any)?.name || 'N/A'}
                            </p>
                          </div>
                          <Badge variant={kit.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {kit.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Badge variant="secondary" className="text-xs">
                            {kit.kit_type}
                          </Badge>
                          {kit.kit_price && (
                            <span className="font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                              }).format(kit.kit_price)}
                            </span>
                          )}
                        </div>

                        {(kit.requires_assembly || kit.track_kit_inventory || kit.auto_allocate) && (
                          <div className="flex flex-wrap gap-1 text-xs">
                            {kit.requires_assembly && (
                              <Badge variant="outline" className="text-xs">Assemblage</Badge>
                            )}
                            {kit.track_kit_inventory && (
                              <Badge variant="outline" className="text-xs">Inventaire</Badge>
                            )}
                            {kit.auto_allocate && (
                              <Badge variant="outline" className="text-xs">Auto</Badge>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(kit)}
                            className="text-xs h-8"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(kit.id)}
                            className="text-xs h-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingKit ? 'Modifier le kit' : 'Nouveau kit produit'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingKit
                ? 'Modifiez les informations du kit'
                : 'Créez un nouveau kit composé de plusieurs produits'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kit_product_id" className="text-xs sm:text-sm">ID Produit principal *</Label>
                  <Input
                    id="kit_product_id"
                    value={formData.kit_product_id || ''}
                    onChange={(e) => setFormData({ ...formData, kit_product_id: e.target.value })}
                    placeholder="UUID du produit"
                    className="text-sm h-9 sm:h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kit_name" className="text-xs sm:text-sm">Nom du kit *</Label>
                  <Input
                    id="kit_name"
                    value={formData.kit_name || ''}
                    onChange={(e) => setFormData({ ...formData, kit_name: e.target.value })}
                    className="text-sm h-9 sm:h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kit_type" className="text-xs sm:text-sm">Type de kit *</Label>
                <Select
                  value={formData.kit_type || 'fixed'}
                  onValueChange={(value: string) => setFormData({ ...formData, kit_type: value })}
                  required
                >
                  <SelectTrigger className="text-sm h-9 sm:h-10">
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
                <Label htmlFor="kit_description" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="kit_description"
                  value={formData.kit_description || ''}
                  onChange={(e) => setFormData({ ...formData, kit_description: e.target.value })}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              {formData.kit_type === 'flexible' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_items" className="text-xs sm:text-sm">Minimum d'items</Label>
                    <Input
                      id="min_items"
                      type="number"
                      min="1"
                      value={formData.min_items || 1}
                      onChange={(e) => setFormData({ ...formData, min_items: parseInt(e.target.value) || 1 })}
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_items" className="text-xs sm:text-sm">Maximum d'items</Label>
                    <Input
                      id="max_items"
                      type="number"
                      min="1"
                      value={formData.max_items || ''}
                      onChange={(e) => setFormData({ ...formData, max_items: parseInt(e.target.value) || undefined })}
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kit_price" className="text-xs sm:text-sm">Prix du kit (optionnel)</Label>
                  <Input
                    id="kit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.kit_price || ''}
                    onChange={(e) => setFormData({ ...formData, kit_price: parseFloat(e.target.value) || undefined })}
                    placeholder="Auto si vide"
                    className="text-sm h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage" className="text-xs sm:text-sm">Réduction (%)</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discount_percentage || 0}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="text-sm h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_amount" className="text-xs sm:text-sm">Réduction (montant)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount || 0}
                    onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="text-sm h-9 sm:h-10"
                  />
                </div>
              </div>

              {formData.requires_assembly && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assembly_time_minutes" className="text-xs sm:text-sm">Temps d'assemblage (minutes)</Label>
                    <Input
                      id="assembly_time_minutes"
                      type="number"
                      min="0"
                      value={formData.assembly_time_minutes || ''}
                      onChange={(e) => setFormData({ ...formData, assembly_time_minutes: parseInt(e.target.value) || undefined })}
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assembly_instructions" className="text-xs sm:text-sm">Instructions d'assemblage</Label>
                    <Input
                      id="assembly_instructions"
                      value={formData.assembly_instructions || ''}
                      onChange={(e) => setFormData({ ...formData, assembly_instructions: e.target.value })}
                      placeholder="URL ou référence"
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 pt-2 border-t border-border/50">
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
                    id="requires_assembly"
                    checked={formData.requires_assembly ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_assembly: checked })}
                  />
                  <Label htmlFor="requires_assembly" className="text-xs sm:text-sm">Nécessite assemblage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="track_kit_inventory"
                    checked={formData.track_kit_inventory ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, track_kit_inventory: checked })}
                  />
                  <Label htmlFor="track_kit_inventory" className="text-xs sm:text-sm">Suivre inventaire kit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_allocate"
                    checked={formData.auto_allocate ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_allocate: checked })}
                  />
                  <Label htmlFor="auto_allocate" className="text-xs sm:text-sm">Allocation automatique</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseDialog}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createKit.isPending}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {editingKit ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}







