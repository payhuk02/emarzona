/**
 * Vérifie la config pipeline webhooks sortants (DB linked).
 * Usage: node scripts/verify-webhook-delivery-config.mjs
 *
 * Prérequis prod/staging :
 *   SELECT public.setup_welcome_email_hook(
 *     p_service_role_key := '...',
 *     p_edge_internal_secret := '<EDGE_INTERNAL_SECRET>',
 *     p_supabase_url := 'https://<project>.supabase.co'
 *   );
 */
import { execSync } from 'child_process';

const report = {
  ok: false,
  timestamp: new Date().toISOString(),
  contract: null,
  blockers: [],
};

function fail(msg) {
  report.blockers.push(msg);
}

function runSql(sql) {
  const out = execSync('npx supabase db query --linked', {
    input: sql,
    encoding: 'utf8',
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return out;
}

try {
  const contractOut = runSql('SELECT public.verify_webhook_delivery_config() AS result;');
  const okMatch = contractOut.match(/"ok"\s*:\s*(true|false)/);
  const sourceMatch = contractOut.match(/"config_source"\s*:\s*(?:"([^"]+)"|null)/);

  report.contract = {
    raw_snippet: contractOut.slice(0, 800),
    ok: okMatch?.[1] === 'true',
    config_source: sourceMatch?.[1] ?? null,
  };

  if (!report.contract.ok) {
    fail(
      'verify_webhook_delivery_config not ok — appliquer migrations 20260810140000+20260810150000 et configurer setup_welcome_email_hook (edge_internal_secret + supabase_url)'
    );
  } else {
    report.ok = true;
  }
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
