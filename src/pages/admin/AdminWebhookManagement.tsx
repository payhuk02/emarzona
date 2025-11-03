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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

// Événements webhook disponibles, groupés par catégorie
const WEBHOOK_EVENTS: { category: string; events: { value: WebhookEventType; label: string }[] }[] = [
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
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredWebhooks = webhooks?.filter((webhook) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
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
    setFormData((prev) => {
      const events = prev.events || [];
      if (events.includes(event)) {
        return { ...prev, events: events.filter((e) => e !== event) };
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
        <AppSidebar />
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Veuillez d'abord créer une boutique.</AlertDescription>
          </Alert>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <WebhookIcon className="h-8 w-8" />
              Gestion des Webhooks
            </h1>
            <p className="text-muted-foreground mt-1">
              Configurez des webhooks pour recevoir des notifications en temps réel
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Webhook
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Webhooks Actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active_webhooks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Livraisons Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_deliveries}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taux de Réussite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.success_rate}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Échecs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.failed_deliveries}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un webhook..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>
              {filteredWebhooks?.length || 0} webhook(s) configuré(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredWebhooks && filteredWebhooks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Événements</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Statistiques</TableHead>
                    <TableHead>Dernière livraison</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWebhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-xs truncate">
                          <code className="text-xs bg-muted px-2 py-1 rounded truncate">
                            {webhook.url}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{webhook.events.length} événement(s)</Badge>
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
                            {format(new Date(webhook.last_triggered_at), 'PPp', { locale: fr })}
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
                            onClick={() => {
                              setSelectedWebhookId(webhook.id);
                            }}
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTest(webhook)}
                            disabled={testWebhook.isPending}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(webhook)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(webhook)}
                            disabled={deleteWebhook.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun webhook configuré. Créez votre premier webhook pour commencer.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Deliveries History */}
        {selectedWebhookId && deliveries && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des Livraisons</CardTitle>
              <CardDescription>
                Historique des tentatives de livraison pour ce webhook
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Événement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Réponse</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          <Badge variant="outline">{delivery.event_type}</Badge>
                        </TableCell>
                        <TableCell>{getDeliveryStatusBadge(delivery.status)}</TableCell>
                        <TableCell>
                          {format(new Date(delivery.triggered_at), 'PPp', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {delivery.response_status_code ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {delivery.response_status_code}
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingDelivery(delivery);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Aucune livraison enregistrée pour ce webhook.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? 'Modifier le Webhook' : 'Nouveau Webhook'}
              </DialogTitle>
              <DialogDescription>
                Configurez un webhook pour recevoir des notifications en temps réel
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Mon Webhook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: WebhookStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du webhook..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL Endpoint *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                  placeholder="https://votre-domaine.com/webhooks/payhula"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">
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
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    placeholder="Laissez vide pour générer automatiquement"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newSecret = btoa(
                        String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
                      ).slice(0, 32);
                      setFormData({ ...formData, secret: newSecret });
                    }}
                  >
                    Générer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Événements à écouter *</Label>
                <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                  {WEBHOOK_EVENTS.map((category) => (
                    <div key={category.category} className="mb-4 last:mb-0">
                      <h4 className="font-medium text-sm mb-2">{category.category}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {category.events.map((event) => (
                          <label
                            key={event.value}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.events?.includes(event.value)}
                              onChange={() => toggleEvent(event.value)}
                              className="rounded"
                            />
                            <span className="text-sm">{event.label}</span>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retry_count">Tentatives de retry</Label>
                  <Input
                    id="retry_count"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.retry_count}
                    onChange={(e) =>
                      setFormData({ ...formData, retry_count: parseInt(e.target.value) || 3 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout_seconds">Timeout (secondes)</Label>
                  <Input
                    id="timeout_seconds"
                    type="number"
                    min="5"
                    max="300"
                    value={formData.timeout_seconds}
                    onChange={(e) =>
                      setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) || 30 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate_limit">Rate limit/min</Label>
                  <Input
                    id="rate_limit"
                    type="number"
                    min="1"
                    value={formData.rate_limit_per_minute}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rate_limit_per_minute: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="verify_ssl"
                    checked={formData.verify_ssl}
                    onCheckedChange={(checked) => setFormData({ ...formData, verify_ssl: checked })}
                  />
                  <Label htmlFor="verify_ssl">Vérifier SSL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include_payload"
                    checked={formData.include_payload}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, include_payload: checked })
                    }
                  />
                  <Label htmlFor="include_payload">Inclure le payload</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!formData.name || !formData.url || !formData.events?.length}>
                  {editingWebhook ? 'Enregistrer' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Delivery Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la Livraison</DialogTitle>
            </DialogHeader>
            {viewingDelivery && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Statut</Label>
                    <div>{getDeliveryStatusBadge(viewingDelivery.status)}</div>
                  </div>
                  <div>
                    <Label>Événement</Label>
                    <div>
                      <Badge variant="outline">{viewingDelivery.event_type}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(viewingDelivery.triggered_at), 'PPp', { locale: fr })}
                    </div>
                  </div>
                  <div>
                    <Label>Durée</Label>
                    <div className="text-sm text-muted-foreground">
                      {viewingDelivery.duration_ms ? `${viewingDelivery.duration_ms}ms` : '-'}
                    </div>
                  </div>
                  <div>
                    <Label>Code HTTP</Label>
                    <div>
                      {viewingDelivery.response_status_code ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {viewingDelivery.response_status_code}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Tentative</Label>
                    <div className="text-sm text-muted-foreground">
                      {viewingDelivery.attempt_number} / {viewingDelivery.max_attempts}
                    </div>
                  </div>
                </div>

                {viewingDelivery.error_message && (
                  <div>
                    <Label>Erreur</Label>
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{viewingDelivery.error_message}</AlertDescription>
                    </Alert>
                  </div>
                )}

                <div>
                  <Label>Request Body</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md max-h-64 overflow-y-auto">
                    <pre className="text-xs">
                      {viewingDelivery.request_body
                        ? JSON.stringify(JSON.parse(viewingDelivery.request_body), null, 2)
                        : '-'}
                    </pre>
                  </div>
                </div>

                {viewingDelivery.response_body && (
                  <div>
                    <Label>Response Body</Label>
                    <div className="mt-2 p-4 bg-muted rounded-md max-h-64 overflow-y-auto">
                      <pre className="text-xs">{viewingDelivery.response_body}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}

