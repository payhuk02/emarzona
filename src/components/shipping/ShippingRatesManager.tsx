/**
 * Gestionnaire de Tarifs de Livraison
 * Permet de créer et gérer les tarifs de livraison par zone
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  useShippingZones,
  useShippingRates,
  useCreateShippingRate,
  useUpdateShippingRate,
  useDeleteShippingRate,
  type ShippingRate,
} from '@/hooks/physical/useShipping';

interface ShippingRatesManagerProps {
  storeId: string;
}

export function ShippingRatesManager({ storeId }: ShippingRatesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [formData, setFormData] = useState({
    shipping_zone_id: '',
    name: '',
    description: '',
    rate_type: 'flat' as ShippingRate['rate_type'],
    base_price: 0,
    price_per_kg: undefined as number | undefined,
    min_weight: undefined as number | undefined,
    max_weight: undefined as number | undefined,
    min_order_amount: undefined as number | undefined,
    max_order_amount: undefined as number | undefined,
    estimated_days_min: 3,
    estimated_days_max: 7,
    is_active: true,
    priority: 0,
  });

  const { data: zones } = useShippingZones(storeId);
  const { data: rates, isLoading } = useQuery({
    queryKey: ['shipping-rates-all', storeId],
    queryFn: async () => {
      if (!zones || zones.length === 0) return [];
      
      const allRates: (ShippingRate & { zone_name: string })[] = [];
      
      for (const zone of zones) {
        const { data: zoneRates } = await supabase
          .from('shipping_rates')
          .select('*')
          .eq('shipping_zone_id', zone.id)
          .order('priority', { ascending: false });
        
        if (zoneRates) {
          allRates.push(
            ...zoneRates.map((rate) => ({
              ...rate,
              zone_name: zone.name,
            }))
          );
        }
      }
      
      return allRates;
    },
    enabled: !!zones && zones.length > 0,
  });

  const createMutation = useCreateShippingRate();
  const updateMutation = useUpdateShippingRate();
  const deleteMutation = useDeleteShippingRate();

  const resetForm = () => {
    setFormData({
      shipping_zone_id: selectedZoneId || '',
      name: '',
      description: '',
      rate_type: 'flat',
      base_price: 0,
      price_per_kg: undefined,
      min_weight: undefined,
      max_weight: undefined,
      min_order_amount: undefined,
      max_order_amount: undefined,
      estimated_days_min: 3,
      estimated_days_max: 7,
      is_active: true,
      priority: 0,
    });
    setEditingRate(null);
  };

  const handleEdit = (rate: ShippingRate & { zone_name?: string }) => {
    setEditingRate(rate);
    setFormData({
      shipping_zone_id: rate.shipping_zone_id,
      name: rate.name,
      description: rate.description || '',
      rate_type: rate.rate_type,
      base_price: rate.base_price,
      price_per_kg: rate.price_per_kg,
      min_weight: rate.min_weight,
      max_weight: rate.max_weight,
      min_order_amount: rate.min_order_amount,
      max_order_amount: rate.max_order_amount,
      estimated_days_min: rate.estimated_days_min || 3,
      estimated_days_max: rate.estimated_days_max || 7,
      is_active: rate.is_active,
      priority: rate.priority,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRate) {
        await updateMutation.mutateAsync({
          id: editingRate.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      toast({
        title: editingRate ? '✅ Tarif mis à jour' : '✅ Tarif créé',
        description: 'Le tarif de livraison a été enregistré avec succès.',
      });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      logger.error('Error saving rate', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'enregistrer le tarif.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: '✅ Tarif supprimé',
        description: 'Le tarif a été supprimé avec succès.',
      });
    } catch (error: any) {
      logger.error('Error deleting rate', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer le tarif.',
        variant: 'destructive',
      });
    }
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
          <h2 className="text-xl font-semibold">Tarifs de Livraison</h2>
          <p className="text-sm text-muted-foreground">
            Configurez les tarifs de livraison pour chaque zone
          </p>
        </div>
        <div className="flex gap-2">
          {zones && zones.length > 0 && (
            <Select
              value={selectedZoneId || ''}
              onValueChange={(value) => {
                setSelectedZoneId(value);
                setFormData({ ...formData, shipping_zone_id: value });
                resetForm();
                setDialogOpen(true);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sélectionner une zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => {
              if (!selectedZoneId && zones && zones.length > 0) {
                setSelectedZoneId(zones[0].id);
                setFormData({ ...formData, shipping_zone_id: zones[0].id });
              }
              resetForm();
              setDialogOpen(true);
            }}
            disabled={!zones || zones.length === 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un tarif
          </Button>
        </div>
      </div>

      {(!zones || zones.length === 0) && (
        <Card>
          <CardContent className="p-6">
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Vous devez d'abord créer une zone de livraison avant de pouvoir ajouter des tarifs.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {(!rates || rates.length === 0) && zones && zones.length > 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun tarif configuré</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre premier tarif de livraison pour commencer.
            </p>
            <Button
              onClick={() => {
                if (zones && zones.length > 0) {
                  setSelectedZoneId(zones[0].id);
                  setFormData({ ...formData, shipping_zone_id: zones[0].id });
                }
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un tarif
            </Button>
          </CardContent>
        </Card>
      )}

      {rates && rates.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rates.map((rate) => (
            <Card key={rate.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {rate.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Zone: {(rate as any).zone_name || 'N/A'}
                    </CardDescription>
                  </div>
                  {rate.is_active ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactif
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{rate.rate_type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Prix de base:</span>
                    <span className="font-semibold">{rate.base_price} XOF</span>
                  </div>
                  {rate.rate_type === 'weight_based' && rate.price_per_kg && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Par kg:</span>
                      <span>{rate.price_per_kg} XOF/kg</span>
                    </div>
                  )}
                  {rate.estimated_days_min && rate.estimated_days_max && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Délai:</span>
                      <span>
                        {rate.estimated_days_min}-{rate.estimated_days_max} jours
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(rate)}
                    className="flex-1"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(rate.id)}
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
              {editingRate ? 'Modifier le tarif' : 'Nouveau tarif de livraison'}
            </DialogTitle>
            <DialogDescription>
              Configurez le tarif de livraison pour la zone sélectionnée.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_zone_id">Zone de livraison *</Label>
              <Select
                value={formData.shipping_zone_id}
                onValueChange={(value) => setFormData({ ...formData, shipping_zone_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones?.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du tarif *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Livraison Standard"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate_type">Type de tarif *</Label>
                <Select
                  value={formData.rate_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, rate_type: value as ShippingRate['rate_type'] })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Tarif fixe</SelectItem>
                    <SelectItem value="weight_based">Basé sur le poids</SelectItem>
                    <SelectItem value="price_based">Basé sur le prix</SelectItem>
                    <SelectItem value="free">Gratuit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du tarif"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Prix de base (XOF) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
              {formData.rate_type === 'weight_based' && (
                <div className="space-y-2">
                  <Label htmlFor="price_per_kg">Prix par kg (XOF)</Label>
                  <Input
                    id="price_per_kg"
                    type="number"
                    step="0.01"
                    value={formData.price_per_kg || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_per_kg: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {formData.rate_type === 'weight_based' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_weight">Poids minimum (kg)</Label>
                  <Input
                    id="min_weight"
                    type="number"
                    step="0.01"
                    value={formData.min_weight || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_weight: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_weight">Poids maximum (kg)</Label>
                  <Input
                    id="max_weight"
                    type="number"
                    step="0.01"
                    value={formData.max_weight || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_weight: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {formData.rate_type === 'price_based' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order_amount">Montant minimum (XOF)</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    step="0.01"
                    value={formData.min_order_amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_order_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_order_amount">Montant maximum (XOF)</Label>
                  <Input
                    id="max_order_amount"
                    type="number"
                    step="0.01"
                    value={formData.max_order_amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_order_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_days_min">Délai minimum (jours)</Label>
                <Input
                  id="estimated_days_min"
                  type="number"
                  value={formData.estimated_days_min}
                  onChange={(e) =>
                    setFormData({ ...formData, estimated_days_min: parseInt(e.target.value) || 3 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_days_max">Délai maximum (jours)</Label>
                <Input
                  id="estimated_days_max"
                  type="number"
                  value={formData.estimated_days_max}
                  onChange={(e) =>
                    setFormData({ ...formData, estimated_days_max: parseInt(e.target.value) || 7 })
                  }
                />
              </div>
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
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Actif</Label>
                  <p className="text-xs text-muted-foreground">
                    Le tarif sera disponible
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
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingRate ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

