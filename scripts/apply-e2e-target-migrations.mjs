#!/usr/bin/env node
/**
 * Apply specific SQL migration files to the E2E Supabase database via pooler.
 *
 * Usage:
 *   $env:E2E_SUPABASE_DB_PASSWORD = '<Dashboard > Database password>'
 *   node scripts/apply-e2e-target-migrations.mjs [migration.sql ...]
 *
 * Delegates to scripts/apply-target-migrations.mjs (SUPABASE_TARGET=e2e).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const result = spawnSync(
  process.execPath,
  [join(__dirname, 'apply-target-migrations.mjs'), ...args],
  {
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_TARGET: 'e2e' },
  }
);

process.exit(result.status ?? 1);
