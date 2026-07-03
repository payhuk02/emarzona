#!/usr/bin/env node
/**
 * Secours cron — refresh vues matérialisées dashboard (GHA ou manuel).
 * Usage: node scripts/cron-refresh-dashboard-views.mjs
 */
import { createClient } from '@supabase/supabase-js';
import {
  loadSupabaseEnv,
  getSupabaseUrl,
  getServiceRoleKey,
} from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const url = getSupabaseUrl(env);
const serviceKey = getServiceRoleKey(env);

if (!serviceKey) {
  console.error(JSON.stringify({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY required' }));
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin.rpc('refresh_all_dashboard_materialized_views');

if (error) {
  console.error(JSON.stringify({ ok: false, error: error.message, code: error.code }));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, ...data }));
process.exit(0);
