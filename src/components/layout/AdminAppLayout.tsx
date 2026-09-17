/**
 * Layout admin persistant — une seule garde + sidebar stable entre /admin/*.
 * Suspense interne : navigation /admin/* sans démonter la sidebar.
 */
import { Outlet } from 'react-router-dom';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RouteOutletSuspense } from '@/components/navigation/RouteChunkFallback';

export function AdminAppLayout() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <RouteOutletSuspense>
          <Outlet />
        </RouteOutletSuspense>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
