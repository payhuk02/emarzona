#!/usr/bin/env node
/**
 * Phase 1 — Gate paiements globaux (audit 2026)
 * Usage: npm run verify:phase1-payments
 */
import { spawnSync } from 'node:child_process';

const steps = [
  {
    id: '1.1',
    label: 'Payment V2 migrations (offline)',
    cmd: 'npm',
    args: ['run', 'verify:payment-v2-migrations'],
    required: true,
  },
  {
    id: '1.2',
    label: 'Payment V2 edge functions (offline)',
    cmd: 'npm',
    args: ['run', 'verify:payment-v2-edge-functions'],
    required: true,
  },
  {
    id: '1.3',
    label: 'Payment unit tests',
    cmd: 'npm',
    args: ['run', 'test:unit:payments'],
    required: true,
  },
  {
    id: '1.4',
    label: 'Canary rollout contract',
    cmd: 'node',
    args: [
      'scripts/payment-v2-canary.mjs',
      '--verify-only',
      ...(process.env.VERIFY_FAST === '1' ? ['--fast'] : []),
    ],
    required: true,
  },
  {
    id: '1.5',
    label: 'Payment V2 remote (Supabase)',
    cmd: 'npm',
    args: ['run', 'verify:payment-v2'],
    required: process.env.VERIFY_REQUIRE_REMOTE === '1',
    warnOnFail: true,
  },
  {
    id: '1.6',
    label: 'Webhook idempotency',
    cmd: 'npm',
    args: ['run', 'verify:webhook-idempotency'],
    required: true,
  },
];

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  steps: {},
  warnings: [],
  blockers: [],
};

for (const step of steps) {
  console.log(`\n=== Phase 1.${step.id} — ${step.label} ===`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const ok = result.status === 0;
  report.steps[step.id] = { ok, label: step.label };
  if (!ok) {
    if (step.required) {
      report.ok = false;
      report.blockers.push(`${step.id}: ${step.label}`);
    } else if (step.warnOnFail) {
      report.warnings.push(`${step.id}: ${step.label} — credentials ou CLI Supabase indisponibles`);
    }
  }
}

console.log('\n=== Phase 1 payments summary ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
