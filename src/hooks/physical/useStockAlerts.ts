import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType =
  | 'low_stock'
  | 'out_of_stock'
  | 'overstock'
  | 'expiring_soon'
  | 'damaged'
  | 'threshold_reached';

export interface StockAlert {
  id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  variant_id?: string;
  variant_label?: string;
  sku?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  current_quantity: number;
  threshold_quantity?: number;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  warning: number;
  info: number;
  by_type: Record<AlertType, number>;
}

export interface CreateAlertInput {
  store_id: string;
  product_id: string;
  product_name: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  current_quantity: number;
  threshold_quantity?: number;
  message: string;
  variant_id?: string;
}

// ============================================================================
// FETCH ALERTS
// ============================================================================

export function useStockAlerts(storeId: string, filters?: {
  severity?: AlertSeverity;
  alert_type?: AlertType;
  is_read?: boolean;
  is_resolved?: boolean;
}) {
  return useQuery({
    queryKey: ['stock-alerts', storeId, filters],
    queryFn: async () => {
      let query = supabase
        .from('stock_alerts')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.alert_type) {
        query = query.eq('alert_type', filters.alert_type);
      }
      if (filters?.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read);
      }
      if (filters?.is_resolved !== undefined) {
        query = query.eq('is_resolved', filters.is_resolved);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as StockAlert[];
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// GET ALERT STATS
// ============================================================================

export function useAlertStats(storeId: string) {
  return useQuery({
    queryKey: ['alert-stats', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_resolved', false);

      if (error) throw error;

      const alerts = (data || []) as StockAlert[];

      const stats: AlertStats = {
        total: alerts.length,
        unread: alerts.filter((a) => !a.is_read).length,
        critical: alerts.filter((a) => a.severity === 'critical').length,
        warning: alerts.filter((a) => a.severity === 'warning').length,
        info: alerts.filter((a) => a.severity === 'info').length,
        by_type: {
          low_stock: alerts.filter((a) => a.alert_type === 'low_stock').length,
          out_of_stock: alerts.filter((a) => a.alert_type === 'out_of_stock').length,
          overstock: alerts.filter((a) => a.alert_type === 'overstock').length,
          expiring_soon: alerts.filter((a) => a.alert_type === 'expiring_soon').length,
          damaged: alerts.filter((a) => a.alert_type === 'damaged').length,
          threshold_reached: alerts.filter((a) => a.alert_type === 'threshold_reached').length,
        },
      };

      return stats;
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// CREATE ALERT
// ============================================================================

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAlertInput) => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .insert([
          {
            ...input,
            is_read: false,
            is_resolved: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as StockAlert;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

// ============================================================================
// MARK AS READ
// ============================================================================

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

// ============================================================================
// MARK MULTIPLE AS READ
// ============================================================================

export function useMarkMultipleAlertsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertIds: string[]) => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .in('id', alertIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

// ============================================================================
// RESOLVE ALERT
// ============================================================================

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alertId,
      userId,
    }: {
      alertId: string;
      userId?: string;
    }) => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .update({
          is_resolved: true,
          is_read: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

// ============================================================================
// RESOLVE MULTIPLE ALERTS
// ============================================================================

export function useResolveMultipleAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alertIds,
      userId,
    }: {
      alertIds: string[];
      userId?: string;
    }) => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .update({
          is_resolved: true,
          is_read: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
          updated_at: new Date().toISOString(),
        })
        .in('id', alertIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

// ============================================================================
// DELETE ALERT
// ============================================================================

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.from('stock_alerts').delete().eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

// ============================================================================
// AUTO-GENERATE ALERTS FOR PRODUCTS
// ============================================================================

export function useGenerateProductAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeId: string) => {
      // Fetch all products with stock tracking
      const { data: products, error: productsError } = await supabase
        .from('physical_products')
        .select('*')
        .eq('store_id', storeId)
        .eq('track_inventory', true);

      if (productsError) throw productsError;

      const alerts: CreateAlertInput[] = [];

      for (const product of products || []) {
        const qty = product.total_quantity || 0;
        const threshold = product.low_stock_threshold || 10;

        // Out of stock
        if (qty === 0) {
          alerts.push({
            store_id: storeId,
            product_id: product.id,
            product_name: product.name,
            alert_type: 'out_of_stock',
            severity: 'critical',
            current_quantity: 0,
            threshold_quantity: threshold,
            message: `${product.name} est en rupture de stock`,
          });
        }
        // Low stock
        else if (qty > 0 && qty <= threshold) {
          alerts.push({
            store_id: storeId,
            product_id: product.id,
            product_name: product.name,
            alert_type: 'low_stock',
            severity: 'warning',
            current_quantity: qty,
            threshold_quantity: threshold,
            message: `${product.name} a un stock faible (${qty} unités restantes)`,
          });
        }
      }

      // Insert alerts (only if they don't already exist for unresolved)
      if (alerts.length > 0) {
        const { data, error } = await supabase
          .from('stock_alerts')
          .insert(
            alerts.map((a) => ({
              ...a,
              is_read: false,
              is_resolved: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
          )
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

