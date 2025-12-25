/**
 * Section Notifications
 * Configuration des notifications
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Smartphone, ShoppingCart, CreditCard, Package, User, AlertTriangle } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';

interface NotificationsSectionProps {
  onChange?: () => void;
}

export const NotificationsSection = ({ onChange }: NotificationsSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  
  const [channels, setChannels] = useState({
    email: customizationData?.notifications?.email ?? true,
    sms: customizationData?.notifications?.sms ?? false,
    push: customizationData?.notifications?.push ?? true,
  });

  const [notificationTypes, setNotificationTypes] = useState({
    newOrder: true,
    paymentReceived: true,
    paymentFailed: true,
    orderShipped: true,
    orderDelivered: true,
    orderCancelled: true,
    newProduct: false,
    lowStock: true,
    newUser: false,
    userVerification: false,
    systemAlert: true,
  });

  useEffect(() => {
    if (customizationData?.notifications) {
      setChannels({
        email: customizationData.notifications.email ?? true,
        sms: customizationData.notifications.sms ?? false,
        push: customizationData.notifications.push ?? true,
      });
      if (customizationData.notifications.channels) {
        setNotificationTypes({
          ...notificationTypes,
          ...customizationData.notifications.channels,
        });
      }
    }
  }, [customizationData]);

  const handleChannelChange = async (channel: 'email' | 'sms' | 'push', enabled: boolean) => {
    const newChannels = { ...channels, [channel]: enabled };
    setChannels(newChannels);
    
    await save('notifications', {
      ...customizationData?.notifications,
      ...newChannels,
    });
    
    if (onChange) onChange();
  };

  const handleNotificationTypeChange = async (type: string, enabled: boolean) => {
    const newTypes = { ...notificationTypes, [type]: enabled };
    setNotificationTypes(newTypes);
    
    await save('notifications', {
      ...customizationData?.notifications,
      channels: newTypes,
    });
    
    if (onChange) onChange();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Canaux de notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canaux de notification
          </CardTitle>
          <CardDescription>
            Activez ou désactivez les canaux de notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Notifications par email</Label>
                <p className="text-xs text-muted-foreground">
                  Envoyer des notifications par email
                </p>
              </div>
            </div>
            <Switch
              checked={channels.email}
              onCheckedChange={(checked) => handleChannelChange('email', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Notifications SMS</Label>
                <p className="text-xs text-muted-foreground">
                  Envoyer des notifications par SMS
                </p>
              </div>
            </div>
            <Switch
              checked={channels.sms}
              onCheckedChange={(checked) => handleChannelChange('sms', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Notifications push</Label>
                <p className="text-xs text-muted-foreground">
                  Notifications dans le navigateur
                </p>
              </div>
            </div>
            <Switch
              checked={channels.push}
              onCheckedChange={(checked) => handleChannelChange('push', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Types de notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Types de notifications
          </CardTitle>
          <CardDescription>
            Configurez quels types de notifications envoyer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Commandes</Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Nouvelle commande</Label>
                </div>
                <Switch
                  checked={notificationTypes.newOrder}
                  onCheckedChange={(checked) => handleNotificationTypeChange('newOrder', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Commande expédiée</Label>
                </div>
                <Switch
                  checked={notificationTypes.orderShipped}
                  onCheckedChange={(checked) => handleNotificationTypeChange('orderShipped', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Commande livrée</Label>
                </div>
                <Switch
                  checked={notificationTypes.orderDelivered}
                  onCheckedChange={(checked) => handleNotificationTypeChange('orderDelivered', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Commande annulée</Label>
                </div>
                <Switch
                  checked={notificationTypes.orderCancelled}
                  onCheckedChange={(checked) => handleNotificationTypeChange('orderCancelled', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Paiements</Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Paiement reçu</Label>
                </div>
                <Switch
                  checked={notificationTypes.paymentReceived}
                  onCheckedChange={(checked) => handleNotificationTypeChange('paymentReceived', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Échec de paiement</Label>
                </div>
                <Switch
                  checked={notificationTypes.paymentFailed}
                  onCheckedChange={(checked) => handleNotificationTypeChange('paymentFailed', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Produits</Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Nouveau produit</Label>
                </div>
                <Switch
                  checked={notificationTypes.newProduct}
                  onCheckedChange={(checked) => handleNotificationTypeChange('newProduct', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Stock faible</Label>
                </div>
                <Switch
                  checked={notificationTypes.lowStock}
                  onCheckedChange={(checked) => handleNotificationTypeChange('lowStock', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Utilisateurs</Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Nouvel utilisateur</Label>
                </div>
                <Switch
                  checked={notificationTypes.newUser}
                  onCheckedChange={(checked) => handleNotificationTypeChange('newUser', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Vérification utilisateur</Label>
                </div>
                <Switch
                  checked={notificationTypes.userVerification}
                  onCheckedChange={(checked) => handleNotificationTypeChange('userVerification', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Système</Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Alertes système</Label>
                </div>
                <Switch
                  checked={notificationTypes.systemAlert}
                  onCheckedChange={(checked) => handleNotificationTypeChange('systemAlert', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

