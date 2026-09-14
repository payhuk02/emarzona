/**
 * Layout authentifié persistant — ProtectedRoute + AppPageShell + Outlet.
 * Évite le remount du shell à chaque navigation /dashboard/* ou /account/*.
 */

import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { AUTH_APP_OUTLET_CONTEXT } from '@/components/layout/authenticated-app-outlet';

export type { AuthenticatedAppOutletContext } from '@/components/layout/authenticated-app-outlet';

export function AuthenticatedAppLayout() {
  return (
    <ProtectedRoute>
      <AppPageShell>
        <Outlet context={AUTH_APP_OUTLET_CONTEXT} />
      </AppPageShell>
    </ProtectedRoute>
  );
}
