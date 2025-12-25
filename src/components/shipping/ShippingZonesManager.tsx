/**
 * Gestionnaire de Zones de Livraison
 * Permet de créer et gérer les zones géographiques de livraison
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  useShippingZones,
  useCreateShippingZone,
  useUpdateShippingZone,
  useDeleteShippingZone,
  type ShippingZone,
} from '@/hooks/physical/useShipping';

interface ShippingZonesManagerProps {
  storeId: string;
}

export function ShippingZonesManager({ storeId }: ShippingZonesManagerProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    countries: [] as string[],
    states: [] as string[],
    zip_codes: [] as string[],
    is_active: true,
    priority: 0,
  });

  const { data: zones, isLoading } = useShippingZones(storeId);
  const createMutation = useCreateShippingZone();
  const updateMutation = useUpdateShippingZone();
  const deleteMutation = useDeleteShippingZone();

  const resetForm = () => {
    setFormData({
      name: '',
      countries: [],
      states: [],
      zip_codes: [],
      is_active: true,
      priority: 0,
    });
    setEditingZone(null);
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      countries: zone.countries || [],
      states: zone.states || [],
      zip_codes: zone.zip_codes || [],
      is_active: zone.is_active,
      priority: zone.priority,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingZone) {
        await updateMutation.mutateAsync({
          id: editingZone.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync({
          ...formData,
          store_id: storeId,
        });
      }
      toast({
        title: editingZone ? '✅ Zone mise à jour' : '✅ Zone créée',
        description: 'La zone de livraison a été enregistrée avec succès.',
      });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      logger.error('Error saving zone', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'enregistrer la zone.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: '✅ Zone supprimée',
        description: 'La zone a été supprimée avec succès.',
      });
    } catch (error: any) {
      logger.error('Error deleting zone', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer la zone.',
        variant: 'destructive',
      });
    }
  };

  const addCountry = () => {
    const country = prompt('Code pays (ISO 2 lettres, ex: BF, FR, SN):');
    if (country && country.length === 2) {
      setFormData({
        ...formData,
        countries: [...formData.countries, country.toUpperCase()],
      });
    }
  };

  const removeCountry = (country: string) => {
    setFormData({
      ...formData,
      countries: formData.countries.filter((c) => c !== country),
    });
  };

  const addZipCode = () => {
    const zip = prompt('Code postal ou plage (ex: 01, 01-10, 01*):');
    if (zip) {
      setFormData({
        ...formData,
        zip_codes: [...formData.zip_codes, zip],
      });
    }
  };

  const removeZipCode = (zip: string) => {
    setFormData({
      ...formData,
      zip_codes: formData.zip_codes.filter((z) => z !== zip),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Zones de Livraison</h2>
          <p className="text-sm text-muted-foreground">
            Définissez les zones géographiques où vous livrez
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une zone
        </Button>
      </div>

      {!zones || zones.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune zone configurée</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre première zone de livraison pour définir où vous livrez.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une zone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <Card key={zone.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {zone.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Priorité: {zone.priority}
                    </CardDescription>
                  </div>
                  {zone.is_active ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {zone.countries && zone.countries.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pays:</p>
                      <div className="flex flex-wrap gap-1">
                        {zone.countries.map((country, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {country}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {zone.zip_codes && zone.zip_codes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Codes postaux: {zone.zip_codes.length}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(zone)}
                    className="flex-1"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(zone.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Créer/Modifier */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
            </DialogTitle>
            <DialogDescription>
              Définissez les pays, états et codes postaux couverts par cette zone.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la zone *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Burkina Faso, Afrique de l'Ouest"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Pays (Codes ISO 2 lettres)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.countries.map((country) => (
                  <Badge
                    key={country}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeCountry(country)}
                  >
                    {country} ×
                  </Badge>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCountry}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Ajouter un pays
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Ex: BF (Burkina Faso), FR (France), SN (Sénégal)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Codes postaux</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.zip_codes.map((zip, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeZipCode(zip)}
                  >
                    {zip} ×
                  </Badge>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addZipCode}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Ajouter un code postal
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Ex: 01, 01-10, 01* (plage ou pattern)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Plus élevé = priorité plus grande
                </p>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    La zone sera utilisée pour le calcul
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingZone ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

