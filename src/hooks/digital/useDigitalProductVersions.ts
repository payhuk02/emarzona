/**
 * Hook pour gérer les versions de produits digitaux
 * Date: 1 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface DigitalProductVersion {
  id: string;
  digital_product_id: string;
  product_id: string;
  version_number: string;
  major_version: number;
  minor_version: number;
  patch_version: number;
  version_name?: string;
  release_notes?: string;
  changelog: Array<{
    type: 'added' | 'fixed' | 'changed' | 'removed';
    description: string;
  }>;
  files: Array<{ url: string; name: string; size: number }>;
  file_changes: Array<{ file: string; change: 'added' | 'modified' | 'removed' }>;
  is_current: boolean;
  is_beta: boolean;
  is_deprecated: boolean;
  released_at: string;
  deprecated_at?: string;
  file_size_bytes?: number;
  download_count: number;
}

export interface CreateDigitalProductVersionInput {
  digital_product_id: string;
  product_id: string;
  version_number: string;
  major_version: number;
  minor_version: number;
  patch_version: number;
  version_name?: string;
  release_notes?: string;
  changelog?: Array<{ type: string; description: string }>;
  files: Array<{ url: string; name: string; size: number }>;
  file_changes?: Array<{ file: string; change: string }>;
  is_current?: boolean;
  is_beta?: boolean;
}

/**
 * Récupère la version courante d'un produit digital
 */
export const useCurrentDigitalProductVersion = (productId: string) => {
  return useQuery({
    queryKey: ['digital-product-version-current', productId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_digital_product_version', {
        p_product_id: productId,
      });

      if (error) {
        logger.error('Error fetching current version', { error, productId });
        throw error;
      }

      return (data?.[0] || null) as DigitalProductVersion | null;
    },
    enabled: !!productId,
  });
};

/**
 * Récupère l'historique des versions d'un produit
 */
export const useDigitalProductVersionHistory = (productId: string, limit = 10) => {
  return useQuery({
    queryKey: ['digital-product-version-history', productId, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_digital_product_version_history', {
        p_product_id: productId,
        p_limit: limit,
      });

      if (error) {
        logger.error('Error fetching version history', { error, productId });
        throw error;
      }

      return (data || []) as DigitalProductVersion[];
    },
    enabled: !!productId,
  });
};

/**
 * Récupère les notifications de mise à jour de l'utilisateur
 */
export const useDigitalProductUpdateNotifications = () => {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  return useQuery({
    queryKey: ['digital-product-update-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('digital_product_update_notifications')
        .select(`
          *,
          version:digital_product_versions(*),
          product:digital_products(*, product:products(*))
        `)
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching update notifications', { error });
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });
};

/**
 * Crée une nouvelle version
 */
export const useCreateDigitalProductVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDigitalProductVersionInput) => {
      // Si c'est la version courante, mettre à jour les autres
      if (input.is_current) {
        await supabase
          .from('digital_product_versions')
          .update({ is_current: false })
          .eq('digital_product_id', input.digital_product_id)
          .eq('is_current', true);
      }

      const { data, error } = await supabase
        .from('digital_product_versions')
        .insert(input)
        .select()
        .single();

      if (error) {
        logger.error('Error creating version', { error, input });
        throw error;
      }

      return data as DigitalProductVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['digital-product-version-current', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['digital-product-version-history', variables.product_id] });
    },
  });
};

/**
 * Met à jour une version
 */
export const useUpdateDigitalProductVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DigitalProductVersion> & { id: string }) => {
      // Si on met à jour is_current à true, mettre les autres à false
      if (updates.is_current === true) {
        const { data: version } = await supabase
          .from('digital_product_versions')
          .select('digital_product_id, product_id')
          .eq('id', id)
          .single();

        if (version) {
          await supabase
            .from('digital_product_versions')
            .update({ is_current: false })
            .eq('digital_product_id', version.digital_product_id)
            .eq('is_current', true)
            .neq('id', id);
        }
      }

      const { data, error } = await supabase
        .from('digital_product_versions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating version', { error, id, updates });
        throw error;
      }

      return data as DigitalProductVersion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['digital-product-version-current', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['digital-product-version-history', data.product_id] });
    },
  });
};

/**
 * Supprime une version
 */
export const useDeleteDigitalProductVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('digital_product_versions')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting digital product version', { error, id });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['digital-product-version-current', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['digital-product-version-history', variables.productId] });
    },
  });
};

/**
 * Marque une notification comme lue
 */
export const useMarkUpdateNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('digital_product_update_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        logger.error('Error marking notification as read', { error, notificationId });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-product-update-notifications'] });
    },
  });
};







