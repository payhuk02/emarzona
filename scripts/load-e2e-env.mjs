/**
 * Charge un fichier .env (KEY=VALUE) sans dépendance dotenv.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnvFile(filePath) {
  const abs = resolve(filePath);
  if (!existsSync(abs)) return {};

  const env = {};
  for (const line of readFileSync(abs, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val !== '') env[key] = val;
  }
  return env;
}

function mergeEnvLayers(...layers) {
  const merged = {};
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object') continue;
    for (const [key, value] of Object.entries(layer)) {
      if (typeof value === 'string' && value.trim() !== '') {
        merged[key] = value.trim();
      }
    }
  }
  return merged;
}

/** Priorité : process.env < .env < .env.local < .env.e2e.local (Vercel pull) */
export function loadE2EEnv(root = process.cwd()) {
  const merged = mergeEnvLayers(
    loadEnvFile(resolve(root, '.env')),
    loadEnvFile(resolve(root, '.env.local')),
    loadEnvFile(resolve(root, '.env.e2e.local')),
    process.env
  );

  const url =
    merged.VITE_SUPABASE_URL ??
    merged.SUPABASE_URL ??
    merged.VITE_SUPABASE_TEST_URL ??
    '';

  const anonKey =
    merged.VITE_SUPABASE_ANON_KEY ??
    merged.VITE_SUPABASE_PUBLISHABLE_KEY ??
    merged.VITE_SUPABASE_TEST_ANON_KEY ??
    '';

  const serviceKey =
    merged.SUPABASE_SERVICE_ROLE_KEY ??
    merged.SUPABASE_TEST_SERVICE_ROLE_KEY ??
    '';

  return {
    ...merged,
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: anonKey || merged.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_PUBLISHABLE_KEY:
      merged.VITE_SUPABASE_PUBLISHABLE_KEY ?? anonKey ?? merged.VITE_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  };
}

export function assertE2ESupabaseEnv(env) {
  const missing = [];
  if (!env.VITE_SUPABASE_URL?.trim()) {
    missing.push('VITE_SUPABASE_URL (ou VITE_SUPABASE_TEST_URL)');
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_TEST_SERVICE_ROLE_KEY)');
  }
  if (!env.VITE_SUPABASE_ANON_KEY?.trim() && !env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()) {
    missing.push('VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY');
  }
  return missing;
}
