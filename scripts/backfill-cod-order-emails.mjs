#!/usr/bin/env node
/**
 * Backfill emails client + vendeur pour commandes COD (cod_pending) sans envoi préalable.
 *
 * Usage:
 *   node scripts/backfill-cod-order-emails.mjs              # dry-run (liste uniquement)
 *   node scripts/backfill-cod-order-emails.mjs --execute    # envoi réel
 *   node scripts/backfill-cod-order-emails.mjs --execute --limit 5
 *   node scripts/backfill-cod-order-emails.mjs --order ORD-202607180001 --execute
 *
 * Prérequis .env : SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL ou VITE_SUPABASE_URL
 */
import { createClient } from '@supabase/supabase-js';
import { loadSupabaseEnv, getSupabaseUrl, getServiceRoleKey } from './load-supabase-env.mjs';

const args = process.argv.slice(2);
const execute = args.includes('--execute');
const limitArg = args.find((_, i) => args[i - 1] === '--limit');
const limit = limitArg ? Number(limitArg) : 50;
const orderFilter = args.find((_, i) => args[i - 1] === '--order');

const env = loadSupabaseEnv();
const url = getSupabaseUrl(env);
const serviceKey = getServiceRoleKey(env);

if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

function parseMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  if (typeof metadata === 'object') return metadata;
  return {};
}

function needsBackfill(metadata) {
  const m = parseMetadata(metadata);
  return !m.confirmation_email_sent_at || !m.seller_order_email_sent_at;
}

async function resolveCustomerEmail(order) {
  if (order.customer?.email) {
    return {
      email: order.customer.email,
      name: order.customer.full_name || order.customer.name || 'Client',
    };
  }

  if (order.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('email, full_name, name')
      .eq('id', order.customer_id)
      .maybeSingle();

    if (customer?.email) {
      return {
        email: customer.email,
        name: customer.full_name || customer.name || 'Client',
      };
    }
  }

  return null;
}

async function invokeConfirmationEmail(order, customer) {
  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/send-order-confirmation-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      order_id: order.id,
      customer_email: customer.email.trim(),
      customer_name: customer.name,
      customer_id: order.customer_id ?? undefined,
    }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 500) };
  }

  return { ok: res.ok, status: res.status, body };
}

async function main() {
  let query = supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      payment_status,
      customer_id,
      metadata,
      created_at,
      customer:customers ( email, full_name, name )
    `
    )
    .eq('payment_status', 'cod_pending')
    .order('created_at', { ascending: false });

  if (orderFilter) {
    query = query.eq('order_number', orderFilter);
  } else {
    query = query.limit(Math.max(limit, 1));
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error('Erreur lecture commandes:', error.message);
    process.exit(1);
  }

  const pending = (orders ?? []).filter(o => needsBackfill(o.metadata));

  console.log(
    JSON.stringify(
      {
        mode: execute ? 'execute' : 'dry-run',
        total_cod_fetched: orders?.length ?? 0,
        needing_backfill: pending.length,
        orders: pending.map(o => ({
          order_number: o.order_number,
          id: o.id,
          created_at: o.created_at,
          missing_client: !parseMetadata(o.metadata).confirmation_email_sent_at,
          missing_seller: !parseMetadata(o.metadata).seller_order_email_sent_at,
        })),
      },
      null,
      2
    )
  );

  if (!execute) {
    console.log('\nDry-run — relancer avec --execute pour envoyer les emails.');
    return;
  }

  if (pending.length === 0) {
    console.log('\nAucune commande COD à backfill.');
    return;
  }

  const results = [];

  for (const order of pending) {
    const customer = await resolveCustomerEmail(order);
    if (!customer?.email) {
      results.push({
        order_number: order.order_number,
        ok: false,
        error: 'no_customer_email',
      });
      continue;
    }

    const masked = customer.email.replace(/(^.).*(@.*$)/, '$1***$2');
    console.log(`\n→ Envoi ${order.order_number} → ${masked}`);

    const result = await invokeConfirmationEmail(order, customer);
    results.push({
      order_number: order.order_number,
      ok: result.ok,
      status: result.status,
      emailsSent: result.body?.emailsSent,
      sellerEmailSent: result.body?.sellerEmailSent,
      sellerEmailSkipped: result.body?.sellerEmailSkipped,
      sellerEmailError: result.body?.sellerEmailError,
      duplicate: result.body?.duplicate,
      error: result.body?.error,
    });

    await new Promise(r => setTimeout(r, 400));
  }

  const okCount = results.filter(r => r.ok).length;
  console.log(
    `\nBackfill terminé: ${okCount}/${results.length} succès\n${JSON.stringify(results, null, 2)}`
  );

  process.exit(okCount === results.length ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
