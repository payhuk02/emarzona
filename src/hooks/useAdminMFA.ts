import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminMFA = () => {
  const [loading, setLoading] = useState(true);
  const [isAAL2, setIsAAL2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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

  return { loading, error, isAAL2, refresh };
};


