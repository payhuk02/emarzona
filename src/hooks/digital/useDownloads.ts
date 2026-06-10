/**
 * Digital Downloads Hooks - Professional
 * Date: 27 octobre 2025
 *
 * E11: Paid files are served via download tokens + /download/:token redemption
 * (private `products` bucket — no direct signed URLs from the client).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { normalizeFileStorageRef } from '@/lib/digital/storage-ref';

const DIGITAL_DOWNLOAD_FIELDS =
  'id, digital_product_id, file_id, user_id, download_date, download_ip, download_country, user_agent, download_duration_seconds, download_success, license_key, file_version, created_at';

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

interface DigitalFileForDownload {
  id: string;
  name: string;
  file_url: string;
  file_size_mb?: number | null;
  digital_product: {
    id: string;
    product_id: string;
    product: {
      id: string;
      store_id: string;
    } | null;
  } | null;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const downloadKeys = {
  all: ['downloads'] as const,
  lists: () => [...downloadKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...downloadKeys.lists(), filters] as const,
  userDownloads: (userId: string) => [...downloadKeys.all, 'user', userId] as const,
  productDownloads: (productId: string) => [...downloadKeys.all, 'product', productId] as const,
};

// =====================================================
// HELPERS
// =====================================================

function mapDownloadTokenError(message: string): string {
  if (message.includes('DOWNLOAD_ACCESS_DENIED') || message.includes('CUSTOMER_ACCESS_DENIED')) {
    return "Accès non autorisé. Veuillez d'abord acheter ce produit.";
  }
  if (message.includes('PRODUCT_NOT_FOUND')) {
    return 'Fichier introuvable.';
  }
  if (message.includes('UNAUTHORIZED')) {
    return 'Vous devez être connecté pour télécharger ce fichier.';
  }
  return message;
}

async function resolveStoreCustomerId(storeId: string, email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('store_id', storeId)
    .eq('email', email)
    .maybeSingle();

  if (error) {
    logger.error('Error resolving store customer for download', { error, storeId });
    return null;
  }

  return data?.id ?? null;
}

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('digital_product_downloads')
        .select(
          `
          *,
          digital_product:digital_products (
            id,
            product:products (
              id,
              name,
              image_url
            )
          )
        `
        )
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
        .select(DIGITAL_DOWNLOAD_FIELDS)
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
export const useDownloadAnalytics = (
  digitalProductId: string,
  period: '7d' | '30d' | '90d' = '30d'
) => {
  return useQuery({
    queryKey: [...downloadKeys.productDownloads(digitalProductId), 'analytics', period],
    queryFn: async () => {
      const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('digital_product_downloads')
        .select(DIGITAL_DOWNLOAD_FIELDS)
        .eq('digital_product_id', digitalProductId)
        .gte('download_date', startDate.toISOString());

      if (error) throw error;

      const totalDownloads = data.length;
      const successfulDownloads = data.filter(d => d.download_success).length;
      const uniqueUsers = new Set(data.map(d => d.user_id)).size;
      const averageDuration =
        data.reduce((sum, d) => sum + (d.download_duration_seconds || 0), 0) /
        (totalDownloads || 1);

      const downloadsByDay = data.reduce(
        (acc, d) => {
          const date = new Date(d.download_date).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const downloadsByCountry = data.reduce(
        (acc, d) => {
          const country = d.download_country || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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

      if (result) {
        supabase
          .from('digital_products')
          .select('product:products(store_id)')
          .eq('id', data.digitalProductId)
          .single()
          .then(({ data: productData }) => {
            if (productData?.product?.store_id) {
              import('@/lib/webhooks/unified-webhook-service')
                .then(({ triggerUnifiedWebhook }) => {
                  triggerUnifiedWebhook(
                    productData.product.store_id,
                    'digital_product.downloaded',
                    {
                      download_id: result.id,
                      product_id: data.digitalProductId,
                      customer_id: user.id,
                      license_key: data.licenseKey,
                      download_url: '',
                      file_id: data.fileId,
                      file_version: data.fileVersion,
                    },
                    result.id
                  ).catch(error => {
                    logger.error('Error triggering download webhook', { error });
                  });
                })
                .catch(error => {
                  logger.error('Error loading unified webhook service', { error });
                });
            }
          })
          .catch(error => {
            logger.error('Error fetching product for webhook', { error });
          });
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: downloadKeys.productDownloads(variables.digitalProductId),
      });
      queryClient.invalidateQueries({
        queryKey: downloadKeys.userDownloads('current'),
      });
    },
  });
};

/**
 * Mint a secure download token and return the redemption page URL (/download/:token).
 */
export const useGenerateDownloadLink = () => {
  const { toast } = useToast();

  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (_error: unknown) {
        lastError = _error instanceof Error ? _error : new Error(String(_error));

        if (
          lastError.message?.includes('non autorisé') ||
          lastError.message?.includes('Not authenticated') ||
          lastError.message?.includes('Accès non autorisé') ||
          lastError.message?.includes('DOWNLOAD_ACCESS_DENIED')
        ) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  };

  return useMutation({
    mutationFn: async (params: { fileId: string; expiresIn?: number; licenseId?: string }) => {
      return await retryWithBackoff(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) throw new Error('Not authenticated');

        const { data: file, error: fileError } = await supabase
          .from('digital_product_files')
          .select(
            `
            id,
            name,
            file_url,
            file_size_mb,
            digital_product:digital_products (
              id,
              product_id,
              product:products (
                id,
                store_id
              )
            )
          `
          )
          .eq('id', params.fileId)
          .single();

        if (fileError || !file) {
          logger.error('Error fetching file info', { error: fileError, fileId: params.fileId });
          throw new Error(`Erreur lors de la récupération du fichier: ${fileError?.message}`);
        }

        const typedFile = file as DigitalFileForDownload;
        const productId = typedFile.digital_product?.product_id;
        const storeId = typedFile.digital_product?.product?.store_id;

        if (!productId || !storeId) {
          throw new Error('Produit digital invalide');
        }

        const customerId = await resolveStoreCustomerId(storeId, user.email);
        if (!customerId) {
          throw new Error("Accès non autorisé. Veuillez d'abord acheter ce produit.");
        }

        const expiresHours = Math.max(1, Math.ceil((params.expiresIn ?? 3600) / 3600));
        const canonicalFileRef = normalizeFileStorageRef(typedFile.file_url);

        const { data: token, error: tokenError } = await supabase.rpc('generate_download_token', {
          p_product_id: productId,
          p_file_url: canonicalFileRef,
          p_customer_id: customerId,
          p_license_id: params.licenseId ?? null,
          p_expires_hours: expiresHours,
        });

        if (tokenError || !token) {
          const message = mapDownloadTokenError(tokenError?.message || 'Token generation failed');
          logger.warn('Download token generation failed', {
            fileId: params.fileId,
            userId: user.id,
            error: tokenError?.message,
          });
          throw new Error(message);
        }

        const downloadPageUrl = `${window.location.origin}/download/${token}`;

        logger.info('Secure download token minted', {
          fileId: params.fileId,
          productId,
          expiresHours,
        });

        return {
          url: downloadPageUrl,
          token: String(token),
          expiresAt: new Date(Date.now() + expiresHours * 3600 * 1000).toISOString(),
          fileName: typedFile.name,
          fileSize: typedFile.file_size_mb,
        };
      });
    },
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error: Error) => {
      logger.error('Error generating download link', { error: error.message });

      let errorMessage = error.message;
      if (error.message.includes('non autorisé') || error.message.includes('Accès non autorisé')) {
        errorMessage = "Vous n'avez pas accès à ce fichier. Veuillez d'abord acheter ce produit.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      }

      toast({
        title: 'Erreur de téléchargement',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
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
