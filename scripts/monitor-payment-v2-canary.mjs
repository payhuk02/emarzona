#!/usr/bin/env node
/**
 * Monitoring canary Payment V2 (gates Phase 0 + checklist 48h).
 * Usage: npm run monitor:payment-v2-canary
 */
import { spawnSync } from 'node:child_process';

const CANARY_DEPLOYED_AT = '2026-07-01T00:00:00Z';
const MIN_HOURS_BEFORE_50 = 48;

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

const deployedMs = Date.parse(CANARY_DEPLOYED_AT);
const hoursSince = (Date.now() - deployedMs) / (1000 * 60 * 60);
const eligible50 = hoursSince >= MIN_HOURS_BEFORE_50 && allOk;

console.log('\n=== Payment V2 canary monitor ===');
console.log(JSON.stringify({ ok: allOk, hoursSinceDeploy: Math.round(hoursSince), eligible50 }, null, 2));

if (eligible50) {
  console.log('\n→ Escalade 50 % autorisée (48h + gates OK):');
  console.log('  gh workflow run payment-v2-vercel-rollout.yml -f rollout_percent=50 -f redeploy=true');
  console.log('  npm run rollout:payment-v2:local -- --rollout 50');
} else if (allOk) {
  const remaining = Math.ceil(MIN_HOURS_BEFORE_50 - hoursSince);
  console.log(`\n⏳ Canary 10 % stable — attendre ~${remaining}h avant escalade 50 %.`);
} else {
  console.log('\n❌ Corriger les gates avant escalade.');
  process.exit(1);
}

process.exit(0);
