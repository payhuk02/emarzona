#!/usr/bin/env node
/**
 * Applique les migrations service P0/P1/P3 (jalons) sur le projet Supabase E2E
 * sans rejouer toute l'historique (évite les conflits de schéma partiel).
 *
 * Usage:
 *   $env:SUPABASE_DB_PASSWORD = '<db-password>'
 *   node scripts/apply-e2e-service-milestone-migrations.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import { resolveE2ECommerceProjectRef } from './resolve-e2e-commerce-project-ref.mjs';

const E2E_REF = resolveE2ECommerceProjectRef();
const DB_PASSWORD = process.env.E2E_SUPABASE_DB_PASSWORD?.trim() || process.env.SUPABASE_DB_PASSWORD?.trim();
const POOLER_HOST = process.env.SUPABASE_POOLER_HOST?.trim() || 'aws-1-eu-west-2.pooler.supabase.com';

if (!DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_PASSWORD (or E2E_SUPABASE_DB_PASSWORD).');
  process.exit(1);
}
if (!E2E_REF) {
  console.error('Missing E2E project ref (.e2e-commerce-project-ref).');
  process.exit(1);
}

const connectionString = `postgresql://postgres.${E2E_REF}:${encodeURIComponent(DB_PASSWORD)}@${POOLER_HOST}:5432/postgres`;

const P0_FULFILLMENT_SQL = `
ALTER TABLE public.service_products
  ADD COLUMN IF NOT EXISTS fulfillment_mode text NOT NULL DEFAULT 'appointment';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_products_fulfillment_mode_check'
  ) THEN
    ALTER TABLE public.service_products
      ADD CONSTRAINT service_products_fulfillment_mode_check
      CHECK (fulfillment_mode IN ('appointment', 'project', 'both'));
  END IF;
END $$;
`;

const MIGRATION_FILES = [
  '20260707043000__fix_generate_order_number_format.sql',
  '20260724195000__fix_digital_fulfill_no_customer_user_id.sql',
  '20260820150000__service_delivery_packages_extras_brief_p1.sql',
  '20260820160000__service_project_order_price_enforcement_p1_1.sql',
  '20260828170000__service_project_payment_milestones.sql',
  '20260828180000__service_milestone_rpc_auth.sql',
  '20260829120000__service_milestones_in_create_rpc.sql',
  '20260829100000__service_milestone_rpc_service_role.sql',
];

async function runSql(client, label, sql) {
  console.log(`→ ${label}`);
  await client.query(sql);
}

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(`Connected to E2E ${E2E_REF} via pooler`);

  try {
    await runSql(client, 'P0 fulfillment_mode', P0_FULFILLMENT_SQL);

    for (const file of MIGRATION_FILES) {
      const path = resolve('supabase/migrations', file);
      const sql = readFileSync(path, 'utf8');
      await runSql(client, file, sql);
    }

    const probe = await client.query(
      `SELECT
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'service_products' AND column_name = 'fulfillment_mode'
        ) AS has_fulfillment_mode,
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'service_order_milestones'
        ) AS has_milestones`
    );
    console.log('Schema probe:', probe.rows[0]);
    console.log('OK — migrations service jalons appliquées.');
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
