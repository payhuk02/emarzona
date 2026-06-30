#!/usr/bin/env node
/**
 * Génère le rapport sign-off Phase 1 paiements.
 * Usage: npm run verify:phase1:signoff
 */
import { spawnSync } from 'node:child_process';

const CHECKS = [
  { label: 'Phase 0 regression', cmd: ['run', 'verify:phase0'] },
  { label: 'Phase 1 commerce core', cmd: ['run', 'verify:phase1'] },
  { label: 'Payment V2 migrations', cmd: ['run', 'verify:payment-v2-migrations'] },
  { label: 'Payment V2 edge functions', cmd: ['run', 'verify:payment-v2-edge-functions'] },
  { label: 'Payment unit tests', cmd: ['run', 'test:unit:payments'] },
  { label: 'Canary rollout contract', cmd: ['run', 'rollout:payment-v2:canary'] },
  { label: 'Payment V2 remote', cmd: ['run', 'verify:payment-v2'] },
  { label: 'Webhook idempotency', cmd: ['run', 'verify:webhook-idempotency'] },
];

const results = [];
let allOk = true;

for (const check of CHECKS) {
  const result = spawnSync('npm', check.cmd, {
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8',
  });
  const ok = result.status === 0;
  results.push({ ...check, ok });
  if (!ok) allOk = false;
}

console.log('\n## Phase 1 — Paiements globaux (sign-off)\n');
console.log('| Check | Commande | Statut |');
console.log('| ----- | -------- | ------ |');

for (const r of results) {
  const cmd = `npm ${r.cmd.join(' ')}`;
  console.log(`| ${r.label} | \`${cmd}\` | ${r.ok ? '✅' : '❌'} |`);
}

console.log('');
console.log('### Rollout canary prod (manuel)');
console.log('');
console.log('| Phase | Variables Vercel | Commande |');
console.log('| ----- | ---------------- | -------- |');
console.log('| 10 % | `VITE_PAYMENT_ORCHESTRATION_V2=true`, `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT=10` | `npm run rollout:payment-v2:10` |');
console.log('| 50 % | `ROLLOUT=50` | `gh workflow run payment-v2-vercel-rollout.yml -f rollout_percent=50` |');
console.log('| 100 % | `ROLLOUT=100` | `gh workflow run payment-v2-vercel-rollout.yml -f rollout_percent=100` |');
console.log('');
console.log(`**Date :** ${new Date().toISOString().slice(0, 10)}`);
console.log(`**Gate Phase 1 paiements :** ${allOk ? 'PASS' : 'FAIL'}`);
console.log('');

process.exit(allOk ? 0 : 1);
