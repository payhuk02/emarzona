/**
 * Epic 5.3 — Health checks plateforme + enregistrement SLA
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getFedexConfigSummary, probeFedexOAuth } from '../_shared/fedex-policy.ts';

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface ProbeResult {
  service_key: string;
  service_label: string;
  status: ServiceStatus;
  latency_ms: number | null;
  message: string | null;
}

async function probeSupabase(): Promise<ProbeResult> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const start = Date.now();
  if (!url || !key) {
    return {
      service_key: 'supabase',
      service_label: 'Base de données & Auth',
      status: 'outage',
      latency_ms: null,
      message: 'Configuration manquante',
    };
  }
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const latency = Date.now() - start;
    const status: ServiceStatus =
      res.ok && latency < 2000 ? 'operational' : latency < 5000 ? 'degraded' : 'outage';
    return {
      service_key: 'supabase',
      service_label: 'Base de données & Auth',
      status,
      latency_ms: latency,
      message: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      service_key: 'supabase',
      service_label: 'Base de données & Auth',
      status: 'outage',
      latency_ms: Date.now() - start,
      message: String(err),
    };
  }
}

async function probeSite(): Promise<ProbeResult> {
  const site = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  const start = Date.now();
  try {
    const res = await fetch(site, { method: 'HEAD', redirect: 'follow' });
    const latency = Date.now() - start;
    const status: ServiceStatus =
      res.ok && latency < 3000 ? 'operational' : latency < 8000 ? 'degraded' : 'outage';
    return {
      service_key: 'web',
      service_label: 'Application web',
      status,
      latency_ms: latency,
      message: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      service_key: 'web',
      service_label: 'Application web',
      status: 'outage',
      latency_ms: Date.now() - start,
      message: String(err),
    };
  }
}

async function probeEdgeFunctions(): Promise<ProbeResult> {
  const url = Deno.env.get('SUPABASE_URL');
  const start = Date.now();
  if (!url) {
    return {
      service_key: 'edge',
      service_label: 'Edge Functions',
      status: 'outage',
      latency_ms: null,
      message: 'SUPABASE_URL missing',
    };
  }
  try {
    const res = await fetch(`${url}/functions/v1/sitemap-main`, { method: 'HEAD' });
    const latency = Date.now() - start;
    const status: ServiceStatus = res.status < 500 ? 'operational' : 'degraded';
    return {
      service_key: 'edge',
      service_label: 'Edge Functions',
      status,
      latency_ms: latency,
      message: res.status >= 500 ? `HTTP ${res.status}` : null,
    };
  } catch (err) {
    return {
      service_key: 'edge',
      service_label: 'Edge Functions',
      status: 'degraded',
      latency_ms: Date.now() - start,
      message: String(err),
    };
  }
}

async function probeFedex(): Promise<ProbeResult> {
  const config = getFedexConfigSummary();
  const start = Date.now();

  if (!config.credentials_present) {
    const status: ServiceStatus = config.production_environment ? 'outage' : 'degraded';
    return {
      service_key: 'fedex',
      service_label: 'FedEx Shipping',
      status,
      latency_ms: Date.now() - start,
      message: config.production_environment
        ? 'Credentials FedEx manquants en production'
        : 'Credentials FedEx non configurés (mock autorisé hors prod)',
    };
  }

  const oauth = await probeFedexOAuth();
  const status: ServiceStatus = oauth.ok
    ? oauth.latency_ms < 3000
      ? 'operational'
      : 'degraded'
    : config.production_environment
      ? 'outage'
      : 'degraded';

  return {
    service_key: 'fedex',
    service_label: 'FedEx Shipping',
    status,
    latency_ms: oauth.latency_ms,
    message: oauth.ok ? `OAuth OK (${config.test_mode ? 'sandbox' : 'production'})` : oauth.message,
  };
}

async function probeFulfillment(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const { data, error } = await supabase.rpc('detect_stale_order_fulfillment', {
      p_stale_minutes: 5,
    });

    if (error) {
      return {
        service_key: 'fulfillment',
        service_label: 'Fulfillment commandes',
        status: 'degraded',
        latency_ms: Date.now() - start,
        message: error.message,
      };
    }

    const staleCount = Number((data as { stale_count?: number })?.stale_count ?? 0);
    const status: ServiceStatus =
      staleCount === 0 ? 'operational' : staleCount <= 3 ? 'degraded' : 'outage';

    return {
      service_key: 'fulfillment',
      service_label: 'Fulfillment commandes',
      status,
      latency_ms: Date.now() - start,
      message:
        staleCount === 0 ? null : `${staleCount} commande(s) > 5 min sans fulfillment complet`,
    };
  } catch (err) {
    return {
      service_key: 'fulfillment',
      service_label: 'Fulfillment commandes',
      status: 'outage',
      latency_ms: Date.now() - start,
      message: String(err),
    };
  }
}

serve(async req => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(origin) });
  }

  const supabase = createSupabaseAdmin();
  const cronSecret = Deno.env.get('CRON_SECRET');
  const isCron =
    req.headers.get('x-cron-secret') === cronSecret ||
    req.headers.get('Authorization')?.replace('Bearer ', '') === cronSecret;

  if (req.method === 'POST') {
    if (!isCron) {
      return jsonResponse({ error: 'Unauthorized' }, 401, origin);
    }
    const probes = await Promise.all([
      probeSupabase(),
      probeSite(),
      probeEdgeFunctions(),
      probeFedex(),
      probeFulfillment(supabase),
    ]);
    for (const probe of probes) {
      await supabase.rpc('record_platform_sla_check', {
        p_service_key: probe.service_key,
        p_service_label: probe.service_label,
        p_status: probe.status,
        p_latency_ms: probe.latency_ms,
        p_message: probe.message,
      });
    }
  }

  const { data, error } = await supabase.rpc('get_platform_status_summary');
  if (error) {
    return jsonResponse({ error: error.message }, 500, origin);
  }

  return jsonResponse(data ?? {}, 200, origin);
});
