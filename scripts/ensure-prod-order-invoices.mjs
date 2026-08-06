#!/usr/bin/env node
/** Ensure invoices exist for paid orders missing one (prod maintenance). */
import pg from 'pg';
import { loadSupabaseEnv } from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const password = env.SUPABASE_DB_PASSWORD?.trim();
if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const ref = 'hbdnzajbyjakdhuavrvb';
const client = new pg.Client({
  connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const missing = await client.query(`
  SELECT o.id, o.order_number
  FROM public.orders o
  LEFT JOIN public.invoices i ON i.order_id = o.id
  WHERE o.payment_status = 'paid' AND i.id IS NULL
  ORDER BY o.created_at DESC
  LIMIT 20
`);

for (const row of missing.rows) {
  const { rows } = await client.query('SELECT public.ensure_order_invoice_paid($1::uuid) AS id', [
    row.id,
  ]);
  console.log(`OK ${row.order_number} -> invoice ${rows[0].id}`);
}

if (missing.rows.length === 0) {
  console.log('All paid orders already have invoices.');
}

await client.end();
