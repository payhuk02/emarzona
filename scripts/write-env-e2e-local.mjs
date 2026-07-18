/**
 * Merge commerce E2E keys into .env.e2e.local (gitignored).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from './load-e2e-env.mjs';

const MANAGED_KEYS = [
  'E2E_SUPABASE_TEST_PROJECT_REF',
  'VITE_SUPABASE_TEST_URL',
  'SUPABASE_TEST_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_TEST_ANON_KEY',
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

export function writeEnvE2eLocal(updates, root = process.cwd()) {
  const filePath = resolve(root, '.env.e2e.local');
  const existing = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  const merged = { ...loadEnvFile(filePath), ...updates };

  const testUrl = merged.VITE_SUPABASE_TEST_URL?.trim() ?? '';
  const serviceKey = merged.SUPABASE_TEST_SERVICE_ROLE_KEY?.trim() ?? '';
  const anonKey = merged.VITE_SUPABASE_TEST_ANON_KEY?.trim() ?? '';

  if (testUrl) {
    merged.VITE_SUPABASE_URL = testUrl;
  }
  if (serviceKey) {
    merged.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  }
  if (anonKey) {
    merged.VITE_SUPABASE_ANON_KEY = anonKey;
    merged.VITE_SUPABASE_PUBLISHABLE_KEY = anonKey;
  }

  const preservedLines = [];
  for (const line of existing.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      preservedLines.push(line);
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      preservedLines.push(line);
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (!MANAGED_KEYS.includes(key)) {
      preservedLines.push(line);
    }
  }

  const managedBlock = [
    '# Commerce E2E — synced by npm run setup:commerce-e2e-secret',
    merged.E2E_SUPABASE_TEST_PROJECT_REF
      ? `E2E_SUPABASE_TEST_PROJECT_REF=${merged.E2E_SUPABASE_TEST_PROJECT_REF}`
      : null,
    testUrl ? `VITE_SUPABASE_TEST_URL=${testUrl}` : null,
    serviceKey ? `SUPABASE_TEST_SERVICE_ROLE_KEY=${serviceKey}` : null,
    anonKey ? `VITE_SUPABASE_TEST_ANON_KEY=${anonKey}` : null,
    testUrl ? `VITE_SUPABASE_URL=${testUrl}` : null,
    serviceKey ? `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}` : null,
    anonKey ? `VITE_SUPABASE_ANON_KEY=${anonKey}` : null,
    anonKey ? `VITE_SUPABASE_PUBLISHABLE_KEY=${anonKey}` : null,
  ].filter(Boolean);

  const body = [...preservedLines.filter(l => l.trim() !== ''), '', ...managedBlock].join('\n');
  writeFileSync(filePath, `${body.trimEnd()}\n`, 'utf8');
  return filePath;
}
