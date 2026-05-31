import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Send,
  History,
  Megaphone,
  Mail,
  MessageSquare,
  Loader2,
  Power,
  PowerOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import {
  fetchAdminBroadcasts,
  fetchPlatformPopups,
  sendAdminBroadcast,
  updatePlatformPopup,
  type BroadcastAudience,
  type BroadcastChannel,
  type PopupStyle,
} from '@/lib/admin/admin-broadcast-service';

const CHANNEL_OPTIONS: { id: BroadcastChannel; label: string; icon: typeof Mail }[] = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'in_app', label: 'Notification interne', icon: MessageSquare },
  { id: 'popup', label: 'Popup utilisateurs', icon: Megaphone },
];

const AUDIENCE_OPTIONS: { value: BroadcastAudience; label: string }[] = [
  { value: 'all', label: 'Tous les utilisateurs' },
  { value: 'vendors', label: 'Vendeurs (boutiques)' },
  { value: 'customers', label: 'Clients (sans boutique)' },
  { value: 'emails', label: 'Adresses email spécifiques' },
];

const AdminNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentAdminPermissions();

  const headerRef = useScrollAnimation<HTMLDivElement>();

  const [form, setForm] = useState({
    title: '',
    message: '',
    channels: ['in_app', 'email'] as BroadcastChannel[],
    audience: 'all' as BroadcastAudience,
    emailsText: '',
    popupStyle: 'info' as PopupStyle,
    actionUrl: '',
    actionLabel: '',
    dismissible: true,
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    logger.info('Admin Notifications page chargée');
  }, []);

  const { data: broadcasts = [], isLoading: broadcastsLoading } = useQuery({
    queryKey: ['admin-broadcasts'],
    queryFn: () => fetchAdminBroadcasts(),
    enabled: can('emails.manage'),
  });

  const { data: popups = [], isLoading: popupsLoading } = useQuery({
    queryKey: ['admin-platform-popups'],
    queryFn: () => fetchPlatformPopups(),
    enabled: can('emails.manage'),
  });

  const toggleChannel = (channel: BroadcastChannel) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleSend = useCallback(async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({
        title: 'Champs requis',
        description: 'Le titre et le message sont obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    if (form.channels.length === 0) {
      toast({
        title: 'Canal requis',
        description: 'Sélectionnez au moins un canal (email, notification ou popup).',
        variant: 'destructive',
      });
      return;
    }

    if (form.audience === 'emails' && !form.emailsText.trim()) {
      toast({
        title: 'Emails requis',
        description:
          'Indiquez une ou plusieurs adresses email (séparées par virgule ou retour ligne).',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const emails =
        form.audience === 'emails'
          ? form.emailsText
              .split(/[\n,;]+/)
              .map(e => e.trim())
              .filter(Boolean)
          : undefined;

      const result = await sendAdminBroadcast({
        title: form.title.trim(),
        message: form.message.trim(),
        channels: form.channels,
        audience: form.audience,
        emails,
        popup_options: form.channels.includes('popup')
          ? {
              style: form.popupStyle,
              action_url: form.actionUrl.trim() || undefined,
              action_label: form.actionLabel.trim() || undefined,
              dismissible: form.dismissible,
              show_once: true,
              target_audience:
                form.audience === 'emails'
                  ? 'all'
                  : form.audience === 'all'
                    ? 'all'
                    : form.audience,
            }
          : undefined,
      });

      if (!result.success) {
        toast({
          title: "Échec de l'envoi",
          description: result.error || 'Une erreur est survenue.',
          variant: 'destructive',
        });
        return;
      }

      const stats = result.stats;
      toast({
        title: 'Message envoyé',
        description: stats
          ? `${stats.sent} destinataire(s) traité(s)${stats.failed ? `, ${stats.failed} échec(s)` : ''}${result.popup_id ? ', popup activée' : ''}.`
          : 'Opération terminée.',
      });

      setForm({
        title: '',
        message: '',
        channels: ['in_app', 'email'],
        audience: 'all',
        emailsText: '',
        popupStyle: 'info',
        actionUrl: '',
        actionLabel: '',
        dismissible: true,
      });

      await queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-platform-popups'] });
    } finally {
      setIsSending(false);
    }
  }, [form, toast, queryClient]);

  const handleTogglePopup = async (id: string, isActive: boolean) => {
    const ok = await updatePlatformPopup(id, { is_active: !isActive });
    if (ok) {
      toast({
        title: isActive ? 'Popup désactivée' : 'Popup activée',
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-platform-popups'] });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la popup.',
        variant: 'destructive',
      });
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      partial: 'secondary',
      failed: 'destructive',
      processing: 'outline',
      pending: 'outline',
    };
    return <Badge variant={variants[status] ?? 'secondary'}>{status}</Badge>;
  };

  if (!can('emails.manage')) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">
            Vous n&apos;avez pas la permission d&apos;envoyer des messages.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div ref={headerRef} className="flex items-center justify-between" role="banner">
          <div>
            <h1
              className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              id="admin-notifications-title"
            >
              Messages &amp; notifications
            </h1>
            <p className="text-muted-foreground mt-2">
              Envoyer des messages individuels ou en masse par email, notification interne ou popup
            </p>
          </div>
          <Bell className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>

        <Tabs defaultValue="send" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="send" className="min-h-[44px]">
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </TabsTrigger>
            <TabsTrigger value="popups" className="min-h-[44px]">
              <Megaphone className="h-4 w-4 mr-2" />
              Popups actives
            </TabsTrigger>
            <TabsTrigger value="history" className="min-h-[44px]">
              <History className="h-4 w-4 mr-2" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Nouveau message</CardTitle>
                <CardDescription>
                  Envoyez un message à un ou plusieurs utilisateurs via email, notification in-app
                  ou popup sur le site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Maintenance programmée"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Destinataires</Label>
                    <Select
                      value={form.audience}
                      onValueChange={value => {
                        const audience = value as BroadcastAudience;
                        setForm(prev => ({
                          ...prev,
                          audience,
                          channels:
                            audience === 'emails'
                              ? prev.channels.filter(c => c !== 'popup')
                              : prev.channels,
                        }));
                      }}
                    >
                      <SelectTrigger id="audience" className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.audience === 'emails' && (
                  <div className="space-y-2">
                    <Label htmlFor="emails">Adresses email</Label>
                    <Textarea
                      id="emails"
                      placeholder="user1@example.com, user2@example.com&#10;ou une adresse par ligne"
                      value={form.emailsText}
                      onChange={e => setForm({ ...form, emailsText: e.target.value })}
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      Séparez les adresses par virgule, point-virgule ou retour à la ligne. La popup
                      n&apos;est pas disponible pour un envoi ciblé par email.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Contenu du message..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={6}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Canaux d&apos;envoi</Label>
                  <div className="flex flex-wrap gap-4">
                    {CHANNEL_OPTIONS.map(({ id, label, icon: Icon }) => {
                      const disabled = id === 'popup' && form.audience === 'emails';
                      return (
                        <label
                          key={id}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-4 py-3 min-h-[44px]',
                            disabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-muted/50'
                          )}
                        >
                          <Checkbox
                            checked={form.channels.includes(id)}
                            disabled={disabled}
                            onCheckedChange={() => !disabled && toggleChannel(id)}
                          />
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {form.channels.includes('popup') && (
                  <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Options popup
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={form.popupStyle}
                          onValueChange={value =>
                            setForm({ ...form, popupStyle: value as PopupStyle })
                          }
                        >
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Information</SelectItem>
                            <SelectItem value="warning">Attention</SelectItem>
                            <SelectItem value="success">Succès</SelectItem>
                            <SelectItem value="announcement">Annonce plateforme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Checkbox
                          id="dismissible"
                          checked={form.dismissible}
                          onCheckedChange={checked =>
                            setForm({ ...form, dismissible: Boolean(checked) })
                          }
                        />
                        <Label htmlFor="dismissible" className="cursor-pointer">
                          L&apos;utilisateur peut fermer la popup
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actionUrl">Lien d&apos;action (optionnel)</Label>
                        <Input
                          id="actionUrl"
                          placeholder="/dashboard ou https://..."
                          value={form.actionUrl}
                          onChange={e => setForm({ ...form, actionUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actionLabel">Texte du bouton</Label>
                        <Input
                          id="actionLabel"
                          placeholder="En savoir plus"
                          value={form.actionLabel}
                          onChange={e => setForm({ ...form, actionLabel: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => void handleSend()}
                  className="w-full gap-2 min-h-[44px]"
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSending ? 'Envoi en cours...' : 'Envoyer le message'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="popups">
            <Card>
              <CardHeader>
                <CardTitle>Popups affichées aux utilisateurs</CardTitle>
                <CardDescription>
                  Gérez les messages popup visibles sur les pages utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {popupsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : popups.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Aucune popup créée</p>
                ) : (
                  <div className="space-y-4">
                    {popups.map(popup => (
                      <div
                        key={popup.id}
                        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-lg border"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{popup.title}</h3>
                            <Badge variant={popup.is_active ? 'default' : 'secondary'}>
                              {popup.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">{popup.style}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {popup.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cible : {popup.target_audience} ·{' '}
                            {new Date(popup.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] shrink-0"
                          onClick={() => void handleTogglePopup(popup.id, popup.is_active)}
                        >
                          {popup.is_active ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-2" />
                              Activer
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des envois</CardTitle>
                <CardDescription>
                  Tous les messages envoyés depuis l&apos;administration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {broadcastsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : broadcasts.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Aucun message envoyé</p>
                ) : (
                  <div className="space-y-4">
                    {broadcasts.map(item => {
                      const stats = item.stats as Record<string, number>;
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors space-y-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{item.title}</h3>
                            {statusBadge(item.status)}
                            {item.channels.map(ch => (
                              <Badge key={ch} variant="outline">
                                {ch}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.message}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Audience : {item.audience_type}</span>
                            {typeof stats?.sent === 'number' && <span>Envoyés : {stats.sent}</span>}
                            {typeof stats?.failed === 'number' && stats.failed > 0 && (
                              <span className="text-destructive">Échecs : {stats.failed}</span>
                            )}
                            <span>{new Date(item.created_at).toLocaleString('fr-FR')}</span>
                          </div>
                          {item.error_message && (
                            <p className="text-xs text-destructive">{item.error_message}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
