import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PlatformServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

export interface PlatformServiceCheck {
  service_key: string;
  service_label: string;
  status: PlatformServiceStatus;
  latency_ms: number | null;
  message: string | null;
  checked_at: string;
}

export interface PlatformIncident {
  id: string;
  title: string;
  severity: 'minor' | 'major' | 'critical';
  status: string;
  services: string[];
  started_at: string;
  resolved_at: string | null;
  updates: Array<{ at: string; message: string }>;
}

export interface PlatformStatusSummary {
  overall: PlatformServiceStatus;
  uptime_30d: number;
  services: PlatformServiceCheck[];
  incidents: PlatformIncident[];
  generated_at: string;
}

async function fetchPlatformStatus(): Promise<PlatformStatusSummary> {
  const { data, error } = await supabase.rpc('get_platform_status_summary');
  if (error) throw error;
  return (data ?? {
    overall: 'operational',
    uptime_30d: 99.9,
    services: [],
    incidents: [],
    generated_at: new Date().toISOString(),
  }) as PlatformStatusSummary;
}

export function usePlatformStatus(refetchIntervalMs = 60_000) {
  return useQuery({
    queryKey: ['platform-status-summary'],
    queryFn: fetchPlatformStatus,
    staleTime: 30_000,
    refetchInterval: refetchIntervalMs,
  });
}
