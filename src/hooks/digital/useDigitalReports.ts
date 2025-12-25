import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Période de rapport
 */
export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

/**
 * Rapport de ventes
 */
export interface SalesReport {
  period: ReportPeriod;
  totalRevenue: number;
  totalOrders: number;
  totalDownloads: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
    downloads: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

/**
 * Rapport de téléchargements
 */
export interface DownloadsReport {
  period: ReportPeriod;
  totalDownloads: number;
  uniqueCustomers: number;
  averageDownloadsPerCustomer: number;
  topProducts: Array<{
    id: string;
    name: string;
    downloads: number;
    uniqueCustomers: number;
  }>;
  downloadsByDay: Array<{
    date: string;
    downloads: number;
    customers: number;
  }>;
  downloadsByLocation: Array<{
    location: string;
    downloads: number;
  }>;
}

/**
 * Rapport de licences
 */
export interface LicensesReport {
  period: ReportPeriod;
  totalLicensesIssued: number;
  activeLicenses: number;
  revokedLicenses: number;
  expiredLicenses: number;
  utilizationRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    issued: number;
    active: number;
    utilization: number;
  }>;
}

/**
 * Rapport de clients
 */
export interface CustomersReport {
  period: ReportPeriod;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  averageSpending: number;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    totalPurchases: number;
    lastPurchaseDate: string;
  }>;
  customersByCountry: Array<{
    country: string;
    customers: number;
  }>;
}

/**
 * Obtenir les dates de début et fin pour une période
 */
const getPeriodDates = (period: ReportPeriod) => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = new Date(0); // Début de l'époque Unix
      break;
  }

  return { startDate, endDate: new Date() };
};

/**
 * useSalesReport - Hook pour le rapport de ventes
 */
export const useSalesReport = (period: ReportPeriod = 'month') => {
  return useQuery({
    queryKey: ['salesReport', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { startDate, endDate } = getPeriodDates(period);

      // Récupérer les produits de l'utilisateur
      const { data: products, error: productsError } = await supabase
        .from('digital_products')
        .select('id')
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      const productIds = products.map((p) => p.id);
      if (productIds.length === 0) {
        return {
          period,
          totalRevenue: 0,
          totalOrders: 0,
          totalDownloads: 0,
          averageOrderValue: 0,
          topProducts: [],
          revenueByDay: [],
        };
      }

      // Récupérer les ventes
      const { data: sales, error: salesError } = await supabase
        .from('customer_downloads')
        .select('product_id, amount_paid, purchase_date, download_count')
        .in('product_id', productIds)
        .gte('purchase_date', startDate.toISOString())
        .lte('purchase_date', endDate.toISOString());

      if (salesError) throw salesError;

      const totalRevenue = sales.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
      const totalOrders = sales.length;
      const totalDownloads = sales.reduce((sum, s) => sum + (s.download_count || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Top produits
      const productSales = new Map();
      sales.forEach((sale) => {
        const existing = productSales.get(sale.product_id) || {
          revenue: 0,
          orders: 0,
          downloads: 0,
        };
        productSales.set(sale.product_id, {
          revenue: existing.revenue + (sale.amount_paid || 0),
          orders: existing.orders + 1,
          downloads: existing.downloads + (sale.download_count || 0),
        });
      });

      // OPTIMIZED: Fetch all product names in one query (N+1 fix)
      const topProductIds = Array.from(productSales.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([productId]) => productId);

      const { data: topProducts } = topProductIds.length > 0
        ? await supabase
            .from('digital_products')
            .select('id, name')
            .in('id', topProductIds)
        : { data: [] };

      const productsMap = new Map(
        (topProducts || []).map((p: any) => [p.id, p.name])
      );

      const topProductsData = Array.from(productSales.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([productId, stats]) => ({
          id: productId,
          name: productsMap.get(productId) || 'Inconnu',
          ...stats,
        }));

      // Revenue par jour
      const revenueByDay: Array<{ date: string; revenue: number; orders: number }> = [];
      const dayGroups = new Map();

      sales.forEach((sale) => {
        const date = new Date(sale.purchase_date).toISOString().split('T')[0];
        const existing = dayGroups.get(date) || { revenue: 0, orders: 0 };
        dayGroups.set(date, {
          revenue: existing.revenue + (sale.amount_paid || 0),
          orders: existing.orders + 1,
        });
      });

      dayGroups.forEach((stats, date) => {
        revenueByDay.push({ date, ...stats });
      });

      revenueByDay.sort((a, b) => a.date.localeCompare(b.date));

      return {
        period,
        totalRevenue,
        totalOrders,
        totalDownloads,
        averageOrderValue,
        topProducts: topProductsData,
        revenueByDay,
      } as SalesReport;
    },
  });
};

/**
 * useDownloadsReport - Hook pour le rapport de téléchargements
 */
export const useDownloadsReport = (period: ReportPeriod = 'month') => {
  return useQuery({
    queryKey: ['downloadsReport', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { startDate, endDate } = getPeriodDates(period);

      // Récupérer les produits de l'utilisateur
      const { data: products, error: productsError } = await supabase
        .from('digital_products')
        .select('id')
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      const productIds = products.map((p) => p.id);
      if (productIds.length === 0) {
        return {
          period,
          totalDownloads: 0,
          uniqueCustomers: 0,
          averageDownloadsPerCustomer: 0,
          topProducts: [],
          downloadsByDay: [],
          downloadsByLocation: [],
        };
      }

      // Récupérer les logs de téléchargement
      const { data: logs, error: logsError } = await supabase
        .from('download_logs')
        .select('product_id, customer_id, created_at, location')
        .in('product_id', productIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (logsError) throw logsError;

      const totalDownloads = logs.length;
      const uniqueCustomers = new Set(logs.map((l) => l.customer_id)).size;
      const averageDownloadsPerCustomer =
        uniqueCustomers > 0 ? totalDownloads / uniqueCustomers : 0;

      // Top produits par téléchargements
      const productDownloads = new Map();
      logs.forEach((log) => {
        const existing = productDownloads.get(log.product_id) || {
          downloads: 0,
          customers: new Set(),
        };
        existing.downloads++;
        existing.customers.add(log.customer_id);
        productDownloads.set(log.product_id, existing);
      });

      // OPTIMIZED: Fetch all product names in one query (N+1 fix)
      const topProductIds = Array.from(productDownloads.entries())
        .sort((a, b) => b[1].downloads - a[1].downloads)
        .slice(0, 5)
        .map(([productId]) => productId);

      const { data: topProducts } = topProductIds.length > 0
        ? await supabase
            .from('digital_products')
            .select('id, name')
            .in('id', topProductIds)
        : { data: [] };

      const productsMap = new Map(
        (topProducts || []).map((p: any) => [p.id, p.name])
      );

      const topProductsData = Array.from(productDownloads.entries())
        .sort((a, b) => b[1].downloads - a[1].downloads)
        .slice(0, 5)
        .map(([productId, stats]) => ({
          id: productId,
          name: productsMap.get(productId) || 'Inconnu',
          downloads: stats.downloads,
          uniqueCustomers: stats.customers.size,
        }));

      // Téléchargements par jour
      const downloadsByDay: Array<{ date: string; downloads: number; customers: number }> = [];
      const dayGroups = new Map();

      logs.forEach((log) => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        const existing = dayGroups.get(date) || { downloads: 0, customers: new Set() };
        existing.downloads++;
        existing.customers.add(log.customer_id);
        dayGroups.set(date, existing);
      });

      dayGroups.forEach((stats, date) => {
        downloadsByDay.push({
          date,
          downloads: stats.downloads,
          customers: stats.customers.size,
        });
      });

      downloadsByDay.sort((a, b) => a.date.localeCompare(b.date));

      // Téléchargements par localisation
      const locationGroups = new Map();
      logs.forEach((log) => {
        if (log.location) {
          const count = locationGroups.get(log.location) || 0;
          locationGroups.set(log.location, count + 1);
        }
      });

      const downloadsByLocation = Array.from(locationGroups.entries())
        .map(([location, downloads]) => ({ location, downloads }))
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 10);

      return {
        period,
        totalDownloads,
        uniqueCustomers,
        averageDownloadsPerCustomer,
        topProducts: topProductsData,
        downloadsByDay,
        downloadsByLocation,
      } as DownloadsReport;
    },
  });
};

/**
 * useLicensesReport - Hook pour le rapport de licences
 */
export const useLicensesReport = (period: ReportPeriod = 'month') => {
  return useQuery({
    queryKey: ['licensesReport', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { startDate, endDate } = getPeriodDates(period);

      // Récupérer les produits de l'utilisateur
      const { data: products, error: productsError } = await supabase
        .from('digital_products')
        .select('id, max_licenses, current_licenses')
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      if (products.length === 0) {
        return {
          period,
          totalLicensesIssued: 0,
          activeLicenses: 0,
          revokedLicenses: 0,
          expiredLicenses: 0,
          utilizationRate: 0,
          topProducts: [],
        };
      }

      const productIds = products.map((p) => p.id);

      // Récupérer les licences
      const { data: licenses, error: licensesError } = await supabase
        .from('digital_product_licenses')
        .select('product_id, status, created_at')
        .in('product_id', productIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (licensesError) throw licensesError;

      const totalLicensesIssued = licenses.length;
      const activeLicenses = licenses.filter((l) => l.status === 'active').length;
      const revokedLicenses = licenses.filter((l) => l.status === 'revoked').length;
      const expiredLicenses = licenses.filter((l) => l.status === 'expired').length;

      const totalMaxLicenses = products.reduce((sum, p) => sum + (p.max_licenses || 0), 0);
      const totalCurrentLicenses = products.reduce((sum, p) => sum + (p.current_licenses || 0), 0);
      const utilizationRate =
        totalMaxLicenses > 0 ? (totalCurrentLicenses / totalMaxLicenses) * 100 : 0;

      // Top produits par licences
      const topProducts = products
        .map((p) => ({
          id: p.id,
          name: '', // À remplir
          issued: licenses.filter((l) => l.product_id === p.id).length,
          active: licenses.filter((l) => l.product_id === p.id && l.status === 'active').length,
          utilization:
            (p.max_licenses || 0) > 0
              ? ((p.current_licenses || 0) / (p.max_licenses || 1)) * 100
              : 0,
        }))
        .sort((a, b) => b.issued - a.issued)
        .slice(0, 5);

      // OPTIMIZED: Fetch all product names in one query (N+1 fix)
      const productIds = topProducts.map((p) => p.id);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('digital_products')
          .select('id, name')
          .in('id', productIds);

        const productsMap = new Map(
          (products || []).map((p: any) => [p.id, p.name])
        );

        topProducts.forEach((product) => {
          product.name = productsMap.get(product.id) || 'Inconnu';
        });
      }

      return {
        period,
        totalLicensesIssued,
        activeLicenses,
        revokedLicenses,
        expiredLicenses,
        utilizationRate,
        topProducts,
      } as LicensesReport;
    },
  });
};

/**
 * useCustomersReport - Hook pour le rapport clients
 */
export const useCustomersReport = (period: ReportPeriod = 'month') => {
  return useQuery({
    queryKey: ['customersReport', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { startDate, endDate } = getPeriodDates(period);

      // Récupérer les produits de l'utilisateur
      const { data: products, error: productsError } = await supabase
        .from('digital_products')
        .select('id')
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      const productIds = products.map((p) => p.id);
      if (productIds.length === 0) {
        return {
          period,
          totalCustomers: 0,
          newCustomers: 0,
          activeCustomers: 0,
          averageSpending: 0,
          topCustomers: [],
          customersByCountry: [],
        };
      }

      // Récupérer les achats
      const { data: purchases, error: purchasesError } = await supabase
        .from('customer_downloads')
        .select('customer_id, amount_paid, purchase_date')
        .in('product_id', productIds);

      if (purchasesError) throw purchasesError;

      const allCustomers = new Set(purchases.map((p) => p.customer_id));
      const totalCustomers = allCustomers.size;

      const newPurchases = purchases.filter(
        (p) =>
          new Date(p.purchase_date) >= startDate && new Date(p.purchase_date) <= endDate
      );
      const newCustomers = new Set(newPurchases.map((p) => p.customer_id)).size;

      const totalSpent = purchases.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
      const averageSpending = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

      // Top clients
      const customerSpending = new Map();
      purchases.forEach((p) => {
        const existing = customerSpending.get(p.customer_id) || {
          totalSpent: 0,
          totalPurchases: 0,
          lastPurchaseDate: p.purchase_date,
        };
        existing.totalSpent += p.amount_paid || 0;
        existing.totalPurchases++;
        if (new Date(p.purchase_date) > new Date(existing.lastPurchaseDate)) {
          existing.lastPurchaseDate = p.purchase_date;
        }
        customerSpending.set(p.customer_id, existing);
      });

      // OPTIMIZED: Fetch all customer names in one query (N+1 fix)
      const topCustomerIds = Array.from(customerSpending.entries())
        .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
        .slice(0, 10)
        .map(([customerId]) => customerId);

      const { data: topCustomers } = topCustomerIds.length > 0
        ? await supabase
            .from('customers')
            .select('id, name, email')
            .in('id', topCustomerIds)
        : { data: [] };

      const customersMap = new Map(
        (topCustomers || []).map((c: any) => [c.id, { name: c.name, email: c.email }])
      );

      const topCustomersData = Array.from(customerSpending.entries())
        .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
        .slice(0, 10)
        .map(([customerId, stats]) => {
          const customer = customersMap.get(customerId);

            return {
              id: customerId,
              name: customer?.name || 'Inconnu',
              email: customer?.email || '',
              ...stats,
            };
          })
      );

      return {
        period,
        totalCustomers,
        newCustomers,
        activeCustomers: newCustomers,
        averageSpending,
        topCustomers: topCustomersData,
        customersByCountry: [],
      } as CustomersReport;
    },
  });
};

