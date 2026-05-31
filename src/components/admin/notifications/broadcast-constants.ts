import type {
  BroadcastAudience,
  BroadcastChannel,
  BroadcastPriority,
  PopupStyle,
} from '@/lib/admin/admin-broadcast-service';

export const CHANNEL_OPTIONS: { id: BroadcastChannel; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'in_app', label: 'Notification interne' },
  { id: 'popup', label: 'Popup utilisateurs' },
];

export const AUDIENCE_OPTIONS: { value: BroadcastAudience; label: string; description: string }[] =
  [
    { value: 'all', label: 'Tous les utilisateurs', description: 'Comptes avec email confirmé' },
    { value: 'vendors', label: 'Vendeurs', description: 'Utilisateurs avec une boutique' },
    { value: 'customers', label: 'Clients', description: 'Utilisateurs sans boutique' },
    { value: 'emails', label: 'Emails spécifiques', description: "Liste manuelle d'adresses" },
  ];

export const PRIORITY_OPTIONS: { value: BroadcastPriority; label: string }[] = [
  { value: 'low', label: 'Basse' },
  { value: 'normal', label: 'Normale' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' },
];

export const STATUS_LABELS: Record<string, string> = {
  completed: 'Terminé',
  partial: 'Partiel',
  failed: 'Échec',
  processing: 'En cours',
  pending: 'En attente',
  scheduled: 'Programmé',
  cancelled: 'Annulé',
};

export const QUICK_TEMPLATES: Array<{
  id: string;
  label: string;
  title: string;
  message: string;
  channels: BroadcastChannel[];
  popupStyle?: PopupStyle;
}> = [
  {
    id: 'maintenance',
    label: 'Maintenance',
    title: 'Maintenance programmée',
    message:
      'Une maintenance est prévue sur la plateforme. Certaines fonctionnalités pourront être temporairement indisponibles. Merci de votre compréhension.',
    channels: ['email', 'in_app', 'popup'],
    popupStyle: 'warning',
  },
  {
    id: 'feature',
    label: 'Nouvelle fonctionnalité',
    title: 'Nouveauté sur Emarzona',
    message:
      'Découvrez notre dernière fonctionnalité ! Connectez-vous à votre tableau de bord pour en profiter dès maintenant.',
    channels: ['email', 'in_app'],
  },
  {
    id: 'security',
    label: 'Sécurité',
    title: 'Alerte sécurité',
    message:
      "Par mesure de sécurité, nous vous recommandons de vérifier vos paramètres de connexion et d'activer la double authentification.",
    channels: ['email', 'in_app'],
  },
  {
    id: 'announcement',
    label: 'Annonce plateforme',
    title: 'Annonce importante',
    message: 'Message important concernant la plateforme Emarzona.',
    channels: ['in_app', 'popup'],
    popupStyle: 'announcement',
  },
];

export interface BroadcastFormState {
  title: string;
  message: string;
  channels: BroadcastChannel[];
  audience: BroadcastAudience;
  emailsText: string;
  priority: BroadcastPriority;
  actionUrl: string;
  actionLabel: string;
  popupStyle: PopupStyle;
  dismissible: boolean;
  scheduleEnabled: boolean;
  scheduledAt: string;
}

export const DEFAULT_BROADCAST_FORM: BroadcastFormState = {
  title: '',
  message: '',
  channels: ['in_app', 'email'],
  audience: 'all',
  emailsText: '',
  priority: 'normal',
  actionUrl: '',
  actionLabel: '',
  popupStyle: 'info',
  dismissible: true,
  scheduleEnabled: false,
  scheduledAt: '',
};

export function broadcastToForm(record: {
  title: string;
  message: string;
  channels: string[];
  audience_type: BroadcastAudience;
  audience_filter?: Record<string, unknown>;
  priority?: BroadcastPriority;
  action_url?: string | null;
  action_label?: string | null;
  scheduled_at?: string | null;
}): BroadcastFormState {
  const emails = Array.isArray(record.audience_filter?.emails)
    ? (record.audience_filter.emails as string[]).join('\n')
    : '';

  return {
    title: record.title,
    message: record.message,
    channels: record.channels.filter((c): c is BroadcastChannel =>
      ['email', 'in_app', 'popup'].includes(c)
    ),
    audience: record.audience_type,
    emailsText: emails,
    priority: record.priority || 'normal',
    actionUrl: record.action_url || '',
    actionLabel: record.action_label || '',
    popupStyle: 'info',
    dismissible: true,
    scheduleEnabled: Boolean(record.scheduled_at),
    scheduledAt: record.scheduled_at
      ? new Date(record.scheduled_at).toISOString().slice(0, 16)
      : '',
  };
}
