#!/usr/bin/env node
/**
 * Benchmark A/B — stats dashboard RPC agrégée vs requêtes client.
 *
 * Usage:
 *   npm run benchmark:dashboard-stats
 *   npm run benchmark:dashboard-stats -- --store-id <uuid> --rounds 5
 *   node scripts/benchmark-dashboard-stats.mjs --json
 *
 * Auth (session vendeur requise pour la RPC) :
 *   E2E_TEST_EMAIL + E2E_TEST_PASSWORD
 *   ou E2E_VENDOR_EMAIL + E2E_VENDOR_PASSWORD
 *   ou --email / --password
 */
import { createClient } from '@supabase/supabase-js';
import { performance } from 'node:perf_hooks';
import {
  loadSupabaseEnv,
  getSupabaseUrl,
  getServiceRoleKey,
} from './load-supabase-env.mjs';

function parseArgs(argv) {
  const out = {
    storeId: null,
    rounds: 5,
    period: '30d',
    warmup: 1,
    json: false,
    email:
      process.env.DASHBOARD_BENCH_EMAIL?.trim() ||
      process.env.E2E_VENDOR_EMAIL?.trim() ||
      process.env.E2E_TEST_EMAIL?.trim() ||
      null,
    password:
      process.env.DASHBOARD_BENCH_PASSWORD?.trim() ||
      process.env.E2E_VENDOR_PASSWORD?.trim() ||
      process.env.E2E_TEST_PASSWORD?.trim() ||
      null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') out.json = true;
    else if (arg === '--store-id' && argv[i + 1]) out.storeId = argv[++i];
    else if (arg.startsWith('--store-id=')) out.storeId = arg.slice('--store-id='.length);
    else if (arg === '--rounds' && argv[i + 1]) out.rounds = Math.max(1, Number(argv[++i]) || 5);
    else if (arg.startsWith('--rounds=')) out.rounds = Math.max(1, Number(arg.slice('--rounds='.length)) || 5);
    else if (arg === '--warmup' && argv[i + 1]) out.warmup = Math.max(0, Number(argv[++i]) || 0);
    else if (arg === '--period' && argv[i + 1]) out.period = argv[++i];
    else if (arg === '--email' && argv[i + 1]) out.email = argv[++i];
    else if (arg === '--password' && argv[i + 1]) out.password = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: npm run benchmark:dashboard-stats -- [options]

Options:
  --store-id <uuid>   Boutique cible (sinon première boutique du vendeur)
  --rounds <n>        Itérations mesurées (défaut: 5)
  --warmup <n>        Itérations chauffe ignorées (défaut: 1)
  --period 7d|30d|90d Fenêtre stats (défaut: 30d)
  --email / --password  Session vendeur (sinon E2E_TEST_* / E2E_VENDOR_*)
  --json              Sortie JSON
`);
      process.exit(0);
    }
  }

  return out;
}

function getPeriodDays(period) {
  if (period === '7d') return 7;
  if (period === '90d') return 90;
  return 30;
}

function resolvePeriodRange(period) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const days = getPeriodDays(period);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end, days, label: `${days} derniers jours` };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((s, v) => s + v, 0);
  return {
    min_ms: sorted[0] ?? 0,
    max_ms: sorted[sorted.length - 1] ?? 0,
    mean_ms: sorted.length ? Math.round(sum / sorted.length) : 0,
    p50_ms: Math.round(percentile(sorted, 50)),
    p95_ms: Math.round(percentile(sorted, 95)),
  };
}

async function resolveStoreId(client, userId, explicitStoreId) {
  if (explicitStoreId) {
    const { data, error } = await client
      .from('stores')
      .select('id, name, user_id')
      .eq('id', explicitStoreId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Store ${explicitStoreId} introuvable`);
    if (data.user_id !== userId) {
      throw new Error(`Store ${explicitStoreId} n'appartient pas à l'utilisateur connecté`);
    }
    return { id: data.id, name: data.name };
  }

  const { data, error } = await client
    .from('stores')
    .select('id, name')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error('Aucune boutique pour cet utilisateur — fournissez --store-id');
  }
  return { id: data.id, name: data.name };
}

/**
 * Reproduit fetchDashboardStatsFromTables (requêtes parallèles + top products).
 */
async function fetchClientPath(client, storeId, range) {
  const compareStart = new Date(range.start);
  compareStart.setDate(compareStart.getDate() - range.days);

  const t0 = performance.now();
  let httpRequests = 0;

  const [
    productsResult,
    ordersResult,
    customersResult,
    pendingRes,
    processingRes,
    draftRes,
    lowStockRes,
    reviewsRes,
  ] = await Promise.all([
    client.from('products').select('product_type, price, is_active, is_draft').eq('store_id', storeId),
    client
      .from('orders')
      .select('id, status, total_amount, created_at, customer_id, order_number, customers(name, email)')
      .eq('store_id', storeId)
      .gte('created_at', compareStart.toISOString())
      .lte('created_at', range.end.toISOString())
      .order('created_at', { ascending: false })
      .limit(500),
    client.from('customers').select('created_at').eq('store_id', storeId).limit(3000),
    client.from('orders').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'pending'),
    client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .in('status', ['processing', 'confirmed']),
    client.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_draft', true),
    client
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('product_type', 'physical')
      .eq('is_active', true)
      .not('stock_quantity', 'is', null)
      .lte('stock_quantity', 5),
    client
      .from('reviews')
      .select('id, products!inner(store_id)', { count: 'exact', head: true })
      .eq('products.store_id', storeId)
      .eq('is_approved', false),
  ]);
  httpRequests += 8;

  for (const res of [
    productsResult,
    ordersResult,
    customersResult,
    pendingRes,
    processingRes,
    draftRes,
    lowStockRes,
    reviewsRes,
  ]) {
    if (res.error) throw res.error;
  }

  const allOrders = ordersResult.data || [];
  const periodOrders = allOrders.filter(o => {
    const t = new Date(o.created_at).getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  });
  const completedOrderIds = periodOrders.filter(o => o.status === 'completed').map(o => o.id);

  if (completedOrderIds.length > 0) {
    const { error: itemsError } = await client
      .from('order_items')
      .select(
        'order_id, product_id, quantity, total_price, product_type, products!inner(id, name, price, image_url, product_type, store_id)'
      )
      .in('order_id', completedOrderIds)
      .eq('products.store_id', storeId);
    httpRequests += 1;
    if (itemsError) throw itemsError;
  } else {
    await client.rpc('get_top_selling_products', {
      store_uuid: storeId,
      limit_count: 5,
    });
    httpRequests += 1;
  }

  const ms = Math.round(performance.now() - t0);
  return {
    ms,
    http_requests: httpRequests,
    rows: {
      products: (productsResult.data || []).length,
      orders: allOrders.length,
      customers: (customersResult.data || []).length,
    },
  };
}

async function fetchRpcPath(client, storeId, range) {
  const t0 = performance.now();
  const { data, error } = await client.rpc('get_store_dashboard_stats_aggregated', {
    p_store_id: storeId,
    p_period_start: range.start.toISOString(),
    p_period_end: range.end.toISOString(),
    p_period_label: range.label,
  });
  const ms = Math.round(performance.now() - t0);
  if (error) throw error;
  return {
    ms,
    http_requests: 1,
    payload_keys: data && typeof data === 'object' ? Object.keys(data).length : 0,
  };
}

async function runBench(label, fn, rounds, warmup) {
  for (let i = 0; i < warmup; i++) {
    await fn();
  }
  const samples = [];
  const meta = [];
  for (let i = 0; i < rounds; i++) {
    const result = await fn();
    samples.push(result.ms);
    meta.push(result);
  }
  return {
    label,
    ...summarize(samples),
    rounds,
    last: meta[meta.length - 1],
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const env = loadSupabaseEnv();
  const url = getSupabaseUrl(env);
  const anonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY requis pour benchmark authentifié');
  }
  if (!args.email || !args.password) {
    throw new Error(
      'Identifiants vendeur requis — E2E_TEST_EMAIL/PASSWORD, E2E_VENDOR_* ou --email/--password'
    );
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: args.email,
    password: args.password,
  });
  if (authError) throw authError;

  const serviceKey = getServiceRoleKey(env);
  const serviceAdmin = serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

  const store = await resolveStoreId(client, authData.user.id, args.storeId);
  const range = resolvePeriodRange(args.period);

  const storeCounts = serviceAdmin
    ? await (async () => {
        const [orders, products, customers] = await Promise.all([
          serviceAdmin
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', store.id),
          serviceAdmin
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', store.id),
          serviceAdmin
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', store.id),
        ]);
        return {
          orders: orders.count ?? null,
          products: products.count ?? null,
          customers: customers.count ?? null,
        };
      })()
    : null;

  const rpcBench = await runBench(
    'rpc_aggregated',
    () => fetchRpcPath(client, store.id, range),
    args.rounds,
    args.warmup
  );
  const clientBench = await runBench(
    'client_multi_query',
    () => fetchClientPath(client, store.id, range),
    args.rounds,
    args.warmup
  );

  const speedup =
    clientBench.mean_ms > 0 ? Number((clientBench.mean_ms / rpcBench.mean_ms).toFixed(2)) : null;

  const report = {
    ok: true,
    timestamp: new Date().toISOString(),
    store: { id: store.id, name: store.name },
    period: range,
    store_volume: storeCounts,
    warmup_rounds: args.warmup,
    measured_rounds: args.rounds,
    rpc: rpcBench,
    client: clientBench,
    comparison: {
      mean_speedup_x: speedup,
      mean_saved_ms: clientBench.mean_ms - rpcBench.mean_ms,
      http_requests_client: clientBench.last?.http_requests,
      http_requests_rpc: rpcBench.last?.http_requests,
      winner: rpcBench.mean_ms < clientBench.mean_ms ? 'rpc_aggregated' : 'client_multi_query',
    },
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('');
    console.log('Dashboard stats — benchmark A/B');
    console.log('================================');
    console.log(`Store   : ${store.name} (${store.id})`);
    console.log(`Period  : ${range.label}`);
    if (storeCounts) {
      console.log(
        `Volume  : ${storeCounts.orders ?? '?'} orders · ${storeCounts.products ?? '?'} products · ${storeCounts.customers ?? '?'} customers`
      );
    }
    console.log('');
    console.log(
      `RPC agrégée     mean=${rpcBench.mean_ms}ms p50=${rpcBench.p50_ms}ms p95=${rpcBench.p95_ms}ms (${rpcBench.last?.http_requests} req)`
    );
    console.log(
      `Client multi    mean=${clientBench.mean_ms}ms p50=${clientBench.p50_ms}ms p95=${clientBench.p95_ms}ms (${clientBench.last?.http_requests} req)`
    );
    console.log('');
    console.log(
      `→ ${report.comparison.winner} gagne · speedup ${speedup ?? '?'}x · ${report.comparison.mean_saved_ms}ms économisés (mean)`
    );
    console.log('');
  }

  process.exit(0);
}

main().catch(err => {
  const payload = { ok: false, error: err instanceof Error ? err.message : String(err) };
  if (parseArgs(process.argv).json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.error('Benchmark failed:', payload.error);
  }
  process.exit(1);
});
