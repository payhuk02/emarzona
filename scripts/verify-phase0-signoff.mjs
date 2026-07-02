#!/usr/bin/env node
/**
 * Génère le tableau §6 de SECURE_DEPLOY_CHECKLIST.md (Phase 0 sign-off).
 * Usage: npm run verify:phase0:signoff
 */
import { spawnSync } from 'node:child_process';

const CHECKS = [
  { label: 'Idempotence webhooks', cmd: ['run', 'verify:webhook-idempotency'] },
  { label: 'Fulfillment monitor', cmd: ['run', 'verify:fulfillment-monitor'] },
  { label: 'Payment V2', cmd: ['run', 'verify:payment-v2'] },
  { label: 'FedEx prod', cmd: ['run', 'verify:fedex-prod'], optional: true },
  { label: 'Secure deploy', cmd: ['run', 'verify:secure-deploy'] },
  { label: 'RLS + storage + client portal', cmd: ['run', 'audit:security-gates'] },
  { label: 'Client portal RLS contract (offline)', cmd: ['run', 'test:client-portal-rls'] },
  { label: 'Edge Functions CI (offline)', cmd: ['run', 'verify:edge-functions-ci'] },
  { label: 'Multi-store isolation contract', cmd: ['run', 'test:multi-store-isolation'] },
];

const results = [];
let allRequiredOk = true;

for (const check of CHECKS) {
  const result = spawnSync('npm', check.cmd, {
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8',
  });
  const ok = result.status === 0;
  results.push({ ...check, ok });
  if (!ok && !check.optional) allRequiredOk = false;
}

console.log('\n## Phase 0 sign-off (auto-generated)\n');
console.log('| Check | Commande | Statut |');
console.log('| ----- | -------- | ------ |');

for (const r of results) {
  const cmd = `npm ${r.cmd.join(' ')}`;
  const status = r.ok ? '✅' : r.optional ? '⚠️ (optionnel)' : '❌';
  console.log(`| ${r.label} | \`${cmd}\` | ${status} |`);
}

console.log('');
console.log(`**Date :** ${new Date().toISOString().slice(0, 10)}`);
console.log(`**Gate Phase 0 :** ${allRequiredOk ? 'PASS' : 'FAIL — corriger les ❌ avant signature'}`);
console.log('');

process.exit(allRequiredOk ? 0 : 1);
