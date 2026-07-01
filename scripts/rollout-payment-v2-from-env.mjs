#!/usr/bin/env node
/**
 * Rollout Payment V2 canary depuis .env (VERCEL_TOKEN + VERCEL_PROJECT_ID).
 * Usage: npm run rollout:payment-v2:local
 *        node scripts/rollout-payment-v2-from-env.mjs --rollout 10 --redeploy
 */
import { parseArgs } from 'node:util';
import { loadSupabaseEnv } from './load-supabase-env.mjs';

const { values } = parseArgs({
  options: {
    rollout: { type: 'string', default: '10' },
    redeploy: { type: 'boolean', default: true },
    'setup-github': { type: 'boolean', default: false },
  },
});

const rollout = String(values.rollout);
const env = loadSupabaseEnv();
const token = (env.VERCEL_TOKEN || env.VERCEL_API_TOKEN)?.trim();
const projectId = env.VERCEL_PROJECT_ID?.trim();
const orgId = env.VERCEL_ORG_ID?.trim();

if (!token || !projectId) {
  console.error('VERCEL_TOKEN (ou VERCEL_API_TOKEN) et VERCEL_PROJECT_ID requis dans .env');
  process.exit(1);
}

const allowed = new Set(['0', '10', '50', '100']);
if (!allowed.has(rollout)) {
  console.error(`Invalid rollout ${rollout}. Use 0, 10, 50, or 100.`);
  process.exit(1);
}

function teamQs() {
  return orgId ? `?teamId=${encodeURIComponent(orgId)}` : '';
}

async function vercelFetch(path, { method = 'GET', body } = {}) {
  const url = `https://api.vercel.com${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const hint =
      res.status === 403 && text.includes('invalidToken')
        ? ' — vérifiez VERCEL_TOKEN (token compte: vercel.com/account/tokens, scope Full Account). Les tokens vcp_* projet peuvent être insuffisants.'
        : orgId
          ? ''
          : ' — si projet team, ajoutez VERCEL_ORG_ID dans .env';
    throw new Error(`Vercel API ${method} ${path} → ${res.status}: ${text.slice(0, 300)}${hint}`);
  }
  return data;
}

async function upsertEnv(key, value) {
  const qs = teamQs();
  const list = await vercelFetch(`/v10/projects/${projectId}/env${qs}`);
  const existing = (list.envs ?? []).find(
    e => e.key === key && Array.isArray(e.target) && e.target.includes('production')
  );

  if (existing?.id) {
    await vercelFetch(`/v9/projects/${projectId}/env/${existing.id}${qs}`, {
      method: 'PATCH',
      body: { value, target: ['production'] },
    });
    console.log(`✓ PATCH ${key}=${value} (production)`);
  } else {
    await vercelFetch(`/v10/projects/${projectId}/env${qs}`, {
      method: 'POST',
      body: { key, value, target: ['production'], type: 'plain' },
    });
    console.log(`✓ POST ${key}=${value} (production)`);
  }
}

async function redeployProduction() {
  const qs = teamQs();
  const listQs = qs ? `${qs}&projectId=${projectId}&target=production&limit=1` : `?projectId=${projectId}&target=production&limit=1`;
  const list = await vercelFetch(`/v6/deployments${listQs}`);
  const deploymentId = list?.deployments?.[0]?.uid ?? list?.deployments?.[0]?.id;
  if (!deploymentId) {
    console.warn('⚠ Aucun déploiement production — redeploy manuel : Vercel Dashboard → Redeploy');
    return;
  }
  try {
    const data = await vercelFetch(`/v13/deployments${qs}`, {
      method: 'POST',
      body: { deploymentId, target: 'production', name: 'emarzona' },
    });
    console.log('✓ Redeploy production lancé:', data.url ?? data.id ?? deploymentId);
  } catch (err) {
    console.warn('⚠ Redeploy API échoué — variables VITE_* déjà à jour.');
    console.warn('  → Vercel Dashboard → Deployments → Redeploy (production) pour activer le build.');
    if (err instanceof Error) console.warn(`  (${err.message.slice(0, 120)})`);
  }
}

console.log(`=== Payment V2 rollout ${rollout}% (depuis .env) ===`);

await upsertEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'true');
await upsertEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT', rollout);

if (values.redeploy) {
  await redeployProduction();
} else {
  console.log('Redeploy ignoré — relancez depuis Vercel Dashboard pour appliquer les VITE_*');
}

if (values['setup-github']) {
  const { spawnSync } = await import('node:child_process');
  console.log('\n→ Duplication vers secrets GitHub...');
  const r = spawnSync('node', ['scripts/setup-payment-v2-github-secrets.mjs'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, VERCEL_TOKEN: token, VERCEL_PROJECT_ID: projectId, VERCEL_ORG_ID: orgId ?? '' },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('\nPost-déploiement: npm run verify:payment-v2');
console.log('Contrat canary: npm run rollout:payment-v2:canary');
