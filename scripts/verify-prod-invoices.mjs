#!/usr/bin/env node
import pg from 'pg';
import { loadSupabaseEnv } from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const ref = process.env.PROD_PROJECT_REF?.trim() || 'hbdnzajbyjakdhuavrvb';
const password = env.SUPABASE_DB_PASSWORD?.trim();
if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('Connected to prod for invoice verification\n');

const paid = await client.query(`
  SELECT
    o.order_number,
    o.total_amount AS order_total,
    COALESCE((o.metadata->>'tax_amount')::numeric, 0) AS order_meta_tax,
    i.invoice_number,
    COALESCE(i.tax_amount, 0) AS invoice_tax,
    i.total_amount AS invoice_total,
    c.email AS customer_email
  FROM public.orders o
  LEFT JOIN public.invoices i ON i.order_id = o.id
  LEFT JOIN public.customers c ON c.id = o.customer_id
  WHERE o.payment_status = 'paid'
  ORDER BY o.created_at DESC
  LIMIT 10
`);

console.log('=== Paid orders + invoices (last 10) ===');
console.table(paid.rows);

const taxCount = await client.query(`
  SELECT COUNT(*)::int AS invoices_with_tax
  FROM public.invoices
  WHERE COALESCE(tax_amount, 0) > 0
`);
console.log('\nInvoices with tax_amount > 0:', taxCount.rows[0].invoices_with_tax);

const policies = await client.query(`
  SELECT policyname
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'invoices'
  ORDER BY policyname
`);
console.log('\nInvoice RLS policies:', policies.rows.map(r => r.policyname).join(', '));

await client.end();
