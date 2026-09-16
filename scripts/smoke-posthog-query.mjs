/**
 * Smoke test PostHog HogQL — no secrets printed.
 * Usage: node scripts/smoke-posthog-query.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadDotEnv() {
  const p = resolve(process.cwd(), '.env');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

loadDotEnv();

const apiKey = (process.env.POSTHOG_PERSONAL_API_KEY || '').trim();
const projectId = (process.env.POSTHOG_PROJECT_ID || '').trim();
const host = (process.env.POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '');
const projectToken = (process.env.VITE_POSTHOG_PROJECT_TOKEN || '').trim();

const report = {
  viteProjectTokenOk: projectToken.startsWith('phc_') && projectToken.length > 10,
  personalKeyOk: apiKey.startsWith('phx_') && apiKey.length > 20,
  projectIdOk: /^\d+$/.test(projectId),
  projectId,
  host,
  personalKeyPrefix: apiKey ? `${apiKey.slice(0, 4)}…` : null,
};

console.log(JSON.stringify({ config: report }, null, 2));

if (!report.personalKeyOk || !report.projectIdOk) {
  console.error('FAIL: missing POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID');
  process.exit(2);
}

const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: {
      kind: 'HogQLQuery',
      query: 'SELECT count() AS c FROM events WHERE timestamp > now() - INTERVAL 7 DAY',
    },
  }),
});

const text = await res.text();
let parsed = null;
try {
  parsed = JSON.parse(text);
} catch {
  parsed = null;
}

console.log(
  JSON.stringify(
    {
      hogql: {
        http: res.status,
        ok: res.ok,
        hasResults: Array.isArray(parsed?.results),
        eventCount7d: parsed?.results?.[0]?.[0] ?? null,
        error: parsed?.error || (!res.ok ? text.slice(0, 200) : null),
      },
    },
    null,
    2
  )
);

process.exit(res.ok ? 0 : 1);
