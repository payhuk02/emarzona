#!/usr/bin/env node
/**
 * Sync commerce E2E GitHub secrets from Supabase Management API (reveal=true).
 *
 * Sets:
 *   - SUPABASE_TEST_SERVICE_ROLE_KEY (sb_secret_...)
 *   - VITE_SUPABASE_TEST_ANON_KEY (sb_publishable_...)
 *   - VITE_SUPABASE_TEST_URL
 *
 * Prereqs:
 *   - SUPABASE_ACCESS_TOKEN (or Supabase CLI login on Windows)
 *   - gh CLI authenticated
 *
 * Usage:
 *   npm run setup:commerce-e2e-secret
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF } from './e2e-supabase-guard.mjs';

const PRODUCTION_PROJECT_REF = DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF;
const PROJECT_REF =
  process.env.E2E_SUPABASE_TEST_PROJECT_REF?.trim() ||
  process.env.SUPABASE_TEST_PROJECT_REF?.trim() ||
  '';

if (!PROJECT_REF) {
  console.error('Missing E2E_SUPABASE_TEST_PROJECT_REF (dedicated non-production Supabase project).');
  console.error('');
  console.error('Example:');
  console.error('  E2E_SUPABASE_TEST_PROJECT_REF=your-test-ref npm run setup:commerce-e2e-secret');
  console.error('');
  console.error(`Production ref "${PRODUCTION_PROJECT_REF}" must NOT be used for commerce E2E secrets.`);
  process.exit(1);
}

if (PROJECT_REF === PRODUCTION_PROJECT_REF) {
  console.error(
    `Refusing to set ${'VITE_SUPABASE_TEST_URL'} to production project "${PRODUCTION_PROJECT_REF}".`
  );
  console.error('Create a separate Supabase project for E2E and set E2E_SUPABASE_TEST_PROJECT_REF.');
  process.exit(1);
}

const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_SECRET = 'SUPABASE_TEST_SERVICE_ROLE_KEY';
const PUBLISHABLE_SECRET = 'VITE_SUPABASE_TEST_ANON_KEY';
const URL_SECRET = 'VITE_SUPABASE_TEST_URL';
const PREFERRED_SERVICE_NAMES = ['app_service_role', 'supabase_service_role_key', 'default'];
const PREFERRED_PUBLISHABLE_NAMES = ['app_anon', 'default'];

function resolveAccessToken() {
  const fromEnv = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  if (process.platform === 'win32') {
    const psScript = resolve('scripts/get-supabase-access-token.ps1');
    if (existsSync(psScript)) {
      const result = spawnSync(
        'powershell',
        ['-NoProfile', '-File', psScript],
        { encoding: 'utf8' }
      );
      const token = result.stdout?.trim();
      if (result.status === 0 && token) return token;
    }
  }

  return null;
}

function setGhSecret(name, value) {
  execSync(`gh secret set ${name}`, {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
}

function pickKey(keys, type, preferredNames) {
  const filtered = keys.filter(k => k.type === type);
  for (const name of preferredNames) {
    const match = filtered.find(k => k.name === name);
    if (match?.api_key) return match;
  }
  return filtered[0] ?? null;
}

function assertAsciiKey(key, label) {
  if (!key || key.length < 40 || /[^\x21-\x7E]/.test(key)) {
    console.error(`${label} looks invalid/truncated. Copy full key from Supabase Dashboard.`);
    process.exit(1);
  }
}

const accessToken = resolveAccessToken();
if (!accessToken) {
  console.error('Missing SUPABASE_ACCESS_TOKEN.');
  console.error('Create one at https://supabase.com/dashboard/account/tokens');
  console.error('Or login via Supabase CLI (Windows: token read from Credential Manager).');
  console.error('Then run: npm run setup:commerce-e2e-secret');
  process.exit(1);
}

const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys?reveal=true`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);

if (!response.ok) {
  const body = await response.text();
  console.error(`Management API error (${response.status}): ${body}`);
  process.exit(1);
}

/** @type {Array<{ name: string; type: string; api_key: string }>} */
const keys = await response.json();

const serviceKeyEntry = pickKey(keys, 'secret', PREFERRED_SERVICE_NAMES);
const publishableKeyEntry = pickKey(keys, 'publishable', PREFERRED_PUBLISHABLE_NAMES);

if (!serviceKeyEntry?.api_key?.startsWith('sb_secret_')) {
  console.error('No sb_secret_ service role key found.');
  process.exit(1);
}
if (!publishableKeyEntry?.api_key?.startsWith('sb_publishable_')) {
  console.error('No sb_publishable_ anon key found.');
  process.exit(1);
}

const serviceKey = serviceKeyEntry.api_key;
const publishableKey = publishableKeyEntry.api_key;
assertAsciiKey(serviceKey, 'Service role key');
assertAsciiKey(publishableKey, 'Publishable key');

const { createClient } = await import('@supabase/supabase-js');
const ws = (await import('ws')).default;

const admin = createClient(PROJECT_URL, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});
const { error: adminError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
if (adminError) {
  console.error(`Service role key "${serviceKeyEntry.name}" failed: ${adminError.message}`);
  process.exit(1);
}

const client = createClient(PROJECT_URL, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});
const { error: restError } = await client.from('stores').select('id').limit(1);
if (restError && !['PGRST116', '42501'].includes(restError.code ?? '')) {
  console.error(`Publishable key "${publishableKeyEntry.name}" failed REST ping: ${restError.message}`);
  process.exit(1);
}

console.log(`Validated service role "${serviceKeyEntry.name}" (${serviceKey.slice(0, 16)}...)`);
console.log(`Validated publishable "${publishableKeyEntry.name}" (${publishableKey.slice(0, 20)}...)`);

setGhSecret(SERVICE_ROLE_SECRET, serviceKey);
setGhSecret(PUBLISHABLE_SECRET, publishableKey);
setGhSecret(URL_SECRET, PROJECT_URL);

console.log(`GitHub secrets updated: ${SERVICE_ROLE_SECRET}, ${PUBLISHABLE_SECRET}, ${URL_SECRET}`);
