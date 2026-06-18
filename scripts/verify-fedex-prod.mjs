#!/usr/bin/env node
/**
 * Vérifie la configuration FedEx production (P0).
 * Usage: node scripts/verify-fedex-prod.mjs
 * Exit 0 = OK ou staging ; exit 1 = prod sans credentials.
 */

const isProd =
  (process.env.ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV || '').toLowerCase() ===
  'production';

const required = ['FEDEX_API_KEY', 'FEDEX_API_SECRET', 'FEDEX_ACCOUNT_NUMBER'];
const missing = required.filter(key => !process.env[key]?.trim());

const testModeRaw = (process.env.FEDEX_TEST_MODE || '').toLowerCase();
const testMode =
  testModeRaw === 'true' ? true : testModeRaw === 'false' ? false : !isProd;

const allowMock = (process.env.FEDEX_ALLOW_MOCK || '').toLowerCase() === 'true';

console.log('FedEx configuration check');
console.log('  environment:', isProd ? 'production' : 'non-production');
console.log('  credentials:', missing.length === 0 ? 'present' : `missing: ${missing.join(', ')}`);
console.log('  test_mode:', testMode ? 'sandbox' : 'production API');
console.log('  allow_mock:', allowMock);

if (isProd && missing.length > 0) {
  console.error('\nFAIL: FedEx credentials required in production.');
  console.error('See docs/runbooks/fedex-prod-credentials.md');
  process.exit(1);
}

if (isProd && testMode) {
  console.warn('\nWARN: FEDEX_TEST_MODE=true in production — sandbox API will be used.');
}

if (isProd && allowMock) {
  console.warn('\nWARN: FEDEX_ALLOW_MOCK=true in production — mock responses enabled.');
}

console.log('\nOK: FedEx configuration acceptable for current environment.');
process.exit(0);
