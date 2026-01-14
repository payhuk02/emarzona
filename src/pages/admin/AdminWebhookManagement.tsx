/**
 * Page Admin Webhook Management - Gestion des webhooks
 * Date: 27 Janvier 2025
 *
 * Fonctionnalités:
 * - Liste tous les webhooks du store
 * - Créer/Modifier/Supprimer webhooks
 * - Tester webhooks
 * - Voir historique des livraisons
 * - Statistiques
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/hooks/useStore';
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useWebhookDeliveries,
  useWebhookStats,
} from '@/hooks/webhooks/useWebhooks';
import {
  Webhook,
  WebhookDelivery,
  WebhookEventType,
  WebhookStatus,
  CreateWebhookForm,
} from '@/types/webhooks';
import {
  Webhook as WebhookIcon,
  Plus,
  Edit,
  Trash2,
  Search,
  TestTube,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { MoreVertical, X } from 'lucide-react';

// Événements webhook disponibles, groupés par catégorie
const  WEBHOOK_EVENTS: { category: string; events: { value: WebhookEventType; label: string }[] }[] =
  [
    {
      category: 'Commandes',
      events: [
        { value: 'order.created', label: 'Commande créée' },
        { value: 'order.updated', label: 'Commande mise à jour' },
        { value: 'order.completed', label: 'Commande complétée' },
        { value: 'order.cancelled', label: 'Commande annulée' },
        { value: 'order.refunded', label: 'Commande remboursée' },
      ],
    },
    {
      category: 'Paiements',
      events: [
        { value: 'payment.completed', label: 'Paiement complété' },
        { value: 'payment.failed', label: 'Paiement échoué' },
        { value: 'payment.refunded', label: 'Paiement remboursé' },
        { value: 'payment.pending', label: 'Paiement en attente' },
      ],
    },
    {
      category: 'Produits',
      events: [
        { value: 'product.created', label: 'Produit créé' },
        { value: 'product.updated', label: 'Produit mis à jour' },
        { value: 'product.deleted', label: 'Produit supprimé' },
        { value: 'product.published', label: 'Produit publié' },
      ],
    },
    {
      category: 'Produits Digitaux',
      events: [
        { value: 'digital_product.downloaded', label: 'Produit téléchargé' },
        { value: 'digital_product.license_activated', label: 'Licence activée' },
        { value: 'digital_product.license_revoked', label: 'Licence révoquée' },
      ],
    },
    {
      category: 'Services',
      events: [
        { value: 'service.booking_created', label: 'Réservation créée' },
        { value: 'service.booking_confirmed', label: 'Réservation confirmée' },
        { value: 'service.booking_cancelled', label: 'Réservation annulée' },
        { value: 'service.booking_completed', label: 'Réservation terminée' },
        { value: 'service.booking_rescheduled', label: 'Réservation replanifiée' },
      ],
    },
    {
      category: 'Cours',
      events: [
        { value: 'course.enrolled', label: 'Inscription au cours' },
        { value: 'course.unenrolled', label: 'Désinscription du cours' },
        { value: 'course.completed', label: 'Cours complété' },
        { value: 'course.progress_updated', label: 'Progrès mis à jour' },
      ],
    },
    {
      category: 'Retours',
      events: [
        { value: 'return.created', label: 'Retour créé' },
        { value: 'return.approved', label: 'Retour approuvé' },
        { value: 'return.rejected', label: 'Retour rejeté' },
        { value: 'return.completed', label: 'Retour complété' },
      ],
    },
  ];

export default function AdminWebhookManagement() {
  const isMobile = useIsMobile();
  const { store, loading: storeLoading } = useStore();
  const { data: webhooks, isLoading } = useWebhooks(store?.id);
  const { data: stats } = useWebhookStats(store?.id);
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [viewingDelivery, setViewingDelivery] = useState<WebhookDelivery | null>(null);
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const listRef = useScrollAnimation<HTMLDivElement>();
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [formData, setFormData] = useState<CreateWebhookForm>({
    name: '',
    description: '',
    url: '',
    secret: '',
    events: [],
    status: 'active',
    retry_count: 3,
    timeout_seconds: 30,
    rate_limit_per_minute: 60,
    custom_headers: {},
    verify_ssl: true,
    include_payload: true,
  });

  const { data: deliveries } = useWebhookDeliveries(selectedWebhookId || undefined);

  const filteredWebhooks = webhooks?.filter(webhook => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return (
      webhook.name.toLowerCase().includes(query) ||
      webhook.url.toLowerCase().includes(query) ||
      webhook.description?.toLowerCase().includes(query)
    );
  });

  const handleOpenDialog = (webhook?: Webhook) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        name: webhook.name,
        description: webhook.description || '',
        url: webhook.url,
        secret: '', // Ne pas pré-remplir le secret
        events: webhook.events,
        status: webhook.status,
        retry_count: webhook.retry_count,
        timeout_seconds: webhook.timeout_seconds,
        rate_limit_per_minute: webhook.rate_limit_per_minute,
        custom_headers: webhook.custom_headers,
        verify_ssl: webhook.verify_ssl,
        include_payload: webhook.include_payload,
      });
    } else {
      setEditingWebhook(null);
      setFormData({
        name: '',
        description: '',
        url: '',
        secret: '',
        events: [],
        status: 'active',
        retry_count: 3,
        timeout_seconds: 30,
        rate_limit_per_minute: 60,
        custom_headers: {},
        verify_ssl: true,
        include_payload: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      if (editingWebhook) {
        await updateWebhook.mutateAsync({
          id: editingWebhook.id,
          ...formData,
        });
      } else {
        await createWebhook.mutateAsync({
          ...formData,
          store_id: store.id,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async (webhook: Webhook) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le webhook "${webhook.name}" ?`)) {
      return;
    }
    await deleteWebhook.mutateAsync(webhook.id);
  };

  const handleTest = async (webhook: Webhook) => {
    await testWebhook.mutateAsync(webhook.id);
  };

  const toggleEvent = (event: WebhookEventType) => {
    setFormData(prev => {
      const events = prev.events || [];
      if (events.includes(event)) {
        return { ...prev, events: events.filter(e => e !== event) };
      } else {
        return { ...prev, events: [...events, event] };
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copié',
      description: 'Le texte a été copié dans le presse-papiers',
    });
  };

  const getStatusBadge = (status: WebhookStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'paused':
        return <Badge variant="outline">En pause</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500">Livré</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Échec</Badge>;
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      case 'retrying':
        return <Badge variant="secondary">Nouvelle tentative</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (storeLoading || isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
                <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
                <Skeleton className="h-64 w-full" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              <div className="container mx-auto p-3 sm:p-4 lg:p-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs sm:text-sm">
                        Veuillez d'abord créer une boutique.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              {/* Header - Responsive & Animated */}
              <div
                ref={headerRef}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                      <WebhookIcon
                        className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Gestion des Webhooks
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                    Configurez des webhooks pour recevoir des notifications en temps réel
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onSelect={() => handleOpenDialog()}
                    className="min-h-[44px] h-11 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline text-xs sm:text-sm">Nouveau Webhook</span>
                    <span className="sm:hidden text-xs">Nouveau</span>
                  </Button>
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div
                  ref={statsRef}
                  className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                            Webhooks Actifs
                          </p>
                          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {stats.active_webhooks}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                            Livraisons Total
                          </p>
                          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            {stats.total_deliveries}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                            Taux de Réussite
                          </p>
                          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {stats.success_rate}%
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Échecs</p>
                          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                            {stats.failed_deliveries}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/5">
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Search */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un webhook..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 pr-8 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm flex-1"
                    />
                    {searchQuery && (
                      <button
                        onSelect={() => setSearchQuery('')}
                        className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Webhooks Table */}
              <Card
                ref={listRef}
                className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Webhooks</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {filteredWebhooks?.length || 0} webhook(s) configuré(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredWebhooks && filteredWebhooks.length > 0 ? (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden lg:block">
                        <div className="border border-border/50 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="text-xs sm:text-sm font-semibold">
                                  Nom
                                </TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">
                                  URL
                                </TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">
                                  Événements
                                </TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">
                                  Statut
                                </TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">
                                  Statistiques
                                </TableHead>
                                <TableHead className="text-xs sm:text-sm font-semibold">
                                  Dernière livraison
                                </TableHead>
                                <TableHead className="text-right text-xs sm:text-sm font-semibold">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredWebhooks.map(webhook => (
                                <TableRow
                                  key={webhook.id}
                                  className="hover:bg-muted/50 transition-colors"
                                >
                                  <TableCell className="font-medium text-xs sm:text-sm">
                                    {webhook.name}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2 max-w-xs">
                                      <code className="text-xs bg-muted/50 px-2 py-1 rounded truncate font-mono">
                                        {webhook.url}
                                      </code>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {webhook.events.length} événement(s)
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                                  <TableCell>
                                    <div className="text-xs text-muted-foreground">
                                      <div>✓ {webhook.successful_deliveries} réussies</div>
                                      <div>✗ {webhook.failed_deliveries} échecs</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {webhook.last_triggered_at ? (
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(webhook.last_triggered_at), 'PPp', {
                                          locale: fr,
                                        })}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Jamais</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onSelect={() => {
                                          setSelectedWebhookId(webhook.id);
                                        }}
                                        className="min-h-[44px] min-w-[44px] h-11 w-11 p-0"
                                      >
                                        <Activity className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onSelect={() => handleTest(webhook)}
                                        disabled={testWebhook.isPending}
                                        className="min-h-[44px] min-w-[44px] h-11 w-11 p-0"
                                      >
                                        <TestTube className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onSelect={() => handleOpenDialog(webhook)}
                                        className="min-h-[44px] min-w-[44px] h-11 w-11 p-0"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onSelect={() => handleDelete(webhook)}
                                        disabled={deleteWebhook.isPending}
                                        className="min-h-[44px] min-w-[44px] h-11 w-11 p-0"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Mobile Table Card View */}
                      {isMobile ? (
                        <MobileTableCard
                          data={filteredWebhooks.map(w => ({ ...w, id: w.id }))}
                          columns={[
                            {
                              key: 'name',
                              label: 'Nom',
                              priority: 'high',
                              render: (row: Webhook) => (
                                <span className="font-semibold text-sm">{row.name}</span>
                              ),
                            },
                            {
                              key: 'url',
                              label: 'URL',
                              priority: 'high',
                              render: (row: Webhook) => (
                                <code className="text-xs bg-muted/50 px-2 py-1 rounded truncate max-w-full font-mono block">
                                  {row.url}
                                </code>
                              ),
                            },
                            {
                              key: 'events',
                              label: 'Événements',
                              priority: 'medium',
                              render: (row: Webhook) => (
                                <Badge variant="outline" className="text-xs">
                                  {row.events.length} événement(s)
                                </Badge>
                              ),
                            },
                            {
                              key: 'status',
                              label: 'Statut',
                              priority: 'high',
                              render: (row: Webhook) => getStatusBadge(row.status),
                            },
                            {
                              key: 'stats',
                              label: 'Statistiques',
                              priority: 'medium',
                              render: (row: Webhook) => (
                                <div className="text-xs text-muted-foreground">
                                  <div>✓ {row.successful_deliveries} réussies</div>
                                  <div>✗ {row.failed_deliveries} échecs</div>
                                </div>
                              ),
                            },
                            {
                              key: 'last_triggered',
                              label: 'Dernière livraison',
                              priority: 'low',
                              render: (row: Webhook) => (
                                <span className="text-xs text-muted-foreground">
                                  {row.last_triggered_at
                                    ? format(new Date(row.last_triggered_at), 'PPp', { locale: fr })
                                    : 'Jamais'}
                                </span>
                              ),
                            },
                          ]}
                          actions={(row: Webhook) => (
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onSelect={() => setSelectedWebhookId(row.id)}
                                className="min-h-[44px] w-full"
                              >
                                <Activity className="h-4 w-4 mr-2" />
                                Historique
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onSelect={() => handleTest(row)}
                                disabled={testWebhook.isPending}
                                className="min-h-[44px] w-full"
                              >
                                <TestTube className="h-4 w-4 mr-2" />
                                Tester
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onSelect={() => handleOpenDialog(row)}
                                className="min-h-[44px] w-full"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onSelect={() => handleDelete(row)}
                                disabled={deleteWebhook.isPending}
                                className="min-h-[44px] w-full text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </Button>
                            </div>
                          )}
                        />
                      ) : (
                        <div className="lg:hidden space-y-3 sm:space-y-4">
                          {filteredWebhooks.map(webhook => (
                            <Card
                              key={webhook.id}
                              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                            >
                              <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm sm:text-base truncate mb-1">
                                      {webhook.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                      {getStatusBadge(webhook.status)}
                                      <Badge variant="outline" className="text-xs">
                                        {webhook.events.length} événement(s)
                                      </Badge>
                                    </div>
                                  </div>
                                  <Select>
                                    <SelectTrigger
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        aria-label={`Actions pour le webhook ${webhook.name}`}
                                      >
                                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                                      </Button>
                                    </SelectTrigger>
                                    <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                      <SelectItem value="edit" onSelect
                                        onSelect={() => setSelectedWebhookId(webhook.id)}
                                      >
                                        <Activity className="h-4 w-4 mr-2" />
                                        Historique
                                      </SelectItem>
                                      <SelectItem value="delete" onSelect
                                        onSelect={() => handleTest(webhook)}
                                        disabled={testWebhook.isPending}
                                      >
                                        <TestTube className="h-4 w-4 mr-2" />
                                        Tester
                                      </SelectItem>
                                      <SelectItem value="copy" onSelect onSelect={() => handleOpenDialog(webhook)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifier
                                      </SelectItem>
                                      <SelectItem value="view" onSelect
                                        onSelect={() => handleDelete(webhook)}
                                        disabled={deleteWebhook.isPending}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2 pt-3 border-t border-border/50">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">URL</p>
                                    <code className="text-xs bg-muted/50 px-2 py-1 rounded truncate max-w-[200px] font-mono">
                                      {webhook.url}
                                    </code>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">Statistiques</p>
                                    <div className="text-xs text-muted-foreground text-right">
                                      <div>✓ {webhook.successful_deliveries} réussies</div>
                                      <div>✗ {webhook.failed_deliveries} échecs</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                      Dernière livraison
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {webhook.last_triggered_at
                                        ? format(new Date(webhook.last_triggered_at), 'PPp', {
                                            locale: fr,
                                          })
                                        : 'Jamais'}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 sm:py-16">
                      <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                        <WebhookIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
                      </div>
                      <p className="text-sm sm:text-base text-foreground font-medium mb-2">
                        Aucun webhook configuré
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Créez votre premier webhook pour commencer.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deliveries History */}
              {selectedWebhookId && deliveries && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">
                      Historique des Livraisons
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Historique des tentatives de livraison pour ce webhook
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deliveries.length > 0 ? (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block">
                          <div className="border border-border/50 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="text-xs sm:text-sm font-semibold">
                                    Événement
                                  </TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold">
                                    Statut
                                  </TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold">
                                    Date
                                  </TableHead>
                                  <TableHead className="text-xs sm:text-sm font-semibold">
                                    Réponse
                                  </TableHead>
                                  <TableHead className="text-right text-xs sm:text-sm font-semibold">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {deliveries.map(delivery => (
                                  <TableRow
                                    key={delivery.id}
                                    className="hover:bg-muted/50 transition-colors"
                                  >
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {delivery.event_type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{getDeliveryStatusBadge(delivery.status)}</TableCell>
                                    <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                      {format(new Date(delivery.triggered_at), 'PPp', {
                                        locale: fr,
                                      })}
                                    </TableCell>
                                    <TableCell>
                                      {delivery.response_status_code ? (
                                        <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                                          {delivery.response_status_code}
                                        </code>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onSelect={() => {
                                          setViewingDelivery(delivery);
                                          setIsViewDialogOpen(true);
                                        }}
                                        className="h-8 w-8 p-0"
                                        aria-label={`Voir les détails de la livraison ${delivery.event_type}`}
                                      >
                                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3 sm:space-y-4">
                          {deliveries.map(delivery => (
                            <Card
                              key={delivery.id}
                              className="border-border/50 bg-card/50 backdrop-blur-sm"
                            >
                              <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="text-xs">
                                        {delivery.event_type}
                                      </Badge>
                                      {getDeliveryStatusBadge(delivery.status)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {format(new Date(delivery.triggered_at), 'PPp', {
                                        locale: fr,
                                      })}
                                    </p>
                                    {delivery.response_status_code && (
                                      <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                                        {delivery.response_status_code}
                                      </code>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onSelect={() => {
                                      setViewingDelivery(delivery);
                                      setIsViewDialogOpen(true);
                                    }}
                                    className="h-8 w-8 p-0"
                                    aria-label={`Voir les détails de la livraison ${delivery.event_type}`}
                                  >
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 sm:py-16">
                        <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                          <Activity className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-20" />
                        </div>
                        <p className="text-sm sm:text-base text-foreground font-medium mb-2">
                          Aucune livraison enregistrée
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Aucune livraison enregistrée pour ce webhook.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Create/Edit Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[90vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                      {editingWebhook ? 'Modifier le Webhook' : 'Nouveau Webhook'}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      Configurez un webhook pour recevoir des notifications en temps réel
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs sm:text-sm">
                          Nom *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Mon Webhook"
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-xs sm:text-sm">
                          Statut
                        </Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: WebhookStatus) =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                            <SelectItem value="paused">En pause</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-xs sm:text-sm">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description du webhook..."
                        rows={2}
                        className="text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url" className="text-xs sm:text-sm">
                        URL Endpoint *
                      </Label>
                      <Input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                        required
                        placeholder="https://votre-domaine.com/webhooks/emarzona"
                        className="h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secret" className="text-xs sm:text-sm">
                        Secret (optionnel)
                        <span className="text-xs text-muted-foreground ml-2">
                          Pour signature HMAC-SHA256
                        </span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="secret"
                          type="password"
                          value={formData.secret}
                          onChange={e => setFormData({ ...formData, secret: e.target.value })}
                          placeholder="Laissez vide pour générer automatiquement"
                          className="h-9 sm:h-10 text-xs sm:text-sm flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onSelect={() => {
                            const newSecret = btoa(
                              String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
                            ).slice(0, 32);
                            setFormData({ ...formData, secret: newSecret });
                          }}
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        >
                          Générer
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Événements à écouter *</Label>
                      <div className="border border-border/50 rounded-md p-3 sm:p-4 max-h-64 overflow-y-auto">
                        {WEBHOOK_EVENTS.map(category => (
                          <div key={category.category} className="mb-3 sm:mb-4 last:mb-0">
                            <h4 className="font-medium text-xs sm:text-sm mb-2">
                              {category.category}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {category.events.map(event => (
                                <label
                                  key={event.value}
                                  className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.events?.includes(event.value)}
                                    onChange={() => toggleEvent(event.value)}
                                    className="rounded"
                                  />
                                  <span className="text-xs sm:text-sm">{event.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      {formData.events && formData.events.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formData.events.length} événement(s) sélectionné(s)
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="retry_count" className="text-xs sm:text-sm">
                          Tentatives de retry
                        </Label>
                        <Input
                          id="retry_count"
                          type="number"
                          min="0"
                          max="10"
                          value={formData.retry_count}
                          onChange={e =>
                            setFormData({ ...formData, retry_count: parseInt(e.target.value) || 3 })
                          }
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeout_seconds" className="text-xs sm:text-sm">
                          Timeout (secondes)
                        </Label>
                        <Input
                          id="timeout_seconds"
                          type="number"
                          min="5"
                          max="300"
                          value={formData.timeout_seconds}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              timeout_seconds: parseInt(e.target.value) || 30,
                            })
                          }
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rate_limit" className="text-xs sm:text-sm">
                          Rate limit/min
                        </Label>
                        <Input
                          id="rate_limit"
                          type="number"
                          min="1"
                          value={formData.rate_limit_per_minute}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              rate_limit_per_minute: parseInt(e.target.value) || 60,
                            })
                          }
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="verify_ssl"
                          checked={formData.verify_ssl}
                          onCheckedChange={checked =>
                            setFormData({ ...formData, verify_ssl: checked })
                          }
                        />
                        <Label htmlFor="verify_ssl" className="text-xs sm:text-sm">
                          Vérifier SSL
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="include_payload"
                          checked={formData.include_payload}
                          onCheckedChange={checked =>
                            setFormData({ ...formData, include_payload: checked })
                          }
                        />
                        <Label htmlFor="include_payload" className="text-xs sm:text-sm">
                          Inclure le payload
                        </Label>
                      </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onSelect={() => setIsDialogOpen(false)}
                        className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        disabled={!formData.name || !formData.url || !formData.events?.length}
                        className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {editingWebhook ? 'Enregistrer' : 'Créer'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* View Delivery Dialog */}
              <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-[90vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                      Détails de la Livraison
                    </DialogTitle>
                  </DialogHeader>
                  {viewingDelivery && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm">Statut</Label>
                          <div className="mt-1">
                            {getDeliveryStatusBadge(viewingDelivery.status)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Événement</Label>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {viewingDelivery.event_type}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Date</Label>
                          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {format(new Date(viewingDelivery.triggered_at), 'PPp', { locale: fr })}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Durée</Label>
                          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {viewingDelivery.duration_ms ? `${viewingDelivery.duration_ms}ms` : '-'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Code HTTP</Label>
                          <div className="mt-1">
                            {viewingDelivery.response_status_code ? (
                              <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                                {viewingDelivery.response_status_code}
                              </code>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Tentative</Label>
                          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {viewingDelivery.attempt_number} / {viewingDelivery.max_attempts}
                          </div>
                        </div>
                      </div>

                      {viewingDelivery.error_message && (
                        <div>
                          <Label className="text-xs sm:text-sm">Erreur</Label>
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <AlertDescription className="text-xs sm:text-sm">
                              {viewingDelivery.error_message}
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}

                      <div>
                        <Label className="text-xs sm:text-sm">Request Body</Label>
                        <div className="mt-2 p-3 sm:p-4 bg-muted/50 rounded-md max-h-64 overflow-y-auto">
                          <pre className="text-xs">
                            {viewingDelivery.request_body
                              ? JSON.stringify(JSON.parse(viewingDelivery.request_body), null, 2)
                              : '-'}
                          </pre>
                        </div>
                      </div>

                      {viewingDelivery.response_body && (
                        <div>
                          <Label className="text-xs sm:text-sm">Response Body</Label>
                          <div className="mt-2 p-3 sm:p-4 bg-muted/50 rounded-md max-h-64 overflow-y-auto">
                            <pre className="text-xs">{viewingDelivery.response_body}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      onSelect={() => setIsViewDialogOpen(false)}
                      className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                    >
                      Fermer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}






