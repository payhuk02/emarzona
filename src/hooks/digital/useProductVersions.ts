import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
        .select('*')
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
        .select(`
          *,
          products (
            name,
            slug
          )
        `)
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
        .select('*')
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
        .select('*')
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: versionKeys.byProduct(data.product_id) });
      queryClient.invalidateQueries({ queryKey: versionKeys.byStore(data.store_id) });
      
      toast({
        title: '✅ Version créée !',
        description: `Version ${data.version_number} créée avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la version.',
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
    mutationFn: async ({ versionId, updates }: { versionId: string; updates: Partial<CreateVersionInput> }) => {
      const { data, error } = await supabase
        .from('product_versions')
        .update(updates)
        .eq('id', versionId)
        .select()
        .single();

      if (error) throw error;
      return data as ProductVersion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: versionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: versionKeys.byProduct(data.product_id) });
      queryClient.invalidateQueries({ queryKey: versionKeys.byStore(data.store_id) });
      
      toast({
        title: '✅ Version mise à jour !',
        description: `Version ${data.version_number} modifiée avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour la version.',
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
      const { error } = await supabase
        .from('product_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: versionKeys.all });
      
      toast({
        title: '✅ Version supprimée !',
        description: 'La version a été supprimée avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer la version.',
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
      // TODO: Implement email notification logic via Supabase Edge Function
      // For now, just update the notification_sent_at timestamp
      
      const { data, error } = await supabase
        .from('product_versions')
        .update({
          notification_sent_at: new Date().toISOString(),
          // customers_notified will be updated by the notification service
        })
        .eq('id', versionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: versionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: versionKeys.byProduct(data.product_id) });
      
      toast({
        title: '📧 Notifications envoyées !',
        description: 'Les clients seront notifiés de la nouvelle version.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'envoyer les notifications.',
      });
    },
  });
}

