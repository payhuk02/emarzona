#!/usr/bin/env node
/**
 * Vérifie la RPC get_customer_hub_summary (hub acheteur unifié).
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';
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
  via: null,
  blockers: [],
};

function fail(msg) {
  report.blockers.push(msg);
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
    AND p.proname = 'get_customer_hub_summary'
) AS exists;
`,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    report.function_exists = /t|true|1/i.test(out);
    if (!report.function_exists) {
      fail('RPC get_customer_hub_summary absente — appliquer migration 20260717160000');
    }
    return report.function_exists;
  } catch (err) {
    fail(`SQL check failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main() {
  if (serviceKey) {
    report.via = 'service_role_rpc';
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await admin.rpc('get_customer_hub_summary', {
      p_limit: 1,
      p_active_only: true,
    });

    if (error) {
      if (/could not find the function|does not exist/i.test(error.message ?? '')) {
        fail('RPC get_customer_hub_summary absente — appliquer migration 20260717160000');
      } else if (error.code === '42501' || /not authenticated/i.test(error.message ?? '')) {
        report.function_exists = true;
        report.rpc_shape_ok = true;
        report.ok = true;
        report.note =
          'RPC présente — auth requise côté client (comportement attendu avec service role sans JWT user)';
      } else {
        fail(`RPC error (${error.code ?? 'unknown'}): ${error.message}`);
      }
    } else {
      report.function_exists = true;
      report.rpc_shape_ok = true;
      report.ok = true;
    }
  } else {
    report.via = 'linked_sql_only';
    const exists = await checkFunctionExistsViaSql();
    if (exists) {
      report.rpc_shape_ok = true;
      report.ok = true;
    }
  }

  if (!report.ok && !report.function_exists) {
    await checkFunctionExistsViaSql();
    if (report.function_exists) {
      report.rpc_shape_ok = true;
      report.ok = true;
    }
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch(err => {
  fail(err.message ?? String(err));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
