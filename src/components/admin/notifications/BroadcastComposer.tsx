import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CalendarClock,
  Eye,
  FlaskConical,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  parseEmailsFromText,
  previewBroadcastRecipients,
  sendAdminBroadcast,
  type BroadcastChannel,
} from '@/lib/admin/admin-broadcast-service';
import {
  AUDIENCE_OPTIONS,
  CHANNEL_OPTIONS,
  DEFAULT_BROADCAST_FORM,
  PRIORITY_OPTIONS,
  QUICK_TEMPLATES,
  type BroadcastFormState,
} from '@/components/admin/notifications/broadcast-constants';

interface BroadcastComposerProps {
  initialForm?: BroadcastFormState;
  onSent?: () => void;
}

export function BroadcastComposer({ initialForm, onSent }: BroadcastComposerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<BroadcastFormState>(initialForm ?? DEFAULT_BROADCAST_FORM);
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (initialForm) setForm(initialForm);
  }, [initialForm]);

  const emailsList = form.audience === 'emails' ? parseEmailsFromText(form.emailsText) : undefined;

  const refreshRecipientCount = useCallback(async () => {
    if (form.audience === 'emails' && !form.emailsText.trim()) {
      setRecipientCount(0);
      return;
    }
    setLoadingCount(true);
    try {
      const count = await previewBroadcastRecipients(form.audience, emailsList);
      setRecipientCount(count);
    } finally {
      setLoadingCount(false);
    }
  }, [form.audience, form.emailsText, emailsList]);

  useEffect(() => {
    const needsCount = form.channels.includes('email') || form.channels.includes('in_app');
    if (!needsCount) {
      setRecipientCount(null);
      return;
    }
    const timer = setTimeout(() => void refreshRecipientCount(), 400);
    return () => clearTimeout(timer);
  }, [form.audience, form.emailsText, form.channels, refreshRecipientCount]);

  const toggleChannel = (channel: BroadcastChannel) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const applyTemplate = (templateId: string) => {
    const template = QUICK_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    setForm(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      channels: template.channels,
      popupStyle: template.popupStyle ?? prev.popupStyle,
    }));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    message: form.message.trim(),
    channels: form.channels,
    audience: form.audience,
    emails: emailsList,
    priority: form.priority,
    action_url: form.actionUrl.trim() || undefined,
    action_label: form.actionLabel.trim() || undefined,
    scheduled_at:
      form.scheduleEnabled && form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : undefined,
    popup_options: form.channels.includes('popup')
      ? {
          style: form.popupStyle,
          action_url: form.actionUrl.trim() || undefined,
          action_label: form.actionLabel.trim() || undefined,
          dismissible: form.dismissible,
          show_once: true,
          target_audience:
            form.audience === 'emails'
              ? ('all' as const)
              : form.audience === 'all'
                ? ('all' as const)
                : form.audience,
        }
      : undefined,
  });

  const validate = (): boolean => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({
        title: 'Champs requis',
        description: 'Le titre et le message sont obligatoires.',
        variant: 'destructive',
      });
      return false;
    }
    if (form.channels.length === 0) {
      toast({
        title: 'Canal requis',
        description: 'Sélectionnez au moins un canal.',
        variant: 'destructive',
      });
      return false;
    }
    if (form.audience === 'emails' && !form.emailsText.trim()) {
      toast({
        title: 'Emails requis',
        description: 'Indiquez au moins une adresse email.',
        variant: 'destructive',
      });
      return false;
    }
    if (form.scheduleEnabled && !form.scheduledAt) {
      toast({
        title: 'Date requise',
        description: 'Choisissez une date et heure pour la programmation.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setIsSending(true);
    try {
      const result = await sendAdminBroadcast(buildPayload());

      if (!result.success) {
        toast({
          title: result.scheduled ? 'Programmation échouée' : "Échec de l'envoi",
          description: result.error || 'Une erreur est survenue.',
          variant: 'destructive',
        });
        return;
      }

      if (result.scheduled) {
        toast({
          title: 'Message programmé',
          description: `Envoi prévu le ${new Date(result.scheduled_at!).toLocaleString('fr-FR')}.`,
        });
      } else {
        const stats = result.stats;
        toast({
          title: 'Message envoyé',
          description: stats
            ? `${stats.sent} destinataire(s) traité(s)${stats.failed ? `, ${stats.failed} échec(s)` : ''}.`
            : 'Opération terminée.',
        });
      }

      setForm(DEFAULT_BROADCAST_FORM);
      await queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-scheduled-broadcasts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-broadcast-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-platform-popups'] });
      onSent?.();
    } finally {
      setIsSending(false);
    }
  };

  const handleTestSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({
        title: 'Champs requis',
        description: 'Remplissez le titre et le message avant le test.',
        variant: 'destructive',
      });
      return;
    }
    if (!user?.email) {
      toast({
        title: 'Email introuvable',
        description: 'Connectez-vous avec un compte email valide.',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    try {
      const result = await sendAdminBroadcast({
        ...buildPayload(),
        test_mode: true,
        test_email: user.email,
        channels: form.channels.filter(c => c === 'email' || c === 'in_app'),
      });

      if (!result.success) {
        toast({
          title: 'Test échoué',
          description: result.error || "Impossible d'envoyer le test.",
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Email de test envoyé',
        description: `Vérifiez votre boîte : ${user.email}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const channelIcons = { email: Mail, in_app: MessageSquare, popup: Megaphone };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Nouveau message</CardTitle>
          <CardDescription>
            Composez, prévisualisez et envoyez immédiatement ou programmez un envoi différé
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Modèles rapides
            </Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map(t => (
                <Button
                  key={t.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-[36px]"
                  onClick={() => applyTemplate(t.id)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

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
                  const audience = value as BroadcastFormState['audience'];
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
              <p className="text-xs text-muted-foreground">
                {AUDIENCE_OPTIONS.find(o => o.value === form.audience)?.description}
              </p>
            </div>
          </div>

          {(form.channels.includes('email') || form.channels.includes('in_app')) && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              {loadingCount ? (
                <span className="text-sm text-muted-foreground">Calcul des destinataires...</span>
              ) : recipientCount !== null ? (
                <span className="text-sm">
                  <strong>{recipientCount.toLocaleString('fr-FR')}</strong> destinataire
                  {recipientCount !== 1 ? 's' : ''} estimé{recipientCount !== 1 ? 's' : ''}
                </span>
              ) : null}
            </div>
          )}

          {form.audience === 'emails' && (
            <div className="space-y-2">
              <Label htmlFor="emails">Adresses email</Label>
              <Textarea
                id="emails"
                placeholder="user1@example.com, user2@example.com"
                value={form.emailsText}
                onChange={e => setForm({ ...form, emailsText: e.target.value })}
                rows={4}
              />
              {emailsList && emailsList.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {emailsList.length} adresse{emailsList.length > 1 ? 's' : ''} détectée
                  {emailsList.length > 1 ? 's' : ''}
                </p>
              )}
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Priorité (notification interne)</Label>
              <Select
                value={form.priority}
                onValueChange={value =>
                  setForm({ ...form, priority: value as BroadcastFormState['priority'] })
                }
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionUrl">Lien d&apos;action (email &amp; notification)</Label>
              <Input
                id="actionUrl"
                placeholder="/dashboard ou https://..."
                value={form.actionUrl}
                onChange={e => setForm({ ...form, actionUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="actionLabel">Texte du bouton d&apos;action</Label>
              <Input
                id="actionLabel"
                placeholder="En savoir plus"
                value={form.actionLabel}
                onChange={e => setForm({ ...form, actionLabel: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Canaux d&apos;envoi</Label>
            <div className="flex flex-wrap gap-4">
              {CHANNEL_OPTIONS.map(({ id, label }) => {
                const Icon = channelIcons[id];
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
                      setForm({ ...form, popupStyle: value as BroadcastFormState['popupStyle'] })
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
                    onCheckedChange={checked => setForm({ ...form, dismissible: Boolean(checked) })}
                  />
                  <Label htmlFor="dismissible" className="cursor-pointer">
                    L&apos;utilisateur peut fermer la popup
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="scheduleEnabled"
                checked={form.scheduleEnabled}
                onCheckedChange={checked => setForm({ ...form, scheduleEnabled: Boolean(checked) })}
              />
              <Label htmlFor="scheduleEnabled" className="cursor-pointer flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Programmer l&apos;envoi
              </Label>
            </div>
            {form.scheduleEnabled && (
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                className="min-h-[44px] max-w-sm"
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2 min-h-[44px] flex-1"
              onClick={() => setPreviewOpen(true)}
              disabled={!form.title.trim() || !form.message.trim()}
            >
              <Eye className="h-4 w-4" />
              Aperçu
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 min-h-[44px] flex-1"
              onClick={() => void handleTestSend()}
              disabled={isTesting || isSending}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4" />
              )}
              Test (mon email)
            </Button>
            <Button
              type="button"
              className="gap-2 min-h-[44px] flex-[2]"
              onClick={() => void handleSend()}
              disabled={isSending || isTesting}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : form.scheduleEnabled ? (
                <CalendarClock className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSending
                ? 'Envoi en cours...'
                : form.scheduleEnabled
                  ? 'Programmer'
                  : 'Envoyer le message'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aperçu du message</DialogTitle>
            <DialogDescription>
              Rendu approximatif tel que le verront les utilisateurs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {form.channels.map(ch => (
                <Badge key={ch} variant="outline">
                  {CHANNEL_OPTIONS.find(c => c.id === ch)?.label ?? ch}
                </Badge>
              ))}
              {recipientCount !== null && (
                <Badge variant="secondary">{recipientCount} destinataire(s)</Badge>
              )}
            </div>
            <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
              <h3 className="font-semibold text-lg">{form.title || 'Sans titre'}</h3>
              <p className="text-sm whitespace-pre-wrap">{form.message || 'Sans contenu'}</p>
              {form.actionUrl && form.actionLabel && (
                <Button size="sm" variant="default" asChild>
                  <span>{form.actionLabel}</span>
                </Button>
              )}
            </div>
            {form.channels.includes('popup') && (
              <div className="rounded-lg border-l-4 border-primary p-3 bg-primary/5 text-sm">
                <strong>Popup :</strong> {form.popupStyle}
                {form.dismissible ? ' · fermable' : ' · non fermable'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
