/**
 * Web analytics metrics (pageViews, bounce, session duration) from analytics_events / user_sessions.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  isRpcUnavailableError,
  logRpcFallback,
  type SupabaseRpcError,
} from '@/lib/dashboard/rpc-error-utils';
import type { DashboardPeriodRange } from '@/lib/dashboard/fetch-dashboard-stats-rpc';

export interface DashboardWebMetrics {
  pageViews: number;
  previousPeriodPageViews: number;
  bounceRate: number;
  sessionDuration: number;
}

export const ZERO_WEB_METRICS: DashboardWebMetrics = {
  pageViews: 0,
  previousPeriodPageViews: 0,
  bounceRate: 0,
  sessionDuration: 0,
};

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parseWebMetricsPayload(raw: unknown): DashboardWebMetrics {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    pageViews: num(o.pageViews),
    previousPeriodPageViews: num(o.previousPeriodPageViews),
    bounceRate: num(o.bounceRate),
    sessionDuration: num(o.sessionDuration),
  };
}

function compareStartForRange(range: DashboardPeriodRange): Date {
  const compare = new Date(range.start);
  compare.setDate(compare.getDate() - range.days);
  return compare;
}

export async function fetchWebMetricsFromRpc(
  storeId: string,
  range: DashboardPeriodRange
): Promise<DashboardWebMetrics> {
  const compareStart = compareStartForRange(range);
  const { data, error } = await supabase.rpc('get_store_web_metrics', {
    p_store_id: storeId,
    p_period_start: range.start.toISOString(),
    p_period_end: range.end.toISOString(),
    p_compare_start: compareStart.toISOString(),
  });

  if (error) {
    if (isRpcUnavailableError(error as SupabaseRpcError)) {
      logRpcFallback('get_store_web_metrics', error, { storeId });
      return fetchWebMetricsFromTables(storeId, range);
    }
    throw error;
  }

  return parseWebMetricsPayload(data);
}

type AnalyticsEventRow = {
  event_type: string;
  session_id: string | null;
  duration: number | null;
  created_at: string;
};

type UserSessionRow = {
  page_views: number | null;
  clicks: number | null;
  duration: number | null;
  start_time: string;
};

/** Client fallback when RPC web metrics are not deployed yet. */
export async function fetchWebMetricsFromTables(
  storeId: string,
  range: DashboardPeriodRange
): Promise<DashboardWebMetrics> {
  const compareStart = compareStartForRange(range);

  const [currentRes, previousRes, sessionsRes] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('event_type, session_id, duration, created_at')
      .eq('store_id', storeId)
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString()),
    supabase
      .from('analytics_events')
      .select('event_type, created_at')
      .eq('store_id', storeId)
      .eq('event_type', 'view')
      .gte('created_at', compareStart.toISOString())
      .lt('created_at', range.start.toISOString()),
    supabase
      .from('user_sessions')
      .select('page_views, clicks, duration, start_time')
      .eq('store_id', storeId)
      .gte('start_time', range.start.toISOString())
      .lte('start_time', range.end.toISOString()),
  ]);

  if (currentRes.error) {
    logger.warn('[Dashboard] analytics_events fallback failed', {
      error: currentRes.error.message,
    });
    return ZERO_WEB_METRICS;
  }

  const events = (currentRes.data ?? []) as AnalyticsEventRow[];
  const pageViews = events.filter(e => e.event_type === 'view').length;
  const previousPeriodPageViews = previousRes.error
    ? 0
    : ((previousRes.data ?? []) as { event_type: string }[]).length;

  const sessions = (sessionsRes.data ?? []) as UserSessionRow[];
  let bounceRate = 0;
  let sessionDuration = 0;

  if (sessions.length > 0) {
    const bounces = sessions.filter(s => (s.page_views ?? 0) <= 1 && (s.clicks ?? 0) === 0).length;
    bounceRate = Math.round((bounces / sessions.length) * 10000) / 100;
    const durations = sessions.map(s => s.duration ?? 0).filter(d => d > 0);
    sessionDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
  } else if (pageViews > 0) {
    const bySession = new Map<
      string,
      { views: number; interactions: number; endDuration: number }
    >();
    events.forEach(e => {
      if (!e.session_id) return;
      const row = bySession.get(e.session_id) ?? { views: 0, interactions: 0, endDuration: 0 };
      if (e.event_type === 'view') row.views += 1;
      if (e.event_type === 'click' || e.event_type === 'conversion') row.interactions += 1;
      if (e.event_type === 'session_end' && e.duration) row.endDuration = e.duration;
      bySession.set(e.session_id, row);
    });
    const rows = [...bySession.values()];
    if (rows.length > 0) {
      const bounces = rows.filter(r => r.views <= 1 && r.interactions === 0).length;
      bounceRate = Math.round((bounces / rows.length) * 10000) / 100;
      sessionDuration = Math.round(rows.reduce((sum, r) => sum + r.endDuration, 0) / rows.length);
    }
  }

  return { pageViews, previousPeriodPageViews, bounceRate, sessionDuration };
}

/** Period-scoped web metrics for unified analytics page. */
export async function fetchWebMetricsForPeriod(
  storeId: string,
  start: Date,
  end: Date = new Date()
): Promise<DashboardWebMetrics> {
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  return fetchWebMetricsFromTables(storeId, {
    start,
    end,
    days,
    label: `${days} derniers jours`,
  });
}

export function calcPageViewGrowth(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
