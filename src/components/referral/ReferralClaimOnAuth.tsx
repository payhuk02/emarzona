import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdvancedLoyalty } from '@/hooks/useAdvancedLoyalty';
import { applyPendingReferralForUser } from '@/lib/referral-helpers';
import { getStoredReferralCode } from '@/components/referral/ReferralTracker';
import { logger } from '@/lib/logger';

/**
 * Applique le code parrainage stocké dès qu'une session authentifiée est disponible
 * (inscription avec confirmation e-mail, OAuth, reconnexion).
 */
export function ReferralClaimOnAuth() {
  const { user, session, loading } = useAuth();
  const { triggerLoyaltyEvent } = useAdvancedLoyalty();
  const lastAttemptUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !session || !user?.id) {
      return;
    }

    const storedReferralCode = getStoredReferralCode();
    if (!storedReferralCode) {
      return;
    }

    if (lastAttemptUserId.current === user.id) {
      return;
    }

    lastAttemptUserId.current = user.id;

    void applyPendingReferralForUser(user.id, storedReferralCode).then(async result => {
      if (!result.success) {
        if (result.error !== 'no_code') {
          logger.warn('Referral claim on auth did not succeed', {
            userId: user.id,
            error: result.error,
          });
        }
        return;
      }

      if (result.referrerId && !result.alreadyLinked) {
        try {
          await triggerLoyaltyEvent('referral_success', {
            referrerId: result.referrerId,
            referredId: user.id,
            referralCode: storedReferralCode,
          });
          await triggerLoyaltyEvent('signup_with_referral', {
            referrerId: result.referrerId,
            referredId: user.id,
            referralCode: storedReferralCode,
          });
        } catch (loyaltyError) {
          logger.error('Failed to trigger referral loyalty events on auth', {
            error: loyaltyError,
          });
        }
      }
    });
  }, [loading, session, triggerLoyaltyEvent, user?.id]);

  return null;
}
