/**
 * Auto Reorder Rules Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des règles de réapprovisionnement automatique
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
import { useAutoReorderRules, useSuppliers, AutoReorderRule } from '@/hooks/physical/useSuppliers';
import { useStore } from '@/hooks/useStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Plus, Edit, Trash2, AlertTriangle, Package, RefreshCw, Search, X, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export default function AutoReorderRules() {
  const { store } = useStore();
  const { data: rules, isLoading } = useAutoReorderRules(store?.id);
  const { data: suppliers } = useSuppliers(store?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReorderRule | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AutoReorderRule | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

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

  // Animations
  const actionsRef = useScrollAnimation<HTMLDivElement>();
  const rulesRef = useScrollAnimation<HTMLDivElement>();

  // Filtrer les règles
  const filteredRules = useMemo(() => {
    if (!rules) return [];
    if (!debouncedSearch) return rules;

    const query = debouncedSearch.toLowerCase();
    return rules.filter(rule =>
      (rule.product as any)?.name?.toLowerCase().includes(query) ||
      (rule.supplier as any)?.name?.toLowerCase().includes(query) ||
      rule.product_id?.toLowerCase().includes(query) ||
      rule.variant_id?.toLowerCase().includes(query)
    );
  }, [rules, debouncedSearch]);

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

  const handleOpenDialog = useCallback((rule?: AutoReorderRule) => {
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
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingRule(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  }, [store?.id, editingRule, formData, queryClient, toast, handleCloseDialog]);

  const handleDeleteClick = useCallback((rule: AutoReorderRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!ruleToDelete || !store?.id) return;

    try {
      const { error } = await supabase
        .from('auto_reorder_rules')
        .delete()
        .eq('id', ruleToDelete.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['auto-reorder-rules', store.id] });
      toast({
        title: '✅ Règle supprimée',
        description: 'La règle a été supprimée avec succès',
      });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer la règle',
        variant: 'destructive',
      });
    }
  }, [ruleToDelete, store?.id, queryClient, toast]);

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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher par produit, fournisseur ou ID..."
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
          onClick={() => handleOpenDialog()}
          className="h-10 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle règle</span>
          <span className="sm:hidden">Nouvelle</span>
        </Button>
      </div>

      {/* Rules List */}
      <div
        ref={rulesRef}
        className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {!rules || filteredRules.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
              <RefreshCw className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                {searchInput ? 'Aucune règle trouvée' : 'Aucune règle configurée'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {searchInput
                  ? 'Essayez de modifier votre recherche'
                  : 'Configurez une règle de réapprovisionnement pour commencer'}
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
                    <TableHead className="text-xs sm:text-sm">Fournisseur</TableHead>
                    <TableHead className="text-xs sm:text-sm">Seuil</TableHead>
                    <TableHead className="text-xs sm:text-sm">Quantité</TableHead>
                    <TableHead className="text-xs sm:text-sm">Stock max</TableHead>
                    <TableHead className="text-xs sm:text-sm">Paramètres</TableHead>
                    <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="text-xs sm:text-sm">
                        {(rule.product as any)?.name || rule.product_id || 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {(rule.supplier as any)?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {rule.reorder_point}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="secondary" className="text-xs">
                          <Package className="mr-1 h-3 w-3" />
                          {rule.reorder_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {rule.max_stock_level || '∞'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex flex-col gap-1">
                          {rule.auto_create_order && (
                            <Badge variant="outline" className="text-xs w-fit">Auto-création</Badge>
                          )}
                          {rule.require_approval && (
                            <Badge variant="outline" className="text-xs w-fit">Approbation requise</Badge>
                          )}
                          {rule.notify_on_reorder && (
                            <Badge variant="outline" className="text-xs w-fit">Notifications</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-xs">
                          {rule.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select>
                          <SelectTrigger className="h-8 w-8 p-0">

                              <MoreVertical className="h-4 w-4" />
                            
</SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="edit" onSelect={() => handleOpenDialog(rule)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </SelectItem>
                            <SelectItem value="delete" onSelect={() => handleDeleteClick(rule)}
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
              {filteredRules.map((rule) => (
                <Card
                  key={rule.id}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                            <h3 className="font-medium text-sm sm:text-base truncate">
                              {(rule.product as any)?.name || rule.product_id || 'N/A'}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {(rule.supplier as any)?.name || 'N/A'}
                          </p>
                        </div>
                        <Select>
                          <SelectTrigger className="h-8 w-8 p-0">

                              <MoreVertical className="h-4 w-4" />
                            
</SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="copy" onSelect={() => handleOpenDialog(rule)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </SelectItem>
                            <SelectItem value="view" onSelect={() => handleDeleteClick(rule)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Seuil:</span>
                        <Badge variant="outline" className="text-xs">{rule.reorder_point}</Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Quantité:</span>
                        <Badge variant="secondary" className="text-xs">{rule.reorder_quantity}</Badge>
                      </div>

                      {rule.max_stock_level && (
                        <div className="text-xs sm:text-sm">
                          <span className="text-muted-foreground">Stock max: </span>
                          <span className="font-medium">{rule.max_stock_level}</span>
                        </div>
                      )}

                      {(rule.auto_create_order || rule.require_approval || rule.notify_on_reorder) && (
                        <div className="flex flex-wrap gap-1 text-xs">
                          {rule.auto_create_order && (
                            <Badge variant="outline" className="text-xs">Auto-création</Badge>
                          )}
                          {rule.require_approval && (
                            <Badge variant="outline" className="text-xs">Approbation requise</Badge>
                          )}
                          {rule.notify_on_reorder && (
                            <Badge variant="outline" className="text-xs">Notifications</Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-xs">
                          {rule.is_active ? 'Actif' : 'Inactif'}
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingRule ? 'Modifier la règle' : 'Nouvelle règle de réapprovisionnement'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingRule
                ? 'Modifiez les paramètres de la règle'
                : 'Configurez une nouvelle règle de réapprovisionnement automatique'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id" className="text-xs sm:text-sm">ID Produit</Label>
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

              <div className="space-y-2">
                <Label htmlFor="supplier_id" className="text-xs sm:text-sm">Fournisseur *</Label>
                <Select
                  value={formData.supplier_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  required
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reorder_point" className="text-xs sm:text-sm">Seuil de réapprovisionnement *</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    min="0"
                    value={formData.reorder_point || 10}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })
                    }
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_quantity" className="text-xs sm:text-sm">Quantité à commander *</Label>
                  <Input
                    id="reorder_quantity"
                    type="number"
                    min="1"
                    value={formData.reorder_quantity || 50}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })
                    }
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_stock_level" className="text-xs sm:text-sm">Stock maximum</Label>
                  <Input
                    id="max_stock_level"
                    type="number"
                    min="0"
                    value={formData.max_stock_level || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, max_stock_level: parseInt(e.target.value) || undefined })
                    }
                    className="text-sm"
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
                  <Label htmlFor="is_active" className="text-xs sm:text-sm">Règle active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_create_order"
                    checked={formData.auto_create_order ?? true}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_create_order: checked })
                    }
                  />
                  <Label htmlFor="auto_create_order" className="text-xs sm:text-sm">Créer automatiquement la commande</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_approval"
                    checked={formData.require_approval ?? false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, require_approval: checked })
                    }
                  />
                  <Label htmlFor="require_approval" className="text-xs sm:text-sm">Approbation requise</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify_on_reorder"
                    checked={formData.notify_on_reorder ?? true}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, notify_on_reorder: checked })
                    }
                  />
                  <Label htmlFor="notify_on_reorder" className="text-xs sm:text-sm">Notifier lors du réapprovisionnement</Label>
                </div>
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
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto text-sm">
                Annuler
              </Button>
              <Button type="submit" className="w-full sm:w-auto text-sm">
                {editingRule ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Supprimer la règle</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Êtes-vous sûr de vouloir supprimer cette règle ? Cette action est irréversible.
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






