/**
 * Charge les variables Supabase depuis .env.local / .env et scripts/.cron-secret.local
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadSupabaseEnv() {
  const env = { ...process.env };

  for (const file of ['.env.local', '.env', '.env.production', '.env.e2e.local']) {
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue;
      const i = line.indexOf('=');
      if (i === -1) continue;
      const key = line.slice(0, i).trim();
      let val = line.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (env[key] === undefined || env[key] === '') env[key] = val;
    }
  }

  // Canonical local cron secret (rotate-cron-secret / Get-CronSecret.ps1) overrides stale .env values.
  const cronFile = join(__dirname, '.cron-secret.local');
  if (existsSync(cronFile)) {
    const raw = readFileSync(cronFile, 'utf8').trim();
    if (raw) env.CRON_SECRET = raw;
  }

  return env;
}

export function getEdgeInternalSecret(env = loadSupabaseEnv()) {
  const secretFile = join(__dirname, '.edge-internal-secret.local');
  if (existsSync(secretFile)) {
    const raw = readFileSync(secretFile, 'utf8').trim();
    if (raw) return raw;
  }
  return env.EDGE_INTERNAL_SECRET?.trim() || null;
}

export function getSupabaseUrl(env = loadSupabaseEnv()) {
  return env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://hbdnzajbyjakdhuavrvb.supabase.co';
}

export function getServiceRoleKey(env = loadSupabaseEnv()) {
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_TEST_SERVICE_ROLE_KEY ||
    env.SB_SERVICE_ROLE_KEY;
  if (!key || key.includes('REMOVED') || key.length < 40) return null;
  return key;
}

export function getVercelCredentials(env = loadSupabaseEnv()) {
  const token = (env.VERCEL_TOKEN || env.VERCEL_API_TOKEN)?.trim() || null;
  const projectId = env.VERCEL_PROJECT_ID?.trim() || null;
  const orgId = env.VERCEL_ORG_ID?.trim() || null;
  return { token, projectId, orgId };
}

export function getCronSecret(env = loadSupabaseEnv()) {
  return env.CRON_SECRET || null;
}
