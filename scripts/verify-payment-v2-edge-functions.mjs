#!/usr/bin/env node
/**
 * Phase 1.2 — Vérifie que les Edge Functions PSP Payment V2 existent (offline).
 * Usage: npm run verify:payment-v2-edge-functions
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const functionsDir = join(root, 'supabase', 'functions');

const REQUIRED = [
  'stripe-connect-onboard',
  'stripe-create-checkout',
  'stripe-connect-webhook',
  'stripe-refund',
  'paypal-partner-onboard',
  'paypal-create-order',
  'paypal-webhook',
  'paypal-refund',
  'moneroo-webhook',
  'moneroo',
];

const report = {
  ok: true,
  timestamp: new Date().toISOString(),
  functions: {},
  blockers: [],
};

for (const name of REQUIRED) {
  const indexPath = join(functionsDir, name, 'index.ts');
  const ok = existsSync(indexPath);
  report.functions[name] = ok;
  if (!ok) {
    report.ok = false;
    report.blockers.push(`missing edge function: ${name}/index.ts`);
  }
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
