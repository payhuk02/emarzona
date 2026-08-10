/**
 * Hook pour récupérer les produits digitaux achetés par un client
 * Date: 2025-01-27
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  getBuyerOrderCustomerIds,
  resolveBuyerCustomerIds,
} from '@/lib/customer/resolve-buyer-customer-ids';

export interface PurchasedDigitalProduct {
  id: string;
  product_id: string;
  product_slug?: string;
  digital_product_id: string;
  order_id: string;
  order_number: string;
  order_date: string;
  purchase_amount: number;
  payment_status: string;
  license_id: string | null;
  license_key: string | null;
  license_status: string | null;
  product_name: string;
  product_image_url: string | null;
  product_description: string | null;
  store_name?: string;
  store_subdomain?: string;
  store_custom_domain?: string | null;
  digital_type: string;
  license_type: string;
  main_file_url: string;
  main_file_id: string | null;
  files?: Array<{ id: string; name: string; is_main: boolean; file_url?: string }>;
  download_count: number;
  download_limit: number;
  last_download_date: string | null;
  expiry_date: string | null;
  status: 'active' | 'expired' | 'suspended';
}

const PAID_ORDER_FIELDS = 'id, order_number, created_at, total_amount, payment_status';

type PaidOrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
};

type DigitalOrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  total_price: number;
  product?: {
    name: string;
    slug?: string;
    description: string | null;
    image_url: string | null;
    store?: {
      id: string;
      name: string;
      subdomain: string;
      custom_domain?: string | null;
    };
    digital_product?: {
      id: string;
      digital_type: string;
      license_type: string;
      main_file_url: string;
      download_limit: number | null;
      download_expiry_days: number | null;
    };
  };
};

/**
 * Récupère tous les produits digitaux achetés par le client connecté
 */
export const useCustomerPurchasedProducts = () => {
  return useQuery({
    queryKey: ['customerPurchasedDigitalProducts'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const customerIds = await resolveBuyerCustomerIds({
        userId: user.id,
        email: user.email,
      });

      const orderCustomerIds = getBuyerOrderCustomerIds(customerIds, user.id);
      if (orderCustomerIds.length === 0) {
        logger.warn('No customer ids resolved for buyer', { userId: user.id, email: user.email });
        return [];
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(PAID_ORDER_FIELDS)
        .in('customer_id', orderCustomerIds)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (ordersError) {
        logger.error('Error fetching paid orders for digital products', { error: ordersError });
        throw ordersError;
      }

      if (!orders || orders.length === 0) {
        return [];
      }

      const orderIds = orders.map(o => o.id);
      const ordersById = new Map((orders as PaidOrderRow[]).map(o => [o.id, o]));

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(
          `
          id,
          order_id,
            product_id,
            total_price,
          product:products (
              name,
              slug,
              description,
              image_url,
              store:stores (
                id,
                name,
                subdomain,
                custom_domain
              ),
              digital_product:digital_products (
                id,
                digital_type,
                license_type,
                main_file_url,
                download_limit,
                download_expiry_days
            )
          )
        `
        )
        .in('order_id', orderIds)
        .eq('product_type', 'digital');

      if (itemsError) {
        logger.error('Error fetching digital order items', { error: itemsError });
        throw itemsError;
      }

      const digitalItems = (orderItems ?? []).filter((item): item is DigitalOrderItemRow =>
        Boolean((item as DigitalOrderItemRow).product?.digital_product?.id)
      );

      if (digitalItems.length === 0) {
        return [];
      }

      const productIds = [
        ...new Set(
          digitalItems
            .map(item => item.product?.digital_product?.id)
            .filter((id): id is string => Boolean(id))
        ),
      ];

      const [{ data: licenses }, downloadsResult, filesResult] = await Promise.all([
        supabase
          .from('digital_licenses')
          .select('id, license_key, status, expires_at, order_id')
          .in('order_id', orderIds),
        productIds.length > 0
          ? supabase
              .from('digital_product_downloads')
              .select('digital_product_id, download_date, user_id')
              .in('digital_product_id', productIds)
              .eq('user_id', user.id)
              .order('download_date', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        productIds.length > 0
          ? supabase
              .from('digital_product_files')
              .select('id, digital_product_id, name, is_main, file_url, order_index')
              .in('digital_product_id', productIds)
              .order('is_main', { ascending: false })
              .order('order_index', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (downloadsResult.error) {
        logger.error('Error fetching digital download history', { error: downloadsResult.error });
        throw downloadsResult.error;
      }

      if (filesResult.error) {
        logger.error('Error fetching digital product files', { error: filesResult.error });
        throw filesResult.error;
      }

      const downloads = downloadsResult.data ?? [];
      const productFiles = filesResult.data ?? [];

      const purchasedProducts: PurchasedDigitalProduct[] = [];

      for (const item of digitalItems) {
        const order = ordersById.get(item.order_id);
        const digitalProduct = item.product?.digital_product;
        if (!order || !digitalProduct || !item.product) continue;

        const license = licenses?.find(l => l.order_id === order.id);
        const productDownloads =
          downloads.filter(d => d.digital_product_id === digitalProduct.id) || [];
        const filesRow = productFiles.filter(f => f.digital_product_id === digitalProduct.id) || [];
        const mainFileRow = filesRow.find(f => f.is_main) || filesRow[0];

        let expiryDate: string | null = null;
        if (digitalProduct.download_expiry_days && digitalProduct.download_expiry_days > 0) {
          const expiry = new Date(order.created_at);
          expiry.setDate(expiry.getDate() + digitalProduct.download_expiry_days);
          expiryDate = expiry.toISOString();
        } else if (license?.expires_at) {
          expiryDate = license.expires_at;
        }

        let status: 'active' | 'expired' | 'suspended' = 'active';
        if (expiryDate && new Date(expiryDate) < new Date()) {
          status = 'expired';
        } else if (license?.status === 'suspended' || license?.status === 'revoked') {
          status = 'suspended';
        }

        purchasedProducts.push({
          id: `${order.id}-${item.id}`,
          product_id: item.product_id,
          digital_product_id: digitalProduct.id,
          order_id: order.id,
          order_number: order.order_number,
          order_date: order.created_at,
          purchase_amount: item.total_price,
          payment_status: order.payment_status,
          license_id: license?.id || null,
          license_key: license?.license_key || null,
          license_status: license?.status || null,
          product_name: item.product.name,
          product_slug: item.product.slug,
          product_image_url: item.product.image_url,
          product_description: item.product.description,
          store_name: item.product.store?.name,
          store_subdomain: item.product.store?.subdomain,
          store_custom_domain: item.product.store?.custom_domain,
          digital_type: digitalProduct.digital_type,
          license_type: digitalProduct.license_type,
          main_file_url: digitalProduct.main_file_url,
          main_file_id: mainFileRow?.id ?? null,
          files: filesRow.map(f => ({
            id: f.id,
            name: f.name,
            is_main: f.is_main,
            file_url: f.file_url,
          })),
          download_count: productDownloads.length,
          download_limit: digitalProduct.download_limit || -1,
          last_download_date: productDownloads[0]?.download_date || null,
          expiry_date: expiryDate,
          status,
        });
      }

      return purchasedProducts;
    },
    enabled: true,
  });
};
