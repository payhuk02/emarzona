import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isPrincipalAdminEmail } from '@/lib/principal-admin';

export const useAdminMFA = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAAL2, setIsAAL2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPrincipalAdmin = isPrincipalAdminEmail(user?.email);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isPrincipalAdmin) {
      setIsAAL2(true);
      setLoading(false);
      return;
    }

    try {
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setIsAAL2(aal.data?.currentLevel === 'aal2');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'MFA check failed');
      setIsAAL2(false);
    } finally {
      setLoading(false);
    }
  }, [isPrincipalAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, error, isAAL2, refresh };
};
