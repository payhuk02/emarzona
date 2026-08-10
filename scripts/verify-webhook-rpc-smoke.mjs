/**
 * Smoke RPC — test_webhook crée une livraison pending (sans Playwright).
 * Usage: node scripts/verify-webhook-rpc-smoke.mjs
 */
import { createClient } from '@supabase/supabase-js';
import {
  getServiceRoleKey,
  getSupabaseUrl,
  loadSupabaseEnv,
} from './load-supabase-env.mjs';

const report = { ok: false, timestamp: new Date().toISOString(), steps: {}, blockers: [] };

function fail(msg) {
  report.blockers.push(msg);
}

const env = loadSupabaseEnv();
const url = getSupabaseUrl(env);
const serviceKey = getServiceRoleKey(env);

if (!url || !serviceKey) {
  fail('SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL requis');
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
let userId = null;
let storeId = null;
let webhookId = null;

try {
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: `smoke-webhook-${runId}@example.com`,
    password: `Smoke!${runId}aA1`,
    email_confirm: true,
  });
  if (userError || !userData.user) throw userError ?? new Error('createUser failed');
  userId = userData.user.id;
  report.steps.create_user = { ok: true };

  const { data: store, error: storeError } = await admin
    .from('stores')
    .insert({
      user_id: userId,
      name: `Smoke Webhook ${runId}`,
      slug: `smoke-webhook-${runId}`,
      description: 'RPC smoke',
      is_active: true,
      commerce_type: 'digital',
      metadata: { commerce_type: 'digital' },
    })
    .select('id')
    .single();
  if (storeError || !store) throw storeError ?? new Error('store insert failed');
  storeId = store.id;
  report.steps.create_store = { ok: true };

  const { data: webhook, error: webhookError } = await admin
    .from('webhooks')
    .insert({
      store_id: storeId,
      created_by: userId,
      name: 'Smoke Test Webhook',
      url: 'https://example.com/webhook-smoke',
      events: ['order.created'],
      status: 'active',
    })
    .select('id')
    .single();
  if (webhookError || !webhook) throw webhookError ?? new Error('webhook insert failed');
  webhookId = webhook.id;
  report.steps.create_webhook = { ok: true };

  const { data: deliveryId, error: testError } = await admin.rpc('test_webhook', {
    p_webhook_id: webhookId,
  });
  if (testError) throw testError;
  report.steps.test_webhook = { ok: true, deliveryId };

  const { data: delivery, error: deliveryError } = await admin
    .from('webhook_deliveries')
    .select('id, status, webhook_id, event_type, error_type')
    .eq('id', deliveryId)
    .single();
  if (deliveryError || !delivery) throw deliveryError ?? new Error('delivery not found');

  report.steps.delivery_row = {
    ok: delivery.status === 'pending' || delivery.status === 'retrying' || delivery.status === 'delivered',
    status: delivery.status,
    event_type: delivery.event_type,
  };

  if (delivery.status !== 'pending' && delivery.status !== 'retrying' && delivery.status !== 'delivered') {
    fail(`unexpected delivery status: ${delivery.status}`);
  }

  report.ok = report.blockers.length === 0;
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  if (webhookId) {
    await admin.from('webhook_deliveries').delete().eq('webhook_id', webhookId);
    await admin.from('webhooks').delete().eq('id', webhookId);
  }
  if (storeId) await admin.from('stores').delete().eq('id', storeId);
  if (userId) await admin.auth.admin.deleteUser(userId);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
