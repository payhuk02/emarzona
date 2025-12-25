/**
 * Paramètres de Livraison
 * Configuration générale des services de livraison
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Save, Loader2 } from '@/components/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ShippingSettingsProps {
  storeId: string;
}

export function ShippingSettings({ storeId }: ShippingSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    default_weight_unit: 'kg',
    default_dimension_unit: 'cm',
    free_shipping_threshold: 0,
    enable_real_time_rates: false,
    default_carrier_id: '',
    auto_generate_labels: false,
    require_signature: false,
    default_insurance: false,
    packaging_instructions: '',
  });

  // Charger les paramètres
  const { data: settings, isLoading } = useQuery({
    queryKey: ['shipping-settings', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('shipping_settings')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        // Si la table n'existe pas ou si aucune ligne n'est trouvée, c'est normal
        if (error.code === 'PGRST116' || error.code === '42P01') {
          logger.warn('Shipping settings table or row not found, using defaults');
          return null;
        }
        logger.warn('Error fetching shipping settings', error);
        return null;
      }

      return (data?.shipping_settings as typeof formData) || null;
    },
    enabled: !!storeId,
  });

  // Mettre à jour les paramètres
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Vérifier si les paramètres existent
      const { data: existing, error: checkError } = await supabase
        .from('store_settings')
        .select('id')
        .eq('store_id', storeId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        logger.warn('Error checking existing settings', checkError);
      }

      if (existing) {
        const { error } = await supabase
          .from('store_settings')
          .update({ shipping_settings: data })
          .eq('store_id', storeId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('store_settings').insert({
          store_id: storeId,
          shipping_settings: data,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-settings', storeId] });
      toast({
        title: '✅ Paramètres sauvegardés',
        description: 'Les paramètres de livraison ont été mis à jour.',
      });
    },
    onError: (error: unknown) => {
      logger.error('Error saving shipping settings', error);
      const message =
        error instanceof Error ? error.message : 'Impossible de sauvegarder les paramètres.';
      toast({
        title: '❌ Erreur',
        description: message,
        variant: 'destructive',
      });
    },
  });

  // Charger les transporteurs pour le sélecteur par défaut
  const { data: carriers } = useQuery({
    queryKey: ['shipping-carriers-all', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_carriers')
        .select('id, display_name, is_default')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) {
        logger.warn('Error fetching carriers for settings', error);
        return [];
      }
      return data || [];
    },
    enabled: !!storeId,
  });

  // Mettre à jour formData quand settings change (avec useEffect pour éviter les re-renders infinis)
  useEffect(() => {
    if (settings && !isLoading) {
      setFormData(prev => ({
        ...prev,
        ...settings,
      }));
    }
  }, [settings, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
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
      <div>
        <h2 className="text-xl font-semibold">Paramètres de Livraison</h2>
        <p className="text-sm text-muted-foreground">
          Configurez les paramètres généraux des services de livraison
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Générale
            </CardTitle>
            <CardDescription>Paramètres de base pour les calculs de livraison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_weight_unit">Unité de poids par défaut</Label>
                <select
                  id="default_weight_unit"
                  value={formData.default_weight_unit}
                  onChange={e => setFormData({ ...formData, default_weight_unit: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[44px] touch-manipulation cursor-pointer"
                >
                  <option value="kg">Kilogrammes (kg)</option>
                  <option value="g">Grammes (g)</option>
                  <option value="lb">Livres (lb)</option>
                  <option value="oz">Onces (oz)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_dimension_unit">Unité de dimension par défaut</Label>
                <select
                  id="default_dimension_unit"
                  value={formData.default_dimension_unit}
                  onChange={e =>
                    setFormData({ ...formData, default_dimension_unit: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[44px] touch-manipulation cursor-pointer"
                >
                  <option value="cm">Centimètres (cm)</option>
                  <option value="m">Mètres (m)</option>
                  <option value="in">Pouces (in)</option>
                  <option value="ft">Pieds (ft)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="free_shipping_threshold">Seuil de livraison gratuite (XOF)</Label>
              <Input
                id="free_shipping_threshold"
                type="number"
                step="0.01"
                value={formData.free_shipping_threshold}
                onChange={e =>
                  setFormData({
                    ...formData,
                    free_shipping_threshold: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Montant minimum de commande pour bénéficier de la livraison gratuite
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options Avancées</CardTitle>
            <CardDescription>Fonctionnalités avancées de livraison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="enable_real_time_rates">Tarifs en temps réel</Label>
                <p className="text-xs text-muted-foreground">
                  Calculer les tarifs via les API des transporteurs
                </p>
              </div>
              <Switch
                id="enable_real_time_rates"
                checked={formData.enable_real_time_rates}
                onCheckedChange={checked =>
                  setFormData({ ...formData, enable_real_time_rates: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="auto_generate_labels">Génération automatique d'étiquettes</Label>
                <p className="text-xs text-muted-foreground">
                  Générer automatiquement les étiquettes lors de la création de commande
                </p>
              </div>
              <Switch
                id="auto_generate_labels"
                checked={formData.auto_generate_labels}
                onCheckedChange={checked =>
                  setFormData({ ...formData, auto_generate_labels: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="require_signature">Signature requise par défaut</Label>
                <p className="text-xs text-muted-foreground">
                  Exiger une signature pour toutes les livraisons
                </p>
              </div>
              <Switch
                id="require_signature"
                checked={formData.require_signature}
                onCheckedChange={checked =>
                  setFormData({ ...formData, require_signature: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="default_insurance">Assurance par défaut</Label>
                <p className="text-xs text-muted-foreground">
                  Activer l'assurance pour toutes les expéditions
                </p>
              </div>
              <Switch
                id="default_insurance"
                checked={formData.default_insurance}
                onCheckedChange={checked =>
                  setFormData({ ...formData, default_insurance: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions d'Emballage</CardTitle>
            <CardDescription>Instructions pour l'emballage des produits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="packaging_instructions">Instructions</Label>
              <Textarea
                id="packaging_instructions"
                value={formData.packaging_instructions}
                onChange={e => setFormData({ ...formData, packaging_instructions: e.target.value })}
                placeholder="Instructions pour l'emballage des produits..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les paramètres
          </Button>
        </div>
      </form>
    </div>
  );
}
