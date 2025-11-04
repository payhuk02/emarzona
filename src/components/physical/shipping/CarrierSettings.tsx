/**
 * Carrier Settings Component
 * Configuration des transporteurs
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useShippingCarriers } from '@/hooks/physical/useShippingCarriers';
import { useStore } from '@/hooks/useStore';
import { Truck, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface CarrierSettingsProps {
  storeId: string;
}

export const CarrierSettings = ({ storeId }: CarrierSettingsProps) => {
  const { toast } = useToast();
  const { data: carriers = [], refetch } = useShippingCarriers(storeId);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    carrier_name: 'DHL' as const,
    display_name: '',
    api_key: '',
    api_secret: '',
    api_url: '',
    account_number: '',
    meter_number: '',
    test_mode: true,
    is_active: true,
    is_default: false,
  });

  const handleSave = async () => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from('shipping_carriers')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shipping_carriers')
          .insert({
            store_id: storeId,
            ...formData,
          });

        if (error) throw error;
      }

      toast({
        title: '✅ Transporteur sauvegardé',
        description: 'La configuration a été sauvegardée avec succès',
      });

      setIsAdding(false);
      setEditingId(null);
      setFormData({
        carrier_name: 'DHL',
        display_name: '',
        api_key: '',
        api_secret: '',
        api_url: '',
        account_number: '',
        meter_number: '',
        test_mode: true,
        is_active: true,
        is_default: false,
      });
      refetch();
    } catch (error: any) {
      logger.error('Error saving carrier', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (carrier: any) => {
    setFormData({
      carrier_name: carrier.carrier_name,
      display_name: carrier.display_name,
      api_key: carrier.api_key || '',
      api_secret: carrier.api_secret || '',
      api_url: carrier.api_url || '',
      account_number: carrier.account_number || '',
      meter_number: carrier.meter_number || '',
      test_mode: carrier.test_mode,
      is_active: carrier.is_active,
      is_default: carrier.is_default,
    });
    setEditingId(carrier.id);
    setIsAdding(true);
  };

  const handleDelete = async (carrierId: string) => {
    if (!confirm('Supprimer ce transporteur ?')) return;

    try {
      const { error } = await supabase
        .from('shipping_carriers')
        .delete()
        .eq('id', carrierId);

      if (error) throw error;

      toast({
        title: '✅ Transporteur supprimé',
        description: 'Le transporteur a été supprimé',
      });

      refetch();
    } catch (error: any) {
      logger.error('Error deleting carrier', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Configuration Transporteurs
          </h1>
          <p className="text-muted-foreground">
            Configurez vos transporteurs pour calculer les tarifs et générer des étiquettes
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un transporteur
        </Button>
      </div>

      {/* Liste des transporteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {carriers.map((carrier) => (
          <Card key={carrier.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{carrier.display_name}</CardTitle>
                <div className="flex items-center gap-2">
                  {carrier.is_default && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Par défaut
                    </span>
                  )}
                  {carrier.test_mode && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Mode test
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Type: {carrier.carrier_name}</p>
                <p>Statut: {carrier.is_active ? 'Actif' : 'Inactif'}</p>
                {carrier.api_key && (
                  <p>API Key: {carrier.api_key.substring(0, 8)}...</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(carrier)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(carrier.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulaire ajout/modification */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Modifier le transporteur' : 'Nouveau transporteur'}
            </CardTitle>
            <CardDescription>
              Configurez les paramètres API pour votre transporteur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier-name">Transporteur *</Label>
                <Select
                  value={formData.carrier_name}
                  onValueChange={(value) => setFormData({ ...formData, carrier_name: value as any })}
                >
                  <SelectTrigger id="carrier-name">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DHL">DHL</SelectItem>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="Chronopost">Chronopost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Nom d'affichage *</Label>
                <Input
                  id="display-name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="DHL Express"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">Clé API *</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Votre clé API"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-secret">Secret API *</Label>
                <Input
                  id="api-secret"
                  type="password"
                  value={formData.api_secret}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                  placeholder="Votre secret API"
                />
              </div>
              {(formData.carrier_name === 'FedEx' || formData.carrier_name === 'FedEx_Express') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Numéro de compte</Label>
                    <Input
                      id="account-number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meter-number">Numéro de compteur</Label>
                    <Input
                      id="meter-number"
                      value={formData.meter_number}
                      onChange={(e) => setFormData({ ...formData, meter_number: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="test-mode"
                    checked={formData.test_mode}
                    onCheckedChange={(checked) => setFormData({ ...formData, test_mode: checked })}
                  />
                  <Label htmlFor="test-mode">Mode test</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is-active">Actif</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is-default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is-default">Par défaut</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              <Button onClick={handleSave}>
                {editingId ? 'Modifier' : 'Ajouter'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

