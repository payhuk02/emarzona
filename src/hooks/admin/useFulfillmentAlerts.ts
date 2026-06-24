import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FulfillmentAlertSeverity = 'info' | 'warning' | 'critical';

export interface FulfillmentAlertRow {
  id: string;
  order_id: string;
  issue_type: string;
  severity: FulfillmentAlertSeverity;
  detail: Record<string, unknown> | null;
  resolved_at: string | null;
  created_at: string;
  order?: {
    id: string;
    order_number: string | null;
    store_id: string | null;
    payment_status: string | null;
    total_amount: number | null;
    currency: string | null;
    updated_at: string | null;
  } | null;
}

export interface StaleFulfillmentScan {
  stale_minutes: number;
  stale_count: number;
  orders: Array<{
    order_id: string;
    order_number?: string;
    store_id?: string;
    paid_at?: string;
    issues: string[];
  }>;
  checked_at?: string;
}

const ALERTS_QUERY_KEY = ['admin-fulfillment-alerts'] as const;
const SCAN_QUERY_KEY = ['admin-fulfillment-sla-scan'] as const;

export function useFulfillmentAlerts(options?: { includeResolved?: boolean; limit?: number }) {
  const includeResolved = options?.includeResolved ?? false;
  const limit = options?.limit ?? 200;

  return useQuery({
    queryKey: [...ALERTS_QUERY_KEY, includeResolved, limit],
    queryFn: async (): Promise<FulfillmentAlertRow[]> => {
      let query = supabase
        .from('order_fulfillment_alerts')
        .select(
          `
          id,
          order_id,
          issue_type,
          severity,
          detail,
          resolved_at,
          created_at,
          order:orders (
            id,
            order_number,
            store_id,
            payment_status,
            total_amount,
            currency,
            updated_at
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!includeResolved) {
        query = query.is('resolved_at', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []) as FulfillmentAlertRow[];
    },
    refetchInterval: 60_000,
  });
}

export function useFulfillmentSlaScan(staleMinutes = 5, enabled = true) {
  return useQuery({
    queryKey: [...SCAN_QUERY_KEY, staleMinutes],
    queryFn: async (): Promise<StaleFulfillmentScan> => {
      const { data, error } = await supabase.rpc('admin_detect_stale_order_fulfillment', {
        p_stale_minutes: staleMinutes,
      });

      if (error) throw error;
      return (data ?? { stale_count: 0, orders: [] }) as StaleFulfillmentScan;
    },
    enabled,
    refetchInterval: 60_000,
  });
}

export function useResolveFulfillmentAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('order_fulfillment_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ALERTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SCAN_QUERY_KEY });
    },
  });
}

export function useFulfillmentAlertStats(alerts: FulfillmentAlertRow[] | undefined) {
  const open = alerts?.filter(a => !a.resolved_at) ?? [];
  return {
    openTotal: open.length,
    openCritical: open.filter(a => a.severity === 'critical').length,
    openWarning: open.filter(a => a.severity === 'warning').length,
    openInfo: open.filter(a => a.severity === 'info').length,
  };
}

export interface FulfillmentMonitorSweepResult {
  stale_minutes: number;
  stale_count: number;
  alerts_recorded: number;
  auto_resolved: { resolved_count?: number; stale_order_count?: number } | null;
  sla_status: string;
  checked_at?: string;
}

export function useRunFulfillmentMonitorSweep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staleMinutes = 5): Promise<FulfillmentMonitorSweepResult> => {
      const { data, error } = await supabase.rpc('admin_run_fulfillment_monitor_sweep', {
        p_stale_minutes: staleMinutes,
      });

      if (error) throw error;
      return (data ?? {}) as FulfillmentMonitorSweepResult;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ALERTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SCAN_QUERY_KEY });
    },
  });
}
