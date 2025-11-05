import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface InventoryReportData {
  // Overview
  total_products: number;
  total_variants: number;
  total_stock_value: number;
  total_quantity: number;
  avg_stock_per_product: number;

  // Stock Status
  in_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  overstock_count: number;

  // Top Products
  top_selling_products: {
    product_id: string;
    product_name: string;
    total_sold: number;
    revenue: number;
  }[];

  top_stock_value_products: {
    product_id: string;
    product_name: string;
    stock_quantity: number;
    stock_value: number;
  }[];

  // Low Stock Products
  low_stock_products: {
    product_id: string;
    product_name: string;
    variant_label?: string;
    sku?: string;
    current_quantity: number;
    threshold: number;
  }[];

  // Stock Movement Summary
  total_movements_in: number;
  total_movements_out: number;
  net_stock_change: number;

  // By Category (if applicable)
  by_category?: Record<
    string,
    {
      count: number;
      total_quantity: number;
      total_value: number;
    }
  >;
}

export interface StockValuationReport {
  total_value: number;
  total_cost: number;
  potential_profit: number;
  items: {
    product_id: string;
    product_name: string;
    sku?: string;
    quantity: number;
    unit_cost: number;
    unit_price: number;
    total_cost: number;
    total_value: number;
    potential_profit: number;
  }[];
}

export interface TurnoverReport {
  period_days: number;
  products: {
    product_id: string;
    product_name: string;
    sku?: string;
    avg_stock: number;
    total_sold: number;
    turnover_ratio: number; // sales / avg_stock
    turnover_days: number; // days to sell current stock
    status: 'fast' | 'normal' | 'slow' | 'dead';
  }[];
}

export interface LowStockForecast {
  products: {
    product_id: string;
    product_name: string;
    sku?: string;
    current_quantity: number;
    avg_daily_sales: number;
    estimated_days_remaining: number;
    estimated_stockout_date: string;
    recommended_order_quantity: number;
  }[];
}

// ============================================================================
// MAIN INVENTORY REPORT
// ============================================================================

export function useInventoryReport(storeId: string, dateRange?: {
  start: string;
  end: string;
}) {
  return useQuery({
    queryKey: ['inventory-report', storeId, dateRange],
    queryFn: async () => {
      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('physical_products')
        .select('*')
        .eq('store_id', storeId);

      if (productsError) throw productsError;

      // Mock data for now (replace with actual calculations from database)
      const report: InventoryReportData = {
        // Overview
        total_products: products?.length || 0,
        total_variants: 0, // TODO: Count from variants table
        total_stock_value: 0,
        total_quantity: (products || []).reduce(
          (sum, p) => sum + (p.total_quantity || 0),
          0
        ),
        avg_stock_per_product: 0,

        // Stock Status
        in_stock_count: (products || []).filter(
          (p) =>
            p.track_inventory &&
            p.total_quantity &&
            p.total_quantity > (p.low_stock_threshold || 10)
        ).length,
        low_stock_count: (products || []).filter(
          (p) =>
            p.track_inventory &&
            p.total_quantity &&
            p.total_quantity > 0 &&
            p.total_quantity <= (p.low_stock_threshold || 10)
        ).length,
        out_of_stock_count: (products || []).filter(
          (p) => p.track_inventory && (p.total_quantity === 0 || !p.total_quantity)
        ).length,
        overstock_count: 0, // TODO: Define overstock threshold

        // Top Products
        top_selling_products: [
          // TODO: Calculate from orders/sales
        ],
        top_stock_value_products: (products || [])
          .map((p) => ({
            product_id: p.id,
            product_name: p.name,
            stock_quantity: p.total_quantity || 0,
            stock_value: (p.total_quantity || 0) * p.price,
          }))
          .sort((a, b) => b.stock_value - a.stock_value)
          .slice(0, 10),

        // Low Stock Products
        low_stock_products: (products || [])
          .filter(
            (p) =>
              p.track_inventory &&
              p.total_quantity &&
              p.total_quantity > 0 &&
              p.total_quantity <= (p.low_stock_threshold || 10)
          )
          .map((p) => ({
            product_id: p.id,
            product_name: p.name,
            sku: p.sku,
            current_quantity: p.total_quantity || 0,
            threshold: p.low_stock_threshold || 10,
          }))
          .slice(0, 20),

        // Stock Movement Summary
        total_movements_in: 0, // TODO: Calculate from stock_movements
        total_movements_out: 0, // TODO: Calculate from stock_movements
        net_stock_change: 0,
      };

      // Calculate computed fields
      report.total_stock_value = report.top_stock_value_products.reduce(
        (sum, p) => sum + p.stock_value,
        0
      );
      report.avg_stock_per_product =
        report.total_products > 0 ? report.total_quantity / report.total_products : 0;

      return report;
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// STOCK VALUATION REPORT
// ============================================================================

export function useStockValuationReport(storeId: string) {
  return useQuery({
    queryKey: ['stock-valuation', storeId],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('physical_products')
        .select('*')
        .eq('store_id', storeId)
        .eq('track_inventory', true);

      if (error) throw error;

      const items: StockValuationReport['items'] = (products || []).map((p) => {
        const quantity = p.total_quantity || 0;
        const unit_cost = p.cost_price || 0;
        const unit_price = p.price || 0;
        const total_cost = quantity * unit_cost;
        const total_value = quantity * unit_price;
        const potential_profit = total_value - total_cost;

        return {
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          quantity,
          unit_cost,
          unit_price,
          total_cost,
          total_value,
          potential_profit,
        };
      });

      const report: StockValuationReport = {
        total_value: items.reduce((sum, i) => sum + i.total_value, 0),
        total_cost: items.reduce((sum, i) => sum + i.total_cost, 0),
        potential_profit: items.reduce((sum, i) => sum + i.potential_profit, 0),
        items: items.sort((a, b) => b.total_value - a.total_value),
      };

      return report;
    },
    enabled: !!storeId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// TURNOVER REPORT
// ============================================================================

export function useTurnoverReport(storeId: string, periodDays: number = 30) {
  return useQuery({
    queryKey: ['turnover-report', storeId, periodDays],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('physical_products')
        .select('*')
        .eq('store_id', storeId)
        .eq('track_inventory', true);

      if (error) throw error;

      // Fetch actual sales data from orders

      // Fetch order items for these products in the period
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - periodDays);
      
      const productIds = (products || []).map(p => p.id);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, created_at')
        .in('product_id', productIds.length > 0 ? productIds : [''])
        .eq('product_type', 'physical')
        .gte('created_at', periodStart.toISOString());

      // Group sales by product_id
      const salesMap = new Map<string, number>();
      (orderItems || []).forEach(item => {
        const existing = salesMap.get(item.product_id) || 0;
        salesMap.set(item.product_id, existing + (item.quantity || 0));
      });

      const reportProducts: TurnoverReport['products'] = (products || []).map((p) => {
        const avg_stock = p.total_quantity || 0;
        const total_sold = salesMap.get(p.id) || 0;
        const turnover_ratio = avg_stock > 0 ? total_sold / avg_stock : 0;
        const turnover_days = turnover_ratio > 0 ? periodDays / turnover_ratio : 0;

        let status: 'fast' | 'normal' | 'slow' | 'dead' = 'normal';
        if (turnover_ratio === 0) status = 'dead';
        else if (turnover_days < 7) status = 'fast';
        else if (turnover_days > 90) status = 'slow';

        return {
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          avg_stock,
          total_sold,
          turnover_ratio,
          turnover_days,
          status,
        };
      });

      const report: TurnoverReport = {
        period_days: periodDays,
        products: reportProducts.sort((a, b) => b.turnover_ratio - a.turnover_ratio),
      };

      return report;
    },
    enabled: !!storeId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ============================================================================
// LOW STOCK FORECAST
// ============================================================================

export function useLowStockForecast(storeId: string, forecastDays: number = 30) {
  return useQuery({
    queryKey: ['low-stock-forecast', storeId, forecastDays],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('physical_products')
        .select('*')
        .eq('store_id', storeId)
        .eq('track_inventory', true);

      if (error) throw error;

      // Fetch order items for sales calculation
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - forecastDays);
      
      const productIds = (products || []).map(p => p.id);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, created_at')
        .in('product_id', productIds.length > 0 ? productIds : [''])
        .eq('product_type', 'physical')
        .gte('created_at', periodStart.toISOString());

      // Group sales by product_id
      const salesMap = new Map<string, number>();
      (orderItems || []).forEach(item => {
        const existing = salesMap.get(item.product_id) || 0;
        salesMap.set(item.product_id, existing + (item.quantity || 0));
      });

      const forecastProducts: LowStockForecast['products'] = (products || [])
        .filter((p) => (p.total_quantity || 0) > 0)
        .map((p) => {
          const current_quantity = p.total_quantity || 0;
          const total_sold = salesMap.get(p.id) || 0;
          const avg_daily_sales = forecastDays > 0 ? total_sold / forecastDays : 0;
          const estimated_days_remaining =
            avg_daily_sales > 0 ? current_quantity / avg_daily_sales : 9999;
          const estimated_stockout_date = new Date(
            Date.now() + estimated_days_remaining * 24 * 60 * 60 * 1000
          ).toISOString();
          const recommended_order_quantity = Math.max(
            p.low_stock_threshold || 10,
            Math.ceil(avg_daily_sales * forecastDays)
          );

          return {
            product_id: p.id,
            product_name: p.name,
            sku: p.sku,
            current_quantity,
            avg_daily_sales,
            estimated_days_remaining,
            estimated_stockout_date,
            recommended_order_quantity,
          };
        })
        .filter((p) => p.estimated_days_remaining < forecastDays)
        .sort((a, b) => a.estimated_days_remaining - b.estimated_days_remaining);

      const report: LowStockForecast = {
        products: forecastProducts,
      };

      return report;
    },
    enabled: !!storeId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// ============================================================================
// EXPORT REPORT TO CSV
// ============================================================================

export function exportInventoryReportToCSV(report: InventoryReportData, filename?: string) {
  const rows: string[][] = [
    ['Rapport d\'Inventaire'],
    [],
    ['Vue d\'Ensemble'],
    ['Total Produits', report.total_products.toString()],
    ['Total Variantes', report.total_variants.toString()],
    ['Quantité Totale', report.total_quantity.toString()],
    ['Valeur Totale Stock', report.total_stock_value.toString()],
    ['Moyenne Stock/Produit', report.avg_stock_per_product.toFixed(2)],
    [],
    ['Statut des Stocks'],
    ['En Stock', report.in_stock_count.toString()],
    ['Stock Faible', report.low_stock_count.toString()],
    ['Rupture de Stock', report.out_of_stock_count.toString()],
    [],
    ['Produits Stock Faible'],
    ['Produit', 'SKU', 'Quantité Actuelle', 'Seuil'],
  ];

  report.low_stock_products.forEach((p) => {
    rows.push([
      p.product_name,
      p.sku || '',
      p.current_quantity.toString(),
      p.threshold.toString(),
    ]);
  });

  const csvContent = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `rapport_inventaire_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

