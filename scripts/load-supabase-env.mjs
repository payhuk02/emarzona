/**
 * Charge les variables Supabase depuis .env.local / .env et scripts/.cron-secret.local
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadSupabaseEnv() {
  const env = { ...process.env };

  for (const file of ['.env.local', '.env']) {
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
      if (!env[key]) env[key] = val;
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

export function getSupabaseUrl(env = loadSupabaseEnv()) {
  return env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://hbdnzajbyjakdhuavrvb.supabase.co';
}

export function getServiceRoleKey(env = loadSupabaseEnv()) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SB_SERVICE_ROLE_KEY;
  if (!key || key.includes('REMOVED') || key.length < 40) return null;
  return key;
}

export function getCronSecret(env = loadSupabaseEnv()) {
  return env.CRON_SECRET || null;
}
