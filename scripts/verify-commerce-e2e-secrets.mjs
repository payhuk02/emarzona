#!/usr/bin/env node
/**
 * Validates env required for commerce_type Playwright E2E (CI gate).
 */
const required = [
  ['VITE_SUPABASE_URL', ['VITE_SUPABASE_URL', 'SUPABASE_URL']],
  [
    'VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY',
    ['VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
  ],
  ['SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_SERVICE_ROLE_KEY']],
];

const missing = [];

for (const [, keys] of required) {
  const value = keys.map(k => process.env[k]).find(v => v && v.trim().length > 0);
  if (!value) missing.push(keys.join(' / '));
}

if (missing.length > 0) {
  console.error('Missing commerce E2E secrets:');
  for (const name of missing) console.error(`  - ${name}`);
  console.error('');
  console.error('Configure GitHub secret: SUPABASE_TEST_SERVICE_ROLE_KEY');
  console.error('Optional dedicated test URL/key: VITE_SUPABASE_TEST_URL, VITE_SUPABASE_TEST_ANON_KEY');
  process.exit(1);
}

console.log('Commerce E2E secrets OK');
