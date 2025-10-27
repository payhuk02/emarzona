/**
 * Hooks pour le système d'Email Marketing Universel
 * Date : 27 octobre 2025
 * Supporte: Digital, Physical, Service, Course
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type {
  EmailTemplate,
  EmailLog,
  EmailPreferences,
  SendEmailPayload,
  ProductType,
  EmailCategory,
} from '@/types/email';
import { sendEmail } from '@/lib/sendgrid';

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
        .select('*')
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
        console.error('Error fetching email templates:', error);
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
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true);

      if (productType) {
        query = query.eq('product_type', productType);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(`Error fetching template ${slug}:`, error);
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
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching email logs:', error);
        throw error;
      }

      return data as EmailLog[];
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
        .select('*')
        .eq('order_id', orderId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching order email logs:', error);
        throw error;
      }

      return data as EmailLog[];
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
        .select('*')
        .eq('product_id', productId)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching product email logs:', error);
        throw error;
      }

      return data as EmailLog[];
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

      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // Ignorer "row not found"
        console.error('Error fetching email preferences:', error);
        throw error;
      }

      // Créer préférences par défaut si elles n'existent pas
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('email_preferences')
          .insert({
            user_id: user.id,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating email preferences:', insertError);
          throw insertError;
        }

        return newPrefs as EmailPreferences;
      }

      return data as EmailPreferences;
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

      const { data, error } = await supabase
        .from('email_preferences')
        .update(preferences)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating email preferences:', error);
        throw error;
      }

      return data as EmailPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-preferences', user?.id] });
      toast({
        title: 'Préférences mises à jour',
        description: 'Vos préférences email ont été enregistrées.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
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
        description: 'L\'email a été envoyé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'envoi',
        description: error.message,
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
      let query = supabase
        .from('email_logs')
        .select('*');

      if (options?.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options?.productId) {
        query = query.eq('product_id', options.productId);
      }

      if (options?.productType) {
        query = query.eq('product_type', options.productType);
      }

      if (options?.dateFrom) {
        query = query.gte('sent_at', options.dateFrom);
      }

      if (options?.dateTo) {
        query = query.lte('sent_at', options.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching email analytics:', error);
        throw error;
      }

      const logs = data as EmailLog[];

      // Calculer les statistiques
      const stats = {
        total_sent: logs.length,
        total_delivered: logs.filter((l) => l.sendgrid_status === 'delivered').length,
        total_opened: logs.filter((l) => l.opened_at).length,
        total_clicked: logs.filter((l) => l.clicked_at).length,
        total_bounced: logs.filter((l) => l.bounced_at).length,
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
      logs.forEach((log) => {
        if (log.product_type) {
          stats.by_product_type[log.product_type] =
            (stats.by_product_type[log.product_type] || 0) + 1;
        }
      });

      // Grouper par template
      logs.forEach((log) => {
        if (log.template_slug) {
          stats.by_template[log.template_slug] =
            (stats.by_template[log.template_slug] || 0) + 1;
        }
      });

      return stats;
    },
    staleTime: 1000 * 60 * 5,
  });
};

