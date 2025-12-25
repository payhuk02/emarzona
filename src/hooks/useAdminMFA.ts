import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Email de l'administrateur principal avec accès complet (bypass AAL2)
const PRINCIPAL_ADMIN_EMAIL = 'contact@edigit-agence.com';

export const useAdminMFA = () => {
  const [loading, setLoading] = useState(true);
  const [isAAL2, setIsAAL2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrincipalAdmin, setIsPrincipalAdmin] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Vérifier si c'est l'administrateur principal
      if (user?.email === PRINCIPAL_ADMIN_EMAIL) {
        setIsPrincipalAdmin(true);
        // L'administrateur principal est considéré comme ayant AAL2 pour bypass
        setIsAAL2(true);
        setLoading(false);
        return;
      }

      setIsPrincipalAdmin(false);
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setIsAAL2(aal.data?.currentLevel === 'aal2');
    } catch (e: any) {
      setError(e.message);
      setIsAAL2(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, error, isAAL2, isPrincipalAdmin, refresh };
};


