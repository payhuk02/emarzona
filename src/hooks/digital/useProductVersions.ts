import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendNewVersionNotification } from '@/utils/digitalNotifications';
import { logger } from '@/lib/logger';

const PRODUCT_VERSION_FIELDS =
  'id, product_id, store_id, version_number, version_name, status, download_url, file_size_mb, file_checksum, changelog_title, changelog_markdown, whats_new, bug_fixes, breaking_changes, release_date, download_count, is_major_update, is_security_update, minimum_version, notify_customers, notification_sent_at, customers_notified, created_at, updated_at, is_beta, rollback_threshold_percentage, rollback_min_downloads, rollback_status, rolled_back_at, rollback_reason, rollback_metrics, previous_version_id, rolled_back_to_version_id';

// ============================================================================
// TYPES
// ============================================================================

export type VersionStatus = 'draft' | 'beta' | 'stable' | 'deprecated';

export interface ProductVersion {
  id: string;
  product_id: string;
  store_id: string;
  version_number: string;
  version_name?: string;
  status: VersionStatus;
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
  // Beta & Rollback support
  is_beta?: boolean;
  rollback_threshold_percentage?: number;
  rollback_min_downloads?: number;
  rollback_status?: 'none' | 'monitoring' | 'rolled_back' | 'rollback_failed';
  rolled_back_at?: string;
  rollback_reason?: string;
  rollback_metrics?: Record<string, unknown>;
  previous_version_id?: string;
  rolled_back_to_version_id?: string;
}

export interface CreateVersionInput {
  product_id: string;
  store_id: string;
  version_number: string;
  version_name?: string;
  status?: VersionStatus;
  download_url: string;
  file_size_mb?: number;
  file_checksum?: string;
  changelog_title?: string;
  changelog_markdown?: string;
  whats_new?: string[];
  bug_fixes?: string[];
  breaking_changes?: string[];
  release_date?: string;
  is_major_update?: boolean;
  is_security_update?: boolean;
  minimum_version?: string;
  notify_customers?: boolean;
  // Beta & Rollback support
  is_beta?: boolean;
  rollback_threshold_percentage?: number;
  rollback_min_downloads?: number;
  previous_version_id?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const versionKeys = {
  all: ['product-versions'] as const,
  byProduct: (productId: string) => [...versionKeys.all, 'product', productId] as const,
  byStore: (storeId: string) => [...versionKeys.all, 'store', storeId] as const,
  detail: (versionId: string) => [...versionKeys.all, 'detail', versionId] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Fetch all versions for a specific product
 */
export function useProductVersions(productId: string) {
  return useQuery({
    queryKey: versionKeys.byProduct(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_versions')
        .select(PRODUCT_VERSION_FIELDS)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductVersion[];
    },
    enabled: !!productId,
  });
}

/**
 * Fetch all versions for a store (vendor)
 */
export function useStoreVersions(storeId: string) {
  return useQuery({
    queryKey: versionKeys.byStore(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_versions')
        .select(
          `
          *,
          products (
            name,
            slug
          )
        `
        )
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
}

/**
 * Fetch a single version by ID
 */
export function useVersion(versionId: string) {
  return useQuery({
    queryKey: versionKeys.detail(versionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_versions')
        .select(PRODUCT_VERSION_FIELDS)
        .eq('id', versionId)
        .single();

      if (error) throw error;
      return data as ProductVersion;
    },
    enabled: !!versionId,
  });
}

/**
 * Get the latest stable version for a product
 */
export function useLatestVersion(productId: string) {
  return useQuery({
    queryKey: [...versionKeys.byProduct(productId), 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_versions')
        .select(PRODUCT_VERSION_FIELDS)
        .eq('product_id', productId)
        .eq('status', 'stable')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ProductVersion | null;
    },
    enabled: !!productId,
  });
}

/**
 * Create a new product version
 */
export function useCreateVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateVersionInput) => {
      const { data, error } = await supabase
        .from('product_versions')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as ProductVersion;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: versionKeys.byProduct(data.product_id) });
      queryClient.invalidateQueries({ queryKey: versionKeys.byStore(data.store_id) });

      toast({
        title: '✅ Version créée !',
        description: `Version ${data.version_number} créée avec succès.`,
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer la version.',
      });
    },
  });
}

/**
 * Update an existing version
 */
export function useUpdateVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      versionId,
      updates,
    }: {
      versionId: string;
      updates: Partial<CreateVersionInput>;
    }) => {
      const { data, error } = await supabase
        .from('product_versions')
        .update(updates)
        .eq('id', versionId)
        .select()
        .single();

      if (error) throw error;
      return data as ProductVersion;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: versionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: versionKeys.byProduct(data.product_id) });
      queryClient.invalidateQueries({ queryKey: versionKeys.byStore(data.store_id) });

      toast({
        title: '✅ Version mise à jour !',
        description: `Version ${data.version_number} modifiée avec succès.`,
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de mettre à jour la version.',
      });
    },
  });
}

/**
 * Delete a version
 */
export function useDeleteVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase.from('product_versions').delete().eq('id', versionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: versionKeys.all });

      toast({
        title: '✅ Version supprimée !',
        description: 'La version a été supprimée avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer la version.',
      });
    },
  });
}

/**
 * Increment download count for a version
 */
export function useIncrementVersionDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase.rpc('increment_version_download_count', {
        version_id: versionId,
      });

      if (error) throw error;
    },
    onSuccess: (_, versionId) => {
      queryClient.invalidateQueries({ queryKey: versionKeys.detail(versionId) });
    },
  });
}

/**
 * Notify customers about a new version
 */
export function useNotifyCustomers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ versionId, productId }: { versionId: string; productId: string }) => {
      // Récupérer les informations de la version
      const { data: version, error: versionError } = await supabase
        .from('product_versions')
        .select(
          `
          *,
          product:products (
            id,
            name,
            slug
          )
        `
        )
        .eq('id', versionId)
        .single();

      if (versionError || !version) {
        throw new Error('Version non trouvée');
      }

      // Récupérer les informations du produit
      const product = Array.isArray(version.product) ? version.product[0] : version.product;
      if (!product) {
        throw new Error('Produit non trouvé');
      }

      // Construire les notes de version depuis le changelog
      const versionNotes =
        version.changelog_markdown ||
        version.changelog_title ||
        (version.whats_new && version.whats_new.length > 0
          ? `Nouveautés: ${version.whats_new.join(', ')}`
          : 'Nouvelle version disponible');

      // Envoyer les notifications à tous les clients qui ont acheté ce produit
      // Note: sendNewVersionNotification récupère automatiquement tous les clients
      // et envoie un email à chacun. Les champs userId/userEmail/userName sont requis
      // par l'interface mais ne sont pas utilisés car la fonction récupère les clients elle-même.
      const notificationResult = await sendNewVersionNotification({
        userId: '', // Non utilisé - la fonction récupère tous les clients
        userEmail: '', // Non utilisé
        userName: '', // Non utilisé
        storeId: version.store_id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug || undefined,
        versionNumber: version.version_number,
        versionNotes,
        downloadLink: version.download_url,
        previousVersion: version.previous_version_id || undefined,
      });

      if (!notificationResult.success) {
        throw new Error(notificationResult.error || "Erreur lors de l'envoi des notifications");
      }

      // Récupérer le nombre de clients notifiés (tous les clients qui ont acheté le produit)
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, orders!inner(customer_id)')
        .eq('product_id', productId)
        .eq('product_type', 'digital');

      interface OrderItemWithOrder {
        order_id: string;
        orders?: {
          customer_id: string;
        } | null;
      }
      const uniqueCustomers = new Set<string>();
      (orderItems as OrderItemWithOrder[] | null)?.forEach(item => {
        if (item.orders?.customer_id) {
          uniqueCustomers.add(item.orders.customer_id);
        }
      });

      const customersNotified = uniqueCustomers.size;

      // Mettre à jour le timestamp de notification et le compteur
      const { data: updatedVersion, error: updateError } = await supabase
        .from('product_versions')
        .update({
          notification_sent_at: new Date().toISOString(),
          customers_notified: customersNotified,
        })
        .eq('id', versionId)
        .select()
        .single();

      if (updateError) {
        logger.error('Erreur lors de la mise à jour du timestamp de notification', {
          error: updateError,
        });
        // Ne pas throw car les notifications ont été envoyées
      }

      return updatedVersion || version;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: versionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: versionKeys.byProduct(data.product_id) });

      toast({
        title: '📧 Notifications envoyées !',
        description: 'Les clients seront notifiés de la nouvelle version.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: errorMessage || "Impossible d'envoyer les notifications.",
      });
    },
  });
}
