#!/usr/bin/env node
/**
 * Phase 4 — Consolidation post J+90 (audit 2026)
 * Usage: npm run verify:phase4
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const steps = [
  { id: '4.0', label: 'Phase 3 regression', cmd: 'npm', args: ['run', 'verify:phase3'], required: true },
  {
    id: '4.1',
    label: 'service product addons tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/service/__tests__/service-product-addons.test.ts'],
    required: true,
  },
  {
    id: '4.2',
    label: 'admin platform analytics tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/admin/__tests__/admin-platform-analytics.test.ts'],
    required: true,
  },
  {
    id: '4.3',
    label: 'emarzona protect policy tests',
    cmd: 'npm',
    args: ['run', 'test:unit', '--', 'src/lib/trust/__tests__/emarzona-protect-policy.test.ts'],
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

const serviceDetail = readFileSync(join(root, 'src/pages/service/ServiceDetail.tsx'), 'utf8');
const serviceCartPolicy = readFileSync(join(root, 'src/lib/cart/service-cart-policy.ts'), 'utf8');
const dashboardRoutes = readFileSync(join(root, 'src/routes/dashboardRoutes.tsx'), 'utf8');
const buyerRlsMigration = join(
  root,
  'supabase/migrations/20260514132000__buyers_rls_use_jwt_email.sql'
);

guard(
  'service-addon-cart-metadata',
  serviceCartPolicy.includes('buildServiceAddonCartMetadata') &&
    serviceCartPolicy.includes('is_service_addon'),
  'Service addon cart metadata helpers present'
);

guard(
  'service-detail-addon-picker',
  serviceDetail.includes('ServiceProductAddonsPicker') &&
    serviceDetail.includes('validateServiceAddonSelection'),
  'ServiceDetail exposes addon picker and validation'
);

guard(
  'vendor-service-addons-route',
  dashboardRoutes.includes('/dashboard/services/addons') &&
    dashboardRoutes.includes('ServiceAddonsPage'),
  'Vendor dashboard route for service addons'
);

guard(
  'service-product-addons-migration',
  existsSync(join(root, 'supabase/migrations/20260626120000__service_product_addons.sql')),
  'service_product_addons migration file present'
);

guard(
  'customer-portal-buyer-rls-migration',
  existsSync(buyerRlsMigration) &&
    readFileSync(buyerRlsMigration, 'utf8').includes('Buyers can select their orders'),
  'Buyer RLS migration for customer portals documented in repo'
);

const adminAnalytics = readFileSync(join(root, 'src/pages/admin/AdminAnalytics.tsx'), 'utf8');

guard(
  'admin-analytics-no-hardcoded-stats',
  !adminAnalytics.includes('totalRevenue: 15680000') &&
    adminAnalytics.includes('useAdminPlatformAnalytics'),
  'AdminAnalytics uses platform RPC instead of hardcoded stats'
);

guard(
  'platform-admin-analytics-rpc',
  existsSync(join(root, 'supabase/migrations/20260626140000__platform_admin_analytics_rpc.sql')) &&
    readFileSync(
      join(root, 'supabase/migrations/20260626140000__platform_admin_analytics_rpc.sql'),
      'utf8'
    ).includes('get_platform_admin_analytics'),
  'Platform admin analytics RPC migration present'
);

const protectPolicy = readFileSync(join(root, 'src/lib/trust/emarzona-protect-policy.ts'), 'utf8');
const checkoutSummary = readFileSync(
  join(root, 'src/components/checkout/cart/CheckoutOrderSummary.tsx'),
  'utf8'
);

guard(
  'emarzona-protect-policy',
  protectPolicy.includes('assessCartProtectEligibility') &&
    protectPolicy.includes('EMARZONA_PROTECT_CLAIM_WINDOW_DAYS'),
  'Emarzona Protect v1 policy module present'
);

guard(
  'emarzona-protect-checkout-badge',
  checkoutSummary.includes('EmarzonaProtectBadge') &&
    checkoutSummary.includes('assessCartProtectEligibility'),
  'Checkout summary shows Protect eligibility badge'
);

guard(
  'emarzona-protect-migration',
  existsSync(join(root, 'supabase/migrations/20260626160000__emarzona_protect_v1.sql')) &&
    readFileSync(
      join(root, 'supabase/migrations/20260626160000__emarzona_protect_v1.sql'),
      'utf8'
    ).includes('create_emarzona_protect_claim'),
  'Emarzona Protect v1 migration with claim RPC'
);

guard(
  'emarzona-protect-public-page',
  readFileSync(join(root, 'src/routes/publicRoutes.tsx'), 'utf8').includes('path="/protect"'),
  'Public /protect landing route'
);

const protectV2Migration = join(root, 'supabase/migrations/20260626180000__emarzona_protect_v2.sql');
const adminDisputes = readFileSync(join(root, 'src/pages/admin/AdminDisputes.tsx'), 'utf8');

guard(
  'emarzona-protect-v2-migration',
  existsSync(protectV2Migration) &&
    readFileSync(protectV2Migration, 'utf8').includes('resolve_emarzona_protect_dispute') &&
    readFileSync(protectV2Migration, 'utf8').includes('backfill_emarzona_protect_enrollments'),
  'Emarzona Protect v2 migration (escrow, resolve, backfill)'
);

guard(
  'emarzona-protect-v2-policy',
  protectPolicy.includes("EMARZONA_PROTECT_VERSION = 'v2'") &&
    protectPolicy.includes("'service'") &&
    protectPolicy.includes('PROTECT_RESOLUTION_OPTIONS'),
  'Emarzona Protect v2 policy (services, resolutions)'
);

guard(
  'emarzona-protect-admin-badge',
  adminDisputes.includes('EmarzonaProtectDisputeBadge') &&
    adminDisputes.includes('ProtectDisputeResolvePanel'),
  'Admin disputes UI shows Protect badge and resolve panel'
);

console.log('\n=== Phase 4 guards ===');
for (const [name, result] of Object.entries(report.guards)) {
  console.log(`${result.ok ? 'OK' : 'FAIL'} — ${name}: ${result.detail}`);
}

console.log('\n=== Phase 4 summary ===');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
