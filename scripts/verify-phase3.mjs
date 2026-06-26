#!/usr/bin/env node
/**
 * Phase 3 — Différenciation (audit J+90)
 * Usage: npm run verify:phase3
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const steps = [
  { id: '3.0', label: 'Phase 2 regression', cmd: 'npm', args: ['run', 'verify:phase2'], required: true },
  {
    id: '3.1',
    label: 'cross-type bundle tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/checkout/__tests__/cross-type-bundle.test.ts'],
    required: true,
  },
  {
    id: '3.1b',
    label: 'cross-type bundle store tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/bundles/__tests__/cross-type-bundle-store.test.ts'],
    required: true,
  },
  {
    id: '3.2',
    label: 'DRM policy tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/digital/__tests__/drm-policy.test.ts'],
    required: true,
  },
  {
    id: '3.3',
    label: 'vendor API client tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/vendor/__tests__/api-v1-client.test.ts'],
    required: true,
  },
  {
    id: '3.4',
    label: 'vendor API remote smoke',
    cmd: 'node',
    args: ['scripts/verify-vendor-api-remote.mjs'],
    required: true,
  },
];

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  steps: {},
  guards: {},
  blockers: [],
};

function guard(name, ok, detail) {
  report.guards[name] = { ok, detail };
  if (!ok) {
    report.ok = false;
    report.blockers.push(`guard:${name}`);
  }
}

for (const step of steps) {
  console.log(`\n=== ${step.id} — ${step.label} ===`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: root,
  });
  const ok = result.status === 0;
  report.steps[step.id] = { ok, label: step.label };
  if (!ok && step.required) {
    report.ok = false;
    report.blockers.push(`${step.id}: ${step.label}`);
  }
}

guard(
  'checkout-expands-cross-type-bundle',
  readFileSync(join(root, 'src/lib/checkout-order-items.ts'), 'utf8').includes('resolveCheckoutCartItems'),
  'buildOrderItemRows expands cross-type bundles before validation'
);

guard(
  'drm-token-redeem-policy',
  readFileSync(join(root, 'src/hooks/digital/useDownloads.ts'), 'utf8').includes('assertBuyerDownloadMethod'),
  'useGenerateDownloadLink enforces DRM v2 token path'
);

guard(
  'vendor-api-client',
  readFileSync(join(root, 'src/lib/vendor/api-v1-client.ts'), 'utf8').includes('VendorApiV1Client'),
  'Vendor API v1 typed client present'
);

const dashboardRoutes = readFileSync(join(root, 'src/routes/dashboardRoutes.tsx'), 'utf8');
const navMenus = readFileSync(join(root, 'src/config/navigation.menus.tsx'), 'utf8');

guard(
  'vendor-cross-type-bundle-route',
  dashboardRoutes.includes('/dashboard/cross-type-bundles') &&
    dashboardRoutes.includes('CrossTypeBundlesPage'),
  'Dashboard route for cross-type bundle management'
);

guard(
  'vendor-cross-type-bundle-nav',
  navMenus.includes('/dashboard/cross-type-bundles'),
  'Navigation entry for cross-type bundles'
);

console.log('\n=== Phase 3 guards ===');
for (const [name, result] of Object.entries(report.guards)) {
  console.log(`${result.ok ? 'OK' : 'FAIL'} — ${name}: ${result.detail}`);
}

console.log('\n=== Phase 3 summary ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
