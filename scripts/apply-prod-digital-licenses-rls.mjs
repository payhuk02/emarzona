#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadSupabaseEnv } from './load-supabase-env.mjs';

const env = loadSupabaseEnv();
const ref = process.env.PROD_PROJECT_REF?.trim() || 'hbdnzajbyjakdhuavrvb';
const password = env.SUPABASE_DB_PASSWORD?.trim();

if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const migration = resolve(
  'supabase/migrations/20260807120000__fix_digital_licenses_customer_rls_email_only.sql'
);
const sql = readFileSync(migration, 'utf8');

const directHost = `db.${ref}.supabase.co`;

const poolerHosts = [
  process.env.SUPABASE_POOLER_HOST?.trim(),
  'aws-1-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
].filter(Boolean);

const connectionStrings = [];
for (const host of poolerHosts) {
  for (const port of ['5432', '6543']) {
    connectionStrings.push(
      `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:${port}/postgres`
    );
  }
}
connectionStrings.push(
  `postgresql://postgres:${encodeURIComponent(password)}@${directHost}:5432/postgres`
);

let lastError;
for (const connectionString of connectionStrings) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
  try {
    await client.connect();
    console.log(`Connected to prod (${ref})`);
    console.log(`Applying ${migration} ...`);
    await client.query(sql);
    console.log('OK migration applied');

    const { rows } = await client.query(`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'digital_licenses'
        AND policyname = 'Customers can view own licenses'
    `);
    console.log('Policy verification:', rows.length === 1 ? 'OK' : rows);
    await client.end();
    process.exit(0);
  } catch (error) {
    lastError = error;
    await client.end().catch(() => undefined);
    console.warn(`Connection failed (${connectionString.includes('@db.') ? 'direct' : 'pooler'}):`, error instanceof Error ? error.message : error);
  }
}

console.error('All connection attempts failed:', lastError instanceof Error ? lastError.message : lastError);
process.exit(1);
