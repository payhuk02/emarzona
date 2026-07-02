#!/usr/bin/env node
/**
 * Vérifie Upstash Redis (Vercel + Supabase Edge) — lecture seule.
 * Usage: npm run verify:upstash-prod
 */
import { spawnSync } from 'node:child_process';
import { loadSupabaseEnv, getVercelCredentials } from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const { token, projectId, orgId } = getVercelCredentials(env);
const projectRef =
  env.SUPABASE_PROJECT_REF?.trim() ||
  (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ||
  'hbdnzajbyjakdhuavrvb';

const report = {
  ok: false,
  timestamp: new Date().toISOString(),
  vercel: { url: false, token: false },
  supabase: { url: false, token: false },
  ping: null,
  blockers: [],
};

async function checkVercel() {
  if (!token || !projectId) {
    report.blockers.push('VERCEL_TOKEN/VERCEL_PROJECT_ID missing for Vercel env check');
    return;
  }
  const qs = orgId ? `?teamId=${encodeURIComponent(orgId)}` : '';
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    report.blockers.push(`Vercel env list failed: ${res.status}`);
    return;
  }
  const data = await res.json();
  const keys = new Set((data.envs ?? []).map(e => e.key));
  report.vercel.url = keys.has('UPSTASH_REDIS_REST_URL');
  report.vercel.token = keys.has('UPSTASH_REDIS_REST_TOKEN');
  if (!report.vercel.url || !report.vercel.token) {
    report.blockers.push('Upstash env vars missing on Vercel (run set-upstash-vercel-env.ps1)');
  }
}

function checkSupabaseSecrets() {
  const r = spawnSync('npx', ['supabase', 'secrets', 'list', '--project-ref', projectRef], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    report.blockers.push('supabase secrets list failed');
    return;
  }
  report.supabase.url = /UPSTASH_REDIS_REST_URL/.test(r.stdout);
  report.supabase.token = /UPSTASH_REDIS_REST_TOKEN/.test(r.stdout);
  if (!report.supabase.url || !report.supabase.token) {
    report.blockers.push('Upstash secrets missing on Supabase Edge');
  }
}

async function pingUpstash() {
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !upstashToken) {
    report.ping = { skipped: true, reason: 'UPSTASH_* not in local .env — Vercel/Supabase presence only' };
    return;
  }
  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    const body = await res.text();
    report.ping = { ok: res.ok, status: res.status, body: body.slice(0, 80) };
    if (!res.ok) report.blockers.push(`Upstash ping failed: ${res.status}`);
  } catch (err) {
    report.blockers.push(`Upstash ping error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

await checkVercel();
checkSupabaseSecrets();
await pingUpstash();

report.ok =
  report.vercel.url &&
  report.vercel.token &&
  report.supabase.url &&
  report.supabase.token &&
  report.blockers.length === 0;

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
