#!/usr/bin/env node
/**
 * Sync SUPABASE_TEST_SERVICE_ROLE_KEY to GitHub using Supabase Management API (reveal=true).
 *
 * Prereqs:
 *   - SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
 *     On Windows, auto-read from Supabase CLI credential store when omitted.
 *   - gh CLI authenticated
 *
 * Usage:
 *   npm run setup:commerce-e2e-secret
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_REF = 'hbdnzajbyjakdhuavrvb';
const SECRET_NAME = 'SUPABASE_TEST_SERVICE_ROLE_KEY';
const PREFERRED_KEY_NAMES = ['app_service_role', 'supabase_service_role_key', 'default'];

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

const secretKeys = keys.filter(k => k.type === 'secret' && k.api_key?.startsWith('sb_secret_'));

let chosen = null;
for (const preferred of PREFERRED_KEY_NAMES) {
  chosen = secretKeys.find(k => k.name === preferred);
  if (chosen) break;
}
if (!chosen) chosen = secretKeys[0];

if (!chosen?.api_key) {
  console.error('No sb_secret_ service role key found. Create one in Supabase Dashboard → API Keys.');
  process.exit(1);
}

const key = chosen.api_key;
if (key.length < 40 || /[^\x21-\x7E]/.test(key)) {
  console.error('Revealed key looks invalid/truncated. Copy manually from Dashboard → API Keys.');
  process.exit(1);
}

// Validate against Auth admin API
const { createClient } = await import('@supabase/supabase-js');
const ws = (await import('ws')).default;
const url = `https://${PROJECT_REF}.supabase.co`;
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});
const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
if (error) {
  console.error(`Key "${chosen.name}" failed auth admin ping: ${error.message}`);
  process.exit(1);
}

console.log(`Validated service role key "${chosen.name}" (${key.slice(0, 16)}...) for ${PROJECT_REF}`);

execSync(`gh secret set ${SECRET_NAME}`, {
  input: key,
  stdio: ['pipe', 'inherit', 'inherit'],
});

console.log(`GitHub secret ${SECRET_NAME} updated.`);
