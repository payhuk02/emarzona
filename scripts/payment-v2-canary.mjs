#!/usr/bin/env node
/**
 * Payment V2 canary — vérifications locales + option dispatch GitHub Actions.
 *
 * Usage:
 *   node scripts/payment-v2-canary.mjs --verify-only
 *   node scripts/payment-v2-canary.mjs --rollout 10 --dispatch
 *   npm run rollout:payment-v2:canary
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    rollout: { type: 'string', default: '10' },
    'verify-only': { type: 'boolean', default: false },
    dispatch: { type: 'boolean', default: false },
  },
});

const rollout = String(values.rollout);
const allowed = new Set(['0', '10', '50', '100']);
if (!allowed.has(rollout)) {
  console.error(`Invalid --rollout ${rollout}. Use 0, 10, 50, or 100.`);
  process.exit(1);
}

function run(label, command, args, { optional = false } = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    if (optional) {
      console.warn(`⚠ ${label} skipped or failed (optional)`);
      return false;
    }
    process.exit(result.status ?? 1);
  }
  return true;
}

console.log('=== Payment V2 canary — preflight ===');
console.log(`Target rollout: ${rollout}%`);

run('Feature flags unit tests', 'npx', [
  'vitest',
  'run',
  'src/lib/payments/__tests__/feature-flags.test.ts',
]);

run('Rollout invariants (Playwright contract)', 'npx', [
  'playwright',
  'test',
  'tests/e2e/payment-v2-rollout.spec.ts',
  '--project=chromium',
]);

if (existsSync('.env')) {
  run('Remote Supabase Payment V2 check', 'node', ['scripts/verify-payment-v2-remote.mjs'], {
    optional: true,
  });
} else {
  console.warn('\n⚠ .env absent — skip verify-payment-v2-remote.mjs');
}

if (values['verify-only']) {
  console.log('\n✓ Verify-only complete.');
  process.exit(0);
}

if (values.dispatch) {
  const ghOk = run('GitHub workflow dispatch', 'gh', [
    'workflow',
    'run',
    'payment-v2-vercel-rollout.yml',
    '-f',
    `rollout_percent=${rollout}`,
    '-f',
    'redeploy=true',
  ], { optional: true });

  if (ghOk) {
    console.log('\n✓ Workflow payment-v2-vercel-rollout.yml dispatched.');
    console.log('  Suivre : gh run list --workflow=payment-v2-vercel-rollout.yml');
    process.exit(0);
  }
}

console.log('\n=== Prochaines étapes (rollout manuel) ===');
console.log('');
console.log('Windows (Vercel CLI) :');
console.log(`  .\\scripts\\enable-payment-v2-rollout-vercel.ps1 -RolloutPercent ${rollout} -Redeploy`);
console.log('');
console.log('GitHub Actions :');
console.log(
  `  gh workflow run payment-v2-vercel-rollout.yml -f rollout_percent=${rollout} -f redeploy=true`
);
console.log('');
console.log('Post-déploiement :');
console.log('  npm run verify:payment-v2');
console.log('  npx playwright test tests/e2e/payment-v2-rollout.spec.ts --project=chromium');
console.log('');
console.log('Rollback :');
console.log('  .\\scripts\\enable-payment-v2-rollout-vercel.ps1 -RolloutPercent 0 -SkipRedeploy');
