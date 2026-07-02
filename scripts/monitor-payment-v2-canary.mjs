#!/usr/bin/env node
/**
 * Monitoring Payment V2 (gates Phase 0 + escalade canary).
 * Usage: npm run monitor:payment-v2-canary
 *        npm run monitor:payment-v2-canary -- --rollout 100
 */
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { loadSupabaseEnv, getVercelCredentials } from './load-supabase-env.mjs';

const { values } = parseArgs({
  options: {
    rollout: { type: 'string', default: '10' },
  },
});

const CANARY_DEPLOYED_AT = '2026-07-01T00:00:00Z';
const MIN_HOURS_BEFORE_50 = 48;
const targetRollout = Number(values.rollout);

const checks = [
  { label: 'Payment V2 remote', cmd: ['npm', 'run', 'verify:payment-v2'] },
  { label: 'Webhook idempotency', cmd: ['npm', 'run', 'verify:webhook-idempotency'] },
  { label: 'Fulfillment monitor', cmd: ['npm', 'run', 'verify:fulfillment-monitor'] },
];

const results = [];
let allOk = true;

for (const check of checks) {
  console.log(`\n▶ ${check.label}`);
  const r = spawnSync(check.cmd[0], check.cmd.slice(1), {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const ok = r.status === 0;
  results.push({ ...check, ok });
  if (!ok) allOk = false;
}

async function readVercelRolloutPercent() {
  const env = loadSupabaseEnv();
  const { token, projectId, orgId } = getVercelCredentials(env);
  if (!token || !projectId) return null;
  const qs = orgId ? `?teamId=${encodeURIComponent(orgId)}` : '';
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const hasV2 = (data.envs ?? []).some(
    e => e.key === 'VITE_PAYMENT_ORCHESTRATION_V2' && e.target?.includes('production')
  );
  const hasRollout = (data.envs ?? []).some(
    e => e.key === 'VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT' && e.target?.includes('production')
  );
  return hasV2 && hasRollout ? targetRollout : null;
}

const hoursSince = (Date.now() - Date.parse(CANARY_DEPLOYED_AT)) / (1000 * 60 * 60);
const vercelRolloutConfigured = await readVercelRolloutPercent();
const eligible50 = hoursSince >= MIN_HOURS_BEFORE_50 && allOk && targetRollout < 50;

console.log('\n=== Payment V2 canary monitor ===');
console.log(
  JSON.stringify(
    {
      ok: allOk,
      targetRolloutPercent: targetRollout,
      vercelRolloutEnvPresent: vercelRolloutConfigured !== null,
      hoursSinceDeploy: Math.round(hoursSince),
      eligible50,
    },
    null,
    2
  )
);

if (targetRollout >= 100 && allOk) {
  console.log('\n✓ Payment V2 rollout 100 % — gates OK. Surveiller Sentry 24h post-déploiement.');
} else if (eligible50) {
  console.log('\n→ Escalade 50 % autorisée (48h + gates OK):');
  console.log('  gh workflow run payment-v2-vercel-rollout.yml -f rollout_percent=50 -f redeploy=true');
} else if (allOk && targetRollout < 50) {
  const remaining = Math.ceil(MIN_HOURS_BEFORE_50 - hoursSince);
  console.log(`\n⏳ Canary ${targetRollout} % stable — ~${Math.max(0, remaining)}h avant escalade 50 %.`);
} else {
  console.log('\n❌ Corriger les gates avant escalade.');
  process.exit(1);
}

process.exit(0);
