/**
 * Epic 5.5 — Smoke API REST vendeurs (contrat sans clé valide)
 */

import { test, expect } from '@playwright/test';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

/** CI job `test` may inject mock.supabase.co — edge calls hang there. */
function isLiveSupabaseTarget(url: string, key: string): boolean {
  if (!url || /mock\.supabase|example\.com|localhost|127\.0\.0\.1/i.test(url)) return false;
  if (!key || /^(mock-key|sb_publishable_ci_mock)$/i.test(key)) return false;
  return true;
}

/** Gateway headers only — no Authorization (vendor key). */
function gatewayHeaders(extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { Accept: 'application/json', ...extra };
  if (SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY;
  }
  return headers;
}

const REQUEST_TIMEOUT_MS = 20_000;

test.describe('Epic 5.5 — Vendor public API smoke', () => {
  test.beforeEach(() => {
    test.skip(
      !isLiveSupabaseTarget(SUPABASE_URL, SUPABASE_ANON_KEY),
      'Requires a real VITE_SUPABASE_URL with api-v1 deployed (not mock.supabase.co)'
    );
  });

  test('GET /api-v1/products sans clé vendeur retourne 401', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/functions/v1/api-v1/products`, {
      headers: gatewayHeaders(),
      timeout: REQUEST_TIMEOUT_MS,
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error ?? body.code ?? body.message).toBeTruthy();
  });

  test('GET /api-v1/webhooks sans clé vendeur retourne 401', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/functions/v1/api-v1/webhooks`, {
      headers: gatewayHeaders(),
      timeout: REQUEST_TIMEOUT_MS,
    });
    expect(res.status()).toBe(401);
  });

  test('clé API invalide retourne 401 ou 403', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/functions/v1/api-v1/products`, {
      headers: gatewayHeaders({
        Authorization: 'Bearer emz_invalid_test_key',
      }),
      timeout: REQUEST_TIMEOUT_MS,
    });
    expect([401, 403]).toContain(res.status());
  });
});
