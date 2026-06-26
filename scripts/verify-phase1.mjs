#!/usr/bin/env node
/**
 * Phase 1 — Production truth (audit 2026)
 * Usage: npm run verify:phase1
 */
import { spawnSync } from 'node:child_process';

const steps = [
  { id: '0', label: 'Phase 0 regression', cmd: 'npm', args: ['run', 'verify:phase0'], required: true },
  {
    id: '1.5',
    label: 'typecheck:commerce-core',
    cmd: 'npm',
    args: ['run', 'typecheck:commerce-core'],
    required: true,
  },
  { id: '1.6', label: 'lint:ci:critical', cmd: 'npm', args: ['run', 'lint:ci:critical'], required: true },
  {
    id: '1.7',
    label: 'production-truth unit tests',
    cmd: 'npm',
    args: ['run', 'test:production-truth'],
    required: true,
  },
];

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  steps: {},
  blockers: [],
};

for (const step of steps) {
  console.log(`\n=== ${step.id} — ${step.label} ===`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const ok = result.status === 0;
  report.steps[step.id] = { ok, label: step.label };
  if (!ok && step.required) {
    report.ok = false;
    report.blockers.push(`${step.id}: ${step.label}`);
  }
}

console.log('\n=== Phase 1 summary ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
