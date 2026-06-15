/**
 * Epic 5.5 — Smoke API REST vendeurs (contrat sans clé valide)
 */

import { test, expect } from '@playwright/test';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

function apiHeaders(extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { Accept: 'application/json', ...extra };
  if (SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY;
    if (!headers.Authorization) {
      headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    }
  }
  return headers;
}

test.describe('Epic 5.5 — Vendor public API smoke', () => {
  test('GET /api-v1/products sans clé vendeur retourne 401', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/functions/v1/api-v1/products`, {
      headers: apiHeaders(),
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error ?? body.code ?? body.message).toBeTruthy();
  });

  test('GET /api-v1/webhooks sans clé vendeur retourne 401', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/functions/v1/api-v1/webhooks`, {
      headers: apiHeaders(),
    });
    expect(res.status()).toBe(401);
  });

  test('clé API invalide retourne 401 ou 403', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/functions/v1/api-v1/products`, {
      headers: apiHeaders({
        Authorization: 'Bearer emz_invalid_test_key',
      }),
    });
    expect([401, 403]).toContain(res.status());
  });
});
