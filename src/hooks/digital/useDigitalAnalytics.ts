/**
 * Digital Products Analytics Hooks
 * Date: 27 octobre 2025
 * 
 * Hooks pour analytics avancés des produits digitaux
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

// =====================================================
// TYPES
// =====================================================

export interface DigitalProductAnalytics {
  product_id: string;
  product_name: string;
  total_downloads: number;
  unique_downloaders: number;
  total_revenue: number;
  conversion_rate: number;
  average_download_size_mb: number;
  failed_downloads: number;
  success_rate: number;
  active_licenses: number;
  expired_licenses: number;
  bandwidth_used_gb: number;
}

export interface DownloadTrend {
  date: string;
  downloads: number;
  unique_users: number;
}

export interface TopFile {
  file_id: string;
  file_name: string;
  downloads: number;
  size_mb: number;
}

export interface UserDownloadStats {
  user_id: string;
  user_email: string;
  total_downloads: number;
  last_download: string;
  products_count: number;
}

// =====================================================
// ANALYTICS HOOKS
// =====================================================

/**
 * Get analytics for a specific digital product
 */
export const useDigitalProductAnalytics = (productId: string, dateRange: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['digital-product-analytics', productId, dateRange],
    queryFn: async () => {
      // Get product info
      const { data: product, error: productError } = await supabase
        .from('digital_products')
        .select(`
          *,
          product:products (
            id,
            name,
            price
          )
        `)
        .eq('product_id', productId)
        .single();

      if (productError) throw productError;

      // Get downloads stats
      const { data: downloads, error: downloadsError } = await supabase
        .from('digital_product_downloads')
        .select('*')
        .eq('digital_product_id', product.id)
        .gte('download_date', dateRange.from.toISOString())
        .lte('download_date', dateRange.to.toISOString());

      if (downloadsError) throw downloadsError;

      // Get licenses stats
      const { data: licenses, error: licensesError } = await supabase
        .from('digital_licenses')
        .select('*')
        .eq('digital_product_id', product.id);

      if (licensesError) throw licensesError;

      // Calculate analytics
      const totalDownloads = downloads.length;
      const successfulDownloads = downloads.filter(d => d.download_success).length;
      const uniqueDownloaders = new Set(downloads.map(d => d.user_id)).size;
      const failedDownloads = totalDownloads - successfulDownloads;
      const successRate = totalDownloads > 0 ? (successfulDownloads / totalDownloads) * 100 : 0;
      
      const activeLicenses = licenses.filter(l => l.status === 'active').length;
      const expiredLicenses = licenses.filter(l => l.status === 'expired').length;

      // Calculate bandwidth (sum of successful downloads * file size)
      const bandwidthMB = downloads
        .filter(d => d.download_success)
        .reduce((sum, d) => sum + (d.file_size_mb || 0), 0);
      const bandwidthGB = bandwidthMB / 1024;

      const analytics: DigitalProductAnalytics = {
        product_id: productId,
        product_name: product.product.name,
        total_downloads: totalDownloads,
        unique_downloaders: uniqueDownloaders,
        total_revenue: product.product.price * totalDownloads, // Simplified, should be from orders
        conversion_rate: (() => {
          // Calculate conversion rate (purchases / views)
          // This would require product_views table or tracking
          // For now, approximate from orders vs downloads
          const totalViews = downloads.length; // Using downloads as proxy for views
          const purchases = licenses.filter(l => l.status === 'active').length;
          return totalViews > 0 ? (purchases / totalViews) * 100 : 0;
        })(),
        average_download_size_mb: product.main_file_size_mb || 0,
        failed_downloads: failedDownloads,
        success_rate: successRate,
        active_licenses: activeLicenses,
        expired_licenses: expiredLicenses,
        bandwidth_used_gb: bandwidthGB,
      };

      return analytics;
    },
    enabled: !!productId,
  });
};

/**
 * Get download trends over time
 */
export const useDownloadTrends = (digitalProductId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['download-trends', digitalProductId, days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);

      const { data, error } = await supabase
        .from('digital_product_downloads')
        .select('download_date, user_id, download_success')
        .eq('digital_product_id', digitalProductId)
        .gte('download_date', startDate.toISOString())
        .order('download_date', { ascending: true });

      if (error) throw error;

      // Group by date
      const trends = new Map<string, DownloadTrend>();

      data.forEach((download) => {
        const date = startOfDay(new Date(download.download_date)).toISOString().split('T')[0];
        
        if (!trends.has(date)) {
          trends.set(date, {
            date,
            downloads: 0,
            unique_users: 0,
          });
        }

        const trend = trends.get(date)!;
        if (download.download_success) {
          trend.downloads += 1;
        }
      });

      // Calculate unique users per day
      data.forEach((download) => {
        const date = startOfDay(new Date(download.download_date)).toISOString().split('T')[0];
        const trend = trends.get(date);
        if (trend && download.download_success) {
          // Count unique users (simplified, should use Set)
          trend.unique_users = new Set(
            data
              .filter(d => startOfDay(new Date(d.download_date)).toISOString().split('T')[0] === date)
              .map(d => d.user_id)
          ).size;
        }
      });

      return Array.from(trends.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    enabled: !!digitalProductId,
  });
};

/**
 * Get top downloaded files for a product
 */
export const useTopDownloadedFiles = (digitalProductId: string, limit: number = 5) => {
  return useQuery({
    queryKey: ['top-files', digitalProductId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_product_downloads')
        .select(`
          file_id,
          digital_product_files (
            name,
            file_size_mb
          )
        `)
        .eq('digital_product_id', digitalProductId)
        .eq('download_success', true);

      if (error) throw error;

      // Count downloads per file
      const fileCounts = new Map<string, TopFile>();

      data.forEach((download) => {
        if (!download.file_id || !download.digital_product_files) return;

        if (!fileCounts.has(download.file_id)) {
          fileCounts.set(download.file_id, {
            file_id: download.file_id,
            file_name: download.digital_product_files.name,
            downloads: 0,
            size_mb: download.digital_product_files.file_size_mb || 0,
          });
        }

        const file = fileCounts.get(download.file_id)!;
        file.downloads += 1;
      });

      return Array.from(fileCounts.values())
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, limit);
    },
    enabled: !!digitalProductId,
  });
};

/**
 * Get user download statistics
 */
export const useUserDownloadStats = (digitalProductId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['user-download-stats', digitalProductId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_product_downloads')
        .select(`
          user_id,
          download_date,
          download_success
        `)
        .eq('digital_product_id', digitalProductId)
        .eq('download_success', true)
        .order('download_date', { ascending: false });

      if (error) throw error;

      // Group by user
      const userStats = new Map<string, UserDownloadStats>();

      for (const download of data) {
        if (!userStats.has(download.user_id)) {
          // Get user email
          const { data: userData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', download.user_id)
            .single();

          userStats.set(download.user_id, {
            user_id: download.user_id,
            user_email: userData?.email || 'Unknown',
            total_downloads: 0,
            last_download: download.download_date,
            products_count: 1,
          });
        }

        const stats = userStats.get(download.user_id)!;
        stats.total_downloads += 1;
        
        // Update last download if more recent
        if (new Date(download.download_date) > new Date(stats.last_download)) {
          stats.last_download = download.download_date;
        }
      }

      return Array.from(userStats.values())
        .sort((a, b) => b.total_downloads - a.total_downloads)
        .slice(0, limit);
    },
    enabled: !!digitalProductId,
  });
};

/**
 * Get license usage analytics
 */
export const useLicenseAnalytics = (digitalProductId: string) => {
  return useQuery({
    queryKey: ['license-analytics', digitalProductId],
    queryFn: async () => {
      const { data: licenses, error } = await supabase
        .from('digital_licenses')
        .select(`
          *,
          activations:digital_license_activations (
            id,
            is_active
          )
        `)
        .eq('digital_product_id', digitalProductId);

      if (error) throw error;

      const total = licenses.length;
      const active = licenses.filter(l => l.status === 'active').length;
      const expired = licenses.filter(l => l.status === 'expired').length;
      const suspended = licenses.filter(l => l.status === 'suspended').length;
      
      const totalActivations = licenses.reduce((sum, l) => 
        sum + (l.activations?.length || 0), 0
      );
      const activeActivations = licenses.reduce((sum, l) => 
        sum + (l.activations?.filter((a: any) => a.is_active).length || 0), 0
      );

      return {
        total_licenses: total,
        active_licenses: active,
        expired_licenses: expired,
        suspended_licenses: suspended,
        total_activations: totalActivations,
        active_activations: activeActivations,
        average_activations_per_license: total > 0 ? totalActivations / total : 0,
      };
    },
    enabled: !!digitalProductId,
  });
};

/**
 * Get revenue analytics for digital products
 */
export const useDigitalRevenueAnalytics = (storeId?: string, dateRange?: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['digital-revenue', storeId, dateRange],
    queryFn: async () => {
      // Get all digital products for this store
      const { data: products, error: productsError } = await supabase
        .from('digital_products')
        .select(`
          id,
          product_id,
          product:products (
            id,
            name,
            price,
            store_id
          )
        `)
        .eq('product.store_id', storeId || '');

      if (productsError) throw productsError;

      // Get orders for these products
      let query = supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          orders!inner (
            id,
            payment_status,
            created_at
          )
        `)
        .in('product_id', products.map(p => p.product_id))
        .eq('orders.payment_status', 'paid');

      if (dateRange) {
        query = query
          .gte('orders.created_at', dateRange.from.toISOString())
          .lte('orders.created_at', dateRange.to.toISOString());
      }

      const { data: orderItems, error: ordersError } = await query;

      if (ordersError) throw ordersError;

      const totalRevenue = orderItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      const totalOrders = new Set(orderItems.map(item => item.orders.id)).size;

      return {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_products_sold: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      };
    },
    enabled: !!storeId,
  });
};

