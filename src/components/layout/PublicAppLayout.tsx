/**
 * Layout public léger — isole le Suspense des lazy pages pour ne pas
 * démonter tout l’arbre App (ResourceHints, nav, etc.).
 */

import { Outlet } from 'react-router-dom';
import { RouteOutletSuspense } from '@/components/navigation/RouteChunkFallback';

export function PublicAppLayout() {
  return (
    <RouteOutletSuspense>
      <Outlet />
    </RouteOutletSuspense>
  );
}
