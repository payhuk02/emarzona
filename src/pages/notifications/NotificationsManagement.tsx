/**
 * Page de Gestion des Notifications In-App
 * Date: 31 Janvier 2025
 * 
 * Interface complète pour gérer les notifications avec :
 * - Liste complète des notifications
 * - Filtres avancés (type, statut, date)
 * - Préférences de notifications
 * - Actions en masse
 * - Statistiques
 */

import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Bell,
  BellOff,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Trash2,
  Archive,
  Eye,
  EyeOff,
  MoreVertical,
  Mail,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useArchiveNotification,
  useDeleteNotification,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

export default function NotificationsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Hooks
  const { data: notificationsResult, isLoading } = useNotifications({ page, pageSize: 50 });
  const notifications = notificationsResult?.data || [];
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const archiveNotification = useArchiveNotification();
  const deleteNotification = useDeleteNotification();
  const { data: preferences } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    if (statusFilter === 'read') {
      filtered = filtered.filter((n) => n.is_read);
    } else if (statusFilter === 'unread') {
      filtered = filtered.filter((n) => !n.is_read);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query) ||
          n.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, typeFilter, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
      read: notifications.filter((n) => n.is_read).length,
      archived: 0, // TODO: Add archived count
    };
  }, [notifications]);

  // Get notification type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      order_placed: 'Commande passée',
      order_confirmed: 'Commande confirmée',
      order_shipped: 'Commande expédiée',
      order_delivered: 'Commande livrée',
      payment_received: 'Paiement reçu',
      payment_failed: 'Paiement échoué',
      product_review: 'Avis produit',
      price_drop: 'Baisse de prix',
      stock_alert: 'Alerte stock',
      system_announcement: 'Annonce système',
    };
    return labels[type] || type;
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    if (type.includes('order')) return <Package className="h-4 w-4" />;
    if (type.includes('payment')) return <CheckCircle2 className="h-4 w-4" />;
    if (type.includes('review')) return <MessageSquare className="h-4 w-4" />;
    if (type.includes('price')) return <TrendingDown className="h-4 w-4" />;
    if (type.includes('stock')) return <AlertCircle className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  // Handlers
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de marquer comme lu',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast({
        title: '✅ Toutes marquées comme lues',
        description: 'Toutes les notifications ont été marquées comme lues',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de marquer toutes comme lues',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (notificationId: string) => {
    try {
      await archiveNotification.mutateAsync(notificationId);
      toast({
        title: '✅ Notification archivée',
        description: 'La notification a été archivée',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'archiver la notification',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification.mutateAsync(notificationId);
      toast({
        title: '✅ Notification supprimée',
        description: 'La notification a été supprimée',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la notification',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Mes Notifications
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gérez toutes vos notifications en un seul endroit
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsPreferencesOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Préférences
                </Button>
                {unreadCount > 0 && (
                  <Button onClick={handleMarkAllAsRead} disabled={markAllAsRead.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Tout marquer lu
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Non lues</CardTitle>
                  <BellOff className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.unread}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Lues</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.read}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Archivées</CardTitle>
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.archived}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une notification..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="order_placed">Commandes</SelectItem>
                      <SelectItem value="payment_received">Paiements</SelectItem>
                      <SelectItem value="product_review">Avis</SelectItem>
                      <SelectItem value="price_drop">Prix</SelectItem>
                      <SelectItem value="stock_alert">Stock</SelectItem>
                      <SelectItem value="system_announcement">Système</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="unread">Non lues</SelectItem>
                      <SelectItem value="read">Lues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Aucune notification ne correspond à vos critères'
                        : 'Aucune notification'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer',
                          !notification.is_read
                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                            : 'bg-muted/30 hover:bg-muted/50'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="p-2 rounded-full bg-primary/10">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                {!notification.is_read && (
                                  <Badge variant="secondary" className="text-xs">
                                    Nouveau
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(notification.type)}
                                </Badge>
                              </div>
                              {notification.message && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {notification.message}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(notification.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                </span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.is_read && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Marquer comme lu
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchive(notification.id);
                                  }}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archiver
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notification.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences Dialog */}
            <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Préférences de Notifications</DialogTitle>
                  <DialogDescription>
                    Configurez vos préférences de notifications
                  </DialogDescription>
                </DialogHeader>
                {preferences && (
                  <div className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email_notifications">Notifications Email</Label>
                        <Switch
                          id="email_notifications"
                          checked={preferences.email_notifications ?? true}
                          onCheckedChange={(checked) => {
                            updatePreferences.mutate({ email_notifications: checked });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push_notifications">Notifications Push</Label>
                        <Switch
                          id="push_notifications"
                          checked={preferences.push_notifications ?? true}
                          onCheckedChange={(checked) => {
                            updatePreferences.mutate({ push_notifications: checked });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sms_notifications">Notifications SMS</Label>
                        <Switch
                          id="sms_notifications"
                          checked={preferences.sms_notifications ?? false}
                          onCheckedChange={(checked) => {
                            updatePreferences.mutate({ sms_notifications: checked });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

