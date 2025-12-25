/**
 * Digital Product Updates Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les mises à jour de produits digitaux
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { invalidateUpdateCache, invalidateDigitalProductCache, EntityAction } from '@/lib/cache-invalidation';
import { useMutationWithRetry } from '@/hooks/useMutationWithRetry';

// =====================================================
// TYPES
// =====================================================

export interface DigitalProductUpdate {
  id: string;
  digital_product_id: string;
  version: string;
  previous_version?: string;
  release_type: 'major' | 'minor' | 'patch' | 'hotfix';
  title: string;
  description?: string;
  changelog: string;
  file_url: string;
  file_size_mb?: number;
  file_hash?: string;
  is_published: boolean;
  is_forced: boolean;
  release_date: string;
  download_count: number;
  created_at: string;
  // Relations
  digital_product?: {
    id: string;
    product: {
      id: string;
      name: string;
      image_url?: string;
    };
  };
}

export interface ProductVersion {
  id: string;
  product_id: string;
  store_id: string;
  version_number: string;
  version_name?: string;
  status: 'draft' | 'beta' | 'stable' | 'deprecated';
  download_url: string;
  file_size_mb?: number;
  file_checksum?: string;
  changelog_title?: string;
  changelog_markdown?: string;
  whats_new?: string[];
  bug_fixes?: string[];
  breaking_changes?: string[];
  release_date?: string;
  download_count: number;
  is_major_update: boolean;
  is_security_update: boolean;
  minimum_version?: string;
  notify_customers: boolean;
  notification_sent_at?: string;
  customers_notified: number;
  created_at: string;
  updated_at: string;
  // Relations
  product?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useCustomerProductUpdates - Liste les mises à jour disponibles pour le client
 */
export const useCustomerProductUpdates = () => {
  return useQuery({
    queryKey: ['customerProductUpdates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer les produits digitaux achetés par le client
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_items!inner (
            product_id,
            product_type
          )
        `)
        .eq('customer_id', user.id)
        .eq('payment_status', 'paid')
        .eq('status', 'completed')
        .eq('order_items.product_type', 'digital');

      if (!orders || orders.length === 0) {
        return [];
      }

      const productIds = orders
        .flatMap((o: any) => o.order_items)
        .map((item: any) => item.product_id)
        .filter((id: string, index: number, self: string[]) => self.indexOf(id) === index);

      if (productIds.length === 0) {
        return [];
      }

      // Récupérer les digital_product_ids correspondants
      const { data: digitalProducts } = await supabase
        .from('digital_products')
        .select('id, product_id')
        .in('product_id', productIds);

      if (!digitalProducts || digitalProducts.length === 0) {
        return [];
      }

      const digitalProductIds = digitalProducts.map((dp) => dp.id);

      // Récupérer les mises à jour publiées
      const { data: updates, error } = await supabase
        .from('digital_product_updates')
        .select(`
          *,
          digital_product:digital_products!inner (
            id,
            product:products!inner (
              id,
              name,
              image_url
            )
          )
        `)
        .in('digital_product_id', digitalProductIds)
        .eq('is_published', true)
        .order('release_date', { ascending: false });

      if (error) {
        logger.error('Error fetching customer product updates', { error });
        throw error;
      }

      return (updates || []) as DigitalProductUpdate[];
    },
  });
};

/**
 * useCustomerProductVersions - Liste les versions disponibles pour le client
 */
export const useCustomerProductVersions = () => {
  return useQuery({
    queryKey: ['customerProductVersions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer les produits achetés par le client
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_items!inner (
            product_id,
            product_type
          )
        `)
        .eq('customer_id', user.id)
        .eq('payment_status', 'paid')
        .eq('status', 'completed')
        .eq('order_items.product_type', 'digital');

      if (!orders || orders.length === 0) {
        return [];
      }

      const productIds = orders
        .flatMap((o: any) => o.order_items)
        .map((item: any) => item.product_id)
        .filter((id: string, index: number, self: string[]) => self.indexOf(id) === index);

      if (productIds.length === 0) {
        return [];
      }

      // Récupérer les versions publiées (stable ou beta)
      const { data: versions, error } = await supabase
        .from('product_versions')
        .select(`
          *,
          product:products!inner (
            id,
            name,
            image_url
          )
        `)
        .in('product_id', productIds)
        .in('status', ['stable', 'beta'])
        .order('release_date', { ascending: false });

      if (error) {
        logger.error('Error fetching customer product versions', { error });
        throw error;
      }

      return (versions || []) as ProductVersion[];
    },
  });
};

/**
 * useProductUpdate - Récupère une mise à jour spécifique
 */
export const useProductUpdate = (updateId: string | undefined) => {
  return useQuery({
    queryKey: ['productUpdate', updateId],
    queryFn: async () => {
      if (!updateId) throw new Error('Update ID manquant');

      const { data, error } = await supabase
        .from('digital_product_updates')
        .select(`
          *,
          digital_product:digital_products!inner (
            id,
            product:products!inner (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('id', updateId)
        .single();

      if (error) {
        logger.error('Error fetching product update', { error, updateId });
        throw error;
      }

      return data as DigitalProductUpdate;
    },
    enabled: !!updateId,
  });
};

/**
 * useProductVersion - Récupère une version spécifique
 */
export const useProductVersion = (versionId: string | undefined) => {
  return useQuery({
    queryKey: ['productVersion', versionId],
    queryFn: async () => {
      if (!versionId) throw new Error('Version ID manquant');

      const { data, error } = await supabase
        .from('product_versions')
        .select(`
          *,
          product:products!inner (
            id,
            name,
            image_url
          )
        `)
        .eq('id', versionId)
        .single();

      if (error) {
        logger.error('Error fetching product version', { error, versionId });
        throw error;
      }

      return data as ProductVersion;
    },
    enabled: !!versionId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useTrackVersionDownload - Enregistre un téléchargement de version
 */
export const useTrackVersionDownload = () => {
  const queryClient = useQueryClient();

  return useMutationWithRetry({
    maxRetries: 3,
    baseDelay: 1000,
    errorToastTitle: 'Erreur mise à jour',
    mutationFn: async (versionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Enregistrer dans version_download_logs si la table existe
      const { error } = await supabase
        .from('version_download_logs')
        .insert({
          version_id: versionId,
          user_id: user.id,
          downloaded_at: new Date().toISOString(),
        });

      if (error) {
        // Si la table n'existe pas, on ignore l'erreur
        logger.warn('Could not track version download', { error });
      }

      // Incrémenter le compteur de téléchargements
      const { error: updateError } = await supabase.rpc('increment_version_download_count', {
        p_version_id: versionId,
      });

      if (updateError) {
        logger.warn('Could not increment version download count', { updateError });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProductVersions'] });
      queryClient.invalidateQueries({ queryKey: ['productVersion'] });
    },
  });
};

/**
 * useProductUpdates - Récupère les mises à jour d'un produit digital
 */
export const useProductUpdates = (digitalProductId: string | undefined) => {
  return useQuery({
    queryKey: ['productUpdates', digitalProductId],
    queryFn: async () => {
      if (!digitalProductId) throw new Error('Digital Product ID manquant');

      const { data, error } = await supabase
        .from('digital_product_updates')
        .select('*')
        .eq('digital_product_id', digitalProductId)
        .order('release_date', { ascending: false });

      if (error) {
        logger.error('Error fetching product updates', { error, digitalProductId });
        throw error;
      }

      return (data || []) as DigitalProductUpdate[];
    },
    enabled: !!digitalProductId,
  });
};

/**
 * useCreateProductUpdate - Crée une nouvelle mise à jour
 */
export const useCreateProductUpdate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutationWithRetry({
    maxRetries: 3,
    baseDelay: 1000,
    errorToastTitle: 'Erreur mise à jour',
    mutationFn: async (updateData: {
      digital_product_id: string;
      version: string;
      previous_version?: string;
      release_type: 'major' | 'minor' | 'patch' | 'hotfix';
      title: string;
      description?: string;
      changelog: string;
      file_url: string;
      file_size_mb?: number;
      file_hash?: string;
      is_published?: boolean;
      is_forced?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('digital_product_updates')
        .insert({
          ...updateData,
          release_date: new Date().toISOString(),
          download_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DigitalProductUpdate;
    },
    onSuccess: (data) => {
      // Invalidation intelligente du cache
      invalidateUpdateCache(queryClient, data.id, EntityAction.CREATE, data.digital_product_id);
      invalidateDigitalProductCache(queryClient, data.digital_product_id, EntityAction.UPDATE);
      toast({
        title: '✅ Mise à jour créée',
        description: `La mise à jour ${data.version} a été créée avec succès`,
      });
    },
    onError: (error: any) => {
      logger.error('Error creating product update', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la mise à jour',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateProductUpdate - Met à jour une mise à jour existante
 */
export const useUpdateProductUpdate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutationWithRetry({
    maxRetries: 3,
    baseDelay: 1000,
    errorToastTitle: 'Erreur mise à jour',
    mutationFn: async ({
      updateId,
      updates,
    }: {
      updateId: string;
      updates: Partial<DigitalProductUpdate>;
    }) => {
      const { data, error } = await supabase
        .from('digital_product_updates')
        .update(updates)
        .eq('id', updateId)
        .select()
        .single();

      if (error) throw error;
      return data as DigitalProductUpdate;
    },
    onSuccess: (data) => {
      // Invalidation intelligente du cache
      invalidateUpdateCache(queryClient, data.id, EntityAction.UPDATE, data.digital_product_id);
      invalidateDigitalProductCache(queryClient, data.digital_product_id, EntityAction.UPDATE);
      toast({
        title: '✅ Mise à jour modifiée',
        description: 'La mise à jour a été modifiée avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating product update', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de modifier la mise à jour',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useDeleteProductUpdate - Supprime une mise à jour
 */
export const useDeleteProductUpdate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutationWithRetry({
    maxRetries: 3,
    baseDelay: 1000,
    errorToastTitle: 'Erreur mise à jour',
    mutationFn: async (updateId: string) => {
      // Récupérer le digital_product_id avant suppression
      const { data: update } = await supabase
        .from('digital_product_updates')
        .select('digital_product_id')
        .eq('id', updateId)
        .single();

      const { error } = await supabase
        .from('digital_product_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;
      return { updateId, digital_product_id: update?.digital_product_id };
    },
    onSuccess: (data, updateId) => {
      if (data.digital_product_id) {
        // Invalidation intelligente du cache
        invalidateUpdateCache(queryClient, updateId, EntityAction.DELETE, data.digital_product_id);
        invalidateDigitalProductCache(queryClient, data.digital_product_id, EntityAction.UPDATE);
      }
      toast({
        title: '✅ Mise à jour supprimée',
        description: 'La mise à jour a été supprimée avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error deleting product update', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer la mise à jour',
        variant: 'destructive',
      });
    },
  });
};

