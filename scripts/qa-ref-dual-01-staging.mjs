/**
 * REF-DUAL-01 — validation staging (Supabase linked project)
 *
 * Prérequis:
 *   - Edge stripe-connect-webhook + stripe-refund déployés (fix REF-DUAL-01)
 *   - Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *   - Au moins 1 store_payment_connections stripe_connect active
 *   - Transaction stripe_connect status=completed OU variables pour en créer une
 *
 * Usage:
 *   npx supabase db query --linked  (utilisé en pré-vol via ce script si pas de clé admin)
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... STRIPE_SECRET_KEY=sk_test_... node scripts/qa-ref-dual-01-staging.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || loadEnvKey('SUPABASE_SERVICE_ROLE_KEY');
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || loadEnvKey('STRIPE_SECRET_KEY');
const VENDOR_EMAIL = process.env.VENDOR_EMAIL || 'vendor-test@emarzona.com';
const VENDOR_PASSWORD = process.env.VENDOR_PASSWORD || 'TestPassword123!';
const TRANSACTION_ID = process.env.TRANSACTION_ID || '';
const POLL_MS = 3000;
const POLL_MAX = 12;

function loadEnvKey(name) {
  try {
    const raw = readFileSync('.env', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue;
      const i = line.indexOf('=');
      if (i === -1) continue;
      const key = line.slice(0, i).trim();
      if (key !== name) continue;
      let val = line.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return val;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

const report = {
  scenario: 'REF-DUAL-01',
  timestamp: new Date().toISOString(),
  pass: false,
  blockers: [],
  steps: {},
};

function fail(msg) {
  report.blockers.push(msg);
}

async function main() {
  if (!SERVICE_KEY || SERVICE_KEY.includes('REMOVED')) {
    fail(
      'SUPABASE_SERVICE_ROLE_KEY manquant — utiliser sb_secret_... (les JWT legacy service_role sont désactivés sur ce projet)'
    );
    printReport();
    process.exit(2);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    loadEnvKey('VITE_SUPABASE_ANON_KEY') ||
    loadEnvKey('VITE_SUPABASE_PUBLISHABLE_KEY');

  report.steps.pf01 = {};

  const { count: stripeConnCount, error: connErr } = await admin
    .from('store_payment_connections')
    .select('*', { count: 'exact', head: true })
    .eq('provider', 'stripe_connect')
    .eq('external_account_status', 'active');

  report.steps.pf01.stripe_connect_active = stripeConnCount ?? 0;
  if (connErr) fail(`store_payment_connections: ${connErr.message}`);
  if (!stripeConnCount) fail('Aucune connexion stripe_connect active sur staging');

  if (!STRIPE_KEY) fail('STRIPE_SECRET_KEY absent (secrets Supabase + .env local)');
  report.steps.pf01.stripe_secret_configured = Boolean(STRIPE_KEY);

  let transactionId = TRANSACTION_ID;
  if (!transactionId) {
    const { data: txs, error: txErr } = await admin
      .from('transactions')
      .select('id, status, store_id, provider_payment_intent_id, created_at')
      .eq('payment_provider', 'stripe_connect')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (txErr) fail(`transactions query: ${txErr.message}`);
    transactionId = txs?.[0]?.id ?? '';
    report.steps.pf01.candidate_transaction = txs?.[0] ?? null;
  }

  if (!transactionId) {
    fail(
      'Aucune transaction stripe_connect completed — exécuter PAY-01 (checkout Stripe test) avant REF-DUAL-01'
    );
    printReport();
    process.exit(3);
  }

  if (!STRIPE_KEY) {
    printReport();
    process.exit(3);
  }

  if (!anonKey) {
    fail('Clé anon/publishable requise pour auth vendeur');
    printReport();
    process.exit(2);
  }

  const userClient = createClient(SUPABASE_URL, anonKey);
  const { data: authData, error: authErr } = await userClient.auth.signInWithPassword({
    email: VENDOR_EMAIL,
    password: VENDOR_PASSWORD,
  });

  if (authErr || !authData.session) {
    fail(`Auth vendeur (${VENDOR_EMAIL}): ${authErr?.message ?? 'no session'}`);
    printReport();
    process.exit(4);
  }

  const { data: txBefore } = await admin
    .from('transactions')
    .select('id, status, metadata, store_id, provider_payment_intent_id')
    .eq('id', transactionId)
    .single();

  const { data: store } = await admin
    .from('stores')
    .select('user_id')
    .eq('id', txBefore.store_id)
    .single();

  if (store?.user_id !== authData.user.id) {
    fail('Le compte vendeur ne possède pas la boutique de la transaction');
    printReport();
    process.exit(4);
  }

  report.steps.ref_vui_01 = { transaction_id: transactionId, status_before: txBefore?.status };

  const refundRes = await fetch(`${SUPABASE_URL}/functions/v1/stripe-refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactionId, reason: 'QA REF-DUAL-01 staging' }),
  });

  const refundBody = await refundRes.json().catch(() => ({}));
  report.steps.ref_vui_01.http_status = refundRes.status;
  report.steps.ref_vui_01.response = refundBody;

  if (!refundRes.ok || !refundBody.success) {
    fail(`stripe-refund failed: ${refundBody.error ?? refundRes.status}`);
    printReport();
    process.exit(5);
  }

  await sleep(POLL_MS);

  const { data: txAfter } = await admin
    .from('transactions')
    .select('id, status, metadata, refunded_at')
    .eq('id', transactionId)
    .single();

  report.steps.ref_vui_01.status_after = txAfter?.status;
  report.steps.ref_vui_01.refund_id =
    txAfter?.metadata && typeof txAfter.metadata === 'object'
      ? (txAfter.metadata).refund?.refund_id
      : null;

  const checks = {
    tx_refunded: txAfter?.status === 'refunded',
    refund_id_is_re: String(report.steps.ref_vui_01.refund_id ?? '').startsWith('re_'),
  };

  let webhookOk = false;
  for (let i = 0; i < POLL_MAX; i++) {
    const { data: events } = await admin
      .from('payment_webhook_events')
      .select('external_event_id, event_type, processing_error, created_at, processed_at')
      .eq('provider', 'stripe_connect')
      .eq('event_type', 'charge.refunded')
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    report.steps.ref_dual_01 = { poll_attempt: i + 1, recent_charge_refunded_events: events ?? [] };

    const bad = (events ?? []).find(e => e.processing_error);
    const good = (events ?? []).some(e => !e.processing_error && e.processed_at);
    if (good && !bad) {
      webhookOk = true;
      break;
    }
    if (bad) {
      fail(`charge.refunded processing_error: ${bad.processing_error}`);
      break;
    }
    await sleep(POLL_MS);
  }

  const { count: logCount } = await admin
    .from('transaction_logs')
    .select('*', { count: 'exact', head: true })
    .eq('transaction_id', transactionId)
    .eq('event_type', 'refund_completed');

  checks.single_refund_log = logCount === 1;
  checks.webhook_no_error = webhookOk;

  report.steps.ref_dual_01.checks = checks;
  report.pass =
    checks.tx_refunded &&
    checks.refund_id_is_re &&
    checks.single_refund_log &&
    checks.webhook_no_error;

  printReport();
  process.exit(report.pass ? 0 : 6);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function printReport() {
  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  fail(err instanceof Error ? err.message : String(err));
  printReport();
  process.exit(1);
});
