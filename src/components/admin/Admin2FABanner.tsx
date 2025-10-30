import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Admin2FABanner = () => {
  const [requires2FA, setRequires2FA] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        // Require AAL2 for admins
        if (mounted) setRequires2FA(aal.data?.currentLevel !== 'aal2');
      } catch {
        if (mounted) setRequires2FA(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!requires2FA) return null;

  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-transparent dark:border-amber-500/60 dark:text-amber-200">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Sécurité renforcée requise</AlertTitle>
      <AlertDescription>
        Activez l’authentification à deux facteurs (2FA) pour accéder à toutes les fonctionnalités d’administration.{' '}
        <Link to="/admin/security" className="underline font-medium">Configurer maintenant</Link>
      </AlertDescription>
    </Alert>
  );
};


