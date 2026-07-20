#!/usr/bin/env node
/**
 * Apply specific SQL migration files to a Supabase database via pooler.
 *
 * Usage:
 *   # E2E (default)
 *   $env:E2E_SUPABASE_DB_PASSWORD = '<password>'
 *   node scripts/apply-target-migrations.mjs supabase/migrations/20260720120000__stores_public_remove_custom_scripts.sql
 *
 *   # Production
 *   $env:SUPABASE_DB_PASSWORD = '<password>'
 *   $env:SUPABASE_TARGET = 'prod'
 *   node scripts/apply-target-migrations.mjs supabase/migrations/20260720120000__stores_public_remove_custom_scripts.sql
 */
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSupabaseEnv } from './load-supabase-env.mjs';
import { resolveE2ECommerceProjectRef } from './resolve-e2e-commerce-project-ref.mjs';

const env = loadSupabaseEnv();
const target = process.env.SUPABASE_TARGET?.trim() || 'e2e';
const ref =
  target === 'prod'
    ? process.env.PROD_PROJECT_REF?.trim() || 'hbdnzajbyjakdhuavrvb'
    : resolveE2ECommerceProjectRef();

const password =
  target === 'prod'
    ? env.SUPABASE_DB_PASSWORD?.trim()
    : env.E2E_SUPABASE_DB_PASSWORD?.trim() || env.SUPABASE_DB_PASSWORD?.trim();

if (!password) {
  console.error(
    target === 'prod'
      ? 'Missing SUPABASE_DB_PASSWORD'
      : 'Missing E2E_SUPABASE_DB_PASSWORD (or SUPABASE_DB_PASSWORD)'
  );
  process.exit(1);
}

const poolerHost = process.env.SUPABASE_POOLER_HOST?.trim() || 'aws-1-eu-west-2.pooler.supabase.com';
const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${poolerHost}:5432/postgres`;

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['supabase/migrations/20260720120000__stores_public_remove_custom_scripts.sql'];

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`Connected to ${target} (${ref}) via ${poolerHost}`);

  for (const relativePath of files) {
    const file = resolve(relativePath);
    const sql = readFileSync(file, 'utf8');
    console.log(`Applying ${relativePath} ...`);
    await client.query(sql);
    console.log(`OK ${relativePath}`);
  }

  const { rows } = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stores_public'
      AND column_name IN ('custom_tracking_scripts', 'custom_scripts_enabled')
  `);

  console.log('Verification stores_public sensitive columns:', rows.length === 0 ? 'OK (absent)' : rows);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}
