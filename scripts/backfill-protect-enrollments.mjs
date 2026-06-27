#!/usr/bin/env node
/**
 * Rétro-enrollment Emarzona Protect (admin RPC).
 * Usage: node scripts/backfill-protect-enrollments.mjs [--days=365] [--limit=500]
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon + admin JWT via env).
 */
import { createClient } from '@supabase/supabase-js';

const daysBack = Number(process.argv.find(a => a.startsWith('--days='))?.split('=')[1] ?? 365);
const limit = Number(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] ?? 500);

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key).');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase.rpc('backfill_emarzona_protect_enrollments', {
  p_days_back: daysBack,
  p_limit: limit,
  p_reconcile_ineligible: true,
});

if (error) {
  console.error('Backfill failed:', error.message);
  process.exit(1);
}

const payload = data ?? {};
console.log(
  JSON.stringify(
    {
      activated: Number(payload.activated ?? 0),
      reconciled: Number(payload.reconciled ?? 0),
      daysBack,
      limit,
    },
    null,
    2
  )
);
