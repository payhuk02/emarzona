#!/usr/bin/env node
/**
 * Phase 0.4 — Audit RLS portails client (/account/*)
 * Usage: npm run audit:client-portal-rls
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = join(root, 'supabase', 'scripts', 'audit-client-portal-rls.sql');

console.log('Emarzona client portal RLS audit');
console.log('SQL:', sqlPath);

const result = spawnSync('npx', ['supabase', 'db', 'query', '--linked', '-f', sqlPath], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});

const out = `${result.stdout || ''}${result.stderr || ''}`;
if (out.trim()) console.log(out.trim());

if (result.status === 0) {
  console.log('\n✓ Client portal RLS audit passed.');
  process.exit(0);
}

console.error('\n❌ Client portal RLS audit failed.');
console.error('Manual: npx supabase db query --linked -f supabase/scripts/audit-client-portal-rls.sql');
console.error('Offline contract: npm run test:client-portal-rls');
process.exit(result.status === null ? 1 : result.status);
