#!/usr/bin/env node
/**
 * Phase 2 — Conversion globale (FedEx, i18n EN, TVA, analytics prod-truth)
 * Usage: npm run verify:phase2
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const fullRegression = process.env.PHASE2_FULL_REGRESSION === '1';

const steps = [
  fullRegression
    ? { id: '2.0', label: 'Phase 1 full regression', cmd: 'npm', args: ['run', 'verify:phase1'], required: true }
    : {
        id: '2.0',
        label: 'Phase 1 payments gate (fast)',
        cmd: 'npm',
        args: ['run', 'verify:phase1-payments'],
        required: true,
      },
  {
    id: '2.3',
    label: 'i18n EN parity audit',
    cmd: 'npm',
    args: ['run', 'audit:i18n-parity'],
    required: true,
  },
  {
    id: '2.1',
    label: 'FedEx prod probe',
    cmd: 'npm',
    args: ['run', 'verify:fedex-prod'],
    required: false,
    warnOnFail: true,
  },
  {
    id: '2.6',
    label: 'Checkout tax unit tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/checkout/__tests__/taxes.test.ts'],
    required: true,
  },
  {
    id: '2.1b',
    label: 'booking-trends unit tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/service/__tests__/booking-trends.test.ts'],
    required: true,
  },
  {
    id: '2.4',
    label: 'i18n ES/DE/PT checkout parity',
    cmd: 'npm',
    args: ['run', 'audit:i18n-checkout-locales'],
    required: true,
  },
  {
    id: '2.5',
    label: 'i18n fallback EN contract',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/i18n/__tests__/config-fallback.test.ts'],
    required: true,
  },
];

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  steps: {},
  guards: {},
  warnings: [],
  blockers: [],
};

function guard(name, ok, detail, { required = true } = {}) {
  report.guards[name] = { ok, detail };
  if (!ok && required) {
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
  if (!ok) {
    if (step.required) {
      report.ok = false;
      report.blockers.push(`${step.id}: ${step.label}`);
    } else if (step.warnOnFail) {
      report.warnings.push(`${step.id}: ${step.label} — credentials ou config manquants`);
    }
  }
}

// Guards production-truth Phase 2
const bookingsDashboard = readFileSync(
  join(root, 'src/components/service/BookingsDashboard.tsx'),
  'utf8'
);
guard(
  'bookings-dashboard-no-mock-trends',
  !bookingsDashboard.includes('const bookingsTrend = 12') &&
    !bookingsDashboard.includes('const revenueTrend = 18'),
  'BookingsDashboard must not use hardcoded trend percentages'
);

guard(
  'checkout-no-hardcoded-tax-fallback',
  !readFileSync(join(root, 'src/lib/checkout/taxes.ts'), 'utf8').includes('0.18') &&
    !readFileSync(join(root, 'src/pages/Checkout.tsx'), 'utf8').match(/taxAmount\s*=\s*subtotal\s*\*\s*0\.18/),
  'Checkout must use calculateCheckoutTaxes RPC, not 18% hardcoded fallback'
);

guard(
  'i18n-fallback-en-for-non-fr',
  readFileSync(join(root, 'src/i18n/config.ts'), 'utf8').includes("return ['en', 'fr']"),
  'i18n fallback uses EN before FR for non-FR locales'
);

guard(
  'physical-product-detail-hook',
  readFileSync(join(root, 'src/pages/physical/PhysicalProductDetail.tsx'), 'utf8').includes(
    'usePhysicalProductDetail'
  ),
  'PhysicalProductDetail uses dedicated data hook'
);

guard(
  'user-guide-payment-connections',
  existsSync(join(root, 'docs/USER_GUIDE_PAYMENT_CONNECTIONS.md')),
  'Seller payment connections guide published'
);

const inventoryDashboard = readFileSync(
  join(root, 'src/components/physical/InventoryDashboard.tsx'),
  'utf8'
);
guard(
  'inventory-dashboard-real-turnover',
  inventoryDashboard.includes('useTurnoverReport') &&
    !inventoryDashboard.includes('// MOCK STATS'),
  'InventoryDashboard derives turnover from orders via useTurnoverReport'
);

const taxMigration = join(
  root,
  'supabase/migrations/20260701120000__stripe_tax_no_global_vat_fallback.sql'
);
const stripeTaxFn = join(root, 'supabase/functions/stripe-tax-calculate/index.ts');

guard(
  'stripe-tax-no-global-vat-fallback',
  existsSync(taxMigration) &&
    readFileSync(taxMigration, 'utf8').includes('Pas de taux par défaut global'),
  'SQL migration removes global 18% VAT fallback'
);

guard(
  'stripe-tax-edge-function',
  existsSync(stripeTaxFn) && readFileSync(stripeTaxFn, 'utf8').includes('/tax/calculations'),
  'stripe-tax-calculate edge function present'
);

guard(
  'checkout-taxes-stripe-routing',
  readFileSync(join(root, 'src/lib/checkout/taxes.ts'), 'utf8').includes('shouldUseStripeTax'),
  'calculateCheckoutTaxes routes international to Stripe Tax'
);

console.log('\n=== Phase 2 guards ===');
for (const [name, result] of Object.entries(report.guards)) {
  console.log(`${result.ok ? 'OK' : 'FAIL'} — ${name}: ${result.detail}`);
}

console.log('\n=== Phase 2 summary ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
