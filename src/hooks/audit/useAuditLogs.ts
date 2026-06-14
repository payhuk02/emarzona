/**
 * Epic 4.4 — Hooks export audit logs SOC2
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UnifiedAuditLog = {
  id: string;
  log_source: string;
  store_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AuditQueryFilters = {
  storeId?: string | null;
  from?: string | null;
  to?: string | null;
  actionPrefix?: string | null;
  logSource?: string | null;
  limit?: number;
  offset?: number;
};

export function useUnifiedAuditLogs(filters: AuditQueryFilters, enabled = true) {
  return useQuery({
    queryKey: ['unified-audit-logs', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('query_unified_audit_logs', {
        p_store_id: filters.storeId ?? null,
        p_from: filters.from ?? null,
        p_to: filters.to ?? null,
        p_action_prefix: filters.actionPrefix ?? null,
        p_log_source: filters.logSource ?? null,
        p_limit: filters.limit ?? 100,
        p_offset: filters.offset ?? 0,
      });
      if (error) throw error;
      return (data as UnifiedAuditLog[]) ?? [];
    },
    enabled,
  });
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async (
      filters: AuditQueryFilters & { format?: 'json' | 'csv'; maxRows?: number }
    ) => {
      const { data, error } = await supabase.rpc('export_unified_audit_logs', {
        p_store_id: filters.storeId ?? null,
        p_from: filters.from ?? null,
        p_to: filters.to ?? null,
        p_action_prefix: filters.actionPrefix ?? null,
        p_log_source: filters.logSource ?? null,
        p_format: filters.format ?? 'json',
        p_max_rows: filters.maxRows ?? 10000,
      });
      if (error) throw error;
      return data as {
        format: string;
        row_count: number;
        exported_at: string;
        rows: UnifiedAuditLog[];
      };
    },
  });
}

export function auditLogsToCsv(rows: UnifiedAuditLog[]): string {
  const header = [
    'created_at',
    'log_source',
    'action',
    'actor_email',
    'actor_id',
    'store_id',
    'target_type',
    'target_id',
    'ip_address',
    'metadata',
  ];
  const lines = rows.map(r =>
    [
      r.created_at,
      r.log_source,
      r.action,
      r.actor_email ?? '',
      r.actor_id ?? '',
      r.store_id ?? '',
      r.target_type ?? '',
      r.target_id ?? '',
      r.ip_address ?? '',
      JSON.stringify(r.metadata ?? {}),
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}

export function downloadAuditExport(
  rows: UnifiedAuditLog[],
  format: 'json' | 'csv',
  prefix = 'audit_export'
): void {
  const blob =
    format === 'csv'
      ? new Blob([auditLogsToCsv(rows)], { type: 'text/csv;charset=utf-8;' })
      : new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${prefix}_${Date.now()}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
