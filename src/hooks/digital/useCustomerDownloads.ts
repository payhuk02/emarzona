import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Téléchargement client
 */
export interface CustomerDownload {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productName: string;
  downloadCount: number;
  downloadLimit?: number;
  licenseKey?: string;
  status: 'pending' | 'active' | 'completed' | 'expired' | 'revoked' | 'suspended';
  purchaseDate: string;
  lastDownloadDate?: string;
  expiryDate?: string;
  ipAddress?: string;
  location?: string;
  amountPaid?: number;
}

/**
 * useCustomerDownloads - Hook pour lister tous les téléchargements clients
 */
export const useCustomerDownloads = () => {
  return useQuery({
    queryKey: ['customerDownloads'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer les produits de l'utilisateur
      const { data: products, error: productsError } = await supabase
        .from('digital_products')
        .select('id')
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      const productIds = products.map((p) => p.id);
      if (productIds.length === 0) return [];

      // Récupérer les téléchargements
      const { data, error } = await supabase
        .from('customer_downloads')
        .select(`
          *,
          customer:customers(name, email),
          product:digital_products(name)
        `)
        .in('product_id', productIds)
        .order('purchase_date', { ascending: false });

      if (error) throw error;

      return data.map((d: any) => ({
        id: d.id,
        customerId: d.customer_id,
        customerName: d.customer?.name || 'Inconnu',
        customerEmail: d.customer?.email || '',
        productId: d.product_id,
        productName: d.product?.name || 'Produit supprimé',
        downloadCount: d.download_count || 0,
        downloadLimit: d.download_limit,
        licenseKey: d.license_key,
        status: d.status,
        purchaseDate: d.purchase_date,
        lastDownloadDate: d.last_download_date,
        expiryDate: d.expiry_date,
        ipAddress: d.ip_address,
        location: d.location,
        amountPaid: d.amount_paid,
      })) as CustomerDownload[];
    },
  });
};

/**
 * useCustomerDownloadsByProduct - Hook pour filtrer par produit
 */
export const useCustomerDownloadsByProduct = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['customerDownloads', 'product', productId],
    queryFn: async () => {
      if (!productId) throw new Error('ID produit manquant');

      const { data, error } = await supabase
        .from('customer_downloads')
        .select(`
          *,
          customer:customers(name, email),
          product:digital_products(name)
        `)
        .eq('product_id', productId)
        .order('purchase_date', { ascending: false });

      if (error) throw error;

      return data.map((d: any) => ({
        id: d.id,
        customerId: d.customer_id,
        customerName: d.customer?.name || 'Inconnu',
        customerEmail: d.customer?.email || '',
        productId: d.product_id,
        productName: d.product?.name || 'Produit supprimé',
        downloadCount: d.download_count || 0,
        downloadLimit: d.download_limit,
        licenseKey: d.license_key,
        status: d.status,
        purchaseDate: d.purchase_date,
        lastDownloadDate: d.last_download_date,
        expiryDate: d.expiry_date,
        ipAddress: d.ip_address,
        location: d.location,
        amountPaid: d.amount_paid,
      })) as CustomerDownload[];
    },
    enabled: !!productId,
  });
};

/**
 * useCustomerDownloadsByCustomer - Hook pour filtrer par client
 */
export const useCustomerDownloadsByCustomer = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ['customerDownloads', 'customer', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('ID client manquant');

      const { data, error } = await supabase
        .from('customer_downloads')
        .select(`
          *,
          customer:customers(name, email),
          product:digital_products(name)
        `)
        .eq('customer_id', customerId)
        .order('purchase_date', { ascending: false });

      if (error) throw error;

      return data.map((d: any) => ({
        id: d.id,
        customerId: d.customer_id,
        customerName: d.customer?.name || 'Inconnu',
        customerEmail: d.customer?.email || '',
        productId: d.product_id,
        productName: d.product?.name || 'Produit supprimé',
        downloadCount: d.download_count || 0,
        downloadLimit: d.download_limit,
        licenseKey: d.license_key,
        status: d.status,
        purchaseDate: d.purchase_date,
        lastDownloadDate: d.last_download_date,
        expiryDate: d.expiry_date,
        ipAddress: d.ip_address,
        location: d.location,
        amountPaid: d.amount_paid,
      })) as CustomerDownload[];
    },
    enabled: !!customerId,
  });
};

/**
 * useRevokeDownloadAccess - Hook pour révoquer un accès de téléchargement
 */
export const useRevokeDownloadAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ downloadId, reason }: { downloadId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('customer_downloads')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', downloadId)
        .select()
        .single();

      if (error) throw error;

      // Créer un événement de révocation
      if (reason) {
        await supabase.from('download_events').insert({
          download_id: downloadId,
          type: 'license_revoked',
          message: reason,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDownloads'] });
    },
  });
};

/**
 * useRestoreDownloadAccess - Hook pour restaurer un accès
 */
export const useRestoreDownloadAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (downloadId: string) => {
      const { data, error } = await supabase
        .from('customer_downloads')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', downloadId)
        .select()
        .single();

      if (error) throw error;

      // Créer un événement de restauration
      await supabase.from('download_events').insert({
        download_id: downloadId,
        type: 'access_granted',
        message: 'Accès restauré',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDownloads'] });
    },
  });
};

/**
 * useUpdateDownloadLimit - Hook pour modifier la limite de téléchargements
 */
export const useUpdateDownloadLimit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ downloadId, newLimit }: { downloadId: string; newLimit: number }) => {
      const { data, error } = await supabase
        .from('customer_downloads')
        .update({
          download_limit: newLimit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', downloadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDownloads'] });
    },
  });
};

/**
 * useCustomerDownloadStats - Hook pour les statistiques des téléchargements clients
 */
export const useCustomerDownloadStats = () => {
  return useQuery({
    queryKey: ['customerDownloadStats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer les produits de l'utilisateur
      const { data: products, error: productsError } = await supabase
        .from('digital_products')
        .select('id')
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      const productIds = products.map((p) => p.id);
      if (productIds.length === 0) {
        return {
          totalCustomers: 0,
          activeDownloads: 0,
          revokedDownloads: 0,
          expiredDownloads: 0,
          totalRevenue: 0,
        };
      }

      // Récupérer les statistiques
      const { data: downloads, error } = await supabase
        .from('customer_downloads')
        .select('status, amount_paid')
        .in('product_id', productIds);

      if (error) throw error;

      const uniqueCustomers = new Set(downloads.map((d: any) => d.customer_id)).size;
      const activeDownloads = downloads.filter((d: any) => d.status === 'active').length;
      const revokedDownloads = downloads.filter((d: any) => d.status === 'revoked').length;
      const expiredDownloads = downloads.filter((d: any) => d.status === 'expired').length;
      const totalRevenue = downloads.reduce((sum: number, d: any) => sum + (d.amount_paid || 0), 0);

      return {
        totalCustomers: uniqueCustomers,
        activeDownloads,
        revokedDownloads,
        expiredDownloads,
        totalRevenue,
      };
    },
  });
};

/**
 * useDownloadEvents - Hook pour récupérer les événements de téléchargement
 */
export const useDownloadEvents = (downloadId: string | undefined) => {
  return useQuery({
    queryKey: ['downloadEvents', downloadId],
    queryFn: async () => {
      if (!downloadId) throw new Error('ID téléchargement manquant');

      const { data, error } = await supabase
        .from('download_events')
        .select('*')
        .eq('download_id', downloadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!downloadId,
  });
};

