#!/usr/bin/env node
/**
 * Lance des tests Playwright E2E avec les variables Vercel / .env locales.
 *
 * Les secrets sur Vercel ne sont pas disponibles dans le terminal tant qu'on ne
 * fait pas `vercel env pull` (voir npm run env:e2e:pull).
 *
 * Usage:
 *   npm run env:e2e:pull
 *   npm run test:e2e:vertical-paid:local
 *   node scripts/run-e2e-with-vercel-env.mjs commerce-gating
 *   node scripts/run-e2e-with-vercel-env.mjs vertical-paid
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertE2ESupabaseEnv, loadE2EEnv, validateServiceRoleKeyFormat } from './load-e2e-env.mjs';

const target = process.argv[2] ?? 'vertical-paid';

const scripts = {
  'commerce-gating': 'test:e2e:commerce-gating',
  'store-theme': 'test:e2e:store-theme',
  'vertical-paid': 'test:e2e:vertical-paid',
};

const npmScript = scripts[target];
if (!npmScript) {
  console.error(`Unknown target "${target}". Use: ${Object.keys(scripts).join(', ')}`);
  process.exit(1);
}

const root = process.cwd();
const envFile = resolve(root, '.env.e2e.local');

if (!existsSync(envFile)) {
  console.warn('⚠ .env.e2e.local absent — tentative avec .env / .env.local / process.env');
  console.warn('  Récupérer depuis Vercel : npm run env:e2e:pull');
  console.warn('');
}

const env = loadE2EEnv(root);
const missing = assertE2ESupabaseEnv(env);

if (missing.length > 0) {
  console.error('Variables Supabase manquantes pour E2E :');
  for (const m of missing) console.error(`  - ${m}`);
  console.error('');
  console.error('Sur Vercel : Settings → Environment Variables');
  console.error('  VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (ou PUBLISHABLE_KEY)');
  console.error('  SUPABASE_SERVICE_ROLE_KEY (sans préfixe VITE_ — jamais exposé au client)');
  console.error('');
  console.error('Local :');
  console.error('  npm run env:e2e:pull');
  console.error('  npm run test:e2e:vertical-paid:local');
  console.error('');
  console.error('CI GitHub (séparé de Vercel) : npm run setup:commerce-e2e-secret');
  console.error('');
  console.error('Si Vercel pull laisse SUPABASE_SERVICE_ROLE_KEY vide :');
  console.error('  Copiez sb_secret_... depuis Supabase Dashboard dans .env.e2e.local');
  process.exit(1);
}

const keyFormatError = validateServiceRoleKeyFormat(env.SUPABASE_SERVICE_ROLE_KEY);
if (keyFormatError) {
  console.error(`SUPABASE_SERVICE_ROLE_KEY invalide : ${keyFormatError}`);
  console.error('');
  console.error('Supabase Dashboard → Project hbdnzajbyjakdhuavrvb → Settings → API Keys');
  console.error('  → Secret key (sb_secret_...) — pas l’ancienne clé JWT service_role');
  console.error('');
  console.error('Ou : npm run setup:commerce-e2e-secret (sync depuis Management API)');
  process.exit(1);
}

const publishableKey = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
if (publishableKey && publishableKey.length < 40) {
  console.warn(
    `⚠ VITE_SUPABASE_PUBLISHABLE_KEY courte (${publishableKey.length} car.) — risque "Invalid API key" dans le navigateur.`
  );
  console.warn('  Copiez la clé complète depuis Supabase Dashboard ou : npm run setup:commerce-e2e-secret');
}

console.log(`▶ E2E "${target}" — project ${env.VITE_SUPABASE_URL}`);
console.log('  (service role chargée — ne pas committer .env.e2e.local)');

const result = spawnSync('npm', ['run', npmScript], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    ...env,
    VITE_E2E_PAYMENT_STUB: env.VITE_E2E_PAYMENT_STUB ?? 'true',
  },
});

process.exit(result.status ?? 1);
