import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Type d'alerte
 */
export type DigitalAlertType =
  | 'low_licenses'           // Licences limitées
  | 'license_expiring'       // Licence expirant bientôt
  | 'suspicious_activity'    // Activité suspecte
  | 'high_downloads'         // Téléchargements élevés
  | 'revenue_milestone'      // Jalon de revenue atteint
  | 'product_inactive'       // Produit inactif longtemps
  | 'download_failed'        // Échecs de téléchargement
  | 'storage_limit';         // Limite de stockage

/**
 * Niveau de priorité d'alerte
 */
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Alerte digitale
 */
export interface DigitalAlert {
  id: string;
  type: DigitalAlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  productId?: string;
  productName?: string;
  customerId?: string;
  customerName?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  readAt?: string;
  resolvedAt?: string;
}

/**
 * useDigitalAlerts - Hook pour lister toutes les alertes
 */
export const useDigitalAlerts = () => {
  return useQuery({
    queryKey: ['digitalAlerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('digital_alerts')
        .select(`
          *,
          product:digital_products(name),
          customer:customers(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((alert: any) => ({
        id: alert.id,
        type: alert.type,
        priority: alert.priority,
        title: alert.title,
        message: alert.message,
        productId: alert.product_id,
        productName: alert.product?.name,
        customerId: alert.customer_id,
        customerName: alert.customer?.name,
        metadata: alert.metadata,
        isRead: alert.is_read,
        isResolved: alert.is_resolved,
        createdAt: alert.created_at,
        readAt: alert.read_at,
        resolvedAt: alert.resolved_at,
      })) as DigitalAlert[];
    },
  });
};

/**
 * useUnreadAlerts - Hook pour les alertes non lues
 */
export const useUnreadAlerts = () => {
  return useQuery({
    queryKey: ['digitalAlerts', 'unread'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('digital_alerts')
        .select(`
          *,
          product:digital_products(name),
          customer:customers(name)
        `)
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((alert: any) => ({
        id: alert.id,
        type: alert.type,
        priority: alert.priority,
        title: alert.title,
        message: alert.message,
        productId: alert.product_id,
        productName: alert.product?.name,
        customerId: alert.customer_id,
        customerName: alert.customer?.name,
        metadata: alert.metadata,
        isRead: alert.is_read,
        isResolved: alert.is_resolved,
        createdAt: alert.created_at,
        readAt: alert.read_at,
        resolvedAt: alert.resolved_at,
      })) as DigitalAlert[];
    },
  });
};

/**
 * useCriticalAlerts - Hook pour les alertes critiques
 */
export const useCriticalAlerts = () => {
  return useQuery({
    queryKey: ['digitalAlerts', 'critical'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('digital_alerts')
        .select(`
          *,
          product:digital_products(name),
          customer:customers(name)
        `)
        .eq('user_id', user.id)
        .eq('priority', 'critical')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((alert: any) => ({
        id: alert.id,
        type: alert.type,
        priority: alert.priority,
        title: alert.title,
        message: alert.message,
        productId: alert.product_id,
        productName: alert.product?.name,
        customerId: alert.customer_id,
        customerName: alert.customer?.name,
        metadata: alert.metadata,
        isRead: alert.is_read,
        isResolved: alert.is_resolved,
        createdAt: alert.created_at,
        readAt: alert.read_at,
        resolvedAt: alert.resolved_at,
      })) as DigitalAlert[];
    },
  });
};

/**
 * useAlertsByProduct - Hook pour les alertes d'un produit
 */
export const useAlertsByProduct = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalAlerts', 'product', productId],
    queryFn: async () => {
      if (!productId) throw new Error('ID produit manquant');

      const { data, error } = await supabase
        .from('digital_alerts')
        .select(`
          *,
          product:digital_products(name),
          customer:customers(name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((alert: any) => ({
        id: alert.id,
        type: alert.type,
        priority: alert.priority,
        title: alert.title,
        message: alert.message,
        productId: alert.product_id,
        productName: alert.product?.name,
        customerId: alert.customer_id,
        customerName: alert.customer?.name,
        metadata: alert.metadata,
        isRead: alert.is_read,
        isResolved: alert.is_resolved,
        createdAt: alert.created_at,
        readAt: alert.read_at,
        resolvedAt: alert.resolved_at,
      })) as DigitalAlert[];
    },
    enabled: !!productId,
  });
};

/**
 * useMarkAlertAsRead - Hook pour marquer une alerte comme lue
 */
export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('digital_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalAlerts'] });
    },
  });
};

/**
 * useMarkAllAlertsAsRead - Hook pour marquer toutes les alertes comme lues
 */
export const useMarkAllAlertsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('digital_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalAlerts'] });
    },
  });
};

/**
 * useResolveAlert - Hook pour résoudre une alerte
 */
export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('digital_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalAlerts'] });
    },
  });
};

/**
 * useDeleteAlert - Hook pour supprimer une alerte
 */
export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('digital_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalAlerts'] });
    },
  });
};

/**
 * useAlertStats - Hook pour les statistiques des alertes
 */
export const useAlertStats = () => {
  return useQuery({
    queryKey: ['digitalAlertStats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('digital_alerts')
        .select('priority, is_read, is_resolved')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data.length;
      const unread = data.filter((a: any) => !a.is_read).length;
      const critical = data.filter((a: any) => a.priority === 'critical' && !a.is_resolved).length;
      const high = data.filter((a: any) => a.priority === 'high' && !a.is_resolved).length;
      const unresolved = data.filter((a: any) => !a.is_resolved).length;

      return {
        total,
        unread,
        critical,
        high,
        unresolved,
      };
    },
  });
};

/**
 * useCreateAlert - Hook pour créer une alerte manuelle
 */
export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      priority,
      title,
      message,
      productId,
      customerId,
      metadata,
    }: {
      type: DigitalAlertType;
      priority: AlertPriority;
      title: string;
      message: string;
      productId?: string;
      customerId?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('digital_alerts')
        .insert({
          user_id: user.id,
          type,
          priority,
          title,
          message,
          product_id: productId,
          customer_id: customerId,
          metadata,
          is_read: false,
          is_resolved: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalAlerts'] });
    },
  });
};

