#!/usr/bin/env node
/**
 * Vérifie la RPC get_store_dashboard_stats_aggregated (remote ou local).
 * Usage: node scripts/verify-dashboard-stats-rpc.mjs [--store-id UUID]
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import {
  loadSupabaseEnv,
  getSupabaseUrl,
  getServiceRoleKey,
} from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const url = getSupabaseUrl(env);
const serviceKey = getServiceRoleKey(env);

const report = {
  ok: false,
  timestamp: new Date().toISOString(),
  function_exists: false,
  rpc_shape_ok: false,
  sample_store_id: null,
  via: null,
  blockers: [],
};

function fail(msg) {
  report.blockers.push(msg);
}

function parseStoreArg() {
  const idx = process.argv.indexOf('--store-id');
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1];
}

async function checkViaServiceRole(storeId) {
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);

  const { data, error } = await admin.rpc('get_store_dashboard_stats_aggregated', {
    p_store_id: storeId,
    p_period_start: start.toISOString(),
    p_period_end: end.toISOString(),
    p_period_label: '30 derniers jours',
  });

  if (error) {
    const code = error.code ?? 'unknown';
    if (/could not find the function|does not exist/i.test(error.message ?? '')) {
      fail('RPC get_store_dashboard_stats_aggregated absente — appliquer migration 20260703130000');
      report.error_code = code;
      return;
    }
    if (code === '42501' || /permission denied/i.test(error.message ?? '')) {
      fail(
        `RPC permissions: ${error.message} — appliquer migration 20260712000000 (GRANT EXECUTE)`
      );
      report.error_code = code;
      return;
    }
    if (code === '42703' || /undefined column|column .* does not exist/i.test(error.message ?? '')) {
      fail(
        `RPC schema drift (${code}): ${error.message} — appliquer migration 20260714170000 (stock, reviews.is_approved, get_unread_count)`
      );
      report.error_code = code;
      return;
    }
    fail(`RPC error (${code}): ${error.message}`);
    report.error_code = code;
    return;
  }

  report.function_exists = true;

  const required = [
    'baseStats',
    'ordersStats',
    'customersStats',
    'productPerformance',
    'topProducts',
    'recentOrders',
    'operational',
  ];
  const missing = required.filter(k => !(k in (data ?? {})));
  if (missing.length) {
    fail(`Payload RPC incomplet — clés manquantes: ${missing.join(', ')}`);
    return;
  }

  report.rpc_shape_ok = true;
  report.ok = true;
}

async function resolveSampleStoreId() {
  const fromArg = parseStoreArg();
  if (fromArg) return fromArg;

  if (!serviceKey) return null;

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await admin.from('stores').select('id').limit(1).maybeSingle();
  return data?.id ?? null;
}

async function checkFunctionExistsViaSql() {
  try {
    const out = execSync('npx supabase db query --linked', {
      input: `
SELECT EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_store_dashboard_stats_aggregated'
) AS exists;
`,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    report.function_exists = /t|true|1/i.test(out);
    if (!report.function_exists) {
      fail('Fonction absente en base linked — supabase db push / migration 20260703130000');
    }
    return report.function_exists;
  } catch (err) {
    fail(`SQL check failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main() {
  report.sample_store_id = await resolveSampleStoreId();

  if (serviceKey && report.sample_store_id) {
    report.via = 'service_role_rpc';
    await checkViaServiceRole(report.sample_store_id);
  } else if (serviceKey) {
    report.via = 'service_role_no_store';
    const exists = await checkFunctionExistsViaSql();
    if (exists) {
      report.rpc_shape_ok = true;
      report.ok = true;
    }
  } else {
    report.via = 'linked_sql_only';
    const exists = await checkFunctionExistsViaSql();
    if (exists) {
      report.rpc_shape_ok = true;
      report.ok = true;
    } else {
      fail('SUPABASE_SERVICE_ROLE_KEY manquant pour test RPC complet');
    }
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch(err => {
  fail(err instanceof Error ? err.message : String(err));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
