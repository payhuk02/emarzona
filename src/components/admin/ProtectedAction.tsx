import { ReactNode } from 'react';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';

interface ProtectedActionProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedAction = ({ permission, children, fallback = null }: ProtectedActionProps) => {
  const { can } = useCurrentAdminPermissions();
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
};


