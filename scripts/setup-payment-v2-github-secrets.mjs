#!/usr/bin/env node
/**
 * Configure les secrets GitHub requis pour payment-v2-vercel-rollout.yml
 * Usage: VERCEL_TOKEN=... VERCEL_PROJECT_ID=... npm run setup:payment-v2-github-secrets
 *        npm run setup:payment-v2-github-secrets -- --dry-run
 */
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { loadSupabaseEnv, getVercelCredentials } from './load-supabase-env.mjs';

function resolveGhRepo() {
  if (process.env.GH_REPO?.trim()) return process.env.GH_REPO.trim();
  const r = spawnSync('git', ['remote', 'get-url', 'origin'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) return null;
  const url = r.stdout.trim();
  const m = url.match(/github\.com[:/]([^/]+\/[^/.]+)/i);
  return m ? m[1].replace(/\.git$/, '') : null;
}

const ghRepo = resolveGhRepo();
const ghRepoArgs = ghRepo ? ['-R', ghRepo] : [];

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
  },
});

const dryRun = values['dry-run'] || process.env.DRY_RUN === '1';
const env = loadSupabaseEnv();
const { token: fromEnvToken, projectId: fromEnvProject } = getVercelCredentials(env);
const token = (process.env.VERCEL_TOKEN || fromEnvToken)?.trim();
const projectId = (process.env.VERCEL_PROJECT_ID || fromEnvProject)?.trim();
const orgId = (process.env.VERCEL_ORG_ID || env.VERCEL_ORG_ID)?.trim();

if (!token || !projectId) {
  console.error('Missing required env vars:');
  console.error('  VERCEL_TOKEN       — https://vercel.com/account/tokens');
  console.error('  VERCEL_PROJECT_ID  — Vercel Dashboard → Project → Settings → General');
  console.error('');
  console.error('Alternative sans GitHub :');
  console.error('  npm run prepare:payment-v2-rollout -- --local');
  process.exit(1);
}

if (dryRun) {
  console.log('Dry-run — secrets qui seraient configurés :');
  console.log(`  VERCEL_TOKEN: ${token.slice(0, 6)}…`);
  console.log(`  VERCEL_PROJECT_ID: ${projectId}`);
  if (orgId) console.log(`  VERCEL_ORG_ID: ${orgId}`);
  console.log('\nDispatch : payment-v2-vercel-rollout.yml rollout_percent=10');
  process.exit(0);
}

function setSecret(name, value) {
  const result = spawnSync('gh', [...ghRepoArgs, 'secret', 'set', name, '--body', value], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Setting GitHub repository secrets for Payment V2 rollout${ghRepo ? ` (${ghRepo})` : ''}...`);
setSecret('VERCEL_TOKEN', token);
setSecret('VERCEL_PROJECT_ID', projectId);
if (orgId) setSecret('VERCEL_ORG_ID', orgId);

console.log('');
console.log('✓ Secrets configured. Dispatching canary 10 %...');
const dispatch = spawnSync(
  'gh',
  [
    ...ghRepoArgs,
    'workflow',
    'run',
    'payment-v2-vercel-rollout.yml',
    '-f',
    'rollout_percent=10',
    '-f',
    'redeploy=true',
  ],
  { stdio: 'inherit', shell: process.platform === 'win32' }
);
process.exit(dispatch.status ?? 0);
