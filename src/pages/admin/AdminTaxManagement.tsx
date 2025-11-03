/**
 * Page Admin Tax Management - Gestion des configurations de taxes
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Liste toutes les configurations de taxes
 * - Créer/Modifier/Supprimer configurations
 * - Gérer taxes par pays/région
 * - Activer/Désactiver configurations
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTaxConfigurations, useCreateTaxConfiguration, useUpdateTaxConfiguration, useDeleteTaxConfiguration } from '@/hooks/admin/useTaxConfigurations';
import {
  Receipt,
  Plus,
  Edit,
  Trash2,
  Search,
  Globe,
  Building2,
  MapPin,
  Percent,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TaxConfiguration, TaxType } from '@/types/invoice';

// Liste des pays d'Afrique de l'Ouest
const WEST_AFRICA_COUNTRIES = [
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'ML', name: 'Mali' },
  { code: 'NE', name: 'Niger' },
  { code: 'TG', name: 'Togo' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'GH', name: 'Ghana' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GN', name: 'Guinée' },
];

const TAX_TYPES: { value: TaxType; label: string }[] = [
  { value: 'VAT', label: 'TVA (Value Added Tax)' },
  { value: 'GST', label: 'GST (Goods and Services Tax)' },
  { value: 'SALES_TAX', label: 'Taxe sur les ventes' },
  { value: 'CUSTOM', label: 'Personnalisée' },
];

export default function AdminTaxManagement() {
  const { data: taxConfigs, isLoading } = useTaxConfigurations();
  const createTax = useCreateTaxConfiguration();
  const updateTax = useUpdateTaxConfiguration();
  const deleteTax = useDeleteTaxConfiguration();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxConfiguration | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<TaxConfiguration>>({
    country_code: 'BF',
    tax_type: 'VAT',
    tax_name: 'TVA',
    rate: 18,
    applies_to_shipping: false,
    tax_inclusive: false,
    priority: 0,
    effective_from: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  // Filtrer les configurations
  const filteredConfigs = (taxConfigs || []).filter(config => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        config.country_code.toLowerCase().includes(query) ||
        config.tax_name.toLowerCase().includes(query) ||
        config.tax_type.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Gérer ouverture dialog création
  const handleOpenCreate = () => {
    setEditingTax(null);
    setFormData({
      country_code: 'BF',
      tax_type: 'VAT',
      tax_name: 'TVA',
      rate: 18,
      applies_to_shipping: false,
      tax_inclusive: false,
      priority: 0,
      effective_from: new Date().toISOString().split('T')[0],
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  // Gérer ouverture dialog édition
  const handleOpenEdit = (tax: TaxConfiguration) => {
    setEditingTax(tax);
    setFormData({
      country_code: tax.country_code,
      state_province: tax.state_province,
      tax_type: tax.tax_type,
      tax_name: tax.tax_name,
      rate: tax.rate,
      applies_to_product_types: tax.applies_to_product_types,
      applies_to_shipping: tax.applies_to_shipping,
      tax_inclusive: tax.tax_inclusive,
      priority: tax.priority,
      effective_from: tax.effective_from.split('T')[0],
      effective_to: tax.effective_to ? tax.effective_to.split('T')[0] : undefined,
      is_active: tax.is_active,
    });
    setIsDialogOpen(true);
  };

  // Gérer soumission formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTax) {
      await updateTax.mutateAsync({ id: editingTax.id, ...formData });
    } else {
      await createTax.mutateAsync(formData);
    }

    setIsDialogOpen(false);
    setEditingTax(null);
  };

  // Gérer suppression
  const handleDelete = async (taxId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette configuration de taxe ?')) {
      await deleteTax.mutateAsync(taxId);
    }
  };

  // Obtenir nom du pays
  const getCountryName = (code: string) => {
    return WEST_AFRICA_COUNTRIES.find(c => c.code === code)?.name || code;
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Receipt className="h-8 w-8" />
                  Gestion des Taxes
                </h1>
                <p className="text-muted-foreground mt-1">
                  Configurez les taxes par pays et région pour votre plateforme
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Configuration
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTax ? 'Modifier la Configuration' : 'Nouvelle Configuration de Taxe'}
                    </DialogTitle>
                    <DialogDescription>
                      Configurez les paramètres de taxe pour un pays ou une région
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country_code">Pays *</Label>
                        <Select
                          value={formData.country_code}
                          onValueChange={(value) => setFormData({ ...formData, country_code: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WEST_AFRICA_COUNTRIES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="state_province">Région/État (optionnel)</Label>
                        <Input
                          id="state_province"
                          value={formData.state_province || ''}
                          onChange={(e) => setFormData({ ...formData, state_province: e.target.value || undefined })}
                          placeholder="Ex: Ouagadougou, Abidjan..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tax_type">Type de taxe *</Label>
                        <Select
                          value={formData.tax_type}
                          onValueChange={(value) => setFormData({ ...formData, tax_type: value as TaxType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="tax_name">Nom de la taxe *</Label>
                        <Input
                          id="tax_name"
                          value={formData.tax_name || ''}
                          onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                          placeholder="Ex: TVA, GST..."
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rate">Taux (%) *</Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.rate || 0}
                          onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="priority">Priorité</Label>
                        <Input
                          id="priority"
                          type="number"
                          value={formData.priority || 0}
                          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Plus élevé = appliqué en premier
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="effective_from">Date d'effet *</Label>
                        <Input
                          id="effective_from"
                          type="date"
                          value={formData.effective_from || ''}
                          onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="effective_to">Date d'expiration (optionnel)</Label>
                        <Input
                          id="effective_to"
                          type="date"
                          value={formData.effective_to || ''}
                          onChange={(e) => setFormData({ ...formData, effective_to: e.target.value || undefined })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="applies_to_shipping">S'applique aux frais de livraison</Label>
                          <p className="text-xs text-muted-foreground">
                            La taxe sera calculée aussi sur les frais de livraison
                          </p>
                        </div>
                        <Switch
                          id="applies_to_shipping"
                          checked={formData.applies_to_shipping || false}
                          onCheckedChange={(checked) => setFormData({ ...formData, applies_to_shipping: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="tax_inclusive">Taxe incluse dans le prix</Label>
                          <p className="text-xs text-muted-foreground">
                            Le prix affiché inclut déjà la taxe
                          </p>
                        </div>
                        <Switch
                          id="tax_inclusive"
                          checked={formData.tax_inclusive || false}
                          onCheckedChange={(checked) => setFormData({ ...formData, tax_inclusive: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="is_active">Configuration active</Label>
                          <p className="text-xs text-muted-foreground">
                            Désactivez pour désactiver temporairement cette taxe
                          </p>
                        </div>
                        <Switch
                          id="is_active"
                          checked={formData.is_active !== false}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={createTax.isPending || updateTax.isPending}
                      >
                        {editingTax ? 'Modifier' : 'Créer'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Recherche */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par pays, nom de taxe..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Liste des configurations */}
            <Card>
              <CardHeader>
                <CardTitle>Configurations de Taxes</CardTitle>
                <CardDescription>
                  {filteredConfigs.length} configuration{filteredConfigs.length > 1 ? 's' : ''} trouvée{filteredConfigs.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredConfigs.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Aucune configuration de taxe trouvée. Créez-en une pour commencer.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pays/Région</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Taux</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConfigs.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{getCountryName(config.country_code)}</div>
                                {config.state_province && (
                                  <div className="text-xs text-muted-foreground">
                                    {config.state_province}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{config.tax_type}</Badge>
                          </TableCell>
                          <TableCell>{config.tax_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{config.rate}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Dès {format(new Date(config.effective_from), 'dd/MM/yyyy', { locale: fr })}</div>
                              {config.effective_to && (
                                <div className="text-muted-foreground">
                                  Jusqu'au {format(new Date(config.effective_to), 'dd/MM/yyyy', { locale: fr })}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {config.is_active ? (
                              <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <XCircle className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(config)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(config.id)}
                                disabled={deleteTax.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

