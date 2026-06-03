import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PAID_REVENUE_ELIGIBLE_STATUSES } from '@/lib/orders/order-status';

const DOWNLOAD_EVENT_FIELDS = 'id, download_id, type, message, created_at';

/**
 * Téléchargement client (vue vendeur — agrégée depuis digital_licenses)
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

type LicenseRow = {
  id: string;
  license_key: string | null;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  activated_at: string | null;
  created_at: string;
  digital_product_id: string;
  order_id: string | null;
  current_activations: number | null;
  max_activations: number | null;
  issued_at: string;
  expires_at: string | null;
  digital_products: {
    id: string;
    products: { id: string; name: string; store_id: string } | null;
  } | null;
  orders: {
    total_amount: number | null;
    payment_status: string | null;
    status: string | null;
    created_at: string;
  } | null;
};

function mapLicenseToCustomerDownload(d: LicenseRow): CustomerDownload {
  const product = d.digital_products?.products;
  return {
    id: d.id,
    customerId: '',
    customerName: d.customer_name || 'Inconnu',
    customerEmail: d.customer_email || '',
    productId: d.digital_product_id,
    productName: product?.name || 'Produit supprimé',
    downloadCount: d.current_activations ?? 0,
    downloadLimit: d.max_activations ?? undefined,
    licenseKey: d.license_key ?? undefined,
    status: (d.status as CustomerDownload['status']) || 'pending',
    purchaseDate: d.orders?.created_at || d.issued_at || d.created_at,
    lastDownloadDate: d.activated_at ?? undefined,
    expiryDate: d.expires_at ?? undefined,
    amountPaid: d.orders?.total_amount ?? undefined,
  };
}

async function fetchStoreDigitalProductIds(userId: string): Promise<string[]> {
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId);

  if (storesError) throw storesError;
  const storeIds = stores?.map(s => s.id) ?? [];
  if (storeIds.length === 0) return [];

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .in('store_id', storeIds)
    .eq('product_type', 'digital');

  if (productsError) throw productsError;
  const productIds = products?.map(p => p.id) ?? [];
  if (productIds.length === 0) return [];

  const { data: digitalRows, error: digitalError } = await supabase
    .from('digital_products')
    .select('id')
    .in('product_id', productIds);

  if (digitalError) throw digitalError;
  return digitalRows?.map(d => d.id) ?? [];
}

/**
 * useCustomerDownloads - Licences / téléchargements des produits digitaux du vendeur
 */
export const useCustomerDownloads = () => {
  return useQuery({
    queryKey: ['customerDownloads'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const digitalProductIds = await fetchStoreDigitalProductIds(user.id);
      if (digitalProductIds.length === 0) return [];

      const { data, error } = await supabase
        .from('digital_licenses')
        .select(
          `
          id,
          license_key,
          status,
          customer_email,
          customer_name,
          activated_at,
          created_at,
          digital_product_id,
          order_id,
          current_activations,
          max_activations,
          issued_at,
          expires_at,
          digital_products (
            id,
            products ( id, name, store_id )
          ),
          orders ( total_amount, payment_status, created_at, status )
        `
        )
        .in('digital_product_id', digitalProductIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as LicenseRow[])
        .filter(
          row =>
            !row.orders?.payment_status ||
            (row.orders.payment_status === 'paid' &&
              PAID_REVENUE_ELIGIBLE_STATUSES.includes(
                row.orders.status as (typeof PAID_REVENUE_ELIGIBLE_STATUSES)[number]
              ))
        )
        .map(mapLicenseToCustomerDownload);
    },
  });
};

/**
 * useCustomerDownloadsByProduct - digital_product_id
 */
export const useCustomerDownloadsByProduct = (digitalProductId: string | undefined) => {
  return useQuery({
    queryKey: ['customerDownloads', 'product', digitalProductId],
    queryFn: async () => {
      if (!digitalProductId) throw new Error('ID produit manquant');

      const { data, error } = await supabase
        .from('digital_licenses')
        .select(
          `
          id,
          license_key,
          status,
          customer_email,
          customer_name,
          activated_at,
          created_at,
          digital_product_id,
          order_id,
          current_activations,
          max_activations,
          issued_at,
          expires_at,
          digital_products (
            id,
            products ( id, name, store_id )
          ),
          orders ( total_amount, payment_status, created_at, status )
        `
        )
        .eq('digital_product_id', digitalProductId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as LicenseRow[]).map(mapLicenseToCustomerDownload);
    },
    enabled: !!digitalProductId,
  });
};

/**
 * useCustomerDownloadsByCustomer - email client
 */
export const useCustomerDownloadsByCustomer = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ['customerDownloads', 'customer', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('ID client manquant');

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, email')
        .eq('id', customerId)
        .single();

      if (customerError || !customer?.email) throw customerError ?? new Error('Client introuvable');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const digitalProductIds = await fetchStoreDigitalProductIds(user.id);
      if (digitalProductIds.length === 0) return [];

      const { data, error } = await supabase
        .from('digital_licenses')
        .select(
          `
          id,
          license_key,
          status,
          customer_email,
          customer_name,
          activated_at,
          created_at,
          digital_product_id,
          order_id,
          current_activations,
          max_activations,
          issued_at,
          expires_at,
          digital_products (
            id,
            products ( id, name, store_id )
          ),
          orders ( total_amount, payment_status, created_at, status )
        `
        )
        .in('digital_product_id', digitalProductIds)
        .eq('customer_email', customer.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as LicenseRow[]).map(mapLicenseToCustomerDownload);
    },
    enabled: !!customerId,
  });
};

/**
 * useRevokeDownloadAccess - Révoque une licence digitale
 */
export const useRevokeDownloadAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ downloadId, reason }: { downloadId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('digital_licenses')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', downloadId)
        .select()
        .single();

      if (reason) {
        await supabase.from('download_events').insert({
          download_id: downloadId,
          type: 'license_revoked',
          message: reason,
        });
      }

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDownloads'] });
    },
  });
};

/**
 * useRestoreDownloadAccess - Réactive une licence
 */
export const useRestoreDownloadAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (licenseId: string) => {
      const { data, error } = await supabase
        .from('digital_licenses')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', licenseId)
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
 * useUpdateDownloadLimit - Modifie max_downloads sur la licence
 */
export const useUpdateDownloadLimit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ downloadId, newLimit }: { downloadId: string; newLimit: number }) => {
      const { data, error } = await supabase
        .from('digital_licenses')
        .update({
          max_activations: newLimit,
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
 * useCustomerDownloadStats - Statistiques licences vendeur
 */
export const useCustomerDownloadStats = () => {
  return useQuery({
    queryKey: ['customerDownloadStats'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const digitalProductIds = await fetchStoreDigitalProductIds(user.id);
      if (digitalProductIds.length === 0) {
        return {
          totalCustomers: 0,
          activeDownloads: 0,
          revokedDownloads: 0,
          expiredDownloads: 0,
          totalRevenue: 0,
        };
      }

      const { data: licenses, error } = await supabase
        .from('digital_licenses')
        .select('status, customer_email, orders(total_amount, payment_status)')
        .in('digital_product_id', digitalProductIds);

      if (error) throw error;

      const rows = licenses ?? [];
      const uniqueCustomers = new Set(
        rows.map((d: { customer_email: string | null }) => d.customer_email).filter(Boolean)
      ).size;
      const activeDownloads = rows.filter((d: { status: string }) => d.status === 'active').length;
      const revokedDownloads = rows.filter(
        (d: { status: string }) => d.status === 'revoked'
      ).length;
      const expiredDownloads = rows.filter(
        (d: { status: string }) => d.status === 'expired'
      ).length;
      const totalRevenue = rows.reduce(
        (
          sum: number,
          d: { orders?: { total_amount?: number; payment_status?: string } | null }
        ) => {
          if (d.orders?.payment_status === 'paid') {
            return sum + Number(d.orders?.total_amount ?? 0);
          }
          return sum;
        },
        0
      );

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
 * useDownloadEvents - Événements liés à une licence (download_id = license id)
 */
export const useDownloadEvents = (downloadId: string | undefined) => {
  return useQuery({
    queryKey: ['downloadEvents', downloadId],
    queryFn: async () => {
      if (!downloadId) throw new Error('ID téléchargement manquant');

      const { data, error } = await supabase
        .from('download_events')
        .select(DOWNLOAD_EVENT_FIELDS)
        .eq('download_id', downloadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!downloadId,
  });
};

export { DOWNLOAD_EVENT_FIELDS };
