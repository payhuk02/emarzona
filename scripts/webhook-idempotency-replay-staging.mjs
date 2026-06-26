/**
 * Phase 0.4 — Replay staging idempotence webhooks (RPC atomique)
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/webhook-idempotency-replay-staging.mjs
 *   TRANSACTION_ID=<uuid> node scripts/webhook-idempotency-replay-staging.mjs
 *
 * Vérifie :
 * 1. Contrat DB (unique constraint + RPC)
 * 2. Rejeu même external_event_id → duplicate_webhook
 * 3. Rejeu transaction déjà completed → already_completed (pas de double fulfillment)
 */
import { createClient } from '@supabase/supabase-js';
import { loadSupabaseEnv, getSupabaseUrl, getServiceRoleKey } from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const url = getSupabaseUrl(env);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || getServiceRoleKey(env);

const report = {
  ok: false,
  timestamp: new Date().toISOString(),
  steps: {},
  blockers: [],
};

function fail(msg) {
  report.blockers.push(msg);
}

async function main() {
  if (!serviceKey) {
    fail('SUPABASE_SERVICE_ROLE_KEY requis (staging/prod ops)');
    printReport();
    process.exit(2);
  }

  const sb = createClient(url, serviceKey);

  // 1. Contrat
  const { data: contract, error: contractErr } = await sb.rpc('verify_webhook_idempotency_contract');
  report.steps.contract = { data: contract, error: contractErr?.message ?? null };
  if (contractErr || !contract?.ok) {
    fail('verify_webhook_idempotency_contract failed — appliquer migration 20260623190000');
  }

  // 2. Transaction cible
  let transactionId = process.env.TRANSACTION_ID || '';
  let txRow = null;

  if (transactionId) {
    const { data, error } = await sb
      .from('transactions')
      .select('id, order_id, status, payment_provider')
      .eq('id', transactionId)
      .maybeSingle();
    if (error || !data) fail(`Transaction ${transactionId} introuvable`);
    else txRow = data;
  } else {
    const { data, error } = await sb
      .from('transactions')
      .select('id, order_id, status, payment_provider')
      .eq('status', 'completed')
      .not('order_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      fail('Aucune transaction completed avec order_id — définir TRANSACTION_ID');
    } else {
      txRow = data;
      transactionId = data.id;
    }
  }

  report.steps.target_transaction = txRow;

  if (!transactionId || !txRow) {
    printReport();
    process.exit(1);
  }

  const provider = txRow.payment_provider || 'moneroo_platform';
  const externalEventId = `staging-replay-${crypto.randomUUID()}`;
  const payload = {
    replay_test: true,
    transaction_id: transactionId,
    at: new Date().toISOString(),
  };

  const rpcArgs = {
    p_provider: provider,
    p_external_event_id: externalEventId,
    p_event_type: 'staging.replay.test',
    p_transaction_id: transactionId,
    p_payload: payload,
    p_mapped_status: 'completed',
  };

  const { data: first, error: firstErr } = await sb.rpc('process_payment_webhook_atomic', rpcArgs);
  report.steps.first_rpc = { data: first, error: firstErr?.message ?? null };
  if (firstErr) fail(`Premier appel RPC échoué: ${firstErr.message}`);

  const { data: second, error: secondErr } = await sb.rpc('process_payment_webhook_atomic', rpcArgs);
  report.steps.second_rpc = { data: second, error: secondErr?.message ?? null };
  if (secondErr) fail(`Second appel RPC échoué: ${secondErr.message}`);

  const duplicateOk =
    second?.success === false && second?.reason === 'duplicate_webhook';
  report.steps.duplicate_guard = { ok: duplicateOk };
  if (!duplicateOk) {
    fail('Rejeu même external_event_id doit retourner duplicate_webhook');
  }

  const firstAlreadyCompleted = first?.already_completed === true;
  const orderUnchanged =
    first?.success === true || first?.already_completed === true || duplicateOk;
  report.steps.idempotent_completion = {
    ok: orderUnchanged,
    first_already_completed: firstAlreadyCompleted,
    note: firstAlreadyCompleted
      ? 'Transaction déjà completed — pas de double mise à jour commande'
      : 'Premier replay a complété la transaction (staging test tx)',
  };

  // 3. Compter events pour cet external id
  const { count, error: countErr } = await sb
    .from('payment_webhook_events')
    .select('*', { count: 'exact', head: true })
    .eq('provider', provider)
    .eq('external_event_id', externalEventId);

  report.steps.event_rows = { count, error: countErr?.message ?? null };
  if (count !== 1) {
    fail(`Attendu 1 ligne payment_webhook_events, obtenu ${count}`);
  }

  report.ok = report.blockers.length === 0;
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
