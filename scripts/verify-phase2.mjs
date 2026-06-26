#!/usr/bin/env node
/**
 * Phase 2 — Conversion globale (audit J+60)
 * Usage: npm run verify:phase2
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const steps = [
  { id: '2.0', label: 'Phase 1 regression', cmd: 'npm', args: ['run', 'verify:phase1'], required: true },
  {
    id: '2.1',
    label: 'booking-trends unit tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/service/__tests__/booking-trends.test.ts'],
    required: true,
  },
  {
    id: '2.2',
    label: 'physical product detail module',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/admin/__tests__/admin-products-query.test.ts'],
    required: false,
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

// Guards production-truth Phase 2
const bookingsDashboard = readFileSync(join(root, 'src/components/service/BookingsDashboard.tsx'), 'utf8');
guard(
  'bookings-dashboard-no-mock-trends',
  !bookingsDashboard.includes('const bookingsTrend = 12') &&
    !bookingsDashboard.includes('const revenueTrend = 18'),
  'BookingsDashboard must not use hardcoded trend percentages'
);

guard(
  'physical-product-detail-hook',
  readFileSync(join(root, 'src/pages/physical/PhysicalProductDetail.tsx'), 'utf8').includes(
    'usePhysicalProductDetail'
  ),
  'PhysicalProductDetail uses dedicated data hook'
);

guard(
  'art-landing-route',
  readFileSync(join(root, 'src/routes/publicRoutes.tsx'), 'utf8').includes('path="/art"'),
  'Public /art landing route registered'
);

guard(
  'courses-itemlist-schema',
  readFileSync(join(root, 'src/pages/courses/CoursesCatalog.tsx'), 'utf8').includes('ItemListSchema'),
  'CoursesCatalog includes ItemListSchema'
);

console.log('\n=== Phase 2 guards ===');
for (const [name, result] of Object.entries(report.guards)) {
  console.log(`${result.ok ? 'OK' : 'FAIL'} — ${name}: ${result.detail}`);
}

console.log('\n=== Phase 2 summary ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
