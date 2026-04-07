/**
 * StoreNotificationSettings Component
 * Configuration des notifications email par boutique
 * Date: 2025-02-02
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Save, Loader2, ShoppingCart, CreditCard, Package, MessageSquare, AlertTriangle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface StoreNotificationSettingsProps {
  storeId: string;
}

interface NotificationSettings {
  id?: string;
  store_id: string;
  email_enabled: boolean;
  notification_email: string | null;
  
  // Notifications par type
  email_new_order: boolean;
  email_order_status_change: boolean;
  email_order_cancelled: boolean;
  email_order_refund: boolean;
  email_payment_received: boolean;
  email_payment_failed: boolean;
  email_low_stock: boolean;
  email_out_of_stock: boolean;
  email_new_review: boolean;
  email_new_question: boolean;
  email_withdrawal_request: boolean;
  email_withdrawal_completed: boolean;
  email_domain_verified: boolean;
  email_ssl_expiring: boolean;
  email_ssl_expired: boolean;
  
  // Fréquence
  notification_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  
  // Heures silencieuses
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string;
  
  // Alertes critiques
  critical_alerts_enabled: boolean;
}

const NOTIFICATION_TYPES = [
  { key: 'email_new_order', label: 'Nouvelle commande', icon: ShoppingCart },
  { key: 'email_order_status_change', label: 'Changement de statut de commande', icon: Package },
  { key: 'email_order_cancelled', label: 'Commande annulée', icon: AlertTriangle },
  { key: 'email_order_refund', label: 'Remboursement', icon: CreditCard },
  { key: 'email_payment_received', label: 'Paiement reçu', icon: CreditCard },
  { key: 'email_payment_failed', label: 'Paiement échoué', icon: AlertTriangle },
  { key: 'email_low_stock', label: 'Stock faible', icon: Package },
  { key: 'email_out_of_stock', label: 'Rupture de stock', icon: AlertTriangle },
  { key: 'email_new_review', label: 'Nouvel avis', icon: MessageSquare },
  { key: 'email_new_question', label: 'Nouvelle question', icon: MessageSquare },
  { key: 'email_withdrawal_request', label: 'Demande de retrait', icon: CreditCard },
  { key: 'email_withdrawal_completed', label: 'Retrait complété', icon: CreditCard },
  { key: 'email_domain_verified', label: 'Domaine vérifié', icon: Shield },
  { key: 'email_ssl_expiring', label: 'SSL expire bientôt', icon: Shield },
  { key: 'email_ssl_expired', label: 'SSL expiré', icon: AlertTriangle },
] as const;

export const StoreNotificationSettings : React.FC<StoreNotificationSettingsProps> = ({ storeId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, [storeId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Appeler la fonction SQL pour obtenir ou créer les paramètres
      const { data, error } = await supabase.rpc('get_or_create_store_notification_settings', {
        p_store_id: storeId,
      });

      if (error) {
        // Si la fonction n'existe pas, essayer de charger directement
        const { data: directData, error: directError } = await supabase
          .from('store_notification_settings')
          .select('*')
          .eq('store_id', storeId)
          .single();

        if (directError && directError.code !== 'PGRST116') {
          throw directError;
        }

        if (directData) {
          setSettings(directData as NotificationSettings);
        } else {
          // Créer avec valeurs par défaut
          setSettings({
            store_id: storeId,
            email_enabled: true,
            notification_email: null,
            email_new_order: true,
            email_order_status_change: true,
            email_order_cancelled: true,
            email_order_refund: true,
            email_payment_received: true,
            email_payment_failed: true,
            email_low_stock: true,
            email_out_of_stock: false,
            email_new_review: true,
            email_new_question: true,
            email_withdrawal_request: true,
            email_withdrawal_completed: true,
            email_domain_verified: true,
            email_ssl_expiring: true,
            email_ssl_expired: true,
            notification_frequency: 'immediate',
            quiet_hours_enabled: false,
            quiet_hours_start: '22:00',
            quiet_hours_end: '08:00',
            quiet_hours_timezone: 'Africa/Ouagadougou',
            critical_alerts_enabled: true,
          });
        }
      } else {
        setSettings(data as NotificationSettings);
      }
    } catch ( _error: unknown) {
      logger.error('Error loading notification settings', { error, storeId });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres de notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('store_notification_settings')
        .upsert(settings, {
          onConflict: 'store_id',
        });

      if (error) throw error;

      toast({
        title: 'Paramètres enregistrés',
        description: 'Vos paramètres de notifications ont été mis à jour avec succès.',
      });
    } catch ( _error: unknown) {
      logger.error('Error saving notification settings', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer les paramètres de notifications',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Alert>
        <AlertDescription>Impossible de charger les paramètres de notifications</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications Email
        </CardTitle>
        <CardDescription>
          Configurez les notifications email pour votre boutique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration générale */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Activer les notifications email</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Activez ou désactivez toutes les notifications email
              </p>
            </div>
            <Switch
              checked={settings.email_enabled}
              onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification_email">Email de notification (optionnel)</Label>
            <Input
              id="notification_email"
              type="email"
              value={settings.notification_email || ''}
              onChange={(e) => updateSetting('notification_email', e.target.value || null)}
              placeholder="notifications@exemple.com"
            />
            <p className="text-xs text-muted-foreground">
              Si vide, l'email de contact de la boutique sera utilisé
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification_frequency">Fréquence des notifications</Label>
            <Select
              value={settings.notification_frequency}
              onValueChange={(value) => updateSetting('notification_frequency', value as 'immediate' | 'hourly' | 'daily' | 'weekly')}
            >
              <SelectTrigger id="notification_frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immédiat</SelectItem>
                <SelectItem value="hourly">Regroupées par heure</SelectItem>
                <SelectItem value="daily">Résumé quotidien</SelectItem>
                <SelectItem value="weekly">Résumé hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Notifications par type */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-4">Notifications par type d'événement</h4>
            <div className="space-y-3">
              {NOTIFICATION_TYPES.map((type) => {
                const Icon = type.icon;
                const key = type.key as keyof NotificationSettings;
                const value = settings[key] as boolean;
                
                return (
                  <div key={type.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={type.key} className="cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                    <Switch
                      id={type.key}
                      checked={value}
                      onCheckedChange={(checked) => updateSetting(key, checked)}
                      disabled={!settings.email_enabled}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Separator />

        {/* Heures silencieuses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Heures silencieuses</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Désactivez les notifications pendant certaines heures (sauf alertes critiques)
              </p>
            </div>
            <Switch
              checked={settings.quiet_hours_enabled}
              onCheckedChange={(checked) => updateSetting('quiet_hours_enabled', checked)}
            />
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="quiet_hours_start">Début</Label>
                <Input
                  id="quiet_hours_start"
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet_hours_end">Fin</Label>
                <Input
                  id="quiet_hours_end"
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet_hours_timezone">Fuseau horaire</Label>
                <Input
                  id="quiet_hours_timezone"
                  value={settings.quiet_hours_timezone}
                  onChange={(e) => updateSetting('quiet_hours_timezone', e.target.value)}
                  placeholder="Africa/Ouagadougou"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Alertes critiques</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Les alertes critiques sont toujours envoyées, même pendant les heures silencieuses
              </p>
            </div>
            <Switch
              checked={settings.critical_alerts_enabled}
              onCheckedChange={(checked) => updateSetting('critical_alerts_enabled', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Bouton sauvegarder */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les paramètres
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};








