#!/usr/bin/env node
/**
 * Smoke API REST vendeurs v1 (sans clé valide requise).
 * Usage: node scripts/verify-vendor-api-remote.mjs
 */
import { loadSupabaseEnv, getSupabaseUrl } from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const url = getSupabaseUrl(env).replace(/\/$/, '');
const anonKey =
  env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  checks: {},
  blockers: [],
};

function setCheck(name, ok, detail) {
  report.checks[name] = { ok, detail };
  if (!ok) {
    report.ok = false;
    report.blockers.push(name);
  }
}

async function getJson(path, headers = {}) {
  const res = await fetch(`${url}/functions/v1/api-v1${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {}),
      ...headers,
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

const noKeyProducts = await getJson('/products');
setCheck(
  'products_without_vendor_key_401',
  noKeyProducts.status === 401,
  `GET /products sans clé vendeur → ${noKeyProducts.status} (attendu 401)`
);

const invalidKey = await getJson('/products', {
  Authorization: 'Bearer pk_live_invalid_verify_script',
});
setCheck(
  'invalid_vendor_key_rejected',
  invalidKey.status === 401 || invalidKey.status === 403,
  `GET /products clé invalide → ${invalidKey.status} (attendu 401/403)`
);

const vendorKey = env.VENDOR_API_KEY?.trim();
if (vendorKey) {
  const me = await getJson('/me', { Authorization: `Bearer ${vendorKey}` });
  setCheck(
    'vendor_key_me_ok',
    me.status === 200 && me.json?.api_version === 'v1',
    `GET /me avec VENDOR_API_KEY → ${me.status}`
  );
} else {
  report.checks.vendor_key_me_ok = {
    ok: true,
    skipped: true,
    detail: 'VENDOR_API_KEY absent — smoke positif ignoré',
  };
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
