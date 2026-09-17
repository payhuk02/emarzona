/**
 * Handler HogQL PostHog pour dashboards.
 * Monté via /api/health?__route=posthog-analytics-query (rewrite vercel.json)
 * pour rester sous la limite Hobby de 12 serverless functions.
 *
 * Secrets Vercel (jamais VITE_*) :
 *   POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST
 *   VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (ou SUPABASE_*)
 *
 * Auth: Bearer JWT Supabase (vendeur propriétaire / admin plateforme).
 */

import { createClient } from '@supabase/supabase-js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function escapeSqlString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "''");
}

function assertUuid(id, label) {
  if (!UUID_RE.test(id)) throw new Error(`${label} invalide`);
  return id;
}

function assertIsoDate(value, label) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`${label} invalide`);
  return d.toISOString().replace('T', ' ').replace('Z', '');
}

function getPostHogConfig() {
  const apiKey = (process.env.POSTHOG_PERSONAL_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const projectId = (process.env.POSTHOG_PROJECT_ID || '').trim().replace(/^["']|["']$/g, '');
  if (!apiKey || !projectId) return null;
  const host = (process.env.POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '');
  return { host, projectId, apiKey };
}

function getSupabaseAnon() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    '';
  return { url, key };
}

async function runHogQl(cfg, query) {
  const url = `${cfg.host}/api/projects/${cfg.projectId}/query/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog query HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return Array.isArray(json.results) ? json.results : [];
}

function storeFilter(storeId) {
  return `toString(properties.store_id) = '${escapeSqlString(storeId)}'`;
}

async function reportStoreWebMetrics(cfg, storeId, periodStart, periodEnd, compareStart) {
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
  let bounceRate = 0;
  if (sessions > 0 && pageViews > 0) {
    const engaged = Math.min(sessions, interactions);
    bounceRate = Math.max(0, Math.min(100, Math.round(((sessions - engaged) / sessions) * 10000) / 100));
  }
  return { pageViews, previousPeriodPageViews, bounceRate, sessionDuration: 0 };
}

async function reportStoreFunnel(cfg, storeId, periodStart, periodEnd) {
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
  return { views: num(rows[0]?.[0]), clicks: num(rows[0]?.[1]), conversions: num(rows[0]?.[2]) };
}

async function reportStoreViews(cfg, storeId, periodStart, periodEnd, compareStart) {
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
    monthlyViews: monthlyRows.map(r => ({ month: String(r[0] ?? ''), views: num(r[1]) })),
  };
}

async function reportPlatformVisitors(cfg, periodDays) {
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
       count() AS page_views, uniqExact(properties.$session_id) AS sessions
FROM events WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY country ORDER BY sessions DESC LIMIT 20
`;
  const byDeviceQ = `
SELECT coalesce(nullIf(toString(properties.device_type), ''), 'unknown') AS device_type,
       count() AS page_views, uniqExact(properties.$session_id) AS sessions
FROM events WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY device_type ORDER BY sessions DESC LIMIT 10
`;
  const byBrowserQ = `
SELECT coalesce(nullIf(toString(properties.browser), ''), 'Unknown') AS browser,
       count() AS page_views, uniqExact(properties.$session_id) AS sessions
FROM events WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY browser ORDER BY sessions DESC LIMIT 10
`;
  const byOsQ = `
SELECT coalesce(nullIf(toString(properties.os), ''), 'Unknown') AS os,
       count() AS page_views, uniqExact(properties.$session_id) AS sessions
FROM events WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY os ORDER BY sessions DESC LIMIT 10
`;
  const topPagesQ = `
SELECT coalesce(nullIf(toString(properties.page_path), ''), '/') AS page_path,
       count() AS views, uniqExact(properties.$session_id) AS sessions, 0 AS avg_duration_ms
FROM events WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY page_path ORDER BY views DESC LIMIT 25
`;
  const dailyQ = `
SELECT toDate(timestamp) AS day, uniqExact(properties.$session_id) AS sessions, count() AS page_views
FROM events WHERE event = 'app_page_viewed' AND timestamp >= now() - INTERVAL ${days} DAY
GROUP BY day ORDER BY day ASC
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
  return {
    period_days: days,
    total_page_views: num(summary[0]?.[0]),
    unique_sessions: num(summary[0]?.[1]),
    unique_users: num(summary[0]?.[2]),
    avg_session_duration_ms: Math.round(num(summary[0]?.[3])),
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

async function reportPhysicalOnboardingFunnel(cfg, periodDays) {
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

async function verifyStoreOwner(supabase, userId, storeId) {
  const { data } = await supabase.from('stores').select('user_id').eq('id', storeId).maybeSingle();
  return data?.user_id === userId;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cfg = getPostHogConfig();
  if (!cfg) {
    return res.status(503).json({
      error: 'PostHog query non configuré (POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID)',
    });
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Connexion requise' });
  }

  const { url, key } = getSupabaseAnon();
  if (!url || !key) {
    return res.status(500).json({ error: 'Supabase config manquante' });
  }

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const report = body.report;

  try {
    if (report === 'platform_visitors' || report === 'physical_onboarding_funnel') {
      const { data: isAdmin, error: adminErr } = await supabase.rpc('is_platform_admin');
      if (adminErr || !isAdmin) {
        return res.status(403).json({ error: 'Accès admin plateforme requis' });
      }
      const periodDays = num(body.periodDays, 30);
      if (report === 'platform_visitors') {
        return res.status(200).json(await reportPlatformVisitors(cfg, periodDays));
      }
      return res.status(200).json(await reportPhysicalOnboardingFunnel(cfg, periodDays));
    }

    const storeId = typeof body.storeId === 'string' ? body.storeId : '';
    if (!storeId) return res.status(400).json({ error: 'storeId requis' });
    const allowed = await verifyStoreOwner(supabase, user.id, storeId);
    if (!allowed) return res.status(403).json({ error: 'Accès boutique refusé' });

    if (report === 'store_web_metrics') {
      return res.status(200).json(
        await reportStoreWebMetrics(
          cfg,
          storeId,
          String(body.periodStart || ''),
          String(body.periodEnd || ''),
          String(body.compareStart || '')
        )
      );
    }
    if (report === 'store_funnel') {
      return res.status(200).json(
        await reportStoreFunnel(
          cfg,
          storeId,
          String(body.periodStart || ''),
          String(body.periodEnd || '')
        )
      );
    }
    if (report === 'store_views') {
      return res.status(200).json(
        await reportStoreViews(
          cfg,
          storeId,
          String(body.periodStart || ''),
          String(body.periodEnd || ''),
          String(body.compareStart || '')
        )
      );
    }
    return res.status(400).json({ error: 'report inconnu' });
  } catch (error) {
    console.error('posthog-analytics-query failed', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur PostHog query',
    });
  }
}
