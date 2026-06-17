#!/usr/bin/env node
/**
 * Validates commerce_type Playwright E2E secrets (presence, format, live auth admin ping).
 *
 * Requires Node < 22: ws devDependency for Supabase realtime transport.
 */
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const required = [
  ['VITE_SUPABASE_URL', ['VITE_SUPABASE_URL', 'SUPABASE_URL']],
  [
    'VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY',
    ['VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
  ],
  ['SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_SERVICE_ROLE_KEY']],
];

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

const missing = [];
const resolved = {};

for (const [label, keys] of required) {
  const value = pick(...keys);
  if (!value) missing.push(label);
  else resolved[label] = value;
}

if (missing.length > 0) {
  console.error('Missing commerce E2E secrets:');
  for (const name of missing) console.error(`  - ${name}`);
  console.error('');
  console.error('Configure GitHub secret: SUPABASE_TEST_SERVICE_ROLE_KEY');
  console.error('Optional dedicated test URL/key: VITE_SUPABASE_TEST_URL, VITE_SUPABASE_TEST_ANON_KEY');
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

const formatError = validateServiceRoleKeyFormat(serviceKey);
if (formatError) {
  console.error(`Invalid SUPABASE_SERVICE_ROLE_KEY: ${formatError}`);
  console.error('');
  console.error('Fix: npm run setup:commerce-e2e-secret (or copy sb_secret_... from Supabase Dashboard)');
  process.exit(1);
}

if (anonKey.startsWith('eyJ')) {
  console.error('VITE_SUPABASE_ANON_KEY / PUBLISHABLE_KEY is a legacy JWT (eyJ...). Use sb_publishable_...');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });

if (error) {
  console.error(`Supabase service role key rejected for project ${projectRef}: ${error.message}`);
  console.error('');
  console.error('Ensure URL and service role secret belong to the same Supabase project.');
  console.error('Rotate CI secret: npm run setup:commerce-e2e-secret');
  process.exit(1);
}

console.log(`Commerce E2E secrets OK (project ${projectRef}, service role validated)`);
