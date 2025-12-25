import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { useLocation, useNavigate } from 'react-router-dom';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { supabase } from '@/integrations/supabase/client';

// Email de l'administrateur principal avec accès complet (bypass AAL2)
const PRINCIPAL_ADMIN_EMAIL = 'contact@edigit-agence.com';

interface RequireAAL2Props {
  children: ReactNode;
}

export const RequireAAL2 = ({ children }: RequireAAL2Props) => {
  const { isAAL2, loading: mfaLoading, isPrincipalAdmin } = useAdminMFA();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = usePlatformSettings('admin');
  const [checkingPrincipal, setCheckingPrincipal] = useState(true);
  const [isPrincipalAdminLocal, setIsPrincipalAdminLocal] = useState(false);

  // Vérifier si c'est l'administrateur principal (fallback si useAdminMFA ne le détecte pas)
  useEffect(() => {
    const checkPrincipalAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const isPrincipal = user?.email === PRINCIPAL_ADMIN_EMAIL;
        setIsPrincipalAdminLocal(isPrincipal);
      } catch (error) {
        setIsPrincipalAdminLocal(false);
      } finally {
        setCheckingPrincipal(false);
      }
    };
    checkPrincipalAdmin();
  }, []);

  const routeRequiresAAL2 = useMemo(() => {
    const prefixes = (settings.require_aal2_routes as string[] | undefined) || [
      '/admin/payments', '/admin/audit', '/admin/users', '/admin/products', '/admin/disputes'
    ];
    return prefixes.some(prefix => location.pathname.startsWith(prefix));
  }, [settings, location.pathname]);

  // Utiliser isPrincipalAdmin du hook ou la vérification locale
  const isPrincipal = isPrincipalAdmin || isPrincipalAdminLocal;
  const loading = mfaLoading || checkingPrincipal;

  useEffect(() => {
    // L'administrateur principal peut contourner l'exigence AAL2
    if (!loading && routeRequiresAAL2 && !isAAL2 && !isPrincipal) {
      navigate('/admin/security');
    }
  }, [loading, routeRequiresAAL2, isAAL2, isPrincipal, navigate]);

  if (loading) return null;
  // L'administrateur principal peut accéder même sans AAL2
  if (routeRequiresAAL2 && !isAAL2 && !isPrincipal) return <Admin2FABanner />;
  return <>{children}</>;
};


