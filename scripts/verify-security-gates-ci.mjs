#!/usr/bin/env node
/**
 * Security & Architecture Gates — CI offline (no linked Supabase / remote probes).
 * Remote audits (RLS live, payment-v2, fulfillment) belong to pre-deploy signoff:
 *   npm run verify:phase0:signoff
 */
import { spawnSync } from 'node:child_process';

const steps = [
  { id: 'guards', label: 'Route & billing guards', cmd: 'npm', args: ['run', 'test:guards'] },
  {
    id: 'commerce',
    label: 'Commerce type gating contracts',
    cmd: 'npm',
    args: ['run', 'test:commerce-gating'],
  },
  {
    id: 'portal-rls',
    label: 'Client portal RLS contract',
    cmd: 'npm',
    args: ['run', 'test:client-portal-rls'],
  },
  { id: 'e2e-guard', label: 'E2E prod Supabase guard', cmd: 'npm', args: ['run', 'test:e2e-guard'] },
  {
    id: 'isolation',
    label: 'Multi-store isolation contract',
    cmd: 'npm',
    args: ['run', 'test:multi-store-isolation'],
  },
  {
    id: 'auth-rate-limit',
    label: 'Auth rate limit contract (P0-4)',
    cmd: 'npx',
    args: ['vitest', 'run', 'src/lib/security/__tests__/auth-rate-limit-contract.test.ts'],
  },
  {
    id: 'shell',
    label: 'Shell heavy imports gate',
    cmd: 'npm',
    args: ['run', 'check:shell-imports'],
  },
  {
    id: 'i18n-parity',
    label: 'i18n parity (sidebar + checkout)',
    cmd: 'npm',
    args: ['run', 'audit:i18n-parity'],
  },
  {
    id: 'customer-hub',
    label: 'Customer hub RPC parser (offline)',
    cmd: 'npx',
    args: ['vitest', 'run', 'src/lib/customer/__tests__/fetch-customer-hub-rpc.test.ts'],
  },
];

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  steps: {},
  blockers: [],
};

for (const step of steps) {
  console.log(`\n=== Security CI — ${step.label} ===`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, CI: 'true' },
  });
  const ok = result.status === 0;
  report.steps[step.id] = { ok, label: step.label };
  if (!ok) {
    report.ok = false;
    report.blockers.push(`${step.id}: ${step.label}`);
  }
}

console.log('\n=== Security & Architecture Gates (CI) summary ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
