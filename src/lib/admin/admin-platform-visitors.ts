/**
 * Analytics visiteurs plateforme — RPC get_platform_visitor_analytics
 */

import { supabase } from '@/integrations/supabase/client';

export type VisitorBreakdownRow = {
  label: string;
  secondary?: string | null;
  sessions: number;
  pageViews?: number;
};

export type VisitorPageRow = {
  pagePath: string;
  views: number;
  sessions: number;
  avgDurationMs: number;
};

export type VisitorSessionRow = {
  sessionId: string;
  userId: string | null;
  country: string;
  region: string | null;
  deviceType: string;
  browser: string;
  os: string;
  pageViews: number;
  durationMs: number;
  landingPage: string | null;
  lastPage: string | null;
  startedAt: string;
  lastSeenAt: string;
};

export type VisitorDailyTrend = {
  date: string;
  sessions: number;
  pageViews: number;
};

export type PlatformVisitorAnalytics = {
  periodDays: number;
  totalPageViews: number;
  uniqueSessions: number;
  uniqueUsers: number;
  avgSessionDurationMs: number;
  bounceRate: number;
  byCountry: VisitorBreakdownRow[];
  byDevice: VisitorBreakdownRow[];
  byBrowser: VisitorBreakdownRow[];
  byOs: VisitorBreakdownRow[];
  topPages: VisitorPageRow[];
  recentSessions: VisitorSessionRow[];
  dailyTrend: VisitorDailyTrend[];
};

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function formatDurationMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
}

export function mapPlatformVisitorAnalyticsPayload(payload: unknown): PlatformVisitorAnalytics {
  const raw = (payload ?? {}) as Record<string, unknown>;

  const byCountry = Array.isArray(raw.by_country)
    ? raw.by_country.map(row => {
        const item = row as Record<string, unknown>;
        return {
          label: asString(item.country, 'Inconnu'),
          secondary: item.region ? asString(item.region) : null,
          sessions: asNumber(item.sessions),
          pageViews: asNumber(item.page_views),
        };
      })
    : [];

  const byDevice = Array.isArray(raw.by_device)
    ? raw.by_device.map(row => {
        const item = row as Record<string, unknown>;
        return {
          label: asString(item.device_type, 'unknown'),
          sessions: asNumber(item.sessions),
          pageViews: asNumber(item.page_views),
        };
      })
    : [];

  const byBrowser = Array.isArray(raw.by_browser)
    ? raw.by_browser.map(row => {
        const item = row as Record<string, unknown>;
        return {
          label: asString(item.browser, 'Unknown'),
          sessions: asNumber(item.sessions),
        };
      })
    : [];

  const byOs = Array.isArray(raw.by_os)
    ? raw.by_os.map(row => {
        const item = row as Record<string, unknown>;
        return {
          label: asString(item.os, 'Unknown'),
          sessions: asNumber(item.sessions),
        };
      })
    : [];

  const topPages = Array.isArray(raw.top_pages)
    ? raw.top_pages.map(row => {
        const item = row as Record<string, unknown>;
        return {
          pagePath: asString(item.page_path, '/'),
          views: asNumber(item.views),
          sessions: asNumber(item.sessions),
          avgDurationMs: asNumber(item.avg_duration_ms),
        };
      })
    : [];

  const recentSessions = Array.isArray(raw.recent_sessions)
    ? raw.recent_sessions.map(row => {
        const item = row as Record<string, unknown>;
        return {
          sessionId: asString(item.session_id),
          userId: item.user_id ? asString(item.user_id) : null,
          country: asString(item.country, 'Inconnu'),
          region: item.region ? asString(item.region) : null,
          deviceType: asString(item.device_type, 'unknown'),
          browser: asString(item.browser, 'Unknown'),
          os: asString(item.os, 'Unknown'),
          pageViews: asNumber(item.page_views),
          durationMs: asNumber(item.duration_ms),
          landingPage: item.landing_page ? asString(item.landing_page) : null,
          lastPage: item.last_page ? asString(item.last_page) : null,
          startedAt: asString(item.started_at),
          lastSeenAt: asString(item.last_seen_at),
        };
      })
    : [];

  const dailyTrend = Array.isArray(raw.daily_trend)
    ? raw.daily_trend.map(row => {
        const item = row as Record<string, unknown>;
        return {
          date: asString(item.date),
          sessions: asNumber(item.sessions),
          pageViews: asNumber(item.page_views),
        };
      })
    : [];

  return {
    periodDays: asNumber(raw.period_days, 30),
    totalPageViews: asNumber(raw.total_page_views),
    uniqueSessions: asNumber(raw.unique_sessions),
    uniqueUsers: asNumber(raw.unique_users),
    avgSessionDurationMs: asNumber(raw.avg_session_duration_ms),
    bounceRate: asNumber(raw.bounce_rate),
    byCountry,
    byDevice,
    byBrowser,
    byOs,
    topPages,
    recentSessions,
    dailyTrend,
  };
}

export async function fetchPlatformVisitorAnalytics(
  periodDays = 30
): Promise<PlatformVisitorAnalytics> {
  const { data, error } = await supabase.rpc('get_platform_visitor_analytics', {
    p_period_days: periodDays,
  });

  if (error) throw error;
  return mapPlatformVisitorAnalyticsPayload(data);
}
