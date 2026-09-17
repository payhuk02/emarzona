/**
 * Layout authentifié persistant — ProtectedRoute + AppPageShell + Outlet.
 * Évite le remount du shell à chaque navigation /dashboard/* ou /account/*.
 * Suspense interne : le lazy page ne remonte pas jusqu'au Suspense global d'App.
 */

import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { AUTH_APP_OUTLET_CONTEXT } from '@/components/layout/authenticated-app-outlet';
import { RouteOutletSuspense } from '@/components/navigation/RouteChunkFallback';

export type { AuthenticatedAppOutletContext } from '@/components/layout/authenticated-app-outlet';

export function AuthenticatedAppLayout() {
  return (
    <ProtectedRoute>
      <AppPageShell>
        <RouteOutletSuspense>
          <Outlet context={AUTH_APP_OUTLET_CONTEXT} />
        </RouteOutletSuspense>
      </AppPageShell>
    </ProtectedRoute>
  );
}
