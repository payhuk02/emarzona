/**
 * Page de Gestion des Intégrations Calendriers Externes
 * Date: 1 Février 2025
 * 
 * Interface complète pour gérer les intégrations avec calendriers externes :
 * - Configuration Google Calendar, Outlook, iCal
 * - Synchronisation bidirectionnelle
 * - Monitoring et logs
 * - Détection de conflits
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Plus,
  Settings,
  RefreshCw,
  Trash2,
  Globe,
  Mail,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import {
  useCalendarIntegrations,
  useCreateCalendarIntegration,
  useUpdateCalendarIntegration,
  useDeleteCalendarIntegration,
  useSyncCalendar,
  useCalendarEvents,
  useSyncLogs,
  type CalendarIntegration,
} from '@/hooks/service/useCalendarIntegrations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CalendarIntegrationsPage() {
  const { store } = useStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<CalendarIntegration | null>(null);

  const { data: integrations, isLoading } = useCalendarIntegrations(store?.id || '');
  const createIntegration = useCreateCalendarIntegration();
  const updateIntegration = useUpdateCalendarIntegration();
  const deleteIntegration = useDeleteCalendarIntegration();
  const syncCalendar = useSyncCalendar();

  const { data: events } = useCalendarEvents(selectedIntegration?.id || '');
  const { data: syncLogs } = useSyncLogs(selectedIntegration?.id || '');

  const handleCreateIntegration = async (formData: Partial<CalendarIntegration>) => {
    if (!store?.id) return;

    try {
      await createIntegration.mutateAsync({
        ...formData,
        store_id: store.id,
      } as CalendarIntegration);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSync = async (integrationId: string, syncType: 'full' | 'incremental' | 'manual' = 'manual') => {
    try {
      await syncCalendar.mutateAsync({ integrationId, syncType });
      setIsSyncDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getCalendarIcon = (type: string) => {
    switch (type) {
      case 'google_calendar':
        return <Globe className="h-4 w-4" />;
      case 'outlook':
        return <Mail className="h-4 w-4" />;
      case 'ical':
        return <CalendarIcon className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (integration: CalendarIntegration) => {
    if (!integration.is_active) {
      return <Badge variant="secondary">Inactif</Badge>;
    }
    
    if (integration.last_sync_status === 'error') {
      return <Badge variant="destructive">Erreur</Badge>;
    }
    
    if (integration.last_sync_status === 'success') {
      return <Badge variant="default" className="bg-green-500">Actif</Badge>;
    }
    
    return <Badge variant="outline">En attente</Badge>;
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Calendar className="h-8 w-8" />
                  Intégrations Calendriers Externes
                </h1>
                <p className="text-muted-foreground mt-2">
                  Connectez vos calendriers Google, Outlook ou iCal pour synchroniser vos réservations
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Intégration
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nouvelle Intégration Calendrier</DialogTitle>
                    <DialogDescription>
                      Configurez une nouvelle intégration avec un calendrier externe
                    </DialogDescription>
                  </DialogHeader>
                  <CreateIntegrationForm
                    onSubmit={handleCreateIntegration}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Integrations List */}
            {integrations && integrations.length > 0 ? (
              <div className="grid gap-4">
                {integrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCalendarIcon(integration.calendar_type)}
                          <div>
                            <CardTitle className="text-lg">
                              {integration.calendar_name || integration.calendar_type}
                            </CardTitle>
                            <CardDescription>
                              {integration.calendar_email || integration.calendar_id}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(integration)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIntegration(integration)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(integration.id)}
                            disabled={syncCalendar.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncCalendar.isPending ? 'animate-spin' : ''}`} />
                            Synchroniser
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer cette intégration ?')) {
                                deleteIntegration.mutate(integration.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium">{integration.calendar_type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Synchronisation</p>
                          <p className="font-medium">{integration.sync_direction}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dernière sync</p>
                          <p className="font-medium">
                            {integration.last_sync_at
                              ? format(new Date(integration.last_sync_at), 'PPp', { locale: fr })
                              : 'Jamais'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Auto-sync</p>
                          <p className="font-medium">{integration.auto_sync ? 'Oui' : 'Non'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune intégration</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Commencez par connecter un calendrier externe pour synchroniser vos réservations
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une intégration
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Integration Details Dialog */}
            {selectedIntegration && (
              <IntegrationDetailsDialog
                integration={selectedIntegration}
                onClose={() => setSelectedIntegration(null)}
                onUpdate={updateIntegration.mutateAsync}
                events={events || []}
                syncLogs={syncLogs || []}
                onSync={handleSync}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function CreateIntegrationForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Partial<CalendarIntegration>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<CalendarIntegration>>({
    calendar_type: 'google_calendar',
    sync_direction: 'bidirectional',
    auto_sync: true,
    sync_interval_minutes: 15,
    create_events_for_bookings: true,
    create_events_for_availability: false,
    is_active: true,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="calendar_type">Type de calendrier</Label>
        <Select
          value={formData.calendar_type}
          onValueChange={(value) => setFormData({ ...formData, calendar_type: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google_calendar">Google Calendar</SelectItem>
            <SelectItem value="outlook">Outlook</SelectItem>
            <SelectItem value="ical">iCal</SelectItem>
            <SelectItem value="other">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calendar_id">ID du calendrier</Label>
        <Input
          id="calendar_id"
          value={formData.calendar_id || ''}
          onChange={(e) => setFormData({ ...formData, calendar_id: e.target.value })}
          placeholder="primary"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="calendar_name">Nom du calendrier</Label>
        <Input
          id="calendar_name"
          value={formData.calendar_name || ''}
          onChange={(e) => setFormData({ ...formData, calendar_name: e.target.value })}
          placeholder="Mon Calendrier Principal"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sync_direction">Direction de synchronisation</Label>
        <Select
          value={formData.sync_direction}
          onValueChange={(value) => setFormData({ ...formData, sync_direction: value as 'bidirectional' | 'to_calendar' | 'from_calendar' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one_way_import">Import uniquement (externe → Emarzona)</SelectItem>
            <SelectItem value="one_way_export">Export uniquement (Emarzona → externe)</SelectItem>
            <SelectItem value="bidirectional">Bidirectionnel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="auto_sync">Synchronisation automatique</Label>
        <Switch
          id="auto_sync"
          checked={formData.auto_sync}
          onCheckedChange={(checked) => setFormData({ ...formData, auto_sync: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="create_events_for_bookings">Créer événements pour réservations</Label>
        <Switch
          id="create_events_for_bookings"
          checked={formData.create_events_for_bookings}
          onCheckedChange={(checked) => setFormData({ ...formData, create_events_for_bookings: checked })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Créer</Button>
      </div>
    </form>
  );
}

function IntegrationDetailsDialog({
  integration,
  onClose,
  onUpdate,
  events,
  syncLogs,
  onSync,
}: {
  integration: CalendarIntegration;
  onClose: () => void;
  onUpdate: (data: Partial<CalendarIntegration> & { id: string }) => Promise<CalendarIntegration>;
  events: Array<{ id: string; title: string; start: string; end: string; [key: string]: unknown }>;
  syncLogs: Array<{ id: string; status: string; created_at: string; [key: string]: unknown }>;
  onSync: (id: string, type?: 'full' | 'incremental' | 'manual') => void;
}) {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <Dialog open={!!integration} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{integration.calendar_name || integration.calendar_type}</DialogTitle>
          <DialogDescription>Configuration et monitoring de l'intégration</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="logs">Logs de sync</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <IntegrationSettingsForm integration={integration} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Événements synchronisés ({events.length})</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.event_title}</TableCell>
                        <TableCell>
                          {format(new Date(event.event_start_time), 'PPp', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.sync_status === 'synced' ? 'default' : 'secondary'}>
                            {event.sync_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Historique de synchronisation</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Résultats</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.sync_type}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.events_created} créés, {log.events_updated} mis à jour
                        </TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), 'PPp', { locale: fr })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end">
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationSettingsForm({
  integration,
  onUpdate,
}: {
  integration: CalendarIntegration;
  onUpdate: (data: Partial<CalendarIntegration> & { id: string }) => Promise<CalendarIntegration>;
}) {
  const [formData, setFormData] = useState(integration);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate({ id: integration.id, ...formData });
      toast({
        title: 'Paramètres mis à jour',
        description: 'Les paramètres de l\'intégration ont été mis à jour avec succès.',
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sync_interval">Intervalle de synchronisation (minutes)</Label>
        <Input
          id="sync_interval"
          type="number"
          value={formData.sync_interval_minutes}
          onChange={(e) => setFormData({ ...formData, sync_interval_minutes: parseInt(e.target.value) })}
          min={1}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="auto_sync">Synchronisation automatique</Label>
        <Switch
          id="auto_sync"
          checked={formData.auto_sync}
          onCheckedChange={(checked) => setFormData({ ...formData, auto_sync: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="create_events_for_bookings">Créer événements pour réservations</Label>
        <Switch
          id="create_events_for_bookings"
          checked={formData.create_events_for_bookings}
          onCheckedChange={(checked) => setFormData({ ...formData, create_events_for_bookings: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Actif</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}







