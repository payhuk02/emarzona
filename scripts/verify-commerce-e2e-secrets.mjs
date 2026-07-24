#!/usr/bin/env node
/**
 * Validates commerce_type Playwright E2E secrets (presence, format, live auth admin ping).
 *
 * Requires Node < 22: ws devDependency for Supabase realtime transport.
 */
import { appendFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { assertSafeE2ESupabaseUrl, isProductionSupabaseUrl } from './e2e-supabase-guard.mjs';

const required = [
  ['VITE_SUPABASE_URL', ['VITE_SUPABASE_TEST_URL', 'VITE_SUPABASE_URL', 'SUPABASE_URL']],
  [
    'VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY',
    ['VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
  ],
  ['SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_SERVICE_ROLE_KEY']],
];

function markGithubOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

function pick(...keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return null;
}

function extractProjectRef(url) {
  const match = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i);
  return match?.[1] ?? null;
}

function validateServiceRoleKeyFormat(key) {
  if (key.startsWith('eyJ')) {
    return 'Legacy JWT service_role keys are disabled on this project. Use sb_secret_... from Dashboard → API Keys.';
  }
  if (key.startsWith('sb_publishable_')) {
    return 'Publishable key cannot be used as SUPABASE_SERVICE_ROLE_KEY. Use sb_secret_... (service role secret).';
  }
  if (!key.startsWith('sb_secret_')) {
    return `Unexpected service role key format (expected sb_secret_..., got prefix "${key.slice(0, 12)}...").`;
  }
  if (key.length < 40) {
    return `Service role key looks truncated (length ${key.length}). Copy the full sb_secret_... from Supabase Dashboard — do not use CLI masked output (···).`;
  }
  if (/[^\x21-\x7E]/.test(key)) {
    return 'Service role key contains non-ASCII characters (likely CLI-masked key with · characters). Re-copy the full secret from Dashboard.';
  }
  return null;
}

function isCommerceE2eRequired() {
  const flag = process.env.COMMERCE_E2E_REQUIRED?.trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

function skipInCi(reason) {
  console.warn(`::warning title=Commerce E2E skipped::${reason}`);
  markGithubOutput('skipped', 'true');
  markGithubOutput('skip_reason', reason.replace(/\n/g, ' '));
  console.log(`Commerce E2E skipped in CI: ${reason}`);
  process.exit(0);
}

function failInCi(reason) {
  console.error(`::error title=Commerce E2E required::${reason}`);
  markGithubOutput('skipped', 'true');
  markGithubOutput('skip_reason', reason.replace(/\n/g, ' '));
  process.exit(1);
}

function skipOrFailInCi(reason) {
  if (isCommerceE2eRequired()) {
    failInCi(reason);
  }
  skipInCi(reason);
}

const PHYSICAL_BASIC_PLAN = {
  slug: 'physical_basic',
  name: 'Physique — Basic',
  description: 'Abonnement requis pour vendre des produits physiques.',
  applies_to_product_type: 'physical',
  trial_days: 30,
  monthly_price: 7500,
  yearly_price: 0,
  max_products: 50,
  max_variants_per_product: 3,
  max_warehouses: 0,
  features: ['Produits physiques', 'Essai 30 jours'],
  display_order: 0,
  is_active: true,
  is_public: true,
};

const E2E_TERMS_DOCUMENT = {
  document_type: 'terms-of-service',
  version: '1.0',
  language: 'fr',
  title: 'Conditions Générales de Vente E2E',
  content: 'Contenu CGV minimal pour les tests E2E commerce.',
  effective_date: new Date().toISOString(),
  is_active: true,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function probePhysicalProductsStoreId(admin) {
  const { error } = await admin.from('physical_products').select('store_id').limit(0);
  if (!error) return true;

  if (/store_id|PGRST204/i.test(error.message ?? '') || error.code === 'PGRST204') {
    return false;
  }

  if (error.code !== 'PGRST116') {
    throw new Error(`physical_products probe failed: ${error.message}`);
  }

  return true;
}

/** Wait for PostgREST schema cache after direct SQL patches (NOTIFY pgrst is async). */
async function waitForPostgrestSchemaPatches(admin, projectRef) {
  const maxAttempts = 8;
  const delayMs = 4_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { error: rpcError } = await admin.rpc('e2e_apply_schema_patches');
    if (!rpcError) {
      console.log(`PostgREST exposes e2e_apply_schema_patches on ${projectRef} (attempt ${attempt})`);
      return;
    }

    const storeIdVisible = await probePhysicalProductsStoreId(admin);
    if (storeIdVisible) {
      console.log(`PostgREST exposes physical_products.store_id on ${projectRef} (attempt ${attempt})`);
      return;
    }

    if (attempt < maxAttempts) {
      console.warn(
        `PostgREST schema cache stale on ${projectRef}, retry ${attempt}/${maxAttempts} in ${delayMs}ms`
      );
      await sleep(delayMs);
    }
  }

  console.warn(
    `PostgREST still missing e2e schema patches on ${projectRef} after ${maxAttempts} attempts — continuing (mixed-cart may fail until patches-only runs)`
  );
}

/** Idempotent seed for schema-only E2E bootstrap (same data as e2e-post-bootstrap-patches.sql). */
async function ensureCommerceE2eSchemaPatches(admin, projectRef) {
  const { error } = await admin.rpc('e2e_apply_schema_patches');
  if (!error) {
    console.log(`Applied e2e_apply_schema_patches on project ${projectRef}`);
    return;
  }

  if (/Could not find the function|42883|PGRST202/i.test(error.message ?? '')) {
    console.warn(
      `e2e_apply_schema_patches RPC not visible on ${projectRef} — waiting for PostgREST schema reload`
    );
    await waitForPostgrestSchemaPatches(admin, projectRef);
    return;
  }

  throw new Error(`e2e_apply_schema_patches failed: ${error.message}`);
}

/** Idempotent seed for schema-only E2E bootstrap (same data as e2e-post-bootstrap-patches.sql). */
async function ensureCommerceE2eSeeds(admin, projectRef) {
  let seeded = false;

  const { data: physicalPlan, error: planProbeError } = await admin
    .from('platform_vendor_plans')
    .select('id')
    .eq('slug', 'physical_basic')
    .eq('is_active', true)
    .maybeSingle();

  if (planProbeError) {
    throw new Error(`platform_vendor_plans probe failed: ${planProbeError.message}`);
  }

  if (!physicalPlan?.id) {
    const { error: planUpsertError } = await admin
      .from('platform_vendor_plans')
      .upsert(PHYSICAL_BASIC_PLAN, { onConflict: 'slug' });
    if (planUpsertError) {
      throw new Error(`platform_vendor_plans.physical_basic upsert failed: ${planUpsertError.message}`);
    }
    seeded = true;
    console.log(`Seeded platform_vendor_plans.physical_basic on project ${projectRef}`);
  }

  const { data: termsDoc, error: termsProbeError } = await admin
    .from('legal_documents')
    .select('id')
    .eq('document_type', 'terms-of-service')
    .eq('language', 'fr')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (termsProbeError) {
    throw new Error(`legal_documents probe failed: ${termsProbeError.message}`);
  }

  if (!termsDoc?.id) {
    const { error: termsInsertError } = await admin.from('legal_documents').insert(E2E_TERMS_DOCUMENT);
    if (termsInsertError && termsInsertError.code !== '23505') {
      throw new Error(`legal_documents terms-of-service insert failed: ${termsInsertError.message}`);
    }
    seeded = true;
    console.log(`Seeded legal_documents terms-of-service/fr on project ${projectRef}`);
  }

  return seeded;
}

const missing = [];
const resolved = {};

for (const [label, keys] of required) {
  const value = pick(...keys);
  if (!value) missing.push(label);
  else resolved[label] = value;
}

if (missing.length > 0) {
  const message =
    'Missing commerce E2E secrets (SUPABASE_TEST_SERVICE_ROLE_KEY, VITE_SUPABASE_TEST_ANON_KEY, VITE_SUPABASE_TEST_URL).';
  if (process.env.CI === 'true') {
    skipOrFailInCi(
      `${message} Fix: E2E_SUPABASE_TEST_PROJECT_REF=<ref> npm run setup:commerce-e2e-secret`
    );
  }
  console.error('Missing commerce E2E secrets:');
  for (const name of missing) console.error(`  - ${name}`);
  console.error('');
  console.error('Configure GitHub secrets: SUPABASE_TEST_SERVICE_ROLE_KEY, VITE_SUPABASE_TEST_ANON_KEY');
  console.error('Rotate all: npm run setup:commerce-e2e-secret');
  process.exit(1);
}

const url = resolved['VITE_SUPABASE_URL'];
const anonKey =
  pick('VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY') ?? '';
const serviceKey = resolved['SUPABASE_SERVICE_ROLE_KEY'];

const projectRef = extractProjectRef(url);
if (!projectRef) {
  console.error(`Invalid VITE_SUPABASE_URL: "${url}" (expected https://<ref>.supabase.co)`);
  process.exit(1);
}

if (process.env.CI === 'true' && isProductionSupabaseUrl(url)) {
  skipOrFailInCi(
    `Project « ${projectRef} » is production. ` +
      'Set GitHub secret VITE_SUPABASE_TEST_URL to a dedicated non-production Supabase project. ' +
      'Fix: E2E_SUPABASE_TEST_PROJECT_REF=<ref> npm run setup:commerce-e2e-secret'
  );
}

const formatError = validateServiceRoleKeyFormat(serviceKey);
if (formatError) {
  console.error(`Invalid SUPABASE_SERVICE_ROLE_KEY: ${formatError}`);
  console.error('');
  console.error('Fix: npm run setup:commerce-e2e-secret (or copy sb_secret_... from Supabase Dashboard)');
  process.exit(1);
}

if (anonKey.startsWith('eyJ')) {
  console.error('VITE_SUPABASE_ANON_KEY / PUBLISHABLE_KEY is a legacy JWT (eyJ...). Use sb_publishable_...');
  console.error('Fix: npm run setup:commerce-e2e-secret (sets VITE_SUPABASE_TEST_ANON_KEY)');
  process.exit(1);
}

if (!anonKey.startsWith('sb_publishable_')) {
  console.error(`Unexpected publishable key format (expected sb_publishable_..., got "${anonKey.slice(0, 12)}...").`);
  console.error('Fix: npm run setup:commerce-e2e-secret');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

function isTransientAuthAdminError(error) {
  const message = error?.message ?? String(error ?? '');
  return /unrecognized JWT kid|unable to parse or verify signature|token is unverifiable|ES256/i.test(
    message
  );
}

async function withAuthAdminRetry(label, fn, options = {}) {
  const attempts = options.attempts ?? 5;
  const initialDelayMs = options.initialDelayMs ?? 1500;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientAuthAdminError(error) || attempt === attempts) break;
      await new Promise(resolve => setTimeout(resolve, initialDelayMs * attempt));
    }
  }

  throw lastError ?? new Error(`${label} failed`);
}

try {
  await withAuthAdminRetry('commerce-e2e listUsers probe', async () => {
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
  });
} catch (error) {
  const message = error?.message ?? String(error);
  console.error(`Supabase service role key rejected for project ${projectRef}: ${message}`);
  console.error('');
  console.error('Ensure URL and service role secret belong to the same Supabase project.');
  console.error('Rotate CI secret: npm run setup:commerce-e2e-secret');
  process.exit(1);
}

const { error: schemaError } = await admin.from('stores').select('id').limit(1);
const missingEmarzonaSchema =
  schemaError &&
  (schemaError.code === 'PGRST205' ||
    schemaError.code === '42P01' ||
    /Could not find the table 'public\.stores'/i.test(schemaError.message ?? ''));

if (missingEmarzonaSchema) {
  const reason =
    `Project « ${projectRef} » is missing Emarzona schema (public.stores). ` +
    'Use a dedicated Supabase project with repo migrations applied. ' +
    'Fix: run workflow bootstrap-e2e-schema.yml or E2E_SUPABASE_TEST_PROJECT_REF=<ref> npm run setup:commerce-e2e-secret';
  if (process.env.CI === 'true') {
    skipOrFailInCi(reason);
  }
  console.error(reason);
  process.exit(1);
}

if (schemaError?.code === '42501') {
  const reason =
    `Project « ${projectRef} » has public.stores but service_role lacks table privileges (42501). ` +
    'Re-run GitHub workflow bootstrap-e2e-schema.yml to restore GRANTs after schema import.';
  if (process.env.CI === 'true') {
    skipOrFailInCi(reason);
  }
  console.error(reason);
  process.exit(1);
}

if (schemaError && schemaError.code !== 'PGRST116') {
  console.error(`Schema probe failed for project ${projectRef}: ${schemaError.message}`);
  process.exit(1);
}

try {
  await ensureCommerceE2eSchemaPatches(admin, projectRef);
  await ensureCommerceE2eSeeds(admin, projectRef);
} catch (seedError) {
  const reason =
    `Project « ${projectRef} » is missing commerce E2E seed data and auto-seed failed: ${seedError.message}. ` +
    'Re-run GitHub workflow bootstrap-e2e-schema.yml with mode patches-only.';
  if (process.env.CI === 'true') {
    skipOrFailInCi(reason);
  }
  console.error(reason);
  process.exit(1);
}

try {
  if (isProductionSupabaseUrl(url)) {
    assertSafeE2ESupabaseUrl(url, 'verify-commerce-e2e-secrets');
  }
} catch (guardError) {
  if (process.env.CI === 'true') {
    skipOrFailInCi(String(guardError.message ?? guardError));
  }
  console.error(String(guardError.message ?? guardError));
  console.error('');
  console.error('Les E2E commerce ne doivent pas cibler la prod. Configurez VITE_SUPABASE_TEST_URL.');
  process.exit(1);
}

markGithubOutput('skipped', 'false');
console.log(`Commerce E2E secrets OK (project ${projectRef}, service role validated)`);
