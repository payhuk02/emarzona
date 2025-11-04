/**
 * Warranties Management Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des garanties produits (pour admins/store owners)
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
import { useStore } from '@/hooks/useStore';
import { Plus, Edit, Trash2, Shield, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ProductWarranty } from '@/hooks/physical/useWarranties';

export default function WarrantiesManagement() {
  const { store } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<ProductWarranty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [productId, setProductId] = useState<string>('');
  const [warranties, setWarranties] = useState<ProductWarranty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ProductWarranty>>({
    warranty_type: 'store',
    warranty_name: '',
    description: '',
    duration_months: 12,
    starts_from: 'purchase',
    coverage_type: 'full',
    coverage_details: {},
    requires_registration: false,
    requires_invoice: true,
    transferable: false,
    transfer_fee: 0,
    is_active: true,
    is_default: false,
  });

  const loadWarranties = async () => {
    if (!productId) {
      setWarranties([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_warranties')
        .select('*')
        .eq('product_id', productId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setWarranties(data || []);
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de charger les garanties',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (warranty?: ProductWarranty) => {
    if (warranty) {
      setEditingWarranty(warranty);
      setFormData(warranty);
    } else {
      setEditingWarranty(null);
      setFormData({
        warranty_type: 'store',
        warranty_name: '',
        description: '',
        duration_months: 12,
        starts_from: 'purchase',
        coverage_type: 'full',
        coverage_details: {},
        requires_registration: false,
        requires_invoice: true,
        transferable: false,
        transfer_fee: 0,
        is_active: true,
        is_default: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingWarranty(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !productId) return;

    try {
      if (editingWarranty) {
        // Update
        const { error } = await supabase
          .from('product_warranties')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingWarranty.id);

        if (error) throw error;

        toast({
          title: '✅ Garantie mise à jour',
          description: 'La garantie a été mise à jour avec succès',
        });
      } else {
        // Create
        const { error } = await supabase
          .from('product_warranties')
          .insert({
            ...formData,
            store_id: store.id,
            product_id: productId,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: '✅ Garantie créée',
          description: 'La garantie a été créée avec succès',
        });
      }
      handleCloseDialog();
      loadWarranties();
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (warrantyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette garantie ?')) return;

    try {
      const { error } = await supabase
        .from('product_warranties')
        .delete()
        .eq('id', warrantyId);

      if (error) throw error;

      toast({
        title: '✅ Garantie supprimée',
        description: 'La garantie a été supprimée avec succès',
      });
      loadWarranties();
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer la garantie',
        variant: 'destructive',
      });
    }
  };

  const filteredWarranties = warranties.filter(warranty =>
    warranty.warranty_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warranty.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Garanties</h2>
          <p className="text-muted-foreground">
            Configurez les garanties pour vos produits
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Sélectionnez un produit pour gérer ses garanties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="product_id">ID Produit</Label>
              <Input
                id="product_id"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="UUID du produit"
              />
            </div>
            <Button onClick={loadWarranties} disabled={!productId}>
              Charger
            </Button>
            {productId && (
              <Button onClick={() => handleOpenDialog()} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une garantie
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {productId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Garanties du produit</CardTitle>
                <CardDescription>
                  {filteredWarranties.length} garantie{filteredWarranties.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Couverture</TableHead>
                      <TableHead>Configuration</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarranties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Aucune garantie trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWarranties.map((warranty) => (
                        <TableRow key={warranty.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{warranty.warranty_name}</div>
                                {warranty.is_default && (
                                  <Badge variant="outline" className="text-xs mt-1">Par défaut</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{warranty.warranty_type}</Badge>
                          </TableCell>
                          <TableCell>{warranty.duration_months} mois</TableCell>
                          <TableCell>
                            <Badge variant="outline">{warranty.coverage_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-xs">
                              {warranty.requires_registration && (
                                <Badge variant="outline" className="w-fit">Enregistrement requis</Badge>
                              )}
                              {warranty.transferable && (
                                <Badge variant="outline" className="w-fit">Transférable</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={warranty.is_active ? 'default' : 'secondary'}>
                              {warranty.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(warranty)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(warranty.id)}
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWarranty ? 'Modifier la garantie' : 'Nouvelle garantie'}
            </DialogTitle>
            <DialogDescription>
              {editingWarranty
                ? 'Modifiez les informations de la garantie'
                : 'Configurez une nouvelle garantie pour le produit'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warranty_type">Type de garantie *</Label>
                  <Select
                    value={formData.warranty_type || 'store'}
                    onValueChange={(value: any) => setFormData({ ...formData, warranty_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Constructeur</SelectItem>
                      <SelectItem value="store">Magasin</SelectItem>
                      <SelectItem value="extended">Étendue</SelectItem>
                      <SelectItem value="international">Internationale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty_name">Nom de la garantie *</Label>
                  <Input
                    id="warranty_name"
                    value={formData.warranty_name || ''}
                    onChange={(e) => setFormData({ ...formData, warranty_name: e.target.value })}
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
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_months">Durée (mois) *</Label>
                  <Input
                    id="duration_months"
                    type="number"
                    min="1"
                    value={formData.duration_months || 12}
                    onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || 12 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="starts_from">Début *</Label>
                  <Select
                    value={formData.starts_from || 'purchase'}
                    onValueChange={(value: any) => setFormData({ ...formData, starts_from: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Achat</SelectItem>
                      <SelectItem value="manufacture">Fabrication</SelectItem>
                      <SelectItem value="delivery">Livraison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverage_type">Couverture *</Label>
                  <Select
                    value={formData.coverage_type || 'full'}
                    onValueChange={(value: any) => setFormData({ ...formData, coverage_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Complète</SelectItem>
                      <SelectItem value="parts_only">Pièces uniquement</SelectItem>
                      <SelectItem value="labor_only">Main d'œuvre uniquement</SelectItem>
                      <SelectItem value="partial">Partielle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Par défaut</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_registration"
                    checked={formData.requires_registration ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_registration: checked })}
                  />
                  <Label htmlFor="requires_registration">Enregistrement requis</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="transferable"
                    checked={formData.transferable ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, transferable: checked })}
                  />
                  <Label htmlFor="transferable">Transférable</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">
                {editingWarranty ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

