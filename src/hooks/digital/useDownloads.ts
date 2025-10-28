/**
 * Digital Downloads Hooks - Professional
 * Date: 27 octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// TYPES
// =====================================================

export interface DigitalDownload {
  id: string;
  digital_product_id: string;
  file_id: string | null;
  user_id: string;
  download_date: string;
  download_ip: string | null;
  download_country: string | null;
  user_agent: string | null;
  download_duration_seconds: number | null;
  download_success: boolean;
  license_key: string | null;
  file_version: string | null;
  created_at: string;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const downloadKeys = {
  all: ['downloads'] as const,
  lists: () => [...downloadKeys.all, 'list'] as const,
  list: (filters: any) => [...downloadKeys.lists(), filters] as const,
  userDownloads: (userId: string) => [...downloadKeys.all, 'user', userId] as const,
  productDownloads: (productId: string) => [...downloadKeys.all, 'product', productId] as const,
};

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * Get user's download history
 */
export const useUserDownloads = () => {
  return useQuery({
    queryKey: downloadKeys.userDownloads('current'),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('digital_product_downloads')
        .select(`
          *,
          digital_product:digital_products (
            id,
            product:products (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('download_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

/**
 * Get downloads for a specific product (for store owners)
 */
export const useProductDownloads = (digitalProductId: string) => {
  return useQuery({
    queryKey: downloadKeys.productDownloads(digitalProductId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_product_downloads')
        .select('*')
        .eq('digital_product_id', digitalProductId)
        .order('download_date', { ascending: false });

      if (error) throw error;
      return data as DigitalDownload[];
    },
    enabled: !!digitalProductId,
  });
};

/**
 * Get download analytics
 */
export const useDownloadAnalytics = (digitalProductId: string, period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: [...downloadKeys.productDownloads(digitalProductId), 'analytics', period],
    queryFn: async () => {
      const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('digital_product_downloads')
        .select('*')
        .eq('digital_product_id', digitalProductId)
        .gte('download_date', startDate.toISOString());

      if (error) throw error;

      // Calculate analytics
      const totalDownloads = data.length;
      const successfulDownloads = data.filter(d => d.download_success).length;
      const uniqueUsers = new Set(data.map(d => d.user_id)).size;
      const averageDuration = data.reduce((sum, d) => sum + (d.download_duration_seconds || 0), 0) / totalDownloads;
      
      // Downloads by day
      const downloadsByDay = data.reduce((acc, d) => {
        const date = new Date(d.download_date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Downloads by country
      const downloadsByCountry = data.reduce((acc, d) => {
        const country = d.download_country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalDownloads,
        successfulDownloads,
        failedDownloads: totalDownloads - successfulDownloads,
        successRate: totalDownloads > 0 ? (successfulDownloads / totalDownloads) * 100 : 0,
        uniqueUsers,
        averageDuration: Math.round(averageDuration),
        downloadsByDay: Object.entries(downloadsByDay).map(([date, count]) => ({ date, count })),
        downloadsByCountry: Object.entries(downloadsByCountry)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      };
    },
    enabled: !!digitalProductId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * Track download
 */
export const useTrackDownload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      digitalProductId: string;
      fileId?: string;
      licenseKey?: string;
      fileVersion?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user IP and location (simplified)
      const userAgent = navigator.userAgent;

      const { data: result, error } = await supabase
        .from('digital_product_downloads')
        .insert({
          digital_product_id: data.digitalProductId,
          file_id: data.fileId,
          user_id: user.id,
          license_key: data.licenseKey,
          file_version: data.fileVersion,
          user_agent: userAgent,
          download_success: true,
          download_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: downloadKeys.productDownloads(variables.digitalProductId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: downloadKeys.userDownloads('current') 
      });
    },
  });
};

/**
 * Create secure download link
 */
export const useGenerateDownloadLink = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      fileId: string;
      expiresIn?: number; // seconds, default 3600 (1h)
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get file info
      const { data: file, error: fileError } = await supabase
        .from('digital_product_files')
        .select('*, digital_product:digital_products (*)')
        .eq('id', params.fileId)
        .single();

      if (fileError) throw fileError;

      // Check if user has access via order_items
      const { data: hasAccess, error: accessError } = await supabase
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
        .eq('product_id', file.digital_product.product_id)
        .eq('orders.payment_status', 'paid')
        .eq('orders.customers.email', user.email)
        .limit(1);

      if (accessError || !hasAccess || hasAccess.length === 0) {
        throw new Error('No access to this file');
      }

      // Generate signed URL
      const { data: signedUrl, error: signError } = await supabase.storage
        .from('products')
        .createSignedUrl(
          file.file_url,
          params.expiresIn || 3600
        );

      if (signError) throw signError;

      return {
        url: signedUrl.signedUrl,
        expiresAt: new Date(Date.now() + (params.expiresIn || 3600) * 1000).toISOString(),
        fileName: file.name,
        fileSize: file.file_size_mb,
      };
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
 * Update download status (success/failure)
 */
export const useUpdateDownloadStatus = () => {
  return useMutation({
    mutationFn: async (params: {
      downloadId: string;
      success: boolean;
      duration?: number;
      errorMessage?: string;
    }) => {
      const { error } = await supabase
        .from('digital_product_downloads')
        .update({
          download_success: params.success,
          download_duration_seconds: params.duration,
          error_message: params.errorMessage,
        })
        .eq('id', params.downloadId);

      if (error) throw error;
    },
  });
};

