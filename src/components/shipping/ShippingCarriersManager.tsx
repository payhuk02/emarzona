/**
 * Gestionnaire de Transporteurs
 * Permet de créer, modifier et configurer les transporteurs de livraison
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Settings,
  Globe,
  ExternalLink,
  Phone,
  Mail,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { ShippingCarrier } from '@/hooks/physical/useShippingCarriers';

interface ShippingCarriersManagerProps {
  storeId: string;
}

export function ShippingCarriersManager({ storeId }: ShippingCarriersManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<ShippingCarrier | null>(null);
  const [formData, setFormData] = useState({
    carrier_name: 'Custom' as ShippingCarrier['carrier_name'],
    display_name: '',
    api_key: '',
    api_secret: '',
    api_url: '',
    account_number: '',
    meter_number: '',
    is_active: true,
    is_default: false,
    test_mode: true,
    available_services: [] as string[],
    requires_signature: false,
    requires_insurance: false,
    requires_customs: false,
    supported_countries: [] as string[],
    supported_states: [] as string[],
  });

  // Charger les transporteurs
  const { data: carriers, isLoading } = useQuery({
    queryKey: ['shipping-carriers-all', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_carriers')
        .select('*')
        .eq('store_id', storeId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching shipping carriers', error);
        // Si la table n'existe pas, retourner un tableau vide
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return [];
        }
        throw error;
      }
      return (data || []) as ShippingCarrier[];
    },
    enabled: !!storeId,
  });

  // Charger les services globaux
  const { data: globalServices } = useQuery({
    queryKey: ['global-shipping-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_shipping_services')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('priority', { ascending: false });

      if (error) {
        // Si la table n'existe pas encore, retourner un tableau vide
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return [];
        }
        throw error;
      }
      return data || [];
    },
  });

  // Créer/Mettre à jour transporteur
  const createMutation = useMutation({
    mutationFn: async (data: Partial<ShippingCarrier>) => {
      const { data: result, error } = await supabase
        .from('shipping_carriers')
        .insert({
          ...data,
          store_id: storeId,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-carriers-all', storeId] });
      queryClient.invalidateQueries({ queryKey: ['shipping-services-stats', storeId] });
      toast({
        title: '✅ Transporteur créé',
        description: 'Le transporteur a été créé avec succès.',
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      logger.error('Error creating carrier', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le transporteur.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShippingCarrier> }) => {
      const { data: result, error } = await supabase
        .from('shipping_carriers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-carriers-all', storeId] });
      queryClient.invalidateQueries({ queryKey: ['shipping-services-stats', storeId] });
      toast({
        title: '✅ Transporteur mis à jour',
        description: 'Le transporteur a été mis à jour avec succès.',
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      logger.error('Error updating carrier', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le transporteur.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shipping_carriers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-carriers-all', storeId] });
      queryClient.invalidateQueries({ queryKey: ['shipping-services-stats', storeId] });
      toast({
        title: '✅ Transporteur supprimé',
        description: 'Le transporteur a été supprimé avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error deleting carrier', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer le transporteur.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      carrier_name: 'Custom',
      display_name: '',
      api_key: '',
      api_secret: '',
      api_url: '',
      account_number: '',
      meter_number: '',
      is_active: true,
      is_default: false,
      test_mode: true,
      available_services: [],
      requires_signature: false,
      requires_insurance: false,
      requires_customs: false,
      supported_countries: [],
      supported_states: [],
    });
    setEditingCarrier(null);
  };

  const handleEdit = (carrier: ShippingCarrier) => {
    setEditingCarrier(carrier);
    setFormData({
      carrier_name: carrier.carrier_name,
      display_name: carrier.display_name,
      api_key: carrier.api_key || '',
      api_secret: carrier.api_secret || '',
      api_url: carrier.api_url || '',
      account_number: carrier.account_number || '',
      meter_number: carrier.meter_number || '',
      is_active: carrier.is_active,
      is_default: carrier.is_default,
      test_mode: carrier.test_mode,
      available_services: carrier.available_services || [],
      requires_signature: carrier.requires_signature,
      requires_insurance: carrier.requires_insurance,
      requires_customs: carrier.requires_customs,
      supported_countries: carrier.supported_countries || [],
      supported_states: carrier.supported_states || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCarrier) {
      updateMutation.mutate({ id: editingCarrier.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
    <div className="space-y-6">
      {/* Services Globaux */}
      {globalServices && globalServices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Services de Livraison Disponibles</h3>
              <Badge variant="outline" className="ml-2">
                {globalServices.length} service{globalServices.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0"
            >
              <Link to="/dashboard/contact-shipping-service">
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Voir tous les services
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Services de livraison gérés par l'administrateur et disponibles pour tous les vendeurs. 
            <Link to="/dashboard/contact-shipping-service" className="text-blue-600 hover:underline ml-1">
              Consultez la page dédiée pour plus de détails et pour contacter ces services.
            </Link>
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {globalServices.map((service: any) => (
              <Card key={service.id} className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-500" />
                        {service.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {service.carrier_type}
                      </CardDescription>
                    </div>
                    {service.is_featured && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        ⭐
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    {service.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <a
                          href={`mailto:${service.contact_email}`}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {service.contact_email}
                        </a>
                      </div>
                    )}
                    {service.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <a
                          href={`tel:${service.contact_phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {service.contact_phone}
                        </a>
                      </div>
                    )}
                    {service.website_url && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        <a
                          href={service.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Site web
                        </a>
                      </div>
                    )}
                    {service.supported_countries && service.supported_countries.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Pays supportés:</p>
                        <div className="flex flex-wrap gap-1">
                          {service.supported_countries.slice(0, 5).map((country: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {country}
                            </Badge>
                          ))}
                          {service.supported_countries.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{service.supported_countries.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transporteurs Personnalisés */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Mes Transporteurs</h2>
            <p className="text-sm text-muted-foreground">
              Configurez vos transporteurs de livraison personnalisés (DHL, FedEx, UPS, etc.)
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un transporteur
          </Button>
        </div>

      {!carriers || carriers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun transporteur configuré</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez votre premier transporteur pour commencer à gérer les livraisons.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un transporteur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {carriers.map((carrier) => (
            <Card key={carrier.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      {carrier.display_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {carrier.carrier_name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {carrier.is_active ? (
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
                    {carrier.is_default && (
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        Par défaut
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {carrier.test_mode && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Mode test
                      </Badge>
                    </div>
                  )}
                  {carrier.available_services && carrier.available_services.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {carrier.available_services.slice(0, 3).map((service, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {carrier.available_services.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{carrier.available_services.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(carrier)}
                    className="flex-1"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce transporteur ?')) {
                        deleteMutation.mutate(carrier.id);
                      }
                    }}
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
      </div>

      {/* Dialog Créer/Modifier */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCarrier ? 'Modifier le transporteur' : 'Nouveau transporteur'}
            </DialogTitle>
            <DialogDescription>
              Configurez les informations du transporteur de livraison.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier_name">Transporteur *</Label>
                <Select
                  value={formData.carrier_name}
                  onValueChange={(value) =>
                    setFormData({ ...formData, carrier_name: value as ShippingCarrier['carrier_name'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un transporteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DHL">DHL</SelectItem>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="Chronopost">Chronopost</SelectItem>
                    <SelectItem value="Custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Nom d'affichage *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Ex: DHL Express"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api_key">Clé API</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Clé API du transporteur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_secret">Secret API</Label>
                <Input
                  id="api_secret"
                  type="password"
                  value={formData.api_secret}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                  placeholder="Secret API"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_number">Numéro de compte</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="Numéro de compte"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meter_number">Numéro de compteur (FedEx)</Label>
                <Input
                  id="meter_number"
                  value={formData.meter_number}
                  onChange={(e) => setFormData({ ...formData, meter_number: e.target.value })}
                  placeholder="Meter number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_url">URL API</Label>
              <Input
                id="api_url"
                value={formData.api_url}
                onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                placeholder="https://api.transporteur.com"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Actif</Label>
                <p className="text-xs text-muted-foreground">
                  Le transporteur sera disponible pour les livraisons
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_default">Par défaut</Label>
                <p className="text-xs text-muted-foreground">
                  Utilisé par défaut pour les nouvelles commandes
                </p>
              </div>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="test_mode">Mode test</Label>
                <p className="text-xs text-muted-foreground">
                  Utiliser les API en mode test
                </p>
              </div>
              <Switch
                id="test_mode"
                checked={formData.test_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, test_mode: checked })}
              />
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
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCarrier ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

