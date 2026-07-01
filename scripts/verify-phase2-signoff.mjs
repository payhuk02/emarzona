#!/usr/bin/env node
/**
 * Phase 2 sign-off (guards + tests, sans regression Phase 0 remote lente).
 * Usage: npm run verify:phase2:signoff
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CHECKS = [
  { label: 'i18n EN parity', cmd: ['run', 'audit:i18n-parity'] },
  { label: 'Payment V2 migrations', cmd: ['run', 'verify:payment-v2-migrations'] },
  { label: 'Payment V2 edge functions', cmd: ['run', 'verify:payment-v2-edge-functions'] },
  { label: 'Payment unit tests', cmd: ['run', 'test:unit:payments'] },
  { label: 'Checkout tax tests', cmd: ['run', 'test:unit', '--', 'src/lib/checkout/__tests__/taxes.test.ts'] },
  { label: 'Tax zones tests', cmd: ['run', 'test:unit', '--', 'src/lib/checkout/__tests__/tax-zones.test.ts'] },
  { label: 'i18n fallback tests', cmd: ['run', 'test:unit', '--', 'src/i18n/__tests__/config-fallback.test.ts'] },
  { label: 'Canary contract', cmd: ['run', 'rollout:payment-v2:canary'] },
];

const results = [];
let allOk = true;

for (const check of CHECKS) {
  const result = spawnSync('npm', check.cmd, {
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8',
    cwd: root,
  });
  const ok = result.status === 0;
  results.push({ ...check, ok });
  if (!ok) allOk = false;
}

const guards = [
  [
    'checkout-no-hardcoded-tax',
    !readFileSync(join(root, 'src/lib/checkout/taxes.ts'), 'utf8').includes('0.18'),
  ],
  ['i18n-fallback-en', readFileSync(join(root, 'src/i18n/config.ts'), 'utf8').includes("return ['en', 'fr']")],
  ['user-guide-payments', existsSync(join(root, 'docs/USER_GUIDE_PAYMENT_CONNECTIONS.md'))],
  [
    'stripe-tax-edge',
    existsSync(join(root, 'supabase/functions/stripe-tax-calculate/index.ts')),
  ],
];

for (const [name, ok] of guards) {
  results.push({ label: `guard:${name}`, ok });
  if (!ok) allOk = false;
}

console.log('\n## Phase 2 sign-off\n');
console.log('| Check | Statut |');
console.log('| ----- | ------ |');
for (const r of results) {
  console.log(`| ${r.label} | ${r.ok ? '✅' : '❌'} |`);
}
console.log('\n### Canary 10 % GitHub Actions');
console.log('Requis : `VERCEL_TOKEN` + `VERCEL_PROJECT_ID` dans les secrets GitHub.');
console.log('Commande : `npm run setup:payment-v2-github-secrets` puis `npm run rollout:payment-v2:10`');
console.log(`\n**Gate Phase 2 :** ${allOk ? 'PASS' : 'FAIL'}\n`);
process.exit(allOk ? 0 : 1);
