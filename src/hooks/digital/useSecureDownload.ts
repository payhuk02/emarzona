import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

export interface DownloadToken {
  id: string;
  product_id: string;
  customer_id?: string;
  license_id?: string;
  version_id?: string;
  token: string;
  file_url: string;
  file_name?: string;
  file_size_mb?: number;
  ip_address?: string;
  max_downloads: number;
  current_downloads: number;
  expires_at: string;
  is_used: boolean;
  is_revoked: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface DownloadLog {
  id: string;
  token_id?: string;
  product_id: string;
  customer_id?: string;
  ip_address?: string;
  user_agent?: string;
  bytes_downloaded?: number;
  download_completed: boolean;
  download_duration_seconds?: number;
  error_message?: string;
  created_at: string;
}

export interface GenerateTokenInput {
  product_id: string;
  file_url: string;
  customer_id?: string;
  license_id?: string;
  expires_hours?: number;
}

export interface ValidateTokenResponse {
  valid: boolean;
  error?: string;
  file_url?: string;
  token_id?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const downloadKeys = {
  all: ['downloads'] as const,
  tokens: () => [...downloadKeys.all, 'tokens'] as const,
  logs: () => [...downloadKeys.all, 'logs'] as const,
  tokensByProduct: (productId: string) => [...downloadKeys.tokens(), 'product', productId] as const,
  logsByProduct: (productId: string) => [...downloadKeys.logs(), 'product', productId] as const,
  logsByCustomer: (customerId: string) => [...downloadKeys.logs(), 'customer', customerId] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Generate a secure download token
 */
export function useGenerateDownloadToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: GenerateTokenInput) => {
      const { data, error } = await supabase.rpc('generate_download_token', {
        p_product_id: input.product_id,
        p_file_url: input.file_url,
        p_customer_id: input.customer_id || null,
        p_license_id: input.license_id || null,
        p_expires_hours: input.expires_hours || 1,
      });

      if (error) throw error;
      return data as string; // Returns the token
    },
    onSuccess: (token, variables) => {
      queryClient.invalidateQueries({ queryKey: downloadKeys.tokensByProduct(variables.product_id) });
      
      toast({
        title: '🔐 Token généré !',
        description: 'Le lien de téléchargement sécurisé a été créé.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message || 'Impossible de générer le token.',
      });
    },
  });
}

/**
 * Validate a download token
 */
export function useValidateDownloadToken(token: string | null) {
  return useQuery({
    queryKey: [...downloadKeys.tokens(), 'validate', token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase.rpc('validate_download_token', {
        p_token: token,
      });

      if (error) throw error;
      return data as ValidateTokenResponse;
    },
    enabled: !!token,
    staleTime: 0, // Always revalidate
  });
}

/**
 * Fetch download tokens for a product (vendor)
 */
export function useProductDownloadTokens(productId: string) {
  return useQuery({
    queryKey: downloadKeys.tokensByProduct(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('download_tokens')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DownloadToken[];
    },
    enabled: !!productId,
  });
}

/**
 * Fetch download logs for a product (vendor analytics)
 */
export function useProductDownloadLogs(productId: string) {
  return useQuery({
    queryKey: downloadKeys.logsByProduct(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('download_logs')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as DownloadLog[];
    },
    enabled: !!productId,
  });
}

/**
 * Fetch download logs for a customer
 */
export function useCustomerDownloadLogs(customerId: string) {
  return useQuery({
    queryKey: downloadKeys.logsByCustomer(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('download_logs')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DownloadLog[];
    },
    enabled: !!customerId,
  });
}

/**
 * Revoke a download token
 */
export function useRevokeDownloadToken() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from('download_tokens')
        .update({ is_revoked: true })
        .eq('id', tokenId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: downloadKeys.tokens() });
      
      toast({
        title: '✅ Token révoqué !',
        description: 'Le lien de téléchargement a été désactivé.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: error.message || 'Impossible de révoquer le token.',
      });
    },
  });
}

/**
 * Log a download attempt
 */
export function useLogDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Partial<DownloadLog>) => {
      const { error } = await supabase
        .from('download_logs')
        .insert([log]);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (variables.product_id) {
        queryClient.invalidateQueries({ queryKey: downloadKeys.logsByProduct(variables.product_id) });
      }
      if (variables.customer_id) {
        queryClient.invalidateQueries({ queryKey: downloadKeys.logsByCustomer(variables.customer_id) });
      }
    },
  });
}

/**
 * Get download analytics for a product
 */
export function useDownloadAnalytics(productId: string) {
  return useQuery({
    queryKey: [...downloadKeys.logsByProduct(productId), 'analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('download_logs')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;

      const logs = data as DownloadLog[];

      // Calculate analytics
      const totalDownloads = logs.length;
      const completedDownloads = logs.filter(log => log.download_completed).length;
      const failedDownloads = totalDownloads - completedDownloads;
      const totalBytes = logs.reduce((sum, log) => sum + (log.bytes_downloaded || 0), 0);
      const averageDuration = logs.filter(log => log.download_duration_seconds)
        .reduce((sum, log, _, arr) => sum + (log.download_duration_seconds || 0) / arr.length, 0);

      // Last 7 days activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentDownloads = logs.filter(log => new Date(log.created_at) > sevenDaysAgo).length;

      return {
        totalDownloads,
        completedDownloads,
        failedDownloads,
        completionRate: totalDownloads > 0 ? (completedDownloads / totalDownloads) * 100 : 0,
        totalBytesGB: totalBytes / (1024 * 1024 * 1024),
        averageDurationSeconds: averageDuration,
        recentDownloads,
        logs,
      };
    },
    enabled: !!productId,
  });
}

/**
 * Create a secure download link (generates token + returns full URL)
 */
export function useCreateSecureDownloadLink() {
  const { mutateAsync: generateToken } = useGenerateDownloadToken();

  return useMutation({
    mutationFn: async (input: GenerateTokenInput) => {
      const token = await generateToken(input);
      
      // Construct the download URL
      const baseUrl = window.location.origin;
      const downloadUrl = `${baseUrl}/download/${token}`;
      
      return {
        token,
        downloadUrl,
        expiresAt: new Date(Date.now() + (input.expires_hours || 1) * 60 * 60 * 1000).toISOString(),
      };
    },
  });
}

