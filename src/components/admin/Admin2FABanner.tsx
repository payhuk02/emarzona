import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isPrincipalAdminEmail } from '@/lib/principal-admin';

export const Admin2FABanner = () => {
  const { user } = useAuth();
  const [requires2FA, setRequires2FA] = useState(false);

  useEffect(() => {
    if (isPrincipalAdminEmail(user?.email)) {
      setRequires2FA(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (mounted) setRequires2FA(aal.data?.currentLevel !== 'aal2');
      } catch {
        if (mounted) setRequires2FA(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  if (!requires2FA) return null;

  return (
    <Alert className="border-amber-500/60 bg-transparent text-amber-200">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Sécurité renforcée requise</AlertTitle>
      <AlertDescription>
        Activez l’authentification à deux facteurs (2FA) pour accéder à toutes les fonctionnalités
        d’administration.{' '}
        <Link
          to="/admin/security"
          className="underline font-medium text-blue-400 hover:text-blue-300"
        >
          Configurer maintenant
        </Link>
      </AlertDescription>
    </Alert>
  );
};
