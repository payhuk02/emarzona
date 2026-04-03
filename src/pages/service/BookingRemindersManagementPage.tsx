/**
 * Page de Gestion des Rappels Automatiques
 * Date: 1 Février 2025
 * 
 * Interface complète pour gérer les templates de rappels et les rappels envoyés
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
import { Textarea } from '@/components/ui/textarea';
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
  Bell,
  Plus,
  Edit,
  Trash2,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import {
  useReminderTemplates,
  useCreateReminderTemplate,
  useUpdateReminderTemplate,
  useDeleteReminderTemplate,
  usePendingReminders,
  type ReminderTemplate,
} from '@/hooks/services/useBookingReminders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BookingRemindersManagementPage() {
  const { store } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);

  const { data: templates, isLoading: templatesLoading } = useReminderTemplates(store?.id || '');
  const { data: pendingReminders } = usePendingReminders(50);
  const createTemplate = useCreateReminderTemplate();
  const updateTemplate = useUpdateReminderTemplate();
  const deleteTemplate = useDeleteReminderTemplate();

  const handleCreateTemplate = async (formData: Partial<ReminderTemplate>) => {
    if (!store?.id) return;

    try {
      await createTemplate.mutateAsync({
        ...formData,
        store_id: store.id,
      } as ReminderTemplate);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      case 'in_app':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (templatesLoading) {
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
                  <Bell className="h-8 w-8" />
                  Gestion des Rappels Automatiques
                </h1>
                <p className="text-muted-foreground mt-2">
                  Configurez les rappels automatiques pour vos réservations de services
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer un Template de Rappel</DialogTitle>
                    <DialogDescription>
                      Configurez un nouveau template de rappel automatique
                    </DialogDescription>
                  </DialogHeader>
                  <CreateReminderTemplateForm
                    onSubmit={handleCreateTemplate}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Templates Actifs</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {templates?.filter((t) => t.is_active).length || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rappels en Attente</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingReminders?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{templates?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="templates" className="space-y-4">
              <TabsList>
                <TabsTrigger value="templates">Templates ({templates?.length || 0})</TabsTrigger>
                <TabsTrigger value="pending">Rappels en Attente ({pendingReminders?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="space-y-4">
                {templates && templates.length > 0 ? (
                  <div className="grid gap-4">
                    {templates.map((template) => (
                      <Card key={template.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getTemplateIcon(template.template_type)}
                              <div>
                                <CardTitle className="text-lg">{template.template_name}</CardTitle>
                                <CardDescription>
                                  {template.reminder_timing_hours}h avant le rendez-vous • {template.template_type}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                                {template.is_active ? 'Actif' : 'Inactif'}
                              </Badge>
                              {template.is_default && (
                                <Badge variant="outline">Par défaut</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTemplate(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
                                    deleteTemplate.mutate({
                                      templateId: template.id,
                                      storeId: template.store_id,
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {template.subject_template && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Sujet</Label>
                                <p className="text-sm font-medium">{template.subject_template}</p>
                              </div>
                            )}
                            <div>
                              <Label className="text-xs text-muted-foreground">Message</Label>
                              <p className="text-sm">{template.message_template}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucun template</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Créez votre premier template de rappel automatique
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un template
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rappels en Attente d'Envoi</CardTitle>
                    <CardDescription>
                      Rappels programmés qui seront envoyés automatiquement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingReminders && pendingReminders.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Programmé pour</TableHead>
                            <TableHead>Rendez-vous</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingReminders.map((reminder: any) => (
                            <TableRow key={reminder.reminder_id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{reminder.user_email}</p>
                                  {reminder.user_phone && (
                                    <p className="text-xs text-muted-foreground">{reminder.user_phone}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{reminder.service_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getTemplateIcon(reminder.reminder_type)}
                                  <span className="ml-2">{reminder.reminder_type}</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(reminder.reminder_scheduled_at), 'PPp', { locale: fr })}
                              </TableCell>
                              <TableCell>
                                {format(new Date(reminder.booking_date), 'PP', { locale: fr })} à{' '}
                                {reminder.booking_time}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun rappel en attente
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Edit Template Dialog */}
            {selectedTemplate && (
              <EditReminderTemplateDialog
                template={selectedTemplate}
                onClose={() => setSelectedTemplate(null)}
                onUpdate={updateTemplate.mutateAsync}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function CreateReminderTemplateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Partial<ReminderTemplate>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<ReminderTemplate>>({
    template_type: 'email',
    reminder_timing_hours: 24,
    is_active: true,
    is_default: false,
    message_template: 'Rappel: Votre réservation pour {service_name} est prévue le {booking_date} à {booking_time}.',
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
        <Label htmlFor="template_name">Nom du template *</Label>
        <Input
          id="template_name"
          value={formData.template_name || ''}
          onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
          placeholder="Rappel 24h avant"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="template_type">Type *</Label>
          <Select
            value={formData.template_type}
            onValueChange={(value) => setFormData({ ...formData, template_type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="push">Notification Push</SelectItem>
              <SelectItem value="in_app">Notification In-App</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reminder_timing_hours">Heures avant le rendez-vous *</Label>
          <Input
            id="reminder_timing_hours"
            type="number"
            value={formData.reminder_timing_hours || 24}
            onChange={(e) => setFormData({ ...formData, reminder_timing_hours: parseInt(e.target.value) })}
            min={1}
            required
          />
        </div>
      </div>

      {formData.template_type === 'email' && (
        <div className="space-y-2">
          <Label htmlFor="subject_template">Sujet (Email) *</Label>
          <Input
            id="subject_template"
            value={formData.subject_template || ''}
            onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
            placeholder="Rappel: Votre rendez-vous {service_name}"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="message_template">Message *</Label>
        <Textarea
          id="message_template"
          value={formData.message_template || ''}
          onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
          rows={6}
          required
          placeholder="Variables disponibles: {service_name}, {customer_name}, {booking_date}, {booking_time}, {location}"
        />
        <p className="text-xs text-muted-foreground">
          Variables disponibles: {'{service_name}'}, {'{customer_name}'}, {'{booking_date}'}, {'{booking_time}'}, {'{location}'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Actif</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_default">Template par défaut</Label>
        <Switch
          id="is_default"
          checked={formData.is_default}
          onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
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

function EditReminderTemplateDialog({
  template,
  onClose,
  onUpdate,
}: {
  template: ReminderTemplate;
  onClose: () => void;
  onUpdate: (data: Partial<ReminderTemplate> & { id: string }) => Promise<ReminderTemplate>;
}) {
  const [formData, setFormData] = useState(template);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate({ id: template.id, ...formData });
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={!!template} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le Template</DialogTitle>
          <DialogDescription>Modifiez les paramètres du template de rappel</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template_name">Nom du template</Label>
            <Input
              id="template_name"
              value={formData.template_name}
              onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder_timing_hours">Heures avant le rendez-vous</Label>
            <Input
              id="reminder_timing_hours"
              type="number"
              value={formData.reminder_timing_hours}
              onChange={(e) => setFormData({ ...formData, reminder_timing_hours: parseInt(e.target.value) })}
              min={1}
            />
          </div>

          {formData.template_type === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject_template">Sujet</Label>
              <Input
                id="subject_template"
                value={formData.subject_template || ''}
                onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message_template">Message</Label>
            <Textarea
              id="message_template"
              value={formData.message_template}
              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
              rows={6}
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}







