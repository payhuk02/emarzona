/**
 * Page complète de gestion des notifications
 * Centre de notifications avec filtres, tri, actions
 * Date : 27 octobre 2025
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Archive,
  Filter,
} from 'lucide-react';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useArchiveNotification,
  useUnreadCount,
} from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import type { NotificationType } from '@/types/notifications';
import { useToast } from '@/hooks/use-toast';

const NotificationsCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | NotificationType | 'unread'>('all');
  
  const { data: notifications = [], isLoading } = useNotifications(100);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const archiveNotification = useArchiveNotification();

  // Filtrer les notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.is_read;
    return notif.type === filter;
  });

  const handleNotificationClick = async (notification: any) => {
    // Marquer comme lu
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.id);
    }

    // Naviguer
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync();
    toast({
      title: 'Notifications marquées',
      description: 'Toutes les notifications ont été marquées comme lues',
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification.mutateAsync(id);
    toast({
      title: 'Notification supprimée',
      description: 'La notification a été supprimée',
    });
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await archiveNotification.mutateAsync(id);
    toast({
      title: 'Notification archivée',
      description: 'La notification a été archivée',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-muted-foreground">
                Gérez vos notifications et restez informé
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/settings/notifications')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Préférences
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Non lues</p>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
                <CheckCheck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                  <p className="text-2xl font-bold">
                    {
                      notifications.filter(
                        (n) =>
                          new Date(n.created_at).toDateString() === new Date().toDateString()
                      ).length
                    }
                  </p>
                </div>
                <Archive className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et actions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="unread">Non lues</SelectItem>
                    <SelectItem value="course_enrollment">Inscriptions</SelectItem>
                    <SelectItem value="course_complete">Cours terminés</SelectItem>
                    <SelectItem value="certificate_ready">Certificats</SelectItem>
                    <SelectItem value="affiliate_sale">Ventes affilié</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary">{filteredNotifications.length} résultats</Badge>
              </div>

              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Tout marquer lu
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Liste notifications */}
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold text-lg mb-2">Aucune notification</h3>
                <p className="text-muted-foreground">
                  {filter === 'unread'
                    ? 'Vous avez tout lu ! 🎉'
                    : 'Vous n\'avez pas encore de notifications'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center">
                    <div className="flex-1" onClick={() => handleNotificationClick(notification)}>
                      <NotificationItem notification={notification} />
                    </div>
                    <div className="flex items-center gap-2 px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleArchive(notification.id, e)}
                        title="Archiver"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(notification.id, e)}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsCenter;

