/**
 * Resolve dedicated Supabase project ref for commerce E2E (non-production).
 *
 * Priority:
 *   1. E2E_SUPABASE_TEST_PROJECT_REF / SUPABASE_TEST_PROJECT_REF (process.env)
 *   2. .env.e2e.local → E2E_SUPABASE_TEST_PROJECT_REF
 *   3. .env.e2e.local → VITE_SUPABASE_TEST_URL
 *   4. .e2e-commerce-project-ref (single line, gitignored)
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractSupabaseProjectRef } from './e2e-supabase-guard.mjs';
import { loadEnvFile } from './load-e2e-env.mjs';

export function resolveE2ECommerceProjectRef(root = process.cwd()) {
  const fromEnv =
    process.env.E2E_SUPABASE_TEST_PROJECT_REF?.trim() ||
    process.env.SUPABASE_TEST_PROJECT_REF?.trim();
  if (fromEnv) return fromEnv;

  const e2eLayer = loadEnvFile(resolve(root, '.env.e2e.local'));
  const fromE2eRef = e2eLayer.E2E_SUPABASE_TEST_PROJECT_REF?.trim();
  if (fromE2eRef) return fromE2eRef;

  const refFromTestUrl = extractSupabaseProjectRef(e2eLayer.VITE_SUPABASE_TEST_URL?.trim() ?? '');
  if (refFromTestUrl) return refFromTestUrl;

  const configPath = resolve(root, '.e2e-commerce-project-ref');
  if (existsSync(configPath)) {
    const line = readFileSync(configPath, 'utf8')
      .split(/\r?\n/)
      .map(l => l.trim())
      .find(l => l && !l.startsWith('#'));
    if (line) return line.split(/\s+/)[0];
  }

  return '';
}
