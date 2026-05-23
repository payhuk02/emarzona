/**
 * Vérifie migration Payment V2 sur Supabase remote (lecture seule)
 * Usage: node scripts/verify-payment-v2-remote.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

function loadEnv() {
  const raw = readFileSync('.env', 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const key = line.slice(0, i);
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL || 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const key =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!key) {
  console.error('Missing Supabase key in .env (SERVICE_ROLE or ANON)');
  process.exit(1);
}

const sb = createClient(url, key);

const { count, error: countErr } = await sb
  .from('store_payment_connections')
  .select('*', { count: 'exact', head: true });

const { data: stores, error: storeErr } = await sb.from('stores').select('id').limit(1);

let rpcSample = null;
let rpcErr = null;
if (stores?.[0]?.id) {
  const r = await sb.rpc('get_store_payment_options', {
    p_store_id: stores[0].id,
    p_currency: 'EUR',
    p_buyer_country: null,
  });
  rpcSample = r.data;
  rpcErr = r.error;
}

const { data: flag } = await sb
  .from('platform_settings')
  .select('settings')
  .eq('key', 'payment_orchestration_v2')
  .maybeSingle();

const { data: monerooCount } = await sb
  .from('store_payment_connections')
  .select('id', { count: 'exact', head: true })
  .eq('provider', 'moneroo_platform');

console.log(
  JSON.stringify(
    {
      ok: !countErr && !rpcErr,
      store_payment_connections_count: count,
      table_error: countErr?.message ?? null,
      moneroo_connections: monerooCount,
      rpc_sample_eur: rpcSample,
      rpc_error: rpcErr?.message ?? null,
      store_fetch_error: storeErr?.message ?? null,
      payment_orchestration_v2_flag: flag?.settings ?? null,
      vite_orchestration_v2: env.VITE_PAYMENT_ORCHESTRATION_V2 ?? null,
    },
    null,
    2
  )
);

process.exit(countErr || rpcErr ? 1 : 0);
