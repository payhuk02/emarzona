import { ReactNode, useEffect, useMemo } from 'react';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { useLocation, useNavigate } from 'react-router-dom';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';

interface RequireAAL2Props {
  children: ReactNode;
}

export const RequireAAL2 = ({ children }: RequireAAL2Props) => {
  const { isAAL2, loading } = useAdminMFA();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = usePlatformSettings('admin');

  const routeRequiresAAL2 = useMemo(() => {
    const prefixes = (settings.require_aal2_routes as string[] | undefined) || [
      '/admin/payments', '/admin/audit', '/admin/users', '/admin/products', '/admin/disputes'
    ];
    return prefixes.some(prefix => location.pathname.startsWith(prefix));
  }, [settings, location.pathname]);

  useEffect(() => {
    if (!loading && routeRequiresAAL2 && !isAAL2) {
      navigate('/admin/security');
    }
  }, [loading, routeRequiresAAL2, isAAL2, navigate]);

  if (loading) return null;
  if (routeRequiresAAL2 && !isAAL2) return <Admin2FABanner />;
  return <>{children}</>;
};


