import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { applyPendingReferralForUser } from '@/lib/referral-helpers';
import { getStoredReferralCode } from '@/components/referral/ReferralTracker';
import { logger } from '@/lib/logger';

/**
 * Applique le code parrainage stocké dès qu'une session authentifiée est disponible
 * (inscription avec confirmation e-mail, OAuth, reconnexion).
 */
export function ReferralClaimOnAuth() {
  const { user, session, loading } = useAuth();
  const lastAttemptUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !session || !user?.id) {
      return;
    }

    if (!getStoredReferralCode()) {
      return;
    }

    if (lastAttemptUserId.current === user.id) {
      return;
    }

    lastAttemptUserId.current = user.id;

    void applyPendingReferralForUser(user.id).then(result => {
      if (!result.success && result.error !== 'no_code') {
        logger.warn('Referral claim on auth did not succeed', {
          userId: user.id,
          error: result.error,
        });
      }
    });
  }, [loading, session, user?.id]);

  return null;
}
