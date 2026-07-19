#!/usr/bin/env node
/**
 * Sync commerce E2E GitHub secrets from Supabase Management API (reveal=true).
 *
 * Sets:
 *   - SUPABASE_TEST_SERVICE_ROLE_KEY (sb_secret_...)
 *   - VITE_SUPABASE_TEST_ANON_KEY (sb_publishable_...)
 *   - VITE_SUPABASE_TEST_URL
 *
 * Also writes/merges `.env.e2e.local` for local Playwright runs.
 *
 * Prereqs:
 *   - SUPABASE_ACCESS_TOKEN (or Supabase CLI login on Windows)
 *   - gh CLI authenticated (`gh auth login`, repo: payhuk02/emarzona)
 *
 * Project ref resolution (first match wins):
 *   - E2E_SUPABASE_TEST_PROJECT_REF / SUPABASE_TEST_PROJECT_REF
 *   - .e2e-commerce-project-ref (gitignored, single line)
 *   - .env.e2e.local → E2E_SUPABASE_TEST_PROJECT_REF or VITE_SUPABASE_TEST_URL
 *
 * Usage:
 *   npm run setup:commerce-e2e-secret
 *   npm run setup:commerce-e2e-secret -- --list-projects
 *   E2E_SUPABASE_TEST_PROJECT_REF=<ref> npm run setup:commerce-e2e-secret
 *   npm run setup:commerce-e2e-secret -- --local-only   # skip gh, update .env.e2e.local only
 *   npm run setup:commerce-e2e-secret -- --mirror-prod-secrets   # CI skip mode (prod URL → verify skips destructive E2E)
 *   npm run setup:commerce-e2e-secret:from-env   # keys from Dashboard when Management API returns 403
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF,
  extractSupabaseProjectRef,
} from './e2e-supabase-guard.mjs';
import { resolveE2ECommerceProjectRef } from './resolve-e2e-commerce-project-ref.mjs';
import { writeEnvE2eLocal } from './write-env-e2e-local.mjs';

const PRODUCTION_PROJECT_REF = DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF;
const args = new Set(process.argv.slice(2));
const LOCAL_ONLY = args.has('--local-only');
const LIST_PROJECTS = args.has('--list-projects');
const MIRROR_PROD_SECRETS = args.has('--mirror-prod-secrets');
const FROM_ENV = args.has('--from-env');
const GH_REPO = process.env.GH_REPO?.trim() || 'payhuk02/emarzona';

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
  execSync(`gh secret set ${name} -R ${GH_REPO}`, {
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

function assertNonProductionRef(projectRef) {
  if (!projectRef) {
    console.error('Missing E2E Supabase test project ref.');
    console.error('');
    console.error('Options:');
    console.error('  1. E2E_SUPABASE_TEST_PROJECT_REF=<ref> npm run setup:commerce-e2e-secret');
    console.error('  2. echo <ref> > .e2e-commerce-project-ref');
    console.error('  3. npm run setup:commerce-e2e-secret -- --list-projects');
    console.error('');
    console.error(`Production ref "${PRODUCTION_PROJECT_REF}" must NOT be used for commerce E2E secrets.`);
    process.exit(1);
  }

  if (projectRef === PRODUCTION_PROJECT_REF) {
    console.error(
      `Refusing to set ${URL_SECRET} to production project "${PRODUCTION_PROJECT_REF}".`
    );
    console.error('Create a separate Supabase project for E2E and set E2E_SUPABASE_TEST_PROJECT_REF.');
    console.error('List projects: npm run setup:commerce-e2e-secret -- --list-projects');
    process.exit(1);
  }
}

const accessToken = FROM_ENV ? null : resolveAccessToken();
if (!FROM_ENV && !accessToken) {
  console.error('Missing SUPABASE_ACCESS_TOKEN.');
  console.error('Create one at https://supabase.com/dashboard/account/tokens');
  console.error('Or login via Supabase CLI (Windows: token read from Credential Manager).');
  console.error('Then run: npm run setup:commerce-e2e-secret');
  process.exit(1);
}

if (LIST_PROJECTS) {
  const response = await fetch('https://api.supabase.com/v1/projects', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.error(`Management API error (${response.status}): ${await response.text()}`);
    process.exit(1);
  }
  /** @type {Array<{ id: string; name: string; region: string }>} */
  const projects = await response.json();
  console.log('Supabase projects (use id as E2E_SUPABASE_TEST_PROJECT_REF):');
  for (const project of projects) {
    const prod = project.id === PRODUCTION_PROJECT_REF ? ' [PRODUCTION — do not use for E2E]' : '';
    console.log(`  ${project.id}  ${project.name}  (${project.region})${prod}`);
  }
  process.exit(0);
}

const PROJECT_REF = MIRROR_PROD_SECRETS
  ? PRODUCTION_PROJECT_REF
  : resolveE2ECommerceProjectRef();
if (MIRROR_PROD_SECRETS) {
  console.warn(
    'Mirror prod mode: TEST secrets will point to production (commerce/wizard E2E stay skipped until a dedicated migrated project is configured).'
  );
} else {
  assertNonProductionRef(PROJECT_REF);
}

const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;

let serviceKey;
let publishableKey;
let serviceKeyLabel = 'env';
let publishableKeyLabel = 'env';

if (FROM_ENV) {
  serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY?.trim() ?? '';
  publishableKey = process.env.VITE_SUPABASE_TEST_ANON_KEY?.trim() ?? '';
  if (!serviceKey || !publishableKey) {
    console.error('Missing SUPABASE_TEST_SERVICE_ROLE_KEY or VITE_SUPABASE_TEST_ANON_KEY.');
    console.error('Copy sb_secret_... and sb_publishable_... from Supabase Dashboard → Project Settings → API Keys.');
    console.error('Then: npm run setup:commerce-e2e-secret:from-env');
    process.exit(1);
  }
} else {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys?reveal=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    console.error(`Management API error (${response.status}): ${body}`);
    if (response.status === 403) {
      console.error('');
      console.error('If the E2E project is on another Supabase account, copy API keys from the Dashboard and run:');
      console.error('  npm run setup:commerce-e2e-secret:from-env');
    }
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

  serviceKey = serviceKeyEntry.api_key;
  publishableKey = publishableKeyEntry.api_key;
  serviceKeyLabel = serviceKeyEntry.name;
  publishableKeyLabel = publishableKeyEntry.name;
}

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
  console.error(`Service role key "${serviceKeyLabel}" failed: ${adminError.message}`);
  process.exit(1);
}

const client = createClient(PROJECT_URL, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});
const { error: restError } = await client.from('stores').select('id').limit(1);
if (restError) {
  const benignCodes = ['PGRST116', '42501', 'PGRST205', '42P01'];
  const missingStores =
    restError.code === 'PGRST205' ||
    /Could not find the table 'public\.stores'/i.test(restError.message ?? '');
  if (benignCodes.includes(restError.code ?? '') || missingStores) {
    console.warn(
      `Warning: publishable key REST ping skipped (${restError.message}). ` +
        'Apply Emarzona migrations on this project before running wizard E2E.'
    );
  } else {
    console.error(`Publishable key "${publishableKeyLabel}" failed REST ping: ${restError.message}`);
    process.exit(1);
  }
}

console.log(`Validated service role "${serviceKeyLabel}" (${serviceKey.slice(0, 16)}...)`);
console.log(`Validated publishable "${publishableKeyLabel}" (${publishableKey.slice(0, 20)}...)`);
console.log(`Target project: ${PROJECT_REF} (${PROJECT_URL})`);

if (!LOCAL_ONLY) {
  setGhSecret(SERVICE_ROLE_SECRET, serviceKey);
  setGhSecret(PUBLISHABLE_SECRET, publishableKey);
  setGhSecret(URL_SECRET, PROJECT_URL);
  console.log(`GitHub secrets updated on ${GH_REPO}: ${SERVICE_ROLE_SECRET}, ${PUBLISHABLE_SECRET}, ${URL_SECRET}`);
} else {
  console.log('Skipped GitHub secrets (--local-only).');
}

const localPath = writeEnvE2eLocal({
  E2E_SUPABASE_TEST_PROJECT_REF: PROJECT_REF,
  VITE_SUPABASE_TEST_URL: PROJECT_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY: serviceKey,
  VITE_SUPABASE_TEST_ANON_KEY: publishableKey,
});
if (!MIRROR_PROD_SECRETS) {
  console.log(`Local env synced: ${localPath}`);
} else {
  console.log('Skipped .env.e2e.local sync in mirror prod mode.');
}

const resolvedRef = extractSupabaseProjectRef(PROJECT_URL);
if (resolvedRef !== PROJECT_REF) {
  console.error('Internal error: project ref mismatch after sync.');
  process.exit(1);
}

console.log('Done. Re-run CI Playwright workflow to execute product wizard E2E.');
