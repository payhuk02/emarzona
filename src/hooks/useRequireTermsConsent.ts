/**
 * Hook pour vérifier et exiger l'acceptation des Conditions Générales de Vente
 * Bloque certaines actions si les CGV ne sont pas acceptées
 */

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLegalDocument, useRecordConsent, useUserConsents } from '@/hooks/useLegal';
import { logger } from '@/lib/logger';

export interface TermsConsentStatus {
  hasConsented: boolean;
  currentVersion: string | null;
  consentedVersion: string | null;
  needsUpdate: boolean;
  isLoading: boolean;
}

/**
 * Vérifie si l'utilisateur a accepté la dernière version des CGV
 */
export function useRequireTermsConsent(): TermsConsentStatus & {
  recordConsent: () => Promise<void>;
  currentTermsDoc: { version: string; content?: string } | undefined;
} {
  const { user } = useAuth();
  const { data: termsDoc, isLoading: loadingTerms } = useLegalDocument('terms', 'fr');
  const { data: consents, isLoading: loadingConsents } = useUserConsents(user?.id);
  const recordConsentMutation = useRecordConsent();

  const isLoading = loadingTerms || loadingConsents;

  // Trouver le consentement aux CGV (terms) le plus récent et non révoqué
  const termsConsent = consents?.find(
    consent => 
      consent.document_type === 'terms' && 
      !consent.is_revoked
  );

  const hasConsented = !!termsConsent;
  const currentVersion = termsDoc?.version || null;
  const consentedVersion = termsConsent?.document_version || null;
  const needsUpdate = hasConsented && currentVersion && consentedVersion !== currentVersion;

  const recordConsent = async () => {
    if (!user || !termsDoc) {
      throw new Error('Utilisateur ou document CGV manquant');
    }

    try {
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      await recordConsentMutation.mutateAsync({
        userId: user.id,
        documentType: 'terms',
        documentVersion: termsDoc.version,
        ipAddress: ipAddress || undefined,
        userAgent: navigator.userAgent,
        consentMethod: 'settings'
      });
    } catch (error) {
      logger.error('Error recording terms consent', { error });
      throw error;
    }
  };

  return {
    hasConsented,
    currentVersion,
    consentedVersion,
    needsUpdate,
    isLoading,
    recordConsent,
    currentTermsDoc: termsDoc
  };
}

/**
 * Vérifie rapidement si l'utilisateur a accepté les CGV (pour vérifications simples)
 */
export async function checkTermsConsent(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_consents')
      .select('id')
      .eq('user_id', userId)
      .eq('document_type', 'terms')
      .eq('is_revoked', false)
      .limit(1);

    if (error) {
      logger.error('Error checking terms consent', { error });
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    logger.error('Error checking terms consent', { error });
    return false;
  }
}

