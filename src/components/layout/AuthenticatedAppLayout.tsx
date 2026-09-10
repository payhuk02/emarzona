/**
 * Layout authentifié persistant — ProtectedRoute + AppPageShell + Outlet.
 * Évite le remount du shell à chaque navigation /dashboard/* ou /account/*.
 */

import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppPageShell } from '@/components/layout/AppPageShell';

export function AuthenticatedAppLayout() {
  return (
    <ProtectedRoute>
      <AppPageShell>
        <Outlet />
      </AppPageShell>
    </ProtectedRoute>
  );
}
