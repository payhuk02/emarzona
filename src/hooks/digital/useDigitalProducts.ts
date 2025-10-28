/**
 * Digital Products Hooks - Professional Grade
 * Date: 27 octobre 2025
 * 
 * Inspiré de: Gumroad, Stripe, Paddle
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// TYPES
// =====================================================

export interface DigitalProduct {
  id: string;
  product_id: string;
  digital_type: string;
  license_type: string;
  license_duration_days: number | null;
  max_activations: number;
  main_file_url: string;
  main_file_size_mb: number;
  main_file_format: string;
  version: string;
  download_limit: number;
  download_expiry_days: number;
  total_downloads: number;
  unique_downloaders: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
  // Relations
  product?: any;
  files?: DigitalProductFile[];
}

export interface DigitalProductFile {
  id: string;
  digital_product_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size_mb: number;
  order_index: number;
  is_main: boolean;
  is_preview: boolean;
  download_count: number;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const digitalProductKeys = {
  all: ['digital-products'] as const,
  lists: () => [...digitalProductKeys.all, 'list'] as const,
  list: (filters: any) => [...digitalProductKeys.lists(), filters] as const,
  details: () => [...digitalProductKeys.all, 'detail'] as const,
  detail: (id: string) => [...digitalProductKeys.details(), id] as const,
  files: (productId: string) => [...digitalProductKeys.detail(productId), 'files'] as const,
  stats: (productId: string) => [...digitalProductKeys.detail(productId), 'stats'] as const,
};

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * Fetch all digital products for current user's store
 */
export const useDigitalProducts = (storeId?: string) => {
  return useQuery({
    queryKey: digitalProductKeys.list({ storeId }),
    queryFn: async () => {
      let query = supabase
        .from('digital_products')
        .select(`
          *,
          product:products (
            id,
            name,
            slug,
            price,
            currency,
            image_url,
            is_active,
            store_id
          )
        `)
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('product.store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DigitalProduct[];
    },
    enabled: !!storeId,
  });
};

/**
 * Fetch single digital product with all relations
 */
export const useDigitalProduct = (productId: string) => {
  return useQuery({
    queryKey: digitalProductKeys.detail(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_products')
        .select(`
          *,
          product:products (*),
          files:digital_product_files (*)
        `)
        .eq('product_id', productId)
        .single();

      if (error) throw error;
      return data as DigitalProduct;
    },
    enabled: !!productId,
  });
};

/**
 * Fetch files for a digital product
 */
export const useDigitalProductFiles = (digitalProductId: string) => {
  return useQuery({
    queryKey: digitalProductKeys.files(digitalProductId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_product_files')
        .select('*')
        .eq('digital_product_id', digitalProductId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as DigitalProductFile[];
    },
    enabled: !!digitalProductId,
  });
};

/**
 * Fetch digital product statistics
 */
export const useDigitalProductStats = (digitalProductId: string) => {
  return useQuery({
    queryKey: digitalProductKeys.stats(digitalProductId),
    queryFn: async () => {
      // Fetch downloads stats
      const { data: downloads, error: downloadsError } = await supabase
        .from('digital_product_downloads')
        .select('*')
        .eq('digital_product_id', digitalProductId);

      if (downloadsError) throw downloadsError;

      // Fetch licenses stats
      const { data: licenses, error: licensesError } = await supabase
        .from('digital_licenses')
        .select('*')
        .eq('digital_product_id', digitalProductId);

      if (licensesError) throw licensesError;

      return {
        total_downloads: downloads?.length || 0,
        unique_users: new Set(downloads?.map(d => d.user_id)).size,
        total_licenses: licenses?.length || 0,
        active_licenses: licenses?.filter(l => l.status === 'active').length || 0,
        success_rate: downloads?.length > 0
          ? (downloads.filter(d => d.download_success).length / downloads.length) * 100
          : 0,
      };
    },
    enabled: !!digitalProductId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * Create digital product
 */
export const useCreateDigitalProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<DigitalProduct>) => {
      const { data: result, error } = await supabase
        .from('digital_products')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: digitalProductKeys.lists() });
      toast({
        title: 'Succès',
        description: 'Produit digital créé avec succès',
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

/**
 * Update digital product
 */
export const useUpdateDigitalProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DigitalProduct> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('digital_products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: digitalProductKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: digitalProductKeys.lists() });
      toast({
        title: 'Succès',
        description: 'Produit digital mis à jour',
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

/**
 * Delete digital product
 */
export const useDeleteDigitalProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('digital_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: digitalProductKeys.lists() });
      toast({
        title: 'Succès',
        description: 'Produit digital supprimé',
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

/**
 * Add file to digital product
 */
export const useAddDigitalProductFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<DigitalProductFile>) => {
      const { data: result, error } = await supabase
        .from('digital_product_files')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: digitalProductKeys.files(data.digital_product_id) 
      });
      toast({
        title: 'Succès',
        description: 'Fichier ajouté',
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

/**
 * Remove file from digital product
 */
export const useRemoveDigitalProductFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, digitalProductId }: { id: string; digitalProductId: string }) => {
      const { error } = await supabase
        .from('digital_product_files')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return digitalProductId;
    },
    onSuccess: (digitalProductId) => {
      queryClient.invalidateQueries({ 
        queryKey: digitalProductKeys.files(digitalProductId) 
      });
      toast({
        title: 'Succès',
        description: 'Fichier supprimé',
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

// =====================================================
// UTILITY HOOKS
// =====================================================

/**
 * Check if user has access to download (purchased product)
 */
export const useHasDownloadAccess = (productId: string) => {
  return useQuery({
    queryKey: ['download-access', productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user has purchased this product via their email
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          orders!inner (
            id,
            payment_status,
            customers!inner (
              email
            )
          )
        `)
        .eq('product_id', productId)
        .eq('orders.payment_status', 'paid')
        .eq('orders.customers.email', user.email)
        .limit(1);

      if (error) {
        console.error('Download access check error:', error);
        return false;
      }
      
      return data && data.length > 0;
    },
    enabled: !!productId,
  });
};

/**
 * Get remaining downloads for user
 */
export const useRemainingDownloads = (digitalProductId: string) => {
  return useQuery({
    queryKey: ['remaining-downloads', digitalProductId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get product download limit
      const { data: product } = await supabase
        .from('digital_products')
        .select('download_limit')
        .eq('id', digitalProductId)
        .single();

      if (!product || product.download_limit === -1) {
        return { unlimited: true, remaining: -1 };
      }

      // Count user's downloads
      const { data: downloads } = await supabase
        .from('digital_product_downloads')
        .select('id')
        .eq('digital_product_id', digitalProductId)
        .eq('user_id', user.id);

      const used = downloads?.length || 0;
      const remaining = Math.max(0, product.download_limit - used);

      return {
        unlimited: false,
        limit: product.download_limit,
        used,
        remaining,
      };
    },
    enabled: !!digitalProductId,
  });
};

