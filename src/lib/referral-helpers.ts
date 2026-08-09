import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  clearStoredReferralCode,
  getStoredReferralCode,
} from '@/components/referral/ReferralTracker';

export interface ApplyReferralResult {
  success: boolean;
  referrerId?: string;
  alreadyLinked?: boolean;
  error?: string;
}

type ClaimReferralRpcResult = {
  success?: boolean;
  referrer_id?: string;
  already_linked?: boolean;
  error?: string;
};

/**
 * Lie le compte authentifié au parrain via le code stocké ou fourni.
 * Utilise la RPC claim_referral (SECURITY DEFINER) pour contourner la RLS insert.
 */
export async function applyPendingReferralForUser(
  referredUserId: string,
  referralCode?: string | null
): Promise<ApplyReferralResult> {
  const code = (referralCode ?? getStoredReferralCode())?.trim();
  if (!code) {
    return { success: false, error: 'no_code' };
  }

  try {
    const { data, error } = await supabase.rpc('claim_referral', {
      p_referral_code: code,
    });

    if (error) {
      logger.error('claim_referral RPC failed', {
        code,
        referredUserId,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    const result = (data ?? {}) as ClaimReferralRpcResult;

    if (!result.success) {
      return { success: false, error: result.error ?? 'claim_failed' };
    }

    clearStoredReferralCode();

    logger.info('Referral claimed successfully', {
      referredUserId,
      referrerId: result.referrer_id,
      alreadyLinked: result.already_linked,
    });

    return {
      success: true,
      referrerId: result.referrer_id,
      alreadyLinked: Boolean(result.already_linked),
    };
  } catch (caught: unknown) {
    const message = caught instanceof Error ? caught.message : 'Erreur inconnue';
    logger.error('Unexpected error claiming referral', { referredUserId, error: message });
    return { success: false, error: message };
  }
}

/** @deprecated Préférer applyPendingReferralForUser (RPC claim_referral). */
export const createReferralRelation = async (
  referrerId: string,
  referredId: string,
  referralCode: string
): Promise<{ success: boolean; error?: string }> => {
  const result = await applyPendingReferralForUser(referredId, referralCode);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  if (result.referrerId && result.referrerId !== referrerId) {
    return { success: false, error: 'Code de parrainage invalide' };
  }
  return { success: true };
};
