#!/usr/bin/env node
/**
 * Prépare le rollout Payment V2 canary 10 % — preflight + secrets GitHub + dispatch optionnel.
 *
 * Usage:
 *   npm run prepare:payment-v2-rollout              # dry-run + preflight
 *   npm run prepare:payment-v2-rollout -- --execute   # secrets GH + dispatch workflow 10 %
 *   npm run prepare:payment-v2-rollout -- --local     # rollout Vercel depuis .env
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { loadSupabaseEnv, getVercelCredentials } from './load-supabase-env.mjs';

const { values } = parseArgs({
  options: {
    execute: { type: 'boolean', default: false },
    local: { type: 'boolean', default: false },
    rollout: { type: 'string', default: '10' },
  },
});

const rollout = String(values.rollout);
const env = loadSupabaseEnv();
const { token, projectId, orgId } = getVercelCredentials(env);

const report = {
  ok: true,
  rollout_percent: rollout,
  checks: {},
  blockers: [],
  warnings: [],
};

function check(name, ok, detail, { required = true } = {}) {
  report.checks[name] = { ok, detail };
  if (!ok && required) {
    report.ok = false;
    report.blockers.push(`${name}: ${detail}`);
  } else if (!ok) {
    report.warnings.push(`${name}: ${detail}`);
  }
}

function run(cmd, args, { optional = false } = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0 && !optional) process.exit(r.status ?? 1);
  return r.status === 0;
}

console.log('=== Payment V2 canary — préparation rollout ===\n');

check('vercel_token', !!token, token ? 'VERCEL_TOKEN présent' : 'VERCEL_TOKEN manquant dans .env');
check('vercel_project_id', !!projectId, projectId ? 'VERCEL_PROJECT_ID présent' : 'VERCEL_PROJECT_ID manquant');
check('env_file', existsSync('.env') || existsSync('.env.local'), '.env ou .env.local trouvé', {
  required: false,
});

const ghVersion = spawnSync('gh', ['--version'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
check(
  'gh_cli',
  ghVersion.status === 0,
  ghVersion.status === 0 ? 'GitHub CLI disponible' : 'gh non installé (brew install gh / winget install GitHub.cli)',
  { required: values.execute }
);

if (ghVersion.status === 0 && values.execute) {
  const auth = spawnSync('gh', ['auth', 'status'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  check('gh_auth', auth.status === 0, auth.status === 0 ? 'gh authentifié' : 'gh auth login requis', {
    required: true,
  });
}

console.log('\n--- Preflight canary (verify-only) ---');
run('node', ['scripts/payment-v2-canary.mjs', '--verify-only', '--fast'], { optional: true });

console.log('\n--- Résumé préparation ---');
console.log(JSON.stringify(report, null, 2));

if (!report.ok && (values.execute || values.local)) {
  console.error('\n❌ Corrigez les blockers avant --execute ou --local');
  process.exit(1);
}

if (values.local) {
  console.log('\n--- Rollout local Vercel API ---');
  run('node', [
    'scripts/rollout-payment-v2-from-env.mjs',
    '--rollout',
    rollout,
    '--redeploy',
  ]);
  process.exit(0);
}

if (values.execute) {
  if (!token || !projectId) process.exit(1);
  console.log('\n--- Configuration secrets GitHub + dispatch ---');
  const setup = spawnSync(
    'node',
    ['scripts/setup-payment-v2-github-secrets.mjs'],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        VERCEL_TOKEN: token,
        VERCEL_PROJECT_ID: projectId,
        VERCEL_ORG_ID: orgId ?? '',
      },
    }
  );
  process.exit(setup.status ?? 1);
}

console.log('\n--- Prochaines étapes ---');
console.log('');
console.log('Option A — GitHub Actions (recommandé CI) :');
console.log('  npm run prepare:payment-v2-rollout -- --execute');
console.log('');
console.log('Option B — Vercel direct (depuis .env) :');
console.log('  npm run prepare:payment-v2-rollout -- --local');
console.log('');
console.log('Option C — manuel :');
console.log(`  gh workflow run payment-v2-vercel-rollout.yml -f rollout_percent=${rollout} -f redeploy=true`);
console.log('');
console.log('Post-rollout (48h monitoring) :');
console.log('  npm run verify:payment-v2');
console.log('  npm run verify:fulfillment-monitor');
console.log('  Sentry — error rate checkout < 0,1 %');
console.log('');
console.log('Doc : docs/PAYMENT_V2_CANARY_10_CHECKLIST.md');

process.exit(report.ok ? 0 : 0);
