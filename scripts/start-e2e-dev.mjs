#!/usr/bin/env node
/**
 * Dev server Vite pour Playwright E2E — injecte .env.e2e.local dans le process enfant.
 */
import { spawn } from 'node:child_process';
import { loadE2EEnv, resolveSupabasePublishableKey } from './load-e2e-env.mjs';

const merged = { ...process.env, ...loadE2EEnv() };
const anonKey = resolveSupabasePublishableKey(merged, merged);

if (!merged.VITE_SUPABASE_URL?.trim() || !anonKey.trim()) {
  console.error('[start-e2e-dev] VITE_SUPABASE_URL et clé publishable requises (.env.e2e.local)');
  process.exit(1);
}

merged.VITE_SUPABASE_ANON_KEY = anonKey;
merged.VITE_SUPABASE_PUBLISHABLE_KEY = anonKey;
merged.VITE_E2E_PAYMENT_STUB = merged.VITE_E2E_PAYMENT_STUB ?? 'true';

console.log(
  `[start-e2e-dev] ${merged.VITE_SUPABASE_URL} — publishable ${anonKey.slice(0, 20)}... (${anonKey.length} car.)`
);

const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: merged,
});

child.on('exit', code => process.exit(code ?? 1));
