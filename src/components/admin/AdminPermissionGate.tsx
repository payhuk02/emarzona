import { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';

type AdminPermissionGateProps = {
  /** Une permission suffit (OR). */
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Affiche children uniquement si l'admin a au moins une des permissions demandées.
 */
export function AdminPermissionGate({ permissions, children, fallback }: AdminPermissionGateProps) {
  const { can, isSuperAdmin, loading } = useCurrentAdminPermissions();

  if (loading) return null;

  const allowed = isSuperAdmin || permissions.some(p => can(p));

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>Permissions requises : {permissions.join(', ')}</AlertDescription>
    </Alert>
  );
}
