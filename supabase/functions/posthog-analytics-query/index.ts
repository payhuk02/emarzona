/**
 * posthog-analytics-query — HogQL whitelisted for vendor/admin dashboards.
 *
 * Secrets (Supabase Edge) :
 *   POSTHOG_PERSONAL_API_KEY  (phx_…)
 *   POSTHOG_PROJECT_ID        (numeric)
 *   POSTHOG_HOST              (optional, default https://us.i.posthog.com)
 *
 * Auth :
 *   - store_* reports : JWT user + propriétaire boutique
 *   - platform_visitors : JWT + is_platform_admin
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { requireAuthenticatedUser } from '../_shared/edge-auth-utils.ts';
import { verifyStoreAccess } from '../_shared/email-compliance-utils.ts';
import { authenticatePlatformAdminRequest } from '../_shared/admin-auth-utils.ts';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Report =
  | 'store_web_metrics'
  | 'store_funnel'
  | 'store_views'
  | 'platform_visitors'
  | 'physical_onboarding_funnel';

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function escapeSqlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

function assertUuid(id: string, label: string): string {
  if (!UUID_RE.test(id)) throw new Error(`${label} invalide`);
  return id;
}

function assertIsoDate(value: string, label: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`${label} invalide`);
  return d.toISOString().replace('T', ' ').replace('Z', '');
}

function getPostHogConfig(): { host: string; projectId: string; apiKey: string } | null {
  const apiKey = Deno.env.get('POSTHOG_PERSONAL_API_KEY')?.trim() ?? '';
  const projectId = Deno.env.get('POSTHOG_PROJECT_ID')?.trim() ?? '';
  if (!apiKey || !projectId) return null;
  const host = (Deno.env.get('POSTHOG_HOST') || 'https://us.i.posthog.com').replace(/\/$/, '');
  return { host, projectId, apiKey };
}

async function runHogQl(
  cfg: { host: string; projectId: string; apiKey: string },
  query: string
): Promise<unknown[][]> {
  const url = `${cfg.host}/api/projects/${cfg.projectId}/query/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: { kind: 'HogQLQuery', query },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog query HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { results?: unknown[][]; error?: string };
  if (json.error) throw new Error(json.error);
  return Array.isArray(json.results) ? json.results : [];
}

function storeFilter(storeId: string): string {
  return `toString(properties.store_id) = '${escapeSqlString(storeId)}'`;
}

async function reportStoreWebMetrics(
  cfg: { host: string; projectId: string; apiKey: string },
  storeId: string,
  periodStart: string,
  periodEnd: string,
  compareStart: string
) {
  const sid = assertUuid(storeId, 'storeId');
  const start = assertIsoDate(periodStart, 'periodStart');
  const end = assertIsoDate(periodEnd, 'periodEnd');
  const compare = assertIsoDate(compareStart, 'compareStart');
  const filter = storeFilter(sid);

  const currentQ = `
SELECT
  countIf(event IN ('product_viewed', 'store_viewed')) AS page_views,
  uniqExactIf(toString(properties.session_id), event IN ('product_viewed', 'store_viewed') AND properties.session_id IS NOT NULL) AS sessions,
  countIf(event IN ('product_clicked', 'purchase_completed')) AS interactions
FROM events
WHERE ${filter}
  AND timestamp >= toDateTime('${start}')
  AND timestamp <= toDateTime('${end}')
`;

  const previousQ = `
SELECT countIf(event IN ('product_viewed', 'store_viewed')) AS page_views
FROM events
WHERE ${filter}
  AND timestamp >= toDateTime('${compare}')
  AND timestamp < toDateTime('${start}')
`;

  const [currentRows, previousRows] = await Promise.all([
    runHogQl(cfg, currentQ),
    runHogQl(cfg, previousQ),
  ]);

  const pageViews = num(currentRows[0]?.[0]);
  const sessions = num(currentRows[0]?.[1]);
  const interactions = num(currentRows[0]?.[2]);
  const previousPeriodPageViews = num(previousRows[0]?.[0]);

  // Bounce approx: sessions with no click/conversion relative to page views
  let bounceRate = 0;
  if (sessions > 0 && pageViews > 0) {
    const engaged = Math.min(sessions, interactions);
    bounceRate = Math.round(((sessions - engaged) / sessions) * 10000) / 100;
    bounceRate = Math.max(0, Math.min(100, bounceRate));
  }

  return {
    pageViews,
    previousPeriodPageViews,
    bounceRate,
    sessionDuration: 0,
  };
}

async function reportStoreFunnel(
  cfg: { host: string; projectId: string; apiKey: string },
  storeId: string,
  periodStart: string,
  periodEnd: string
) {
  const sid = assertUuid(storeId, 'storeId');
  const start = assertIsoDate(periodStart, 'periodStart');
  const end = assertIsoDate(periodEnd, 'periodEnd');
  const filter = storeFilter(sid);

  const q = `
SELECT
  countIf(event = 'product_viewed') AS views,
  countIf(event = 'product_clicked') AS clicks,
  countIf(event = 'purchase_completed') AS conversions
FROM events
WHERE ${filter}
  AND timestamp >= toDateTime('${start}')
  AND timestamp <= toDateTime('${end}')
`;

  const rows = await runHogQl(cfg, q);
  return {
    views: num(rows[0]?.[0]),
    clicks: num(rows[0]?.[1]),
    conversions: num(rows[0]?.[2]),
  };
}

async function reportStoreViews(
  cfg: { host: string; projectId: string; apiKey: string },
  storeId: string,
  periodStart: string,
  periodEnd: string,
  compareStart: string
) {
  const sid = assertUuid(storeId, 'storeId');
  const start = assertIsoDate(periodStart, 'periodStart');
  const end = assertIsoDate(periodEnd, 'periodEnd');
  const compare = assertIsoDate(compareStart, 'compareStart');
  const filter = storeFilter(sid);

  const currentQ = `
SELECT count() FROM events
WHERE ${filter} AND event = 'store_viewed'
  AND timestamp >= toDateTime('${start}') AND timestamp <= toDateTime('${end}')
`;
  const previousQ = `
SELECT count() FROM events
WHERE ${filter} AND event = 'store_viewed'
  AND timestamp >= toDateTime('${compare}') AND timestamp < toDateTime('${start}')
`;
  const monthlyQ = `
SELECT formatDateTime(timestamp, '%Y-%m') AS month, count() AS views
FROM events
WHERE ${filter} AND event = 'store_viewed'
  AND timestamp >= now() - INTERVAL 12 MONTH
GROUP BY month
ORDER BY month ASC
`;

  const [currentRows, previousRows, monthlyRows] = await Promise.all([
    runHogQl(cfg, currentQ),
    runHogQl(cfg, previousQ),
    runHogQl(cfg, monthlyQ),
  ]);

  return {
    currentViews: num(currentRows[0]?.[0]),
    previousViews: num(previousRows[0]?.[0]),
    monthlyViews: monthlyRows.map(r => ({
      month: String(r[0] ?? ''),
      views: num(r[1]),
    })),
  };
}

async function reportPlatformVisitors(
  cfg: { host: string; projectId: string; apiKey: string },
  periodDays: number
) {
  const days = Math.min(365, Math.max(1, Math.floor(periodDays)));

  const summaryQ = `
SELECT
  countIf(event = 'app_page_viewed') AS total_page_views,
  uniqExactIf(properties.$session_id, event = 'app_page_viewed') AS unique_sessions,
  uniqExactIf(person_id, event = 'app_page_viewed') AS unique_users,
  avgIf(toFloat(properties.duration_ms), event = 'session_ended') AS avg_duration_ms
FROM events
WHERE event IN ('app_page_viewed', 'session_ended')
  AND timestamp >= now() - INTERVAL ${days} DAY
`;

  const byCountryQ = `
SELECT coalesce(nullIf(toString(properties.country), ''), 'Inconnu') AS country,
       count() AS page_views,
       uniqExact(properties.$session_id) AS sessions
FROM events
WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY country
ORDER BY sessions DESC
LIMIT 20
`;

  const byDeviceQ = `
SELECT coalesce(nullIf(toString(properties.device_type), ''), 'unknown') AS device_type,
       count() AS page_views,
       uniqExact(properties.$session_id) AS sessions
FROM events
WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY device_type
ORDER BY sessions DESC
LIMIT 10
`;

  const byBrowserQ = `
SELECT coalesce(nullIf(toString(properties.browser), ''), 'Unknown') AS browser,
       count() AS page_views,
       uniqExact(properties.$session_id) AS sessions
FROM events
WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY browser
ORDER BY sessions DESC
LIMIT 10
`;

  const byOsQ = `
SELECT coalesce(nullIf(toString(properties.os), ''), 'Unknown') AS os,
       count() AS page_views,
       uniqExact(properties.$session_id) AS sessions
FROM events
WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY os
ORDER BY sessions DESC
LIMIT 10
`;

  const topPagesQ = `
SELECT coalesce(nullIf(toString(properties.page_path), ''), '/') AS page_path,
       count() AS views,
       uniqExact(properties.$session_id) AS sessions,
       0 AS avg_duration_ms
FROM events
WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY page_path
ORDER BY views DESC
LIMIT 25
`;

  const dailyQ = `
SELECT toDate(timestamp) AS day,
       uniqExact(properties.$session_id) AS sessions,
       count() AS page_views
FROM events
WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY day
ORDER BY day ASC
`;

  const [summary, byCountry, byDevice, byBrowser, byOs, topPages, dailyTrend] = await Promise.all([
    runHogQl(cfg, summaryQ),
    runHogQl(cfg, byCountryQ),
    runHogQl(cfg, byDeviceQ),
    runHogQl(cfg, byBrowserQ),
    runHogQl(cfg, byOsQ),
    runHogQl(cfg, topPagesQ),
    runHogQl(cfg, dailyQ),
  ]);

  const totalPageViews = num(summary[0]?.[0]);
  const uniqueSessions = num(summary[0]?.[1]);
  const uniqueUsers = num(summary[0]?.[2]);
  const avgSessionDurationMs = Math.round(num(summary[0]?.[3]));

  return {
    period_days: days,
    total_page_views: totalPageViews,
    unique_sessions: uniqueSessions,
    unique_users: uniqueUsers,
    avg_session_duration_ms: avgSessionDurationMs,
    bounce_rate: 0,
    by_country: byCountry.map(r => ({
      country: String(r[0] ?? 'Inconnu'),
      page_views: num(r[1]),
      sessions: num(r[2]),
    })),
    by_device: byDevice.map(r => ({
      device_type: String(r[0] ?? 'unknown'),
      page_views: num(r[1]),
      sessions: num(r[2]),
    })),
    by_browser: byBrowser.map(r => ({
      browser: String(r[0] ?? 'Unknown'),
      page_views: num(r[1]),
      sessions: num(r[2]),
    })),
    by_os: byOs.map(r => ({
      os: String(r[0] ?? 'Unknown'),
      page_views: num(r[1]),
      sessions: num(r[2]),
    })),
    top_pages: topPages.map(r => ({
      page_path: String(r[0] ?? '/'),
      views: num(r[1]),
      sessions: num(r[2]),
      avg_duration_ms: num(r[3]),
    })),
    recent_sessions: [],
    daily_trend: dailyTrend.map(r => ({
      date: String(r[0] ?? ''),
      sessions: num(r[1]),
      page_views: num(r[2]),
    })),
  };
}

async function reportPhysicalOnboardingFunnel(
  cfg: { host: string; projectId: string; apiKey: string },
  periodDays: number
) {
  const days = Math.min(365, Math.max(1, Math.floor(periodDays)));
  const q = `
SELECT
  countIf(event = 'physical_onboarding_seen') AS onboarding_views,
  countIf(event = 'trial_continue_clicked') AS trial_clicks,
  countIf(event = 'billing_cta_clicked') AS billing_clicks
FROM events
WHERE event IN ('physical_onboarding_seen', 'trial_continue_clicked', 'billing_cta_clicked')
  AND timestamp >= now() - INTERVAL ${days} DAY
`;
  const rows = await runHogQl(cfg, q);
  return {
    onboardingViews: num(rows[0]?.[0]),
    trialClicks: num(rows[0]?.[1]),
    billingClicks: num(rows[0]?.[2]),
  };
}

serve(async req => {
  const cors = buildCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, cors);
  }

  const cfg = getPostHogConfig();
  if (!cfg) {
    return jsonResponse(
      { error: 'PostHog query non configuré (POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID)' },
      503,
      cors
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'JSON invalide' }, 400, cors);
  }

  const report = body.report as Report;
  if (!report) {
    return jsonResponse({ error: 'report requis' }, 400, cors);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';

  try {
    if (report === 'platform_visitors') {
      const adminClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const adminAuth = await authenticatePlatformAdminRequest(adminClient, req);
      if (!adminAuth.ok) {
        return jsonResponse({ error: adminAuth.error }, adminAuth.status, cors);
      }

      const periodDays = num(body.periodDays, 30);
      const payload = await reportPlatformVisitors(cfg, periodDays);
      return jsonResponse(payload, 200, cors);
    }

    if (report === 'physical_onboarding_funnel') {
      const adminClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const adminAuth = await authenticatePlatformAdminRequest(adminClient, req);
      if (!adminAuth.ok) {
        return jsonResponse({ error: adminAuth.error }, adminAuth.status, cors);
      }
      const periodDays = num(body.periodDays, 30);
      const payload = await reportPhysicalOnboardingFunnel(cfg, periodDays);
      return jsonResponse(payload, 200, cors);
    }

    const auth = await requireAuthenticatedUser(req, cors);
    if (auth instanceof Response) return auth;

    const storeId = typeof body.storeId === 'string' ? body.storeId : '';
    if (!storeId) {
      return jsonResponse({ error: 'storeId requis' }, 400, cors);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth.authHeader } },
    });
    const access = await verifyStoreAccess(userClient, auth.user.id, { storeId });
    if (!access.allowed) {
      return jsonResponse({ error: 'Accès boutique refusé' }, 403, cors);
    }

    if (report === 'store_web_metrics') {
      const payload = await reportStoreWebMetrics(
        cfg,
        storeId,
        String(body.periodStart ?? ''),
        String(body.periodEnd ?? ''),
        String(body.compareStart ?? '')
      );
      return jsonResponse(payload, 200, cors);
    }

    if (report === 'store_funnel') {
      const payload = await reportStoreFunnel(
        cfg,
        storeId,
        String(body.periodStart ?? ''),
        String(body.periodEnd ?? '')
      );
      return jsonResponse(payload, 200, cors);
    }

    if (report === 'store_views') {
      const payload = await reportStoreViews(
        cfg,
        storeId,
        String(body.periodStart ?? ''),
        String(body.periodEnd ?? ''),
        String(body.compareStart ?? '')
      );
      return jsonResponse(payload, 200, cors);
    }

    return jsonResponse({ error: 'report inconnu' }, 400, cors);
  } catch (error) {
    console.error('posthog-analytics-query failed', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Erreur PostHog query' },
      500,
      cors
    );
  }
});
