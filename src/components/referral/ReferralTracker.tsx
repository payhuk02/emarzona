import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { logger } from '@/lib/logger';

/**
 * Composant pour tracker les codes de parrainage dans l'URL
 * Stocke le code dans localStorage pour l'utiliser lors de l'inscription
 */
export const ReferralTracker = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const referralCode = searchParams.get('ref');
    
    if (referralCode) {
      try {
        // Stocker le code de parrainage dans localStorage
        localStorage.setItem('referral_code', referralCode);
        
        // Optionnel : stocker aussi dans sessionStorage pour une session
        sessionStorage.setItem('referral_code', referralCode);
        
        logger.info('Referral code tracked', { code: referralCode });
        
        // Nettoyer l'URL pour ne pas laisser le paramètre visible
        // (On garde le paramètre pour que l'utilisateur puisse le voir s'il le souhaite)
      } catch (error: any) {
        logger.error('Error tracking referral code', { error: error.message });
      }
    }
  }, [searchParams]);

  return null; // Ce composant ne rend rien
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

