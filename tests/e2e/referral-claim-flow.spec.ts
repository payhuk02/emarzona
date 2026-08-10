/**
 * E2E — Parrainage : tracking ?ref= + claim RPC après authentification
 *
 * npx playwright test tests/e2e/referral-claim-flow.spec.ts
 */

import { test, expect } from '@playwright/test';
import { createNodeSupabaseClient } from './helpers/create-node-supabase-client';
import { assertSafeE2ESupabaseUrl, resolveE2ESupabaseUrl } from './helpers/e2e-supabase-guard';
import {
  assertReferralClaimed,
  cleanupE2EReferralUsers,
  createE2EAuthUser,
  waitForProfileReferralCode,
} from './helpers/referral-e2e-helpers';
import { gotoApp, loginAsSeededUser } from './shared/e2e-test-config';

function requiredEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

const supabaseUrl = resolveE2ESupabaseUrl() || null;
const supabaseServiceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const canRunSupabaseE2E = Boolean(supabaseUrl && supabaseServiceKey);

test.describe('Referral — tracking URL (browser)', () => {
  test('?ref= stocke le code dans localStorage', async ({ page }) => {
    await gotoApp(page, '/?ref=TESTCODE123');

    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('referral_code')), {
        timeout: 15_000,
      })
      .toBe('TESTCODE123');
  });

  test('?ref= vide ne stocke pas de code', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('referral_code');
      sessionStorage.removeItem('referral_code');
    });

    await gotoApp(page, '/?ref=');

    const stored = await page.evaluate(() => localStorage.getItem('referral_code'));
    expect(stored).toBeNull();
  });
});

test.describe('Referral — claim après auth (E2E Supabase)', () => {
  test.beforeAll(() => {
    if (!canRunSupabaseE2E) {
      const message =
        'Requires SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (test Supabase migrated with claim_referral).';
      if (process.env.CI) {
        throw new Error(message);
      }
      test.skip(true, message);
      return;
    }

    assertSafeE2ESupabaseUrl(supabaseUrl!, 'referral-claim-flow E2E');
  });

  test('filleul authentifié avec ?ref= crée la relation parrainage', async ({ page }) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);

    const referrer = await createE2EAuthUser(admin, 'referrer');
    const referred = await createE2EAuthUser(admin, 'referred');
    const referralCode = await waitForProfileReferralCode(admin, referrer.userId);

    try {
      await page.addInitScript(() => {
        document.documentElement.dataset.e2eBypassTerms = '1';
      });

      await gotoApp(page, `/?ref=${encodeURIComponent(referralCode)}`);

      await expect
        .poll(
          async () => {
            const stored = await page.evaluate(() => localStorage.getItem('referral_code'));
            return stored?.toUpperCase() ?? null;
          },
          { timeout: 15_000 }
        )
        .toBe(referralCode.toUpperCase());

      await loginAsSeededUser(page, admin, referred.email, '/dashboard', referred.password);

      await expect
        .poll(
          async () => {
            const { data } = await admin
              .from('referrals')
              .select('id')
              .eq('referred_id', referred.userId)
              .maybeSingle();
            return data?.id ?? null;
          },
          { timeout: 30_000 }
        )
        .toBeTruthy();

      await assertReferralClaimed(admin, referrer.userId, referred.userId, referralCode);

      await expect
        .poll(async () => page.evaluate(() => localStorage.getItem('referral_code')), {
          timeout: 10_000,
        })
        .toBeNull();
    } finally {
      await cleanupE2EReferralUsers(admin, [referrer.userId, referred.userId]);
    }
  });

  test('claim idempotent — pas de doublon referrals', async ({ page }) => {
    const admin = createNodeSupabaseClient(supabaseUrl!, supabaseServiceKey!);

    const referrer = await createE2EAuthUser(admin, 'referrer-idem');
    const referred = await createE2EAuthUser(admin, 'referred-idem');
    const referralCode = await waitForProfileReferralCode(admin, referrer.userId);

    try {
      await page.addInitScript(() => {
        document.documentElement.dataset.e2eBypassTerms = '1';
      });

      await gotoApp(page, `/?ref=${encodeURIComponent(referralCode)}`);
      await loginAsSeededUser(page, admin, referred.email, '/dashboard', referred.password);

      await expect
        .poll(
          async () => {
            const { data } = await admin
              .from('referrals')
              .select('id')
              .eq('referred_id', referred.userId)
              .maybeSingle();
            return data?.id ?? null;
          },
          { timeout: 30_000 }
        )
        .toBeTruthy();

      await page.evaluate(code => {
        localStorage.setItem('referral_code', code);
      }, referralCode);

      await gotoApp(page, '/dashboard');

      await expect
        .poll(
          async () => {
            const { count } = await admin
              .from('referrals')
              .select('id', { count: 'exact', head: true })
              .eq('referred_id', referred.userId);
            return count ?? 0;
          },
          { timeout: 15_000 }
        )
        .toBe(1);
    } finally {
      await cleanupE2EReferralUsers(admin, [referrer.userId, referred.userId]);
    }
  });
});
