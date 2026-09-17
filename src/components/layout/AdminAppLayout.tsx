/**
 * Layout admin persistant — une seule garde + sidebar stable entre /admin/*.
 */
import { Outlet } from 'react-router-dom';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';

export function AdminAppLayout() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
