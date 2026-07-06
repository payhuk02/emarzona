/**
 * Hooks pour le système d'Email Marketing Universel
 * Date : 27 octobre 2025
 * Supporte: Digital, Physical, Service, Course
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import type {
  EmailTemplate,
  EmailLog,
  EmailPreferences,
  SendEmailPayload,
  ProductType,
  EmailCategory,
  SendGridStatus,
} from '@/types/email';
import { sendEmail } from '@/lib/resend';
import { EmailPreferencesService } from '@/lib/email/email-preferences-service';

const EMAIL_TEMPLATE_FIELDS =
  'id, name, slug, category, product_type, subject, html_content, text_content, variables, is_active, is_default, created_at, updated_at';
const EMAIL_LOG_FIELDS =
  'id, user_id, template_id, campaign_id, sequence_id, to_email, subject, status, provider_message_id, error_message, opened_at, clicked_at, metadata, created_at, updated_at';

type EmailLogRow = {
  id: string;
  user_id: string | null;
  template_id: string | null;
  campaign_id: string | null;
  sequence_id: string | null;
  to_email: string;
  subject: string;
  status: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

function mapEmailLogRow(row: EmailLogRow): EmailLog {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    template_id: row.template_id ?? undefined,
    template_slug: String(meta.template_slug ?? ''),
    recipient_email: row.to_email,
    recipient_name: typeof meta.recipient_name === 'string' ? meta.recipient_name : undefined,
    user_id: row.user_id ?? undefined,
    subject: row.subject,
    product_type: meta.product_type as ProductType | undefined,
    product_id: typeof meta.product_id === 'string' ? meta.product_id : undefined,
    product_name: typeof meta.product_name === 'string' ? meta.product_name : undefined,
    order_id: typeof meta.order_id === 'string' ? meta.order_id : undefined,
    store_id: typeof meta.store_id === 'string' ? meta.store_id : undefined,
    variables: meta,
    provider_message_id: row.provider_message_id ?? undefined,
    status: (row.status ?? 'sent') as SendGridStatus,
    sent_at: row.created_at ?? '',
    opened_at: row.opened_at ?? undefined,
    clicked_at: row.clicked_at ?? undefined,
    error_message: row.error_message ?? undefined,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? row.created_at ?? '',
    open_count: 0,
    click_count: 0,
  };
}
// ============================================================
// EMAIL TEMPLATES
// ============================================================

/**
 * Hook pour récupérer tous les templates actifs
 */
export const useEmailTemplates = (options?: {
  category?: EmailCategory;
  productType?: ProductType;
}) => {
  return useQuery({
    queryKey: ['email-templates', options?.category, options?.productType],
    queryFn: async (): Promise<EmailTemplate[]> => {
      let query = supabase
        .from('email_templates')
        .select(EMAIL_TEMPLATE_FIELDS)
        .eq('is_active', true)
        .order('name');

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.productType) {
        query = query.eq('product_type', options.productType);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching email templates', { error });
        throw error;
      }

      return data as EmailTemplate[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook pour récupérer un template spécifique
 */
export const useEmailTemplate = (slug: string, productType?: ProductType) => {
  return useQuery({
    queryKey: ['email-template', slug, productType],
    queryFn: async (): Promise<EmailTemplate | null> => {
      let query = supabase
        .from('email_templates')
        .select(EMAIL_TEMPLATE_FIELDS)
        .eq('slug', slug)
        .eq('is_active', true);

      if (productType) {
        query = query.eq('product_type', productType);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        logger.error('Error fetching email template', { error, slug });
        throw error;
      }

      return data as EmailTemplate | null;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30,
  });
};

// ============================================================
// EMAIL LOGS
// ============================================================

/**
 * Hook pour récupérer les logs d'emails d'un utilisateur
 */
export const useUserEmailLogs = (userId?: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['email-logs', 'user', userId, limit],
    queryFn: async (): Promise<EmailLog[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('email_logs')
        .select(EMAIL_LOG_FIELDS)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching email logs', { error, limit });
        throw error;
      }

      return (data as EmailLogRow[]).map(mapEmailLogRow);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook pour récupérer les logs d'une commande
 */
export const useOrderEmailLogs = (orderId?: string) => {
  return useQuery({
    queryKey: ['email-logs', 'order', orderId],
    queryFn: async (): Promise<EmailLog[]> => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from('email_logs')
        .select(EMAIL_LOG_FIELDS)
        .filter('metadata->>order_id', 'eq', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching order email logs', { error, orderId });
        throw error;
      }

      return (data as EmailLogRow[]).map(mapEmailLogRow);
    },
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook pour récupérer les logs d'un produit
 */
export const useProductEmailLogs = (productId?: string) => {
  return useQuery({
    queryKey: ['email-logs', 'product', productId],
    queryFn: async (): Promise<EmailLog[]> => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('email_logs')
        .select(EMAIL_LOG_FIELDS)
        .filter('metadata->>product_id', 'eq', productId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        logger.error('Error fetching product email logs', { error, productId });
        throw error;
      }

      return (data as EmailLogRow[]).map(mapEmailLogRow);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10,
  });
};

// ============================================================
// EMAIL PREFERENCES
// ============================================================

/**
 * Hook pour récupérer les préférences email de l'utilisateur
 */
export const useEmailPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email-preferences', user?.id],
    queryFn: async (): Promise<EmailPreferences | null> => {
      if (!user) return null;
      return EmailPreferencesService.getOrCreateForUser(user.id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
};

/**
 * Hook pour mettre à jour les préférences email
 */
export const useUpdateEmailPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (preferences: Partial<EmailPreferences>) => {
      if (!user) throw new Error('User not authenticated');

      return EmailPreferencesService.updateForUser(user.id, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-preferences', user?.id] });
      toast({
        title: 'Préférences mises à jour',
        description: 'Vos préférences email ont été enregistrées.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    },
  });
};

// ============================================================
// SEND EMAIL
// ============================================================

/**
 * Hook pour envoyer un email
 */
export const useSendEmail = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: SendEmailPayload) => {
      const result = await sendEmail(payload);

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Email envoyé',
        description: "L'email a été envoyé avec succès.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Erreur d'envoi",
        description: error instanceof Error ? error.message : "Erreur d'envoi",
        variant: 'destructive',
      });
    },
  });
};

// ============================================================
// ANALYTICS
// ============================================================

/**
 * Hook pour les statistiques d'emails
 */
export const useEmailAnalytics = (options?: {
  userId?: string;
  productId?: string;
  productType?: ProductType;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return useQuery({
    queryKey: ['email-analytics', options],
    queryFn: async () => {
      let query = supabase.from('email_logs').select(EMAIL_LOG_FIELDS);

      if (options?.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options?.dateFrom) {
        query = query.gte('created_at', options.dateFrom);
      }

      if (options?.dateTo) {
        query = query.lte('created_at', options.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching email analytics', { error, options });
        throw error;
      }

      let logs = (data as EmailLogRow[]).map(mapEmailLogRow);
      if (options?.productType) {
        logs = logs.filter(l => l.product_type === options.productType);
      }
      if (options?.productId) {
        logs = logs.filter(l => l.product_id === options.productId);
      }

      // Calculer les statistiques
      const stats = {
        total_sent: logs.length,
        total_delivered: logs.filter(l => l.status === 'delivered').length,
        total_opened: logs.filter(l => l.opened_at).length,
        total_clicked: logs.filter(l => l.clicked_at).length,
        total_bounced: logs.filter(l => l.status === 'bounced' || l.status === 'failed').length,
        open_rate: 0,
        click_rate: 0,
        bounce_rate: 0,
        by_product_type: {} as { [key: string]: number },
        by_template: {} as { [key: string]: number },
      };

      if (stats.total_delivered > 0) {
        stats.open_rate = (stats.total_opened / stats.total_delivered) * 100;
        stats.click_rate = (stats.total_clicked / stats.total_delivered) * 100;
        stats.bounce_rate = (stats.total_bounced / stats.total_sent) * 100;
      }

      // Grouper par product_type
      logs.forEach(log => {
        if (log.product_type) {
          stats.by_product_type[log.product_type] =
            (stats.by_product_type[log.product_type] || 0) + 1;
        }
      });

      // Grouper par template
      logs.forEach(log => {
        if (log.template_slug) {
          stats.by_template[log.template_slug] = (stats.by_template[log.template_slug] || 0) + 1;
        }
      });

      return stats;
    },
    staleTime: 1000 * 60 * 5,
  });
};
