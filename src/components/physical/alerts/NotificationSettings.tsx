/**
 * Notification Settings Component
 * Paramètres de notifications pour les utilisateurs
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/physical/useAlerts';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NotificationSettingsProps {
  storeId: string;
}

export const NotificationSettings = ({ storeId }: NotificationSettingsProps) => {
  const { user } = useAuth();
  const { data: preferences, isLoading } = useNotificationPreferences(storeId, user?.id);
  const updatePreferences = useUpdateNotificationPreferences();

  const [settings, setSettings] = useState({
    email_low_stock: true,
    email_out_of_stock: true,
    email_new_order: true,
    email_order_shipped: true,
    email_order_delivered: true,
    email_return_request: true,
    email_refund_processed: true,
    push_low_stock: false,
    push_new_order: true,
    push_return_request: true,
    notification_frequency: 'realtime' as 'realtime' | 'daily' | 'weekly',
  });

  useEffect(() => {
    if (preferences) {
      setSettings({
        email_low_stock: preferences.email_low_stock,
        email_out_of_stock: preferences.email_out_of_stock,
        email_new_order: preferences.email_new_order,
        email_order_shipped: preferences.email_order_shipped,
        email_order_delivered: preferences.email_order_delivered,
        email_return_request: preferences.email_return_request,
        email_refund_processed: preferences.email_refund_processed,
        push_low_stock: preferences.push_low_stock,
        push_new_order: preferences.push_new_order,
        push_return_request: preferences.push_return_request,
        notification_frequency: preferences.notification_frequency,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    if (!user) return;

    updatePreferences.mutate({
      storeId,
      userId: user.id,
      preferences: settings,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Paramètres de Notifications
        </CardTitle>
        <CardDescription>
          Configurez comment vous souhaitez recevoir les notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5" />
            <h3 className="font-semibold">Notifications Email</h3>
          </div>
          
          <div className="space-y-3 pl-7">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-low-stock">Stock faible</Label>
              <Switch
                id="email-low-stock"
                checked={settings.email_low_stock}
                onCheckedChange={(checked) => setSettings({ ...settings, email_low_stock: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-out-of-stock">Stock épuisé</Label>
              <Switch
                id="email-out-of-stock"
                checked={settings.email_out_of_stock}
                onCheckedChange={(checked) => setSettings({ ...settings, email_out_of_stock: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-new-order">Nouvelle commande</Label>
              <Switch
                id="email-new-order"
                checked={settings.email_new_order}
                onCheckedChange={(checked) => setSettings({ ...settings, email_new_order: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-order-shipped">Commande expédiée</Label>
              <Switch
                id="email-order-shipped"
                checked={settings.email_order_shipped}
                onCheckedChange={(checked) => setSettings({ ...settings, email_order_shipped: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-order-delivered">Commande livrée</Label>
              <Switch
                id="email-order-delivered"
                checked={settings.email_order_delivered}
                onCheckedChange={(checked) => setSettings({ ...settings, email_order_delivered: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-return-request">Demande de retour</Label>
              <Switch
                id="email-return-request"
                checked={settings.email_return_request}
                onCheckedChange={(checked) => setSettings({ ...settings, email_return_request: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-refund-processed">Remboursement traité</Label>
              <Switch
                id="email-refund-processed"
                checked={settings.email_refund_processed}
                onCheckedChange={(checked) => setSettings({ ...settings, email_refund_processed: checked })}
              />
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="h-5 w-5" />
            <h3 className="font-semibold">Notifications Push</h3>
          </div>
          
          <div className="space-y-3 pl-7">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-low-stock">Stock faible</Label>
              <Switch
                id="push-low-stock"
                checked={settings.push_low_stock}
                onCheckedChange={(checked) => setSettings({ ...settings, push_low_stock: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-new-order">Nouvelle commande</Label>
              <Switch
                id="push-new-order"
                checked={settings.push_new_order}
                onCheckedChange={(checked) => setSettings({ ...settings, push_new_order: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-return-request">Demande de retour</Label>
              <Switch
                id="push-return-request"
                checked={settings.push_return_request}
                onCheckedChange={(checked) => setSettings({ ...settings, push_return_request: checked })}
              />
            </div>
          </div>
        </div>

        {/* Frequency */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="notification-frequency">Fréquence des notifications</Label>
          <Select
            value={settings.notification_frequency}
            onValueChange={(value) => setSettings({ ...settings, notification_frequency: value as typeof settings.notification_frequency })}
          >
            <SelectTrigger id="notification-frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Temps réel</SelectItem>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={updatePreferences.isPending}
            className="w-full"
          >
            {updatePreferences.isPending ? 'Enregistrement...' : 'Enregistrer les préférences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

