#!/usr/bin/env node
/**
 * Configure VAPID Web Push — Vercel (client) + Supabase Edge (server).
 * Usage:
 *   npm run setup:vapid-secrets              # génère + configure
 *   npm run setup:vapid-secrets -- --dry-run
 *   VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... npm run setup:vapid-secrets
 */
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { loadSupabaseEnv, getVercelCredentials } from './load-supabase-env.mjs';
import { generateVapidKeyPair } from './vapid-keygen.mjs';

function getSupabaseProjectRef(url) {
  if (!url) return null;
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/i);
  return m?.[1] ?? null;
}

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    redeploy: { type: 'boolean', default: false },
    generate: { type: 'boolean', default: false },
  },
});

const dryRun = values['dry-run'] || process.env.DRY_RUN === '1';
const env = loadSupabaseEnv();
const { token, projectId, orgId } = getVercelCredentials(env);
const projectRef =
  env.SUPABASE_PROJECT_REF?.trim() ||
  (getSupabaseProjectRef(env.SUPABASE_URL || env.VITE_SUPABASE_URL) ?? 'hbdnzajbyjakdhuavrvb');

let publicKey = env.VAPID_PUBLIC_KEY?.trim() || env.VITE_VAPID_PUBLIC_KEY?.trim();
let privateKey = env.VAPID_PRIVATE_KEY?.trim();

if (!publicKey || !privateKey || values.generate) {
  const generated = await generateVapidKeyPair();
  publicKey = generated.publicKey;
  privateKey = generated.privateKey;
}

if (!token || !projectId) {
  console.error('VERCEL_TOKEN et VERCEL_PROJECT_ID requis (.env) pour VITE_VAPID_PUBLIC_KEY');
  process.exit(1);
}

if (dryRun) {
  console.log('Dry-run VAPID setup');
  console.log(`  Supabase project: ${projectRef}`);
  console.log(`  VITE_VAPID_PUBLIC_KEY: ${publicKey.slice(0, 12)}… (${publicKey.length} chars)`);
  console.log(`  VAPID_PRIVATE_KEY: ${privateKey.slice(0, 8)}… (Supabase Edge only)`);
  process.exit(0);
}

function teamQs() {
  return orgId ? `?teamId=${encodeURIComponent(orgId)}` : '';
}

async function vercelFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Vercel ${method} ${path} → ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

async function upsertVercelEnv(key, value, targets = ['production', 'preview']) {
  const qs = teamQs();
  const list = await vercelFetch(`/v10/projects/${projectId}/env${qs}`);
  for (const target of targets) {
    const existing = (list.envs ?? []).find(
      e => e.key === key && Array.isArray(e.target) && e.target.includes(target)
    );
    if (existing?.id) {
      await vercelFetch(`/v9/projects/${projectId}/env/${existing.id}${qs}`, {
        method: 'PATCH',
        body: { value, target: [target] },
      });
      console.log(`✓ Vercel PATCH ${key} (${target})`);
    } else {
      await vercelFetch(`/v10/projects/${projectId}/env${qs}`, {
        method: 'POST',
        body: { key, value, target: [target], type: 'plain' },
      });
      console.log(`✓ Vercel POST ${key} (${target})`);
    }
  }
}

function setSupabaseSecrets() {
  const vapidSubject =
    env.VAPID_SUBJECT?.trim() || 'mailto:contact@emarzona.com';
  const result = spawnSync(
    'npx',
    [
      'supabase',
      'secrets',
      'set',
      `VAPID_PUBLIC_KEY=${publicKey}`,
      `VAPID_PRIVATE_KEY=${privateKey}`,
      `VAPID_SUBJECT=${vapidSubject}`,
      '--project-ref',
      projectRef,
    ],
    { stdio: 'inherit', shell: process.platform === 'win32' }
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('=== VAPID Web Push — configuration prod ===');
await upsertVercelEnv('VITE_VAPID_PUBLIC_KEY', publicKey);
console.log(`→ Supabase Edge secrets (project ${projectRef})…`);
setSupabaseSecrets();

if (values.redeploy) {
  const qs = teamQs();
  const listQs = qs
    ? `${qs}&projectId=${projectId}&target=production&limit=1`
    : `?projectId=${projectId}&target=production&limit=1`;
  const list = await vercelFetch(`/v6/deployments${listQs}`);
  const deploymentId = list?.deployments?.[0]?.uid ?? list?.deployments?.[0]?.id;
  if (deploymentId) {
    const data = await vercelFetch(`/v13/deployments${qs}`, {
      method: 'POST',
      body: { deploymentId, target: 'production', name: 'emarzona' },
    });
    console.log('✓ Redeploy production:', data.url ?? deploymentId);
  }
}

console.log('\n✓ VAPID configuré. Test: activer push depuis le dashboard vendeur (PWA).');
console.log('  Ne commitez jamais VAPID_PRIVATE_KEY — secrets Supabase uniquement.');
