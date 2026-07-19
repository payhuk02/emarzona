#!/usr/bin/env node
/**
 * Bootstrap Emarzona E2E Supabase schema from production (schema-only, no data).
 *
 * Requires: pg (npm), pg_dump in PATH (PostgreSQL client tools).
 *
 * Usage:
 *   $env:SUPABASE_DB_PASSWORD = '<prod-db-password>'
 *   node scripts/bootstrap-e2e-schema-from-prod.mjs
 *
 * Optional:
 *   E2E_SUPABASE_DB_PASSWORD  (defaults to SUPABASE_DB_PASSWORD)
 *   PROD_PROJECT_REF=hbdnzajbyjakdhuavrvb
 *   E2E_PROJECT_REF from .e2e-commerce-project-ref
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import { DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF } from './e2e-supabase-guard.mjs';
import { resolveE2ECommerceProjectRef } from './resolve-e2e-commerce-project-ref.mjs';

const PROD_REF = process.env.PROD_PROJECT_REF?.trim() || DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF;
const E2E_REF = resolveE2ECommerceProjectRef();
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD?.trim();
const E2E_DB_PASSWORD = process.env.E2E_SUPABASE_DB_PASSWORD?.trim() || DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_PASSWORD (production database password).');
  process.exit(1);
}
if (!E2E_REF) {
  console.error('Missing E2E project ref (.e2e-commerce-project-ref).');
  process.exit(1);
}
if (E2E_REF === PROD_REF) {
  console.error('E2E ref must differ from production ref.');
  process.exit(1);
}

const POOLER_HOST = process.env.SUPABASE_POOLER_HOST?.trim() || 'aws-1-eu-west-2.pooler.supabase.com';
const E2E_DIRECT_HOST = process.env.E2E_DIRECT_HOST?.trim() || `db.${E2E_REF}.supabase.co`;

function poolerUrl(ref, password) {
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres.${ref}:${encoded}@${POOLER_HOST}:5432/postgres`;
}

function e2eDirectUrl(password) {
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@${E2E_DIRECT_HOST}:5432/postgres`;
}

const RESET_E2E_PUBLIC_SQL = `
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;

DO $$
DECLARE
  r RECORD;
  remaining INTEGER;
BEGIN
  FOR r IN (SELECT matviewname FROM pg_matviews WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE', r.matviewname);
  END LOOP;
  FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', r.viewname);
  END LOOP;
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
  END LOOP;
  FOR r IN (
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
  ) LOOP
    EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE', r.sequence_name);
  END LOOP;
  LOOP
    remaining := 0;
    FOR r IN (
      SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
    ) LOOP
      remaining := remaining + 1;
      EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', r.proname, r.args);
    END LOOP;
    EXIT WHEN remaining = 0;
  END LOOP;
  FOR r IN (
    SELECT typname FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype IN ('e', 'c', 'd')
  ) LOOP
    EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
  END LOOP;
END $$;
`;

async function probe(label, ref, password, { direct = false } = {}) {
  const client = new pg.Client({
    connectionString: direct ? e2eDirectUrl(password) : poolerUrl(ref, password),
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const tables = await client.query(
      "SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'"
    );
    const stores = await client.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') AS ok"
    );
    console.log(`${label}: public tables=${tables.rows[0].n}, stores=${stores.rows[0].ok}`);
    return { tables: tables.rows[0].n, hasStores: stores.rows[0].ok };
  } finally {
    await client.end().catch(() => {});
  }
}

function findPgDump() {
  if (process.env.PG_DUMP_PATH?.trim()) {
    return process.env.PG_DUMP_PATH.trim();
  }
  const which = spawnSync('where', ['pg_dump'], { encoding: 'utf8', shell: true });
  if (which.status === 0) {
    return which.stdout.split(/\r?\n/).map(l => l.trim()).find(Boolean) ?? 'pg_dump';
  }
  const candidates = [
    'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
  ];
  return candidates.find(p => existsSync(p)) ?? null;
}

function run(cmd, args, env = process.env) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

const tempDir = resolve('supabase/.temp');
mkdirSync(tempDir, { recursive: true });
const schemaFile = resolve(tempDir, 'prod-public-schema.sql');

console.log(`Production: ${PROD_REF}`);
console.log(`E2E target: ${E2E_REF}`);

try {
  await probe('prod (before)', PROD_REF, DB_PASSWORD);
} catch (error) {
  console.error(`Cannot connect to production DB: ${error.message}`);
  console.error('Check SUPABASE_DB_PASSWORD (Dashboard > Settings > Database).');
  process.exit(1);
}

try {
  await probe('e2e (before)', E2E_REF, E2E_DB_PASSWORD, { direct: true });
} catch (error) {
  console.error(`Cannot connect to E2E DB: ${error.message}`);
  console.error('Set E2E_SUPABASE_DB_PASSWORD if the E2E project uses a different database password.');
  process.exit(1);
}

const pgDump = findPgDump();
if (!pgDump) {
  console.error('pg_dump not found. Install PostgreSQL client tools or set PG_DUMP_PATH.');
  console.error('Windows: winget install PostgreSQL.PostgreSQL.17');
  process.exit(1);
}

console.log(`Using pg_dump: ${pgDump}`);
console.log('Dumping production public schema (no data)...');

const dump = spawnSync(
  pgDump,
  [
    '-h',
    POOLER_HOST,
    '-p',
    '5432',
    '-U',
    `postgres.${PROD_REF}`,
    '-d',
    'postgres',
    '--schema=public',
    '--schema-only',
    '--no-owner',
    '--no-privileges',
  ],
  { encoding: 'buffer', env: { ...process.env, PGPASSWORD: DB_PASSWORD, PGSSLMODE: 'require' } }
);

if (dump.status !== 0) {
  console.error(dump.stderr?.toString('utf8') || 'pg_dump failed');
  process.exit(1);
}

let schemaSql = dump.stdout.toString('utf8');
schemaSql = schemaSql.replace(/^CREATE SCHEMA public;\s*$/m, '');
schemaSql = schemaSql.replace(/^COMMENT ON SCHEMA public IS.*$/m, '');
writeFileSync(schemaFile, schemaSql);
console.log(`Schema written: ${schemaFile} (${schemaSql.length} bytes)`);

console.log('Collecting prod extensions...');
const prodClient = new pg.Client({
  connectionString: poolerUrl(PROD_REF, DB_PASSWORD),
  ssl: { rejectUnauthorized: false },
});
await prodClient.connect();
const extRows = await prodClient.query(`
  SELECT format('CREATE EXTENSION IF NOT EXISTS %I WITH SCHEMA %I;', e.extname, n.nspname) AS ddl
  FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname NOT IN ('plpgsql')
  ORDER BY e.extname
`);
await prodClient.end();
const extensionSql = extRows.rows.map(r => r.ddl).join('\n');
console.log(extensionSql || '(no extensions)');

console.log('Resetting E2E public schema (batched drops via direct DB)...');
const e2eClient = new pg.Client({
  connectionString: e2eDirectUrl(E2E_DB_PASSWORD),
  ssl: { rejectUnauthorized: false },
});
await e2eClient.connect();
await e2eClient.query(RESET_E2E_PUBLIC_SQL);
for (const ddl of extRows.rows.map(r => r.ddl)) {
  try {
    await e2eClient.query(ddl);
  } catch (error) {
    console.warn(`WARN extension: ${error.message}`);
  }
}
await e2eClient.end();

console.log('Applying schema to E2E project (direct DB)...');
const psql = pgDump.replace(/pg_dump(\.exe)?$/i, 'psql$1');
if (!existsSync(psql)) {
  console.error(`psql not found next to pg_dump (${psql}). Set PG_DUMP_PATH directory manually.`);
  process.exit(1);
}

const apply = spawnSync(
  psql,
  [
    '-h',
    E2E_DIRECT_HOST,
    '-p',
    '5432',
    '-U',
    'postgres',
    '-d',
    'postgres',
    '--set',
    'ON_ERROR_STOP=1',
    '--file',
    schemaFile,
  ],
  { encoding: 'utf8', env: { ...process.env, PGPASSWORD: E2E_DB_PASSWORD, PGSSLMODE: 'require' } }
);

if (apply.status !== 0) {
  console.error(apply.stderr || apply.stdout || 'psql apply failed');
  process.exit(1);
}

const after = await probe('e2e (after)', E2E_REF, E2E_DB_PASSWORD, { direct: true });
if (!after.hasStores || after.tables < 500) {
  console.error(`Schema apply finished but verification failed (tables=${after.tables}, stores=${after.hasStores}).`);
  process.exit(1);
}

console.log('');
console.log('OK - E2E schema bootstrapped from production.');
console.log('Next:');
console.log('  npx supabase link --project-ref ' + E2E_REF);
console.log('  npx supabase migration repair --status applied');
console.log('  npm run setup:commerce-e2e-secret');
