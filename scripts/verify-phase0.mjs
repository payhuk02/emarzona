#!/usr/bin/env node
/**
 * Phase 0 — Validation bout en bout (audit 2026)
 * Usage: npm run verify:phase0
 */
import { spawnSync } from 'node:child_process';

const steps = [
  { id: '0.4', label: 'Webhook idempotence contract', cmd: 'npm', args: ['run', 'verify:webhook-idempotency'], required: true },
  { id: '0.3', label: 'Fulfillment monitor', cmd: 'npm', args: ['run', 'verify:fulfillment-monitor'], required: true },
  { id: '0.1', label: 'Payment V2 remote', cmd: 'npm', args: ['run', 'verify:payment-v2'], required: true },
  { id: '0.2', label: 'FedEx prod probe', cmd: 'npm', args: ['run', 'verify:fedex-prod'], required: false, warnOnFail: true },
  { id: '0.5', label: 'Secure deploy smoke', cmd: 'npm', args: ['run', 'verify:secure-deploy'], required: true },
  { id: 'sec', label: 'Security gates (RLS + storage + client portal)', cmd: 'npm', args: ['run', 'audit:security-gates'], required: true },
  { id: '0.4b', label: 'Client portal RLS contract (offline)', cmd: 'npm', args: ['run', 'test:client-portal-rls'], required: true },
  { id: '0.5b', label: 'E2E prod guard (offline)', cmd: 'npm', args: ['run', 'test:e2e-guard'], required: true },
  { id: '0.6', label: 'Edge Functions CI (offline)', cmd: 'npm', args: ['run', 'verify:edge-functions-ci'], required: true },
  { id: '0.7', label: 'Multi-store isolation contract', cmd: 'npm', args: ['run', 'test:multi-store-isolation'], required: true },
];

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  steps: {},
  warnings: [],
  blockers: [],
};

function runStep(step) {
  console.log(`\n=== Phase ${step.id} — ${step.label} ===`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const ok = result.status === 0;
  report.steps[step.id] = { ok, label: step.label, required: step.required };

  if (!ok) {
    if (step.required) {
      report.ok = false;
      report.blockers.push(`${step.id}: ${step.label}`);
    } else if (step.warnOnFail) {
      report.warnings.push(`${step.id}: ${step.label} — credentials ou config manquants`);
    }
  }
}

for (const step of steps) {
  runStep(step);
}

console.log('\n=== Phase 0 summary ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
