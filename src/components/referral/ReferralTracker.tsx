import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { extractReferralCodeFromPath } from '@/lib/referral/referral-link';

export function persistReferralCode(code: string) {
  const trimmed = code.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem('referral_code', trimmed);
    sessionStorage.setItem('referral_code', trimmed);
  } catch (error) {
    logger.error('Error tracking referral code', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Capture le code de parrainage : ?ref=CODE (ancien) ou /p/abcdef (lien court).
 */
export const ReferralTracker = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const fromQuery = searchParams.get('ref')?.trim() || '';
    const fromPath = extractReferralCodeFromPath(location.pathname);
    const referralCode = fromQuery || fromPath?.trim() || '';

    if (referralCode) {
      persistReferralCode(referralCode);
      logger.info('Referral code tracked', { code: referralCode });
    }
  }, [searchParams, location.pathname]);

  return null;
};

/**
 * Fonction utilitaire pour obtenir le code de parrainage stocké
 */
export const getStoredReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null;

  // Essayer localStorage d'abord, puis sessionStorage
  return localStorage.getItem('referral_code') || sessionStorage.getItem('referral_code');
};

/**
 * Fonction pour nettoyer le code de parrainage après utilisation
 */
export const clearStoredReferralCode = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('referral_code');
  sessionStorage.removeItem('referral_code');
};
