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

import { useState, useMemo, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StableDropdownMenu, DropdownMenuSeparator } from '@/components/ui/stable-dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Bell,
  BellOff,
  Search,
  CheckCircle2,
  Clock,
  Settings,
  Trash2,
  Archive,
  MoreVertical,
  MessageSquare,
  AlertCircle,
  Package,
  TrendingDown,
  Download,
  GraduationCap,
  Palette,
  Wrench,
  ArrowDown,
  ArrowUp,
  CreditCard,
  Gift,
  Volume2,
  Accessibility,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useArchiveNotification,
  useDeleteNotification,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useRealtimeNotifications,
} from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function NotificationsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Hooks
  const includeArchived = statusFilter === 'archived' || statusFilter === 'all';
  const { data: notificationsResult, isLoading } = useNotifications({
    page,
    pageSize,
    includeArchived,
  });
  const notifications = useMemo(() => notificationsResult?.data || [], [notificationsResult?.data]);
  const totalCount = notificationsResult?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const archiveNotification = useArchiveNotification();
  const deleteNotification = useDeleteNotification();
  const { data: preferences } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Realtime notifications
  useRealtimeNotifications();

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Filtered and sorted notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Filter by status
    if (statusFilter === 'read') {
      filtered = filtered.filter(n => n.is_read && !n.is_archived);
    } else if (statusFilter === 'unread') {
      filtered = filtered.filter(n => !n.is_read && !n.is_archived);
    } else if (statusFilter === 'archived') {
      filtered = filtered.filter(n => n.is_archived);
    } else {
      // 'all' - show non-archived only (archived are shown separately)
      filtered = filtered.filter(n => !n.is_archived);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query) ||
          n.type.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (sortBy === 'priority') {
        const priorityOrder: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
        const priorityA = priorityOrder[a.priority] || 2;
        const priorityB = priorityOrder[b.priority] || 2;
        return sortOrder === 'desc' ? priorityB - priorityA : priorityA - priorityB;
      }
      return 0;
    });

    return filtered;
  }, [notifications, typeFilter, statusFilter, searchQuery, sortBy, sortOrder]);

  // Stats

  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      read: notifications.filter(n => n.is_read).length,
      archived: notifications.filter(n => n.is_archived === true).length,
    };
  }, [notifications]);

  // Get notification type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      // Produits digitaux
      digital_product_purchased: 'Produit digital acheté',
      digital_product_download_ready: 'Téléchargement prêt',
      digital_product_version_update: 'Mise à jour disponible',
      digital_product_license_expiring: 'Licence expire bientôt',
      digital_product_license_expired: 'Licence expirée',

      // Produits physiques
      physical_product_order_placed: 'Commande passée',
      physical_product_order_confirmed: 'Commande confirmée',
      physical_product_order_shipped: 'Commande expédiée',
      physical_product_order_delivered: 'Commande livrée',
      physical_product_order_cancelled: 'Commande annulée',
      physical_product_low_stock: 'Stock faible',
      physical_product_out_of_stock: 'Rupture de stock',
      physical_product_back_in_stock: 'Stock réapprovisionné',

      // Services
      service_booking_confirmed: 'Réservation confirmée',
      service_booking_reminder: 'Rappel de réservation',
      service_booking_cancelled: 'Réservation annulée',
      service_booking_completed: 'Service terminé',
      service_payment_required: 'Paiement requis',

      // Cours
      course_enrollment: 'Inscription au cours',
      course_lesson_complete: 'Leçon terminée',
      course_complete: 'Cours terminé',
      course_certificate_ready: 'Certificat prêt',
      course_new_content: 'Nouveau contenu',
      course_quiz_passed: 'Quiz réussi',
      course_quiz_failed: 'Quiz échoué',

      // Artistes
      artist_product_purchased: 'Oeuvre achetée',
      artist_product_certificate_ready: "Certificat d'authenticité prêt",
      artist_product_edition_sold_out: 'Édition épuisée',
      artist_product_shipping_update: 'Mise à jour expédition',

      // Général
      order_payment_received: 'Paiement reçu',
      order_payment_failed: 'Paiement échoué',
      order_refund_processed: 'Remboursement traité',
      affiliate_commission_earned: 'Commission gagnée',
      affiliate_commission_paid: 'Commission payée',
      product_review_received: 'Avis reçu',
      system_announcement: 'Annonce système',

      // Messages
      vendor_message_received: 'Message vendeur',
      customer_message_received: 'Message client',
      vendor_conversation_started: 'Conversation démarrée',
      vendor_conversation_closed: 'Conversation fermée',
      order_message_received: 'Message commande',

      // Legacy types
      order_placed: 'Commande passée',
      order_confirmed: 'Commande confirmée',
      order_shipped: 'Commande expédiée',
      order_delivered: 'Commande livrée',
      payment_received: 'Paiement reçu',
      payment_failed: 'Paiement échoué',
      product_review: 'Avis produit',
      price_drop: 'Baisse de prix',
      stock_alert: 'Alerte stock',
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    // Produits digitaux
    if (type.includes('digital_product')) return <Download className="h-4 w-4" />;

    // Produits physiques
    if (type.includes('physical_product') || type.includes('order'))
      return <Package className="h-4 w-4" />;

    // Services
    if (type.includes('service')) return <Wrench className="h-4 w-4" />;

    // Cours
    if (type.includes('course')) return <GraduationCap className="h-4 w-4" />;

    // Artistes
    if (type.includes('artist')) return <Palette className="h-4 w-4" />;

    // Paiements
    if (type.includes('payment') || type.includes('refund'))
      return <CreditCard className="h-4 w-4" />;

    // Messages
    if (type.includes('message') || type.includes('conversation'))
      return <MessageSquare className="h-4 w-4" />;

    // Avis
    if (type.includes('review')) return <MessageSquare className="h-4 w-4" />;

    // Prix
    if (type.includes('price') || type.includes('drop'))
      return <TrendingDown className="h-4 w-4" />;

    // Stock
    if (type.includes('stock')) return <AlertCircle className="h-4 w-4" />;

    // Affiliation
    if (type.includes('affiliate') || type.includes('commission'))
      return <Gift className="h-4 w-4" />;

    // Système
    if (type.includes('system') || type.includes('announcement'))
      return <Bell className="h-4 w-4" />;

    // Par défaut
    return <Bell className="h-4 w-4" />;
  };

  // Handlers
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (_error: unknown) {
      const errorMessage =
        _error instanceof Error ? _error.message : 'Impossible de marquer comme lu';
      toast({
        title: 'Erreur',
        description: errorMessage,
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
    } catch (_error: unknown) {
      const errorMessage =
        _error instanceof Error ? _error.message : 'Impossible de marquer toutes comme lues';
      toast({
        title: 'Erreur',
        description: errorMessage,
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
    } catch (_error: unknown) {
      const errorMessage =
        _error instanceof Error ? _error.message : "Impossible d'archiver la notification";
      toast({
        title: 'Erreur',
        description: errorMessage,
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
    } catch (_error: unknown) {
      const errorMessage =
        _error instanceof Error ? _error.message : 'Impossible de supprimer la notification';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = (notification: {
    id: string;
    is_read: boolean;
    type?: string;
    [key: string]: unknown;
  }) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleToggleSelect = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await Promise.all(selectedNotifications.map(id => markAsRead.mutateAsync(id)));
      setSelectedNotifications([]);
      toast({
        title: '✅ Notifications marquées comme lues',
        description: `${selectedNotifications.length} notification(s) marquée(s) comme lue(s)`,
      });
    } catch (_error: unknown) {
      const errorMessage =
        _error instanceof Error ? _error.message : 'Impossible de marquer comme lues';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleBulkArchive = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await Promise.all(selectedNotifications.map(id => archiveNotification.mutateAsync(id)));
      setSelectedNotifications([]);
      toast({
        title: '✅ Notifications archivées',
        description: `${selectedNotifications.length} notification(s) archivée(s)`,
      });
    } catch (_error: unknown) {
      const errorMessage =
        _error instanceof Error ? _error.message : "Impossible d'archiver les notifications";
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await Promise.all(selectedNotifications.map(id => deleteNotification.mutateAsync(id)));
      setSelectedNotifications([]);
      toast({
        title: '✅ Notifications supprimées',
        description: `${selectedNotifications.length} notification(s) supprimée(s)`,
      });
    } catch (_error: unknown) {
      const errorMessage =
        _error instanceof Error ? _error.message : 'Impossible de supprimer les notifications';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, searchQuery]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
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
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {stats.unread}
                  </div>
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
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="digital_product_purchased">Produits digitaux</SelectItem>
                      <SelectItem value="physical_product_order_placed">
                        Produits physiques
                      </SelectItem>
                      <SelectItem value="service_booking_confirmed">Services</SelectItem>
                      <SelectItem value="course_enrollment">Cours</SelectItem>
                      <SelectItem value="artist_product_purchased">Artistes</SelectItem>
                      <SelectItem value="order_payment_received">Paiements</SelectItem>
                      <SelectItem value="vendor_message_received">Messages</SelectItem>
                      <SelectItem value="product_review_received">Avis</SelectItem>
                      <SelectItem value="affiliate_commission_earned">Affiliation</SelectItem>
                      <SelectItem value="system_announcement">Système</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={v =>
                      setStatusFilter(v as 'all' | 'read' | 'unread' | 'archived')
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="unread">Non lues</SelectItem>
                      <SelectItem value="read">Lues</SelectItem>
                      <SelectItem value="archived">Archivées</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={v => setSortBy(v as 'date' | 'priority')}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="priority">Priorité</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    title={sortOrder === 'asc' ? 'Trier décroissant' : 'Trier croissant'}
                  >
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
                  {filteredNotifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          filteredNotifications.length > 0 &&
                          selectedNotifications.length === filteredNotifications.length
                        }
                        onCheckedChange={handleSelectAll}
                        onSelect={e => e.stopPropagation()}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedNotifications.length > 0
                          ? `${selectedNotifications.length} sélectionnée(s)`
                          : 'Sélectionner tout'}
                      </span>
                      {selectedNotifications.length > 0 && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleBulkMarkAsRead();
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Marquer lu
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleBulkArchive();
                            }}
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Archiver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleBulkDelete();
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                    {filteredNotifications.map(notification => (
                      <div
                        key={notification.id}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-lg border transition-colors',
                          selectedNotifications.includes(notification.id)
                            ? 'bg-primary/10 border-primary/40'
                            : !notification.is_read
                              ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                              : 'bg-muted/30 hover:bg-muted/50',
                          notification.action_url && 'cursor-pointer'
                        )}
                        onSelect={() => handleNotificationClick(notification)}
                      >
                        <Checkbox
                          checked={selectedNotifications.includes(notification.id)}
                          onCheckedChange={() => handleToggleSelect(notification.id)}
                          onSelect={e => e.stopPropagation()}
                          className="mt-1"
                        />
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
                                  {format(
                                    new Date(notification.created_at),
                                    'dd MMM yyyy à HH:mm',
                                    { locale: fr }
                                  )}
                                </span>
                              </div>
                            </div>
                            <StableDropdownMenu
                              triggerContent={<MoreVertical className="h-4 w-4" />}
                              triggerProps={{
                                variant: 'ghost' as const,
                                size: 'sm' as const,
                                'aria-label': `Actions pour la notification ${notification.id}`,
                              }}
                            >
                              {!notification.is_read && (
                                <SelectItem
                                  value="edit"
                                  onSelect={() => handleMarkAsRead(notification.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Marquer comme lu
                                </SelectItem>
                              )}
                              <SelectItem
                                value="delete"
                                onSelect={() => handleArchive(notification.id)}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archiver
                              </SelectItem>
                              <DropdownMenuSeparator />
                              <SelectItem
                                value="copy"
                                onSelect={() => handleDelete(notification.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </SelectItem>
                            </StableDropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages} • {totalCount} notification(s) au total
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onSelect={e => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onSelect={e => {
                              e.preventDefault();
                              setPage(pageNum);
                            }}
                            isActive={page === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    {totalPages > 5 && page < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onSelect={e => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <Select
                  value={pageSize.toString()}
                  onValueChange={value => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Preferences Dialog */}
            <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Préférences de Notifications</DialogTitle>
                  <DialogDescription>Configurez vos préférences de notifications</DialogDescription>
                </DialogHeader>
                {preferences && (
                  <div className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email_notifications">Notifications Email</Label>
                        <Switch
                          id="email_notifications"
                          checked={preferences.email_notifications ?? true}
                          onCheckedChange={checked => {
                            updatePreferences.mutate({ email_notifications: checked });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push_notifications">Notifications Push</Label>
                        <Switch
                          id="push_notifications"
                          checked={preferences.push_notifications ?? true}
                          onCheckedChange={checked => {
                            updatePreferences.mutate({ push_notifications: checked });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sms_notifications">Notifications SMS</Label>
                        <Switch
                          id="sms_notifications"
                          checked={preferences.sms_notifications ?? false}
                          onCheckedChange={checked => {
                            updatePreferences.mutate({ sms_notifications: checked });
                          }}
                        />
                      </div>
                    </div>

                    {/* Section Sons et Vibrations */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Volume2 className="h-5 w-5" />
                        Sons et Vibrations
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sound_notifications" className="flex items-center gap-2">
                            Sons de notifications
                            <span className="text-sm text-muted-foreground">
                              (recommandé pour l'accessibilité)
                            </span>
                          </Label>
                          <Switch
                            id="sound_notifications"
                            checked={preferences.sound_notifications ?? true}
                            onCheckedChange={checked => {
                              updatePreferences.mutate({ sound_notifications: checked });
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="vibration_notifications"
                            className="flex items-center gap-2"
                          >
                            Vibrations
                            <span className="text-sm text-muted-foreground">
                              (mobile uniquement)
                            </span>
                          </Label>
                          <Switch
                            id="vibration_notifications"
                            checked={preferences.vibration_notifications ?? true}
                            onCheckedChange={checked => {
                              updatePreferences.mutate({ vibration_notifications: checked });
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vibration_intensity">Intensité des vibrations</Label>
                          <Select
                            value={preferences.vibration_intensity || 'medium'}
                            onValueChange={value => {
                              updatePreferences.mutate({
                                vibration_intensity: value as 'light' | 'medium' | 'heavy',
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Légère</SelectItem>
                              <SelectItem value="medium">Normale</SelectItem>
                              <SelectItem value="heavy">Intense</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notification_sound_type">Type de son</Label>
                          <Select
                            value={preferences.notification_sound_type || 'default'}
                            onValueChange={value => {
                              updatePreferences.mutate({
                                notification_sound_type: value as 'default' | 'gentle' | 'urgent',
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Par défaut</SelectItem>
                              <SelectItem value="gentle">Doux</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Section Accessibilité */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Accessibility className="h-5 w-5" />
                        Accessibilité
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="accessibility_mode" className="flex items-center gap-2">
                            Mode accessibilité
                            <span className="text-sm text-muted-foreground">
                              (optimisations pour les utilisateurs handicapés)
                            </span>
                          </Label>
                          <Switch
                            id="accessibility_mode"
                            checked={preferences.accessibility_mode ?? false}
                            onCheckedChange={checked => {
                              updatePreferences.mutate({ accessibility_mode: checked });
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="high_contrast_sounds" className="flex items-center gap-2">
                            Sons haute contraste
                            <span className="text-sm text-muted-foreground">
                              (différenciation améliorée)
                            </span>
                          </Label>
                          <Switch
                            id="high_contrast_sounds"
                            checked={preferences.high_contrast_sounds ?? false}
                            onCheckedChange={checked => {
                              updatePreferences.mutate({ high_contrast_sounds: checked });
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="screen_reader_friendly"
                            className="flex items-center gap-2"
                          >
                            Compatible lecteur d'écran
                            <span className="text-sm text-muted-foreground">
                              (optimisations ARIA)
                            </span>
                          </Label>
                          <Switch
                            id="screen_reader_friendly"
                            checked={preferences.screen_reader_friendly ?? true}
                            onCheckedChange={checked => {
                              updatePreferences.mutate({ screen_reader_friendly: checked });
                            }}
                          />
                        </div>
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
