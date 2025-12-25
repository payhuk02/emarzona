/**
 * NotificationPreferences - Configuration des préférences de notifications
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  Loader2,
} from 'lucide-react';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  NotificationPreferences,
} from '@/hooks/physical/usePhysicalNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';

export const NotificationPreferences = () => {
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const [formData, setFormData] = useState<Partial<NotificationPreferences>>({
    email_price_alerts: true,
    email_stock_alerts: true,
    email_promotion_alerts: true,
    email_shipment_updates: true,
    email_return_updates: true,
    email_order_updates: true,
    email_marketing: false,
    sms_price_alerts: false,
    sms_stock_alerts: false,
    sms_shipment_updates: true,
    sms_return_updates: false,
    sms_order_updates: false,
    push_price_alerts: true,
    push_stock_alerts: true,
    push_promotion_alerts: true,
    push_shipment_updates: true,
    push_return_updates: true,
    notification_frequency: 'immediate',
  });

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePreferences.mutateAsync(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des préférences. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Préférences de notifications
        </CardTitle>
        <CardDescription>
          Configurez comment et quand vous souhaitez recevoir des notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Notifications Email</h3>
            </div>
            <div className="space-y-4 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de prix</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des emails pour les baisses de prix
                  </div>
                </div>
                <Switch
                  checked={formData.email_price_alerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, email_price_alerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de stock</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des emails pour les retours en stock
                  </div>
                </div>
                <Switch
                  checked={formData.email_stock_alerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, email_stock_alerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de promotions</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des emails pour les promotions
                  </div>
                </div>
                <Switch
                  checked={formData.email_promotion_alerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, email_promotion_alerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mises à jour d'expédition</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des emails pour le suivi de vos commandes
                  </div>
                </div>
                <Switch
                  checked={formData.email_shipment_updates}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, email_shipment_updates: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mises à jour de retours</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des emails pour le statut de vos retours
                  </div>
                </div>
                <Switch
                  checked={formData.email_return_updates}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, email_return_updates: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mises à jour de commandes</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des emails pour vos commandes
                  </div>
                </div>
                <Switch
                  checked={formData.email_order_updates}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, email_order_updates: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des emails marketing et promotions
                  </div>
                </div>
                <Switch
                  checked={formData.email_marketing}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, email_marketing: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SMS Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Notifications SMS</h3>
            </div>
            <div className="space-y-4 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de prix</Label>
                </div>
                <Switch
                  checked={formData.sms_price_alerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sms_price_alerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de stock</Label>
                </div>
                <Switch
                  checked={formData.sms_stock_alerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sms_stock_alerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mises à jour d'expédition</Label>
                </div>
                <Switch
                  checked={formData.sms_shipment_updates}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sms_shipment_updates: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Push Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Notifications Push</h3>
            </div>
            <div className="space-y-4 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de prix</Label>
                </div>
                <Switch
                  checked={formData.push_price_alerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, push_price_alerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de stock</Label>
                </div>
                <Switch
                  checked={formData.push_stock_alerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, push_stock_alerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de promotions</Label>
                </div>
                <Switch
                  checked={formData.push_promotion_alerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, push_promotion_alerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mises à jour d'expédition</Label>
                </div>
                <Switch
                  checked={formData.push_shipment_updates}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, push_shipment_updates: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="notification_frequency">Fréquence des notifications</Label>
            <Select
              value={formData.notification_frequency || 'immediate'}
              onValueChange={(value: 'immediate' | 'daily' | 'weekly') =>
                setFormData({ ...formData, notification_frequency: value })
              }
            >
              <SelectTrigger id="notification_frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immédiat</SelectItem>
                <SelectItem value="daily">Quotidien (résumé)</SelectItem>
                <SelectItem value="weekly">Hebdomadaire (résumé)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {formData.notification_frequency === 'immediate' &&
                'Recevez les notifications dès qu\'elles se produisent'}
              {formData.notification_frequency === 'daily' &&
                'Recevez un résumé quotidien de toutes vos notifications'}
              {formData.notification_frequency === 'weekly' &&
                'Recevez un résumé hebdomadaire de toutes vos notifications'}
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={updatePreferences.isPending}>
              {updatePreferences.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les préférences
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

