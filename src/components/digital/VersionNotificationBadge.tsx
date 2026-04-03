/**
 * Version Notification Badge Component
 * Date: 1 Février 2025
 * 
 * Badge pour afficher les notifications de nouvelles versions
 */

import { useDigitalProductUpdateNotifications, useMarkUpdateNotificationRead, DigitalProductVersion } from '@/hooks/digital/useDigitalProductVersions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';

interface UpdateNotification {
  id: string;
  user_id: string;
  digital_product_id: string;
  version_id: string;
  is_read: boolean;
  created_at: string;
  version?: DigitalProductVersion;
  product?: {
    id: string;
    digital_type: string;
    product?: {
      id: string;
      name: string;
      slug?: string;
      image_url?: string;
    };
  };
}
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const VersionNotificationBadge = () => {
  const { data: notifications = [], isLoading } = useDigitalProductUpdateNotifications();
  const markAsRead = useMarkUpdateNotificationRead();
  const navigate = useNavigate();
  const { toast } = useToast();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notification: UpdateNotification) => {
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.id);
    }

    // Naviguer vers la page du produit
    if (notification.product?.product?.slug) {
      navigate(`/digital-product/${notification.product.product.slug}`);
    }

    toast({
      title: 'Nouvelle version disponible',
      description: `Version ${notification.version?.version_number} de ${notification.product?.product?.name}`,
    });
  };

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    await Promise.all(
      unreadNotifications.map((n) => markAsRead.mutateAsync(n.id))
    );
  };

  if (isLoading) {
    return null;
  }

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Mises à jour disponibles</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-auto p-0 text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {notification.product?.product?.name || 'Produit'}
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Version {notification.version?.version_number} disponible
                      </p>
                      {notification.version?.version_name && (
                        <p className="text-xs text-muted-foreground">
                          {notification.version.version_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(notification.created_at),
                          'd MMM yyyy à HH:mm',
                          { locale: fr }
                        )}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead.mutate(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};







