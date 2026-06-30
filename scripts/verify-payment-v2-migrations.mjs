#!/usr/bin/env node
/**
 * Phase 1.1 — Vérifie que les migrations Payment V2 requises existent (offline).
 * Usage: npm run verify:payment-v2-migrations
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(root, 'supabase', 'migrations');

/** Ordre runbook PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md §2 */
const REQUIRED = [
  '20260523120000__payment_orchestration_v2_foundation.sql',
  '20250603120000__fix_order_status_paid_revenue_eligibility.sql',
  '20250603120100__hotfix_store_earnings_trigger_pg42p17.sql',
  '20250603130000__affiliate_paid_trigger_and_connect_earnings.sql',
  '20250603140000__audit_p1_security_refunds_downloads.sql',
  '20250603150000__audit_p2_checkout_rls_subscriptions.sql',
  '20250603160000__physical_product_subscription_lifecycle.sql',
];

/** Routing V2 post-foundation (E29) */
const RECOMMENDED = ['20260611250000__e29_payment_orchestration_v2_routing.sql'];

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  required: {},
  recommended: {},
  blockers: [],
};

for (const file of REQUIRED) {
  const path = join(migrationsDir, file);
  const ok = existsSync(path);
  report.required[file] = ok;
  if (!ok) {
    report.ok = false;
    report.blockers.push(`missing migration: ${file}`);
  }
}

for (const file of RECOMMENDED) {
  report.recommended[file] = existsSync(join(migrationsDir, file));
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
