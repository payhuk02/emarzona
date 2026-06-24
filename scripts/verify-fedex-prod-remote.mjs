/**
 * Vérifie FedEx production via platform-health (OAuth probe côté Edge secrets).
 * Usage: node scripts/verify-fedex-prod-remote.mjs
 */
import { loadSupabaseEnv, getSupabaseUrl, getCronSecret } from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const url = getSupabaseUrl(env);
const cronSecret = getCronSecret(env);

const report = {
  ok: false,
  timestamp: new Date().toISOString(),
  fedex: null,
  overall: null,
  blockers: [],
};

function fail(msg) {
  report.blockers.push(msg);
}

async function main() {
  if (!cronSecret) {
    fail('CRON_SECRET requis (scripts/.cron-secret.local ou $env:CRON_SECRET)');
    printReport();
    process.exit(2);
  }

  const healthUrl = `${url.replace(/\/$/, '')}/functions/v1/platform-health`;
  const res = await fetch(healthUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': cronSecret,
    },
    body: '{}',
  });

  const body = await res.json().catch(() => ({}));
  report.overall = body?.overall ?? null;

  const services = body?.services ?? [];
  const fedex = services.find(s => s.service_key === 'fedex');
  report.fedex = fedex ?? { status: 'missing', message: 'Service fedex absent du status summary' };

  if (!res.ok) {
    fail(`platform-health HTTP ${res.status}`);
  }

  if (!fedex) {
    fail('Service FedEx non présent dans get_platform_status_summary');
  } else if (fedex.status === 'outage') {
    fail(`FedEx outage: ${fedex.message ?? 'credentials ou OAuth'}`);
  } else if (fedex.status === 'degraded') {
    console.warn('WARN: FedEx degraded —', fedex.message);
    report.ok = true;
  } else if (fedex.status === 'operational') {
    report.ok = true;
  } else {
    fail(`Statut FedEx inattendu: ${fedex.status}`);
  }

  if (fedex?.message?.includes('sandbox') && env.ENVIRONMENT === 'production') {
    console.warn('WARN: FedEx OAuth sandbox en environnement production');
  }

  printReport();
  process.exit(report.ok ? 0 : 1);
}

function printReport() {
  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  fail(err instanceof Error ? err.message : String(err));
  printReport();
  process.exit(1);
});
