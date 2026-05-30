#!/usr/bin/env node
/**
 * RLS audit helper — runs audit-rls.sql on linked Supabase when available,
 * otherwise prints instructions for the SQL Editor.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = join(root, 'supabase', 'scripts', 'audit-rls.sql');

console.log('Emarzona RLS audit');
console.log('SQL file:', sqlPath);

const linked = spawnSync('npx', ['supabase', 'db', 'query', '--linked', '-f', sqlPath], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});

if (linked.status === 0) {
  const out = (linked.stdout || '').trim();
  if (out) console.log(out);
  console.log('\nDone. Review NOTICE lines in Supabase Dashboard logs if output is empty.');
  process.exit(0);
}

console.warn('\nCould not run against linked project:', linked.stderr || linked.stdout || 'unknown error');
console.log('\nManual steps:');
console.log('  1. Open Supabase SQL Editor');
console.log('  2. Paste contents of supabase/scripts/audit-rls.sql');
console.log('  3. Or: npx supabase db query --linked -f supabase/scripts/audit-rls.sql');
process.exit(linked.status === null ? 1 : linked.status);
