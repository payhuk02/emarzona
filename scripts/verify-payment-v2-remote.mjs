/**
 * Vérifie Payment V2 sur Supabase remote (lecture seule).
 * Usage: node scripts/verify-payment-v2-remote.mjs
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
  store_payment_connections_count: null,
  moneroo_connections: null,
  rpc_sample_eur: null,
  payment_orchestration_v2_flag: null,
  vite_orchestration_v2: env.VITE_PAYMENT_ORCHESTRATION_V2 ?? null,
  via: null,
  blockers: [],
};

function fail(msg) {
  report.blockers.push(msg);
}

function isTransientSupabaseError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return /503|timeout|connection timeout|upstream connect error/i.test(msg);
}

function runLinkedSql(sql, { retries = 3 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return execSync('npx supabase db query --linked', {
        input: sql,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err) {
      lastError = err;
      if (attempt >= retries || !isTransientSupabaseError(err)) {
        throw err;
      }
      // Backoff before retry on transient Supabase CLI errors
      execSync('node -e "setTimeout(()=>{}, 2000)"', { stdio: 'ignore' });
    }
  }
  throw lastError;
}

async function verifyViaServiceRole() {
  const sb = createClient(url, serviceKey);

  const { count, error: countErr } = await sb
    .from('store_payment_connections')
    .select('*', { count: 'exact', head: true });
  if (countErr) throw new Error(countErr.message);
  report.store_payment_connections_count = count;

  const { count: monerooCount, error: monerooErr } = await sb
    .from('store_payment_connections')
    .select('id', { count: 'exact', head: true })
    .eq('provider', 'moneroo_platform');
  if (monerooErr) throw new Error(monerooErr.message);
  report.moneroo_connections = monerooCount;

  const { data: stores, error: storeErr } = await sb.from('stores').select('id').limit(1);
  if (storeErr) throw new Error(storeErr.message);

  if (stores?.[0]?.id) {
    const { data, error } = await sb.rpc('get_store_payment_options', {
      p_store_id: stores[0].id,
      p_currency: 'EUR',
      p_buyer_country: null,
    });
    if (error) throw new Error(error.message);
    report.rpc_sample_eur = data;
  }

  const { data: flag, error: flagErr } = await sb
    .from('platform_settings')
    .select('settings')
    .eq('key', 'payment_orchestration_v2')
    .maybeSingle();
  if (flagErr) throw new Error(flagErr.message);
  report.payment_orchestration_v2_flag = flag?.settings ?? null;

  report.via = 'service_role';
}

function verifyViaLinkedSql() {
  const countOut = runLinkedSql(
    'SELECT count(*)::int AS c FROM public.store_payment_connections;'
  );
  const countMatch = countOut.match(/"c":\s*(\d+)/);
  report.store_payment_connections_count = countMatch ? Number(countMatch[1]) : null;

  const monerooOut = runLinkedSql(
    "SELECT count(*)::int AS c FROM public.store_payment_connections WHERE provider = 'moneroo_platform';"
  );
  const monerooMatch = monerooOut.match(/"c":\s*(\d+)/);
  report.moneroo_connections = monerooMatch ? Number(monerooMatch[1]) : null;

  const flagOut = runLinkedSql(
    "SELECT settings FROM public.platform_settings WHERE key = 'payment_orchestration_v2' LIMIT 1;"
  );
  if (flagOut.includes('enabled') || flagOut.includes('rollout')) {
    report.payment_orchestration_v2_flag = 'present_in_db';
  }

  const rpcOut = runLinkedSql(`
    SELECT public.get_store_payment_options(
      (SELECT id FROM public.stores LIMIT 1),
      'EUR',
      NULL
    ) AS opts;
  `);
  report.rpc_sample_eur = rpcOut.includes('moneroo') || rpcOut.includes('providers') ? 'ok' : null;
  report.via = 'supabase_db_query';
}

try {
  if (serviceKey) {
    await verifyViaServiceRole();
  } else {
    try {
      verifyViaLinkedSql();
    } catch (linkedErr) {
      if (process.env.SUPABASE_DB_PASSWORD?.trim()) {
        verifyViaLinkedSql();
      } else {
        fail(
          'Configure SUPABASE_SERVICE_ROLE_KEY in .env (recommandé) ou connectez supabase login + db query --linked'
        );
        if (linkedErr instanceof Error) fail(linkedErr.message);
      }
    }
  }

  if (report.store_payment_connections_count === null) {
    fail('store_payment_connections inaccessible');
  }
  if (!report.rpc_sample_eur) {
    fail('get_store_payment_options indisponible ou vide');
  }
  if (!report.payment_orchestration_v2_flag) {
    fail('platform_settings.payment_orchestration_v2 absent');
  }

  report.ok = report.blockers.length === 0;
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
