/**
 * Suppliers Management Component
 * Date: 27 Janvier 2025
 * 
 * Gestion complète des fournisseurs (liste, création, édition, suppression)
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
import { useSuppliers, useCreateSupplier, Supplier } from '@/hooks/physical/useSuppliers';
import { useStore } from '@/hooks/useStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Plus, Edit, Trash2, Building2, Star, Mail, Phone, Globe, MapPin, Search, X, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export default function SuppliersManagement() {
  const { store } = useStore();
  const { data: suppliers, isLoading } = useSuppliers(store?.id);
  const createSupplier = useCreateSupplier();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'SN',
    payment_terms: '',
    currency: 'XOF',
    tax_id: '',
    notes: '',
    tags: [],
    is_active: true,
    is_preferred: false,
  });

  // Animations
  const actionsRef = useScrollAnimation<HTMLDivElement>();
  const suppliersRef = useScrollAnimation<HTMLDivElement>();

  // Filtrer les fournisseurs
  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!debouncedSearch) return suppliers;

    const query = debouncedSearch.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(query) ||
      supplier.company_name?.toLowerCase().includes(query) ||
      supplier.email?.toLowerCase().includes(query) ||
      supplier.phone?.toLowerCase().includes(query) ||
      supplier.city?.toLowerCase().includes(query)
    );
  }, [suppliers, debouncedSearch]);

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

  const handleOpenDialog = useCallback((supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        website: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'SN',
        payment_terms: '',
        currency: 'XOF',
        tax_id: '',
        notes: '',
        tags: [],
        is_active: true,
        is_preferred: false,
      });
    }
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      if (editingSupplier) {
        // Update
        const { error } = await supabase
          .from('suppliers')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSupplier.id);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['suppliers', store.id] });
        toast({
          title: '✅ Fournisseur mis à jour',
          description: 'Le fournisseur a été mis à jour avec succès',
        });
      } else {
        // Create
        await createSupplier.mutateAsync({
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
  }, [store?.id, editingSupplier, formData, createSupplier, queryClient, toast, handleCloseDialog]);

  const handleDeleteClick = useCallback((supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!supplierToDelete || !store?.id) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['suppliers', store.id] });
      toast({
        title: '✅ Fournisseur supprimé',
        description: 'Le fournisseur a été supprimé avec succès',
      });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer le fournisseur',
        variant: 'destructive',
      });
    }
  }, [supplierToDelete, store?.id, queryClient, toast]);

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
            placeholder="Rechercher par nom, entreprise, email, téléphone ou ville..."
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
              onSelect={() => setSearchInput('')}
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
          onSelect={() => handleOpenDialog()}
          className="h-10 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un fournisseur</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Suppliers List */}
      <div
        ref={suppliersRef}
        className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {filteredSuppliers.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
              <Building2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                {searchInput ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {searchInput
                  ? 'Essayez de modifier votre recherche'
                  : 'Ajoutez un fournisseur pour commencer'}
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
                    <TableHead className="text-xs sm:text-sm">Fournisseur</TableHead>
                    <TableHead className="text-xs sm:text-sm">Contact</TableHead>
                    <TableHead className="text-xs sm:text-sm">Localisation</TableHead>
                    <TableHead className="text-xs sm:text-sm">Statistiques</TableHead>
                    <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{supplier.name}</div>
                            {supplier.company_name && (
                              <div className="text-xs text-muted-foreground truncate">
                                {supplier.company_name}
                              </div>
                            )}
                          </div>
                          {supplier.is_preferred && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{supplier.email}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{supplier.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {supplier.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {supplier.city}
                              {supplier.country && `, ${supplier.country}`}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="space-y-1">
                          <div>{supplier.total_orders} commande{supplier.total_orders > 1 ? 's' : ''}</div>
                          <div className="text-muted-foreground">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: supplier.currency || 'XOF',
                            }).format(supplier.total_spent)}
                          </div>
                          {supplier.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{supplier.rating.toFixed(1)}/5</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant={supplier.is_active ? 'default' : 'secondary'} className="text-xs">
                          {supplier.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select>
                          <SelectTrigger
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions pour le fournisseur ${supplier.name || supplier.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="edit" onSelect onSelect={() => handleOpenDialog(supplier)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </SelectItem>
                            <SelectItem value="delete" onSelect
                              onSelect={() => handleDeleteClick(supplier)}
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
              {filteredSuppliers.map((supplier) => (
                <Card
                  key={supplier.id}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <h3 className="font-medium text-sm sm:text-base truncate">
                              {supplier.name}
                            </h3>
                            {supplier.is_preferred && (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                            )}
                          </div>
                          {supplier.company_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {supplier.company_name}
                            </p>
                          )}
                        </div>
                        <Select>
                          <SelectTrigger
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions pour le fournisseur ${supplier.name || supplier.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="copy" onSelect onSelect={() => handleOpenDialog(supplier)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </SelectItem>
                            <SelectItem value="view" onSelect
                              onSelect={() => handleDeleteClick(supplier)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(supplier.email || supplier.phone) && (
                        <div className="space-y-1 text-xs sm:text-sm">
                          {supplier.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{supplier.email}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{supplier.phone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {supplier.city && (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {supplier.city}
                            {supplier.country && `, ${supplier.country}`}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Commandes:</span>
                          <span className="text-xs font-medium">{supplier.total_orders}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Total:</span>
                          <span className="text-xs font-medium">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: supplier.currency || 'XOF',
                            }).format(supplier.total_spent)}
                          </span>
                        </div>
                        {supplier.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{supplier.rating.toFixed(1)}/5</span>
                          </div>
                        )}
                        <Badge variant={supplier.is_active ? 'default' : 'secondary'} className="text-xs ml-auto">
                          {supplier.is_active ? 'Actif' : 'Inactif'}
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
              {editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingSupplier
                ? 'Modifiez les informations du fournisseur'
                : 'Ajoutez un nouveau fournisseur à votre liste'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs sm:text-sm">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-xs sm:text-sm">Nom de l'entreprise</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name || ''}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="text-xs sm:text-sm">Personne de contact</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person || ''}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs sm:text-sm">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-xs sm:text-sm">Site web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1" className="text-xs sm:text-sm">Adresse ligne 1</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1 || ''}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2" className="text-xs sm:text-sm">Adresse ligne 2</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2 || ''}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs sm:text-sm">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-xs sm:text-sm">État/Région</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code" className="text-xs sm:text-sm">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-xs sm:text-sm">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country || 'SN'}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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
                      <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_terms" className="text-xs sm:text-sm">Conditions de paiement</Label>
                  <Select
                    value={formData.payment_terms || ''}
                    onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">Prépayé</SelectItem>
                      <SelectItem value="net_15">Net 15</SelectItem>
                      <SelectItem value="net_30">Net 30</SelectItem>
                      <SelectItem value="net_60">Net 60</SelectItem>
                      <SelectItem value="net_90">Net 90</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_id" className="text-xs sm:text-sm">Numéro d'identification fiscale</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id || ''}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="text-sm"
                  />
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
                    id="is_preferred"
                    checked={formData.is_preferred ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_preferred: checked })}
                  />
                  <Label htmlFor="is_preferred" className="text-xs sm:text-sm">Fournisseur préféré</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button type="button" variant="outline" onSelect={handleCloseDialog} className="w-full sm:w-auto text-sm">
                Annuler
              </Button>
              <Button type="submit" disabled={createSupplier.isPending} className="w-full sm:w-auto text-sm">
                {editingSupplier ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Supprimer le fournisseur</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Êtes-vous sûr de vouloir supprimer le fournisseur "{supplierToDelete?.name}" ? Cette action est irréversible.
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






