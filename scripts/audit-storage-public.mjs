#!/usr/bin/env node
/**
 * Epic 1.1 — Scan : buckets payants ne doivent pas être public.
 * Usage: npm run audit:storage-public
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = join(root, 'supabase', 'scripts', 'audit-storage-public.sql');

console.log('Emarzona storage public audit');
console.log('SQL:', sqlPath);

const result = spawnSync('npx', ['supabase', 'db', 'query', '--linked', '-f', sqlPath], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});

const out = `${result.stdout || ''}${result.stderr || ''}`;
if (out.trim()) console.log(out.trim());

if (result.status === 0) {
  console.log('\n✓ Storage audit passed.');
  process.exit(0);
}

console.error('\n❌ Storage audit failed. Run manually:');
console.error(`  npx supabase db query --linked -f ${sqlPath}`);
process.exit(result.status === null ? 1 : result.status);
