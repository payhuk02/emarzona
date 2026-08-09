import { expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { withAuthAdminRetry } from './auth-admin-retry';
import { seedTermsConsent } from './store-theme-helpers';

export type ReferralE2EUser = {
  runId: string;
  email: string;
  password: string;
  userId: string;
};

export async function createE2EAuthUser(
  admin: SupabaseClient,
  prefix: string
): Promise<ReferralE2EUser> {
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `e2e-${prefix}-${runId}@example.com`;
  const password = `E2E!${runId}aA1`;

  const created = await withAuthAdminRetry(`createE2EAuthUser(${email})`, async () => {
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (result.error || !result.data.user) {
      throw result.error ?? new Error('createUser failed');
    }
    return result.data;
  });

  const userId = created.user!.id;
  await seedTermsConsent(admin, userId);

  return { runId, email, password, userId };
}

/** Attend le profil et retourne un code parrain valide (trigger ensure_referral_code ou RPC). */
export async function waitForProfileReferralCode(
  admin: SupabaseClient,
  userId: string,
  timeoutMs = 15_000
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, user_id, referral_code')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (profile) {
      if (!profile.user_id) {
        await admin.from('profiles').update({ user_id: userId }).eq('id', profile.id);
      }

      const code = profile.referral_code?.trim();
      if (code) {
        return code;
      }

      const { data: generated, error: genError } = await admin.rpc('generate_referral_code');
      if (genError) {
        throw genError;
      }
      if (generated) {
        await admin
          .from('profiles')
          .update({ referral_code: generated, user_id: profile.user_id ?? userId })
          .eq('id', profile.id);
        return String(generated).trim();
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error(`referral_code not ready for user ${userId}`);
}

export async function assertReferralClaimed(
  admin: SupabaseClient,
  referrerId: string,
  referredId: string,
  referralCode: string
): Promise<void> {
  const { data: referral, error: referralError } = await admin
    .from('referrals')
    .select('referrer_id, referred_id, referral_code, status')
    .eq('referred_id', referredId)
    .maybeSingle();

  expect(referralError).toBeNull();
  expect(referral, 'referrals row for filleul').toBeTruthy();
  expect(referral!.referrer_id).toBe(referrerId);
  expect(referral!.referral_code?.toUpperCase()).toBe(referralCode.toUpperCase());
  expect(referral!.status).toBe('active');

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('referred_by')
    .or(`user_id.eq.${referredId},id.eq.${referredId}`)
    .maybeSingle();

  expect(profileError).toBeNull();
  expect(profile?.referred_by).toBe(referrerId);
}

export async function cleanupE2EReferralUsers(
  admin: SupabaseClient,
  userIds: string[]
): Promise<void> {
  for (const userId of userIds) {
    try {
      await admin
        .from('referrals')
        .delete()
        .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
    } catch {
      /* best-effort */
    }
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch {
      /* best-effort */
    }
  }
}
