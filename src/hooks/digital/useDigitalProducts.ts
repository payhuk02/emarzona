import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Produit digital complet
 */
export interface DigitalProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category: string;
  status: 'draft' | 'published' | 'active' | 'archived' | 'suspended';
  protectionLevel: 'basic' | 'standard' | 'advanced';
  version?: string;
  fileSize: number; // MB
  fileType: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  maxLicenses?: number;
  currentLicenses?: number;
  totalDownloads: number;
  recentDownloads?: number;
  revenue: number;
  createdAt: string;
  updatedAt?: string;
  userId: string;
}

/**
 * Données pour créer/mettre à jour un produit digital
 */
export interface DigitalProductData {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category: string;
  status?: 'draft' | 'published' | 'active' | 'archived' | 'suspended';
  protectionLevel?: 'basic' | 'standard' | 'advanced';
  version?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
  maxLicenses?: number;
}

/**
 * useDigitalProducts - Hook pour lister les produits digitaux
 */
export const useDigitalProducts = () => {
  return useQuery({
    queryKey: ['digitalProducts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DigitalProduct[];
    },
  });
};

/**
 * useDigitalProduct - Hook pour récupérer un produit digital par ID
 */
export const useDigitalProduct = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProduct', productId],
    queryFn: async () => {
      if (!productId) throw new Error('ID produit manquant');

      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as DigitalProduct;
    },
    enabled: !!productId,
  });
};

/**
 * useCreateDigitalProduct - Hook pour créer un produit digital
 */
export const useCreateDigitalProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: DigitalProductData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('digital_products')
        .insert({
          ...productData,
          user_id: user.id,
          total_downloads: 0,
          revenue: 0,
          current_licenses: 0,
          status: productData.status || 'draft',
          protection_level: productData.protectionLevel || 'basic',
          tags: productData.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data as DigitalProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
    },
  });
};

/**
 * useUpdateDigitalProduct - Hook pour mettre à jour un produit digital
 */
export const useUpdateDigitalProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, updates }: { productId: string; updates: Partial<DigitalProductData> }) => {
      const { data, error } = await supabase
        .from('digital_products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data as DigitalProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
      queryClient.invalidateQueries({ queryKey: ['digitalProduct', variables.productId] });
    },
  });
};

/**
 * useDeleteDigitalProduct - Hook pour supprimer un produit digital
 */
export const useDeleteDigitalProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('digital_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
    },
  });
};

/**
 * useBulkUpdateDigitalProducts - Hook pour mettre à jour plusieurs produits
 */
export const useBulkUpdateDigitalProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productIds, updates }: { productIds: string[]; updates: Partial<DigitalProductData> }) => {
      const promises = productIds.map((id) =>
        supabase
          .from('digital_products')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`${errors.length} produit(s) n'ont pas pu être mis à jour`);
      }

      return results.map((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
    },
  });
};

/**
 * useDigitalProductStats - Hook pour obtenir les statistiques d'un produit
 */
export const useDigitalProductStats = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProductStats', productId],
    queryFn: async () => {
      if (!productId) throw new Error('ID produit manquant');

      // Récupérer les statistiques (downloads, revenue, licenses)
      const { data: product, error: productError } = await supabase
        .from('digital_products')
        .select('total_downloads, revenue, current_licenses, max_licenses')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Récupérer les téléchargements récents (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentDownloads, error: downloadsError } = await supabase
        .from('download_logs')
        .select('id')
        .eq('product_id', productId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (downloadsError) throw downloadsError;

      // Récupérer le nombre de clients uniques
      const { data: customers, error: customersError } = await supabase
        .from('download_logs')
        .select('customer_id', { count: 'exact', head: false })
        .eq('product_id', productId);

      if (customersError) throw customersError;

      const uniqueCustomers = new Set(customers?.map((c) => c.customer_id) || []).size;

      return {
        totalDownloads: product.total_downloads || 0,
        recentDownloads: recentDownloads?.length || 0,
        revenue: product.revenue || 0,
        activeLicenses: product.current_licenses || 0,
        totalLicenses: product.max_licenses,
        activeCustomers: uniqueCustomers,
      };
    },
    enabled: !!productId,
  });
};

/**
 * useDigitalProductsByCategory - Hook pour filtrer par catégorie
 */
export const useDigitalProductsByCategory = (category: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProducts', 'category', category],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from('digital_products')
        .select('*')
        .eq('user_id', user.id);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as DigitalProduct[];
    },
    enabled: category !== undefined,
  });
};

/**
 * useDigitalProductsByStatus - Hook pour filtrer par statut
 */
export const useDigitalProductsByStatus = (status: DigitalProduct['status'] | undefined) => {
  return useQuery({
    queryKey: ['digitalProducts', 'status', status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from('digital_products')
        .select('*')
        .eq('user_id', user.id);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as DigitalProduct[];
    },
    enabled: status !== undefined,
  });
};

/**
 * useRemainingDownloads - Hook pour obtenir le nombre de téléchargements restants
 */
export const useRemainingDownloads = (digitalProductId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProduct', digitalProductId, 'remainingDownloads'],
    queryFn: async () => {
      if (!digitalProductId) throw new Error('ID produit manquant');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get product download limits
      const { data: product, error: productError } = await supabase
        .from('digital_products')
        .select('max_licenses, current_licenses')
        .eq('id', digitalProductId)
        .single();

      if (productError) throw productError;

      // Count user's downloads for this product
      const { count, error: countError } = await supabase
        .from('digital_product_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('digital_product_id', digitalProductId)
        .eq('user_id', user.id);

      if (countError) throw countError;

      const downloadCount = count || 0;
      const maxDownloads = product?.max_licenses || Infinity;
      const remaining = maxDownloads === Infinity ? Infinity : Math.max(0, maxDownloads - downloadCount);

      return {
        downloadCount,
        maxDownloads,
        remaining,
        hasRemainingDownloads: remaining > 0 || remaining === Infinity,
      };
    },
    enabled: !!digitalProductId,
  });
};

/**
 * useHasDownloadAccess - Hook pour vérifier si l'utilisateur a accès au téléchargement
 */
export const useHasDownloadAccess = (digitalProductId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProduct', digitalProductId, 'hasAccess'],
    queryFn: async () => {
      if (!digitalProductId) throw new Error('ID produit manquant');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Check if user has purchased this product via order_items
      const { data: orderItems, error } = await supabase
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
        .eq('product_id', digitalProductId)
        .eq('orders.payment_status', 'paid')
        .eq('orders.customers.email', user.email);

      if (error) throw error;

      const hasAccess = orderItems && orderItems.length > 0;

      return {
        hasAccess,
        purchaseCount: orderItems?.length || 0,
      };
    },
    enabled: !!digitalProductId,
  });
};
