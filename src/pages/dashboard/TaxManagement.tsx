/**
 * Page de Gestion des Taxes Automatiques
 * Date: 31 Janvier 2025
 * 
 * Interface complète pour gérer les taxes automatiques avec :
 * - Configuration par pays/région
 * - Types de taxes multiples (VAT, GST, Sales Tax)
 * - Règles par type de produit
 * - Historique et dates d'effet
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Receipt,
  Plus,
  Edit,
  Trash2,
  Search,
  Globe,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Percent,
  MapPin,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import type { TaxConfiguration } from '@/types/invoice';

// Liste des pays avec codes ISO
const COUNTRIES = [
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'ML', name: 'Mali' },
  { code: 'NE', name: 'Niger' },
  { code: 'TG', name: 'Togo' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'FR', name: 'France' },
  { code: 'US', name: 'États-Unis' },
  { code: 'CA', name: 'Canada' },
];

export default function TaxManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [deletingTaxId, setDeletingTaxId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<TaxConfiguration>>({
    country_code: 'BF',
    state_province: '',
    tax_type: 'VAT',
    tax_name: 'TVA',
    rate: 18,
    applies_to_product_types: [],
    applies_to_shipping: false,
    tax_inclusive: false,
    priority: 0,
    effective_from: format(new Date(), 'yyyy-MM-dd'),
    effective_to: '',
    is_active: true,
  });

  // Fetch tax configurations
  const { data: taxConfigs = [], isLoading: taxConfigsLoading } = useQuery({
    queryKey: ['tax-configurations', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      const query = supabase
        .from('tax_configurations')
        .select('*')
        .or(`store_id.is.null,store_id.eq.${store.id}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching tax configurations', { error });
        throw error;
      }

      return (data || []) as TaxConfiguration[];
    },
    enabled: !!store?.id,
  });

  // Create/Update mutation
  const createTaxConfig = useMutation({
    mutationFn: async (taxData: Partial<TaxConfiguration>) => {
      const { data, error } = await supabase
        .from('tax_configurations')
        .insert({
          ...taxData,
          store_id: store?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TaxConfiguration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast({
        title: '✅ Configuration créée',
        description: 'La configuration de taxe a été créée avec succès',
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer la configuration',
        variant: 'destructive',
      });
    },
  });

  const updateTaxConfig = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaxConfiguration> }) => {
      const { data, error } = await supabase
        .from('tax_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TaxConfiguration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast({
        title: '✅ Configuration mise à jour',
        description: 'La configuration de taxe a été mise à jour avec succès',
      });
      setEditingTaxId(null);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de mettre à jour la configuration',
        variant: 'destructive',
      });
    },
  });

  const deleteTaxConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tax_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast({
        title: '✅ Configuration supprimée',
        description: 'La configuration de taxe a été supprimée avec succès',
      });
      setDeletingTaxId(null);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer la configuration',
        variant: 'destructive',
      });
    },
  });

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Filtered tax configs
  const filteredTaxConfigs = useMemo(() => {
    let  filtered= taxConfigs;

    if (countryFilter !== 'all') {
      filtered = filtered.filter((t) => t.country_code === countryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.tax_name.toLowerCase().includes(query) ||
          t.country_code.toLowerCase().includes(query) ||
          t.state_province?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [taxConfigs, countryFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: taxConfigs.length,
      active: taxConfigs.filter((t) => t.is_active && (!t.effective_to || new Date(t.effective_to) >= now)).length,
      countries: new Set(taxConfigs.map((t) => t.country_code)).size,
      platformWide: taxConfigs.filter((t) => !t.store_id).length,
    };
  }, [taxConfigs]);

  // Handlers
  const handleSaveTaxConfig = async () => {
    if (!formData.country_code || !formData.tax_name || !formData.rate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    if (editingTaxId) {
      await updateTaxConfig.mutateAsync({ id: editingTaxId, updates: formData });
    } else {
      await createTaxConfig.mutateAsync(formData);
    }

    // Reset form
    setFormData({
      country_code: 'BF',
      state_province: '',
      tax_type: 'VAT',
      tax_name: 'TVA',
      rate: 18,
      applies_to_product_types: [],
      applies_to_shipping: false,
      tax_inclusive: false,
      priority: 0,
      effective_from: format(new Date(), 'yyyy-MM-dd'),
      effective_to: '',
      is_active: true,
    });
  };

  const handleEditTax = (tax: TaxConfiguration) => {
    setEditingTaxId(tax.id);
    setFormData({
      country_code: tax.country_code,
      state_province: tax.state_province || '',
      tax_type: tax.tax_type,
      tax_name: tax.tax_name,
      rate: tax.rate,
      applies_to_product_types: tax.applies_to_product_types || [],
      applies_to_shipping: tax.applies_to_shipping,
      tax_inclusive: tax.tax_inclusive,
      priority: tax.priority,
      effective_from: format(new Date(tax.effective_from), 'yyyy-MM-dd'),
      effective_to: tax.effective_to ? format(new Date(tax.effective_to), 'yyyy-MM-dd') : '',
      is_active: tax.is_active,
    });
    setIsCreateDialogOpen(true);
  };

  const getTaxTypeLabel = (type: string) => {
    const  labels: Record<string, string> = {
      VAT: 'TVA',
      GST: 'GST',
      SALES_TAX: 'Taxe sur les ventes',
      CUSTOM: 'Personnalisé',
    };
    return labels[type] || type;
  };

  const getCountryName = (code: string) => {
    return COUNTRIES.find((c) => c.code === code)?.name || code;
  };

  if (storeLoading || taxConfigsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion des Taxes Automatiques
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Configurez les taxes automatiques par pays, région et type de produit
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Configuration
              </Button>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Actives</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Pays</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.countries}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Plateforme</CardTitle>
                  <Globe className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.platformWide}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une configuration..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les pays</SelectItem>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tax Configurations List */}
            <Card>
              <CardHeader>
                <CardTitle>Configurations de Taxes ({filteredTaxConfigs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTaxConfigs.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || countryFilter !== 'all'
                        ? 'Aucune configuration ne correspond à vos critères'
                        : 'Aucune configuration de taxe créée'}
                    </p>
                    {!searchQuery && countryFilter === 'all' && (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer votre première configuration
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Taux</TableHead>
                          <TableHead>Produits</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTaxConfigs.map((tax) => {
                          const now = new Date();
                          const isEffective =
                            tax.is_active &&
                            new Date(tax.effective_from) <= now &&
                            (!tax.effective_to || new Date(tax.effective_to) >= now);

                          return (
                            <TableRow key={tax.id}>
                              <TableCell>
                                <div className="font-medium">{tax.tax_name}</div>
                                {!tax.store_id && (
                                  <Badge variant="outline" className="mt-1">
                                    Plateforme
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  <span>{getCountryName(tax.country_code)}</span>
                                  {tax.state_province && (
                                    <Badge variant="secondary" className="ml-1">
                                      {tax.state_province}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{getTaxTypeLabel(tax.tax_type)}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Percent className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">{tax.rate}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {tax.applies_to_product_types && tax.applies_to_product_types.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {tax.applies_to_product_types.map((type) => (
                                        <Badge key={type} variant="outline" className="text-xs">
                                          {type}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Tous</span>
                                  )}
                                  {tax.applies_to_shipping && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                                      Shipping
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>Dès le {format(new Date(tax.effective_from), 'dd MMM yyyy', { locale: fr })}</div>
                                  {tax.effective_to && (
                                    <div className="text-muted-foreground">
                                      jusqu'au {format(new Date(tax.effective_to), 'dd MMM yyyy', { locale: fr })}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {isEffective ? (
                                  <Badge variant="default" className="bg-green-600">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Select>
                                  <SelectTrigger>

                                      <MoreVertical className="h-4 w-4" />
                                    
</SelectTrigger>
                                  <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                    <SelectItem value="edit" onSelect={() => handleEditTax(tax)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Éditer
                                    </SelectItem>
                                    <SelectItem value="delete" onSelect={() => setDeletingTaxId(tax.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Supprimer
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog
              open={isCreateDialogOpen || !!editingTaxId}
              onOpenChange={(open) => {
                if (!open) {
                  setIsCreateDialogOpen(false);
                  setEditingTaxId(null);
                  setFormData({
                    country_code: 'BF',
                    state_province: '',
                    tax_type: 'VAT',
                    tax_name: 'TVA',
                    rate: 18,
                    applies_to_product_types: [],
                    applies_to_shipping: false,
                    tax_inclusive: false,
                    priority: 0,
                    effective_from: format(new Date(), 'yyyy-MM-dd'),
                    effective_to: '',
                    is_active: true,
                  });
                }
              }}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTaxId ? 'Éditer la Configuration' : 'Créer une Nouvelle Configuration'}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez les taxes automatiques pour un pays ou une région
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country_code">Pays *</Label>
                      <Select
                        value={formData.country_code}
                        onValueChange={(value) => setFormData({ ...formData, country_code: value })}
                      >
                        <SelectTrigger id="country_code">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state_province">Région/État (optionnel)</Label>
                      <Input
                        id="state_province"
                        value={formData.state_province}
                        onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                        placeholder="Ex: Île-de-France"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax_type">Type de Taxe *</Label>
                      <Select
                        value={formData.tax_type}
                        onValueChange={(value: string) => setFormData({ ...formData, tax_type: value })}
                      >
                        <SelectTrigger id="tax_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VAT">TVA</SelectItem>
                          <SelectItem value="GST">GST</SelectItem>
                          <SelectItem value="SALES_TAX">Taxe sur les ventes</SelectItem>
                          <SelectItem value="CUSTOM">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax_name">Nom de la Taxe *</Label>
                      <Input
                        id="tax_name"
                        value={formData.tax_name}
                        onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                        placeholder="Ex: TVA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rate">Taux (%) *</Label>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priorité</Label>
                      <Input
                        id="priority"
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Plus élevé = appliqué en premier
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Types de Produits (laisser vide pour tous)</Label>
                    <div className="flex flex-wrap gap-2">
                      {['digital', 'physical', 'service', 'course', 'artist'].map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={
                            formData.applies_to_product_types?.includes(type) ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            const current = formData.applies_to_product_types || [];
                            const newTypes = current.includes(type)
                              ? current.filter((t) => t !== type)
                              : [...current, type];
                            setFormData({ ...formData, applies_to_product_types: newTypes });
                          }}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="effective_from">Date d'Effet *</Label>
                      <Input
                        id="effective_from"
                        type="date"
                        value={formData.effective_from}
                        onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="effective_to">Date de Fin (optionnel)</Label>
                      <Input
                        id="effective_to"
                        type="date"
                        value={formData.effective_to}
                        onChange={(e) => setFormData({ ...formData, effective_to: e.target.value || undefined })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="applies_to_shipping"
                      checked={formData.applies_to_shipping}
                      onCheckedChange={(checked) => setFormData({ ...formData, applies_to_shipping: checked })}
                    />
                    <Label htmlFor="applies_to_shipping">S'applique à la livraison</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tax_inclusive"
                      checked={formData.tax_inclusive}
                      onCheckedChange={(checked) => setFormData({ ...formData, tax_inclusive: checked })}
                    />
                    <Label htmlFor="tax_inclusive">Taxe incluse dans le prix</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingTaxId(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSaveTaxConfig}
                    disabled={createTaxConfig.isPending || updateTaxConfig.isPending}
                  >
                    {editingTaxId ? 'Sauvegarder' : 'Créer'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deletingTaxId} onOpenChange={(open) => !open && setDeletingTaxId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette configuration ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La configuration de taxe sera définitivement supprimée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletingTaxId && deleteTaxConfig.mutate(deletingTaxId)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







