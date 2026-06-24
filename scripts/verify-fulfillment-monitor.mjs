/**
 * Vérifie le monitoring fulfillment post-paiement (E49 P0)
 * Usage: node scripts/verify-fulfillment-monitor.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import {
  loadSupabaseEnv,
  getSupabaseUrl,
  getServiceRoleKey,
  getCronSecret,
} from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const url = getSupabaseUrl(env);
const serviceKey = getServiceRoleKey(env);
const cronSecret = getCronSecret(env);

const report = {
  ok: true,
  checks: {},
  edge_smoke: null,
};

async function check(name, fn) {
  try {
    report.checks[name] = await fn();
    if (report.checks[name]?.ok === false) report.ok = false;
  } catch (e) {
    report.ok = false;
    report.checks[name] = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function runLinkedSql(sql) {
  return execSync('npx supabase db query --linked', {
    input: sql,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

if (serviceKey) {
  const sb = createClient(url, serviceKey);

  await check('detect_stale_order_fulfillment_rpc', async () => {
    const { data, error } = await sb.rpc('detect_stale_order_fulfillment', { p_stale_minutes: 5 });
    if (error) return { ok: false, error: error.message };
    return {
      ok: data?.stale_count !== undefined && Array.isArray(data?.orders),
      stale_count: data?.stale_count,
      orders_length: data?.orders?.length ?? 0,
      via: 'service_role',
    };
  });

  await check('order_fulfillment_alerts_table', async () => {
    const { count, error } = await sb
      .from('order_fulfillment_alerts')
      .select('*', { count: 'exact', head: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true, row_count: count, via: 'service_role' };
  });

  await check('auto_resolve_rpc', async () => {
    const { data, error } = await sb.rpc('auto_resolve_fulfilled_order_alerts', {
      p_stale_minutes: 5,
    });
    if (error) return { ok: false, error: error.message };
    return {
      ok: data?.resolved_count !== undefined,
      resolved_count: data?.resolved_count,
      via: 'service_role',
    };
  });
} else {
  await check('detect_stale_order_fulfillment_rpc', async () => {
    try {
      const out = runLinkedSql(
        "SELECT (public.detect_stale_order_fulfillment(5)->>'stale_count') IS NOT NULL AS ok;"
      );
      return { ok: out.includes('true'), via: 'supabase_db_query' };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

  await check('auto_resolve_rpc', async () => {
    try {
      const out = runLinkedSql(
        "SELECT (public.auto_resolve_fulfilled_order_alerts(5)->>'resolved_count') IS NOT NULL AS ok;"
      );
      return { ok: out.includes('true'), via: 'supabase_db_query' };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });
}

if (cronSecret) {
  try {
    const edgeUrl = `${url.replace(/\/$/, '')}/functions/v1/process-order-fulfillment-monitor`;
    const res = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
      },
      body: '{}',
    });
    const body = await res.json().catch(() => ({}));
    report.edge_smoke = {
      ok: res.ok && body.success === true,
      status: res.status,
      stale_count: body.stale_count,
      sla_status: body.sla_status,
      auto_resolved: body.auto_resolved,
    };
    if (!report.edge_smoke.ok) report.ok = false;
  } catch (e) {
    report.edge_smoke = { ok: false, error: e instanceof Error ? e.message : String(e) };
    report.ok = false;
  }
} else {
  report.edge_smoke = { skipped: true, reason: 'CRON_SECRET not available' };
  report.ok = false;
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
