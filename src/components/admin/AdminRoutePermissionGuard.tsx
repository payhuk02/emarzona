import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { canAccessAdminPath } from '@/lib/admin/admin-route-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type AdminRoutePermissionGuardProps = {
  children: ReactNode;
};

/**
 * Bloque l'accès direct aux URLs admin sans permission RBAC (redirect → /admin).
 */
export function AdminRoutePermissionGuard({ children }: AdminRoutePermissionGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { can, isSuperAdmin, loading, platformRole } = useCurrentAdminPermissions();

  const allowed = canAccessAdminPath(location.pathname, can, isSuperAdmin);

  useEffect(() => {
    if (loading) return;
    if (!allowed) {
      navigate('/admin', {
        replace: true,
        state: { forbiddenPath: location.pathname, role: platformRole },
      });
    }
  }, [loading, allowed, navigate, location.pathname, platformRole]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-4">
        <Card className="max-w-md border-destructive/40">
          <CardHeader className="text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive mb-2" />
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Votre rôle ({platformRole ?? 'admin'}) n&apos;a pas accès à cette section.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/admin', { replace: true })}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
