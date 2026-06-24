/**
 * Vérifie idempotence webhooks via DB linked (sans service role local).
 * Usage: node scripts/verify-webhook-idempotency-remote.mjs
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
  const contractOut = runSql('SELECT public.verify_webhook_idempotency_contract() AS result;');
  const match = contractOut.match(/"ok":\s*(true|false)/);
  report.contract = { raw_snippet: contractOut.slice(0, 500), ok: match?.[1] === 'true' };
  if (!report.contract.ok) {
    fail('verify_webhook_idempotency_contract not ok — migration 20260623190000');
  } else {
    report.ok = true;
  }
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
